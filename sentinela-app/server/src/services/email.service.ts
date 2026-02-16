import { Resend } from 'resend';

export class EmailService {
    private _resend: Resend | null = null;
    private fromEmail = 'Sentinela AI <notificacoes@sheldonfeitosa.com.br>'; // Using user's professional domain
    private fallbackFrom = 'Sentinela AI <onboarding@resend.dev>';

    private get resend() {
        if (!this._resend) {
            if (!process.env.RESEND_API_KEY) {
                console.warn('RESEND_API_KEY is missing');
            }
            this._resend = new Resend(process.env.RESEND_API_KEY);
        }
        return this._resend;
    }

    private get appUrl() {
        return process.env.APP_URL || 'http://localhost:5173';
    }

    private async sendEmailWithFallback(options: { to: string | string[], subject: string, html: string, tag?: string }) {
        const { to, subject, html, tag = 'Email' } = options;

        try {
            console.log(`📧 Attempting to send ${tag} to: ${Array.isArray(to) ? to.join(', ') : to}`);
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject,
                html
            });

            if (error) {
                console.warn(`⚠️ Standard ${tag} failed (Domain likely unverified):`, JSON.stringify(error, null, 2));

                // Try fallback only if primary failed and we are not in a strict production-only mode
                console.log(`🔄 Attempting fallback using ${this.fallbackFrom}...`);
                const fallbackResult = await this.resend.emails.send({
                    from: this.fallbackFrom,
                    to,
                    subject,
                    html
                });

                if (fallbackResult.error) {
                    console.error(`❌ Fallback ${tag} also failed (Sandbox restriction?):`, JSON.stringify(fallbackResult.error, null, 2));

                    const errorMsg = (fallbackResult.error as any).message || 'Unknown error';
                    if (errorMsg.includes('can only send to')) {
                        console.error('💡 TIP: You are in Resend Sandbox mode. You can ONLY send emails to the address associated with your Resend account until you verify your domain.');
                    }

                    throw new Error(`Both primary and fallback email failed: ${errorMsg}`);
                }

                console.log(`✅ ${tag} sent successfully using fallback domain.`);
                return fallbackResult.data;
            }

