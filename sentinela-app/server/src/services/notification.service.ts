import { NotificationRepository } from '../repositories/notification.repository';
import { AIService } from './ai.service';
import { EmailService } from './email.service';
import { RiskManagerRepository } from '../repositories/risk-manager.repository';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../lib/prisma';

export class NotificationService {
    private repository: NotificationRepository;
    private aiService: AIService;
    private emailService: EmailService;
    private riskManagerRepo: RiskManagerRepository;

    constructor() {
        this.repository = new NotificationRepository();
        this.aiService = new AIService();
        this.emailService = new EmailService();
        this.riskManagerRepo = new RiskManagerRepository();
    }

    async createNotification(data: any, authTenantId?: string) {
        // 1. Analyze with AI
        let aiResult = {
            eventType: 'EM ANÁLISE',
            riskLevel: 'MODERADO',
            recommendation: 'Aguardando análise...'
        };

        try {
            console.log('Solicitando análise da IA...');
            const result = await this.aiService.analyzeIncident(data.descricao);
            aiResult = {
                eventType: result.eventType || 'EM ANÁLISE',
                riskLevel: result.riskLevel || 'MODERADO',
                recommendation: result.recommendation || 'Análise concluída sem recomendação específica.'
            };
        } catch (error) {
            console.error('Falha na análise da IA:', error);
        }

        // SaaS: Determine Tenant
        let tenantId = authTenantId;

        // If not authenticated (anonymous report), try to resolve from slug or fallback
        if (!tenantId) {
            if (data.tenantSlug) {
                console.log(`Resolving tenant slug: ${data.tenantSlug}`);
                const tenant = await prisma.tenant.findUnique({ where: { slug: data.tenantSlug } });
                if (tenant) {
                    tenantId = tenant.id;
                    console.log(`Resolved to Tenant ID: ${tenantId}`);
                }
            }

            // Fallback for public reporting if no slug (Demo support) - but ideally every report should have a tenant context
            if (!tenantId) {
                const defaultTenant = await prisma.tenant.findFirst();
                if (defaultTenant) {
                    tenantId = defaultTenant.id;
                }
            }
        }

        if (!tenantId) throw new Error('System configuration error: No active tenant context found.');

        const incidentData = {
            eventTypeAi: aiResult.eventType,
            riskLevel: data.tipo_notificacao === 'NÃO CONFORMIDADE' ? 'NA' : (aiResult.riskLevel as any),
            aiAnalysis: aiResult.recommendation,
            patientName: data.paciente || data.patientName,
            motherName: data.nome_mae || data.motherName || null,
            birthDate: (data.nascimento || data.birthDate) ? new Date(data.nascimento || data.birthDate) : null,
            sex: data.sexo || data.sex || null,
            admissionDate: (data.data_internacao || data.admissionDate) ? new Date(data.data_internacao || data.admissionDate) : null,
            eventDate: (data.data_evento || data.eventDate) ? new Date(data.data_evento || data.eventDate) : new Date(),
            period: data.periodo || data.period || null,
            sector: data.setor || data.sector,
            notifySector: data.setor_notificado || data.notifySector || data.setor || data.sector || "Não Informado",
            type: data.tipo_notificacao || data.type,
            description: sanitizeHtml(data.descricao || data.description),
            reporterEmail: data.email_relator || data.reporterEmail || null,
            rootCause: null,
            actionPlan: null,
            actionPlanStatus: 'NOT_STARTED',
            actionPlanStartDate: null,
            actionPlanDeadline: null,
            investigationList: null
        };

        const createdNotification = await this.repository.create(tenantId, incidentData);

        // 3. Automate Emails (Scoped to Tenant)
        try {
            const targetSector = data.setor_notificado || data.setor;
            const sectorManager = await this.riskManagerRepo.findBySector(targetSector, tenantId);

            if (sectorManager) {
                await this.emailService.sendActionRequest(createdNotification, sectorManager.email);
            }

            const riskManagerEmail = process.env.RISK_MANAGER_EMAIL || 'qualidade@inmceb.med.br';
            await this.emailService.sendIncidentNotification(createdNotification, riskManagerEmail);

        } catch (emailError) {
            console.error('[Flow] Error sending automated emails:', emailError);
        }

        return createdNotification;
    }

    async getAllNotifications(tenantId: string) {
        return this.repository.findAll(tenantId);
    }

