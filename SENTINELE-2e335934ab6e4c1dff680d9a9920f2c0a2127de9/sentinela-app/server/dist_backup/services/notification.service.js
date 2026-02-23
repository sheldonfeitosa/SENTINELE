"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_repository_1 = require("../repositories/notification.repository");
const ai_service_1 = require("./ai.service");
const email_service_1 = require("./email.service");
const risk_manager_repository_1 = require("../repositories/risk-manager.repository");
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const prisma_1 = require("../lib/prisma");
class NotificationService {
    constructor() {
        this.repository = new notification_repository_1.NotificationRepository();
        this.aiService = new ai_service_1.AIService();
        this.emailService = new email_service_1.EmailService();
        this.riskManagerRepo = new risk_manager_repository_1.RiskManagerRepository();
    }
    createNotification(data, authTenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Analyze with AI
            let aiResult = {
                eventType: 'EM ANÁLISE',
                riskLevel: 'MODERADO',
                recommendation: 'Aguardando análise...'
            };
            try {
                console.log('Solicitando análise da IA...');
                const result = yield this.aiService.analyzeIncident(data.descricao);
                aiResult = {
                    eventType: result.eventType || 'EM ANÁLISE',
                    riskLevel: result.riskLevel || 'MODERADO',
                    recommendation: result.recommendation || 'Análise concluída sem recomendação específica.'
                };
            }
            catch (error) {
                console.error('Falha na análise da IA:', error);
            }
            // SaaS: Determine Tenant
            let tenantId = authTenantId;
            // If not authenticated (anonymous report), try to resolve from slug or fallback
            if (!tenantId) {
                if (data.tenantSlug) {
                    console.log(`Resolving tenant slug: ${data.tenantSlug}`);
                    const tenant = yield prisma_1.prisma.tenant.findUnique({ where: { slug: data.tenantSlug } });
                    if (tenant) {
                        tenantId = tenant.id;
                        console.log(`Resolved to Tenant ID: ${tenantId}`);
                    }
                    else {
                        throw new Error(`Hospital não encontrado: ${data.tenantSlug}`);
                    }
                }
                else {
                    throw new Error('Identificação do hospital ausente. Por favor, use o link correto da sua instituição.');
                }
            }
            if (!tenantId)
                throw new Error('System configuration error: No active tenant context found.');
            const incidentData = {
                eventTypeAi: aiResult.eventType,
                riskLevel: data.tipo_notificacao === 'NÃO CONFORMIDADE' ? 'NA' : aiResult.riskLevel,
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
                description: (0, sanitize_html_1.default)(data.descricao || data.description),
                reporterEmail: data.email_relator || data.reporterEmail || null,
                rootCause: null,
                actionPlan: null,
                actionPlanStatus: 'NOT_STARTED',
                actionPlanStartDate: null,
                actionPlanDeadline: null,
                investigationList: null
            };
            const createdNotification = yield this.repository.create(tenantId, incidentData);
            // 3. Automate Emails (Scoped to Tenant)
            try {
                const targetSector = data.setor_notificado || data.setor;
                const sectorManager = yield this.riskManagerRepo.findBySector(targetSector, tenantId);
                if (sectorManager) {
                    yield this.emailService.sendActionRequest(createdNotification, sectorManager.email);
                }
                // Notify all Risk Managers (ADMIN)
                const allManagers = yield this.riskManagerRepo.findAll(tenantId);
                const riskManagers = allManagers.filter(m => m.role === 'ADMIN');
                const riskManagerEmails = riskManagers.length > 0
                    ? riskManagers.map(m => m.email)
                    : [process.env.RISK_MANAGER_EMAIL || 'qualidade@inmceb.med.br'];
                for (const email of riskManagerEmails) {
                    yield this.emailService.sendIncidentNotification(createdNotification, email);
                }
            }
            catch (emailError) {
                console.error('[Flow] Error sending automated emails:', emailError.message);
            }
            return createdNotification;
        });
    }
    getAllNotifications(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.findAll(tenantId);
        });
    }
    getNotificationById(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.findById(id, tenantId);
        });
    }
    updateNotification(id, tenantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateData = {};
            const currentNotification = yield this.repository.findById(id, tenantId);
            if (!currentNotification)
                throw new Error('Notification not found');
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
            if (data.tipo_evento)
                updateData.eventTypeAi = data.tipo_evento;
            // Action Plan Fields
            if (data.rootCause)
                updateData.rootCause = (0, sanitize_html_1.default)(data.rootCause);
            if (data.actionPlan)
                updateData.actionPlan = (0, sanitize_html_1.default)(data.actionPlan);
            if (data.actionPlanStatus)
                updateData.actionPlanStatus = data.actionPlanStatus;
            if (data.actionPlanDeadline)
                updateData.actionPlanDeadline = data.actionPlanDeadline;
            if (data.investigationList)
                updateData.investigationList = data.investigationList;
            return this.repository.update(id, tenantId, updateData);
        });
    }
    startActionPlan(id, tenantId, customDeadline) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repository.findById(id, tenantId);
            if (!notification)
                throw new Error('Notification not found');
            const riskLevel = notification.riskLevel || 'MODERADO';
            const startDate = new Date();
            let deadline = new Date(startDate);
            if (customDeadline) {
                deadline = customDeadline;
            }
            else {
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
        });
    }
    reanalyzeIncident(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repository.findById(id, tenantId);
            if (!notification)
                throw new Error('Notification not found');
            console.log(`Re-analyzing incident #${id}...`);
            const aiResult = yield this.aiService.analyzeIncident(notification.description);
            console.log('Re-analysis complete:', aiResult);
            const updateData = {
                eventTypeAi: aiResult.eventType,
                riskLevel: aiResult.eventType === 'NÃO CONFORMIDADE' ? 'NA' : aiResult.riskLevel,
                aiAnalysis: aiResult.recommendation
            };
            return this.repository.update(id, tenantId, updateData);
        });
    }
    generateRCA(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repository.findById(id, tenantId);
            if (!notification)
                throw new Error('Notification not found');
            const description = notification.description;
            const eventType = notification.eventTypeAi || notification.type;
            const investigationData = notification.investigationList;
            return this.aiService.generateRootCauseAnalysis(description, eventType, investigationData);
        });
    }
    generateFiveWhys(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repository.findById(id, tenantId);
            if (!notification)
                throw new Error('Notification not found');
            return this.aiService.generateFiveWhys(notification.description);
        });
    }
    // New Methods for Email Workflow
    forwardToSector(id, tenantId, sectorManagerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            const incident = yield this.repository.findById(id, tenantId);
            if (!incident)
                throw new Error('Incident not found');
            yield this.emailService.sendActionRequest(incident, sectorManagerEmail);
            return { message: 'Email forwarded to sector manager' };
        });
    }
    notifyHighManagement(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const incident = yield this.repository.findById(id, tenantId);
            if (!incident)
                throw new Error('Incident not found');
            // Find managers for the specific tenant
            const managers = yield this.riskManagerRepo.findAll(tenantId);
            // 1. Try Alta Gestão role
            let highManagementEmails = managers
                .filter(m => m.role === 'ALTA_GESTAO')
                .map(m => m.email);
            // 2. Fallback to ADMIN if no ALTA_GESTAO found
            if (highManagementEmails.length === 0) {
                console.log(`[Flow] No ALTA_GESTAO found for tenant ${tenantId}, falling back to ADMINs.`);
                highManagementEmails = managers
                    .filter(m => m.role === 'ADMIN')
                    .map(m => m.email);
            }
            // 3. Absolute fallback for testing
            if (highManagementEmails.length === 0) {
                console.log(`[Flow] No managers found, sending to fallback email.`);
                highManagementEmails = [process.env.RISK_MANAGER_EMAIL || 'sheldonfeitosa@gmail.com'];
            }
            // Always include Sheldon for validation if it's the specific test case
            if (!highManagementEmails.includes('sheldonfeitosa@gmail.com')) {
                // Optional: add to list if not present for debugging
                // highManagementEmails.push('sheldonfeitosa@gmail.com');
            }
            console.log(`[Flow] Triggering High Management Report to: ${highManagementEmails.join(', ')}`);
            yield this.emailService.sendHighManagementReport(incident, highManagementEmails);
            return { message: 'High Management notified', recipients: highManagementEmails };
        });
    }
    checkOverdueTratativas(tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            const allIncidents = yield this.repository.findAll(tenantId);
            const overdue = allIncidents.filter(i => i.status !== 'Concluído' &&
                new Date(i.createdAt) < fiveDaysAgo);
            const admins = yield this.riskManagerRepo.findAll(tenantId);
            const riskManagerEmail = ((_a = admins.find(m => m.role === 'ADMIN')) === null || _a === void 0 ? void 0 : _a.email) || process.env.RISK_MANAGER_EMAIL || 'risk.manager@hospital.com';
            for (const incident of overdue) {
                console.log(`Overdue incident #${incident.id} for tenant ${tenantId}`);
            }
            return { overdueCount: overdue.length };
        });
    }
    chatWithAI(id, tenantId, message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repository.findById(id, tenantId);
            if (!notification)
                throw new Error('Notification not found');
            return this.aiService.chatWithContext(message, Object.assign(Object.assign({}, context), { notification: notification }));
        });
    }
    contactRiskManager(id, tenantId, message, requesterEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repository.findById(id, tenantId);
            if (!notification)
                throw new Error('Notification not found');
            // Find all Risk Managers (ADMIN) for this specific tenant
            const allManagers = yield this.riskManagerRepo.findAll(tenantId);
            const riskManagers = allManagers.filter(m => m.role === 'ADMIN');
            const riskManagerEmails = riskManagers.length > 0
                ? riskManagers.map(m => m.email)
                : [process.env.RISK_MANAGER_EMAIL || 'sheldonfeitosa@gmail.com', 'qualidade@inmceb.med.br'];
            const oldDeadline = notification.actionPlanDeadline
                ? new Date(notification.actionPlanDeadline).toLocaleDateString('pt-BR')
                : 'Não definido';
            const incidentData = Object.assign({ id: notification.id, description: notification.description }, notification);
            console.log(`[Flow] Notifying Risk Managers of Deadline Change Request: ${riskManagerEmails.join(', ')}`);
            for (const email of riskManagerEmails) {
                try {
                    yield this.emailService.sendRiskManagerContactEmail(incidentData, requesterEmail || 'Anônimo', message, email, oldDeadline);
                    console.log(`✅ Deadline Change Request email sent to: ${email}`);
                }
                catch (err) {
                    console.error(`❌ Failed to send Deadline Change Request email to ${email}:`, err.message);
                }
            }
            return { message: 'Email sent to Risk Manager(s)' };
        });
    }
    approveDeadline(id, tenantId, newDeadline) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repository.findById(id, tenantId);
            if (!notification)
                throw new Error('Notification not found');
            // Update deadline
            console.log(`[Flow] Approving deadline for incident ${id} to ${newDeadline.toISOString()}`);
            yield this.repository.update(id, tenantId, { actionPlanDeadline: newDeadline });
            // Find sector manager for this tenant using the robust repository method
            const sectorManager = yield this.riskManagerRepo.findBySector(notification.notifySector, tenantId);
            if (sectorManager) {
                console.log(`[Flow] Notifying sector manager ${sectorManager.email} about deadline approval`);
                yield this.emailService.sendDeadlineApprovalEmail(notification, newDeadline.toLocaleDateString('pt-BR'), sectorManager.email);
            }
            else {
                console.warn(`[Flow] No sector manager found for sector ${notification.notifySector} in tenant ${tenantId}. Notifying Admins.`);
                // Fallback: Notify Admins if no sector manager is found
                const allManagers = yield this.riskManagerRepo.findAll(tenantId);
                const admins = allManagers.filter(m => m.role === 'ADMIN');
                for (const admin of admins) {
                    yield this.emailService.sendDeadlineApprovalEmail(notification, newDeadline.toLocaleDateString('pt-BR'), admin.email);
                }
            }
            return { message: 'Deadline approved and email sent' };
        });
    }
    rejectDeadline(id, tenantId) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield this.repository.findById(id, tenantId);
            if (!notification)
                throw new Error('Notification not found');
            // Find sector manager for this tenant
            const sectorManager = yield this.riskManagerRepo.findBySector(notification.notifySector, tenantId);
            if (sectorManager) {
                yield this.emailService.sendDeadlineRejectionEmail(notification, sectorManager.email);
            }
            else {
                console.warn(`No sector manager found for sector ${notification.notifySector} in tenant ${tenantId}`);
                // Fallback: Notify Admins
                const allManagers = yield this.riskManagerRepo.findAll(tenantId);
                const admins = allManagers.filter(m => m.role === 'ADMIN');
                for (const admin of admins) {
                    yield this.emailService.sendDeadlineRejectionEmail(notification, admin.email);
                }
            }
            return { message: 'Deadline rejected and email sent' };
        });
    }
}
exports.NotificationService = NotificationService;