            console.log(`✅ Standard ${tag} sent successfully:`, data);
            return data;
        } catch (error) {
            console.error(`❌ Critical error in ${tag} sending:`, error);
            throw error;
        }
    }

    async sendWelcomeEmail(email: string, name: string, password: string, loginUrl: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003366;">Bem-vindo ao Sentinela AI!</h2>
                <p>Olá <strong>${name}</strong>,</p>
                <p>Seu ambiente de testes foi criado com sucesso. Aqui estão suas credenciais de acesso:</p>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #003366;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Senha Provisória:</strong> <code style="background-color: #e0e0e0; padding: 2px 5px; border-radius: 4px;">${password}</code></p>
                    <p style="margin: 5px 0;"><strong>Link de Acesso:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
                </div>

                <p>Você tem <strong>30 dias de acesso gratuito</strong> a todas as funcionalidades Premium, incluindo:</p>
                <ul>
                    <li>Gestão de Incidentes com IA</li>
                    <li>Notificações Ilimitadas</li>
                    <li>Dashboard Executivo em Tempo Real</li>
                </ul>

                <p>Nossa equipe entrará em contato em breve para agendar uma demonstração personalizada.</p>
                
                <br>
                <a href="${loginUrl}" style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Acessar Agora</a>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: email,
            subject: 'Bem-vindo ao Sentinela AI - Suas Credenciais de Acesso',
            html,
            tag: 'Welcome Email'
        });
    }

    async sendIncidentNotification(incident: any, riskManagerEmail: string) {
        const currentDate = new Date();
        const deadlineDate = new Date(currentDate);
        deadlineDate.setDate(deadlineDate.getDate() + 5);
        const deadlineString = deadlineDate.toLocaleDateString('pt-BR');

        const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
                <div style="background-color: #003366; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">SENTINELA AI | NOTIFICAÇÃO DE OCORRÊNCIA</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; font-weight: 600;">ID: ${incident.id}</p>
                </div>
                <div style="padding: 40px;">
                    <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
                        Prezado Gestor <strong>${incident.notifySector || incident.sector}</strong>,
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 140px; font-weight: 700; color: #555;">Paciente:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; text-transform: uppercase;">${incident.patientName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 700; color: #555;">Idade:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${incident.birthDate ? this.calculateAge(incident.birthDate) + ' anos' : '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 700; color: #555;">Evento:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${incident.type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 700; color: #555;">Classificação:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${incident.riskLevel}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 700; color: #555;">Prazo Tratativa:</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                                <span style="background-color: #ffebee; color: #d32f2f; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 14px;">${deadlineString}</span>
                            </td>
                        </tr>
                    </table>
                    <div style="background-color: #fffde7; border-left: 5px solid #ffb300; padding: 20px; margin-bottom: 20px;">
                        <h3 style="color: #ffb300; margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">DESCRIÇÃO DO EVENTO:</h3>
                        <p style="margin: 0; font-style: italic; color: #555; line-height: 1.5;">"${incident.description}"</p>
                    </div>
                    <div style="background-color: #e8f5e9; border-left: 5px solid #4caf50; padding: 20px; margin-bottom: 40px;">
                        <h3 style="color: #4caf50; margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">💡 RECOMENDAÇÃO DA QUALIDADE:</h3>
                        <p style="margin: 0; color: #555; line-height: 1.5;">${incident.aiAnalysis || '-'}</p>
                    </div>
                    <div style="text-align: center; margin-bottom: 50px;">
                        <a href="${this.appUrl}/tratativa/${incident.id}" style="background-color: #003366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: 700; font-size: 14px; text-transform: uppercase; display: inline-block;">RESPONDER PLANO DE AÇÃO</a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 30px;">
                    <div>
                        <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 18px; font-weight: 700;">Sheldon L. A. Feitosa</h2>
                        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">Gerente da Qualidade | INMCEB</p>
                    </div>
                </div>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: riskManagerEmail,
            subject: `[SENTINELA AI] NOTIFICAÇÃO: Nº ${incident.id}`,
            html,
            tag: 'Incident Notification'
        });
    }

    private calculateAge(birthDate: Date | string): number {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    async sendActionRequest(incident: any, sectorManagerEmail: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #d32f2f;">Ação Necessária: Notificação #${incident.id}</h2>
                <p>Uma nova notificação requer sua atenção para elaboração do Plano de Ação.</p>
                <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
                    <p><strong>Descrição:</strong> ${incident.description}</p>
                    <p><strong>Setor:</strong> ${incident.sector}</p>
                </div>
                <a href="${this.appUrl}/tratativa/${incident.id}" 
                   style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                   Acessar Tratativa
                </a>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: sectorManagerEmail,
            subject: `[AÇÃO NECESSÁRIA] Notificação #${incident.id}`,
            html,
            tag: 'Action Request'
        });
    }

    async sendHighManagementReport(incident: any, highManagementEmails: string[]) {
        if (highManagementEmails.length === 0) {
            console.warn('⚠️ No High Management emails found to send report.');
            return;
        }

        const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px;">
                <div style="background: linear-gradient(135deg, #b71c1c 0%, #880e4f 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">
                        NOTA DE ESCALONAMENTO <br>
                        <span style="font-size: 18px; font-weight: normal; opacity: 0.9;">RISCO INSTITUCIONAL</span>
                    </h1>
                </div>
                <div style="padding: 40px;">
                    <p style="font-size: 16px; font-weight: bold; margin-bottom: 25px;">
                        Excelentíssimo Diretor Presidente Voluntário, Sr. Zilmar Pereira,
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
                        No exercício da <strong>Governança Clínica e Gestão de Riscos</strong>, submeto a V.S.ª este reporte de nível crítico.
                    </p>
                    <div style="background-color: #fff9c4; border-top: 4px solid #fbc02d; padding: 25px; margin-bottom: 30px;">
                        <h3 style="color: #d32f2f; margin-top: 0; margin-bottom: 20px; font-size: 18px;">📂 DOSSIÊ DE PENDÊNCIA:</h3>
                        <p><strong>Nº Notificação:</strong> ${incident.id}</p>
                        <p><strong>Setor Envolvido:</strong> ${incident.sector}</p>
                    </div>
                    <div style="text-align: center;">
                        <a href="${this.appUrl}/tratativa/${incident.id}" style="background-color: #1565c0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                            ACESSAR PAINEL DE GESTÃO
                        </a>
                    </div>
                </div>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: highManagementEmails,
            subject: `[ALTA GESTÃO] NOTA DE ESCALONAMENTO - Notificação Nº ${incident.id}`,
            html,
            tag: 'High Management Report'
        });
    }

    async sendRiskManagerContactEmail(incident: any, requesterEmail: string, message: string, riskManagerEmail: string, oldDeadline: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px;">
                <h2 style="color: #d32f2f;">Solicitação de Alteração de Prazo</h2>
                <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
                    <p><strong>ID da Notificação:</strong> #${incident.id}</p>
                    <p><strong>Prazo Atual:</strong> ${oldDeadline}</p>
                    <p><strong>Solicitante:</strong> ${requesterEmail || 'Gestor do Setor'}</p>
                </div>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Justificativa do Atraso:</strong><br>
                    <em style="color: #555;">"${message}"</em>
                </div>
                <div style="text-align: center;">
                    <a href="${this.appUrl}/tratativa/${incident.id}?action=approve_deadline" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">✅ DEFERIR</a>
                    <a href="${this.appUrl}/tratativa/${incident.id}?action=reject_deadline" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">❌ INDEFERIR</a>
                </div>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: riskManagerEmail,
            subject: `[SOLICITAÇÃO] Alteração de Prazo - Notificação #${incident.id}`,
            html,
            tag: 'Risk Manager Request'
        });
    }

    async sendDeadlineApprovalEmail(incident: any, newDeadline: string, managerEmail: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #003366;">Solicitação de Prazo Deferida</h2>
                <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #003366; margin: 20px 0;">
                    <p><strong>Novo Prazo Definido:</strong> ${newDeadline}</p>
                </div>
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/tratativa/${incident.id}" style="display: inline-block; background-color: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar Tratativa</a>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: managerEmail,
            subject: `[DEFERIDO] Novo Prazo para Notificação #${incident.id}`,
            html,
            tag: 'Deadline Approval'
        });
    }

    async sendDeadlineRejectionEmail(incident: any, managerEmail: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #d32f2f;">Solicitação de Prazo Indeferida</h2>
                <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
                    <p><strong>O prazo original permanece inalterado.</strong></p>
                </div>
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/tratativa/${incident.id}" style="display: inline-block; background-color: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar Tratativa</a>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: managerEmail,
            subject: `[INDEFERIDO] Solicitação de Prazo - Notificação #${incident.id}`,
            html,
            tag: 'Deadline Rejection'
        });
    }

    async sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003366;">Recuperação de Senha - Sentinela AI</h2>
                <p>Olá <strong>${name}</strong>,</p>
                <div style="background-color: #f0f9ff; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #003366; text-align: center;">
                    <a href="${resetUrl}" style="background-color: #003366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
                </div>
                <p style="color: #666; font-size: 14px;">Se o botão não funcionar, use o link: ${resetUrl}</p>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: email,
            subject: 'Sua Nova Senha - Sentinela AI',
            html,
            tag: 'Password Reset'
        });
    }

    async sendTrialRequestNotification(data: { name: string; hospital: string; email: string; phone: string }) {
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0;">
                <h2 style="color: #003366;">🚀 Nova Solicitação de Teste Grátis</h2>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Nome:</strong> ${data.name}</p>
                    <p><strong>Instituição:</strong> ${data.hospital}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Telefone:</strong> ${data.phone}</p>
                </div>
            </div>
        `;

        await this.sendEmailWithFallback({
            to: process.env.RISK_MANAGER_EMAIL || 'sheldonfeitosa@gmail.com',
            subject: `[LEAD] Novo Teste Grátis: ${data.name} - ${data.hospital}`,
            html,
            tag: 'Trial Request'
        });
    }
}