    async getNotificationById(id: number, tenantId: string) {
        return this.repository.findById(id, tenantId);
    }

    async updateNotification(id: number, tenantId: string, data: any) {
        const updateData: any = {};
        const currentNotification = await this.repository.findById(id, tenantId);

        if (!currentNotification) throw new Error('Notification not found');

        if (data.tipo_notificacao) {
            updateData.type = data.tipo_notificacao;
            if (data.tipo_notificacao === 'NÃO CONFORMIDADE') {
                updateData.riskLevel = 'NA';
            }
        }

        // Check if risk level is changing
        if (data.classificacao && (!updateData.type || updateData.type !== 'NÃO CONFORMIDADE')) {
            updateData.riskLevel = data.classificacao;

            // Recalculate Deadline if Action Plan is in progress
            if (currentNotification.actionPlanStartDate) {
                const startDate = new Date(currentNotification.actionPlanStartDate);
                if (!isNaN(startDate.getTime())) {
                    let newDeadline = new Date(startDate);

                    switch (data.classificacao) {
                        case 'GRAVE':
                            newDeadline.setDate(newDeadline.getDate() + 1); // 24h
                            break;
                        case 'MODERADO':
                            newDeadline.setDate(newDeadline.getDate() + 3); // 72h
                            break;
                        default: // LEVE or NA
                            newDeadline.setDate(newDeadline.getDate() + 5); // 5 days
                            break;
                    }
                    updateData.actionPlanDeadline = newDeadline;
                }
            }
        }

        if (data.tipo_evento) updateData.eventTypeAi = data.tipo_evento;

        // Action Plan Fields
        if (data.rootCause) updateData.rootCause = sanitizeHtml(data.rootCause);
        if (data.actionPlan) updateData.actionPlan = sanitizeHtml(data.actionPlan);
        if (data.actionPlanStatus) updateData.actionPlanStatus = data.actionPlanStatus;
        if (data.actionPlanDeadline) updateData.actionPlanDeadline = data.actionPlanDeadline;
        if (data.investigationList) updateData.investigationList = data.investigationList;

        return this.repository.update(id, tenantId, updateData);
    }

    async startActionPlan(id: number, tenantId: string, customDeadline?: Date) {
        const notification = await this.repository.findById(id, tenantId);
        if (!notification) throw new Error('Notification not found');

        const riskLevel = notification.riskLevel || 'MODERADO';
        const startDate = new Date();
        let deadline = new Date(startDate);

        if (customDeadline) {
            deadline = customDeadline;
        } else {
            // Calculate deadline based on risk
            switch (riskLevel) {
                case 'GRAVE':
                    deadline.setDate(deadline.getDate() + 1); // 24h
                    break;
                case 'MODERADO':
                    deadline.setDate(deadline.getDate() + 3); // 72h
                    break;
                default: // LEVE or NA
                    deadline.setDate(deadline.getDate() + 5); // 5 days
                    break;
            }
        }

        const updateData = {
            actionPlanStatus: 'IN_PROGRESS',
            actionPlanStartDate: startDate,
            actionPlanDeadline: deadline
        };

        return this.repository.update(id, tenantId, updateData);
    }

    async reanalyzeIncident(id: number, tenantId: string) {
        const notification = await this.repository.findById(id, tenantId);
        if (!notification) throw new Error('Notification not found');

        console.log(`Re-analyzing incident #${id}...`);
        const aiResult = await this.aiService.analyzeIncident(notification.description);
        console.log('Re-analysis complete:', aiResult);

        const updateData = {
            eventTypeAi: aiResult.eventType,
            riskLevel: aiResult.eventType === 'NÃO CONFORMIDADE' ? 'NA' : aiResult.riskLevel,
            aiAnalysis: aiResult.recommendation
        };

        return this.repository.update(id, tenantId, updateData);
    }

    async generateRCA(id: number, tenantId: string) {
        const notification = await this.repository.findById(id, tenantId);
        if (!notification) throw new Error('Notification not found');

        const description = notification.description;
        const eventType = notification.eventTypeAi || notification.type;
        const investigationData = notification.investigationList;

        return this.aiService.generateRootCauseAnalysis(description, eventType, investigationData);
    }

    async generateFiveWhys(id: number, tenantId: string) {
        const notification = await this.repository.findById(id, tenantId);
        if (!notification) throw new Error('Notification not found');

        return this.aiService.generateFiveWhys(notification.description);
    }

    // New Methods for Email Workflow

    async forwardToSector(id: number, tenantId: string, sectorManagerEmail: string) {
        const incident = await this.repository.findById(id, tenantId);
        if (!incident) throw new Error('Incident not found');

        await this.emailService.sendActionRequest(incident, sectorManagerEmail);
        return { message: 'Email forwarded to sector manager' };
    }

    async notifyHighManagement(id: number, tenantId: string) {
        const incident = await this.repository.findById(id, tenantId);
        if (!incident) throw new Error('Incident not found');

        // Find managers for the specific tenant
        const managers = await this.riskManagerRepo.findAll(tenantId);
        const highManagementEmails = managers
            .filter(m => m.role === 'ALTA_GESTAO')
            .map(m => m.email);

        if (highManagementEmails.length === 0) {
            throw new Error('No High Management contacts found');
        }

        await this.emailService.sendHighManagementReport(incident, highManagementEmails);
        return { message: 'High Management notified' };
    }

    async checkOverdueTratativas(tenantId: string) {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const allIncidents = await this.repository.findAll(tenantId);
        const overdue = allIncidents.filter(i =>
            i.status !== 'Concluído' &&
            new Date(i.createdAt) < fiveDaysAgo
        );

        const admins = await this.riskManagerRepo.findAll(tenantId);
        const riskManagerEmail = admins.find(m => m.role === 'ADMIN')?.email || process.env.RISK_MANAGER_EMAIL || 'risk.manager@hospital.com';

        for (const incident of overdue) {
            console.log(`Overdue incident #${incident.id} for tenant ${tenantId}`);
        }

        return { overdueCount: overdue.length };
    }

    async chatWithAI(id: number, tenantId: string, message: string, context?: any) {
        const notification = await this.repository.findById(id, tenantId);
        if (!notification) throw new Error('Notification not found');

        return this.aiService.chatWithContext(message, {
            ...context,
            notification: notification
        });
    }
    async contactRiskManager(id: number, tenantId: string, message: string, requesterEmail?: string) {
        const notification = await this.repository.findById(id, tenantId);
        if (!notification) throw new Error('Notification not found');

        const riskManagerEmail = process.env.RISK_MANAGER_EMAIL || 'admin@sentinela.ai';

        const oldDeadline = notification.actionPlanDeadline
            ? new Date(notification.actionPlanDeadline).toLocaleDateString('pt-BR')
            : 'Não definido';

        const incidentData = {
            id: notification.id,
            description: notification.description,
            ...notification
        };

        await this.emailService.sendRiskManagerContactEmail(incidentData, requesterEmail || 'Anônimo', message, riskManagerEmail, oldDeadline);

        return { message: 'Email sent to Risk Manager' };
    }

    async approveDeadline(id: number, tenantId: string, newDeadline: Date) {
        const notification = await this.repository.findById(id, tenantId);
        if (!notification) throw new Error('Notification not found');

        // Update deadline
        await this.repository.update(id, tenantId, { actionPlanDeadline: newDeadline });

        // Find sector manager for this tenant
        const managers = await this.riskManagerRepo.findAll(tenantId);
        // Simple check: if manager's sectors string includes the notified sector
        const sectorManager = managers.find(m => m.sectors.includes(notification.notifySector) && m.role === 'GESTOR_SETOR');

        if (sectorManager) {
            await this.emailService.sendDeadlineApprovalEmail(notification, newDeadline.toLocaleDateString('pt-BR'), sectorManager.email);
        } else {
            console.warn(`No sector manager found for sector ${notification.notifySector}`);
        }

        return { message: 'Deadline approved and email sent' };
    }

    async rejectDeadline(id: number, tenantId: string) {
        const notification = await this.repository.findById(id, tenantId);
        if (!notification) throw new Error('Notification not found');

        // Find sector manager for this tenant
        const managers = await this.riskManagerRepo.findAll(tenantId);
        const sectorManager = managers.find(m => m.sectors.includes(notification.notifySector) && m.role === 'GESTOR_SETOR');

        if (sectorManager) {
            await this.emailService.sendDeadlineRejectionEmail(notification, sectorManager.email);
        } else {
            console.warn(`No sector manager found for sector ${notification.notifySector}`);
        }

        return { message: 'Deadline rejected and email sent' };
    }
}
