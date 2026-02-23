import { Resend } from 'resend';

export class EmailService {
    private _resend: Resend | null = null;
    private fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev'; // Configurable sender

    private get resend() {
        if (!this._resend) {
            if (!process.env.RESEND_API_KEY) {
                console.warn('RESEND_API_KEY is missing');
            }
            this._resend = new Resend(process.env.RESEND_API_KEY);
        }
        return this._resend;
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

        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Bem-vindo ao Sentinela AI - Suas Credenciais de Acesso',
                html
            });
            console.log(`✅ Welcome Email sent to ${email}`);
        } catch (error) {
            console.error('❌ Failed to send Welcome Email:', error);
            // Don't throw, allow flow to continue even if email fails (for dev mainly)
        }
    }

    async sendIncidentNotification(incident: any, riskManagerEmail: string) {
        const currentDate = new Date();
        const deadlineDate = new Date(currentDate);
        deadlineDate.setDate(deadlineDate.getDate() + 5);
        const deadlineString = deadlineDate.toLocaleDateString('pt-BR');

        const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
                <!-- Header -->
                <div style="background-color: #003366; padding: 30px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">SENTINELA AI | NOTIFICAÇÃO DE OCORRÊNCIA</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; font-weight: 600;">ID: ${incident.id}</p>
                </div>

                <div style="padding: 40px;">
                    <!-- Salutation -->
                    <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
                        Prezado Gestor <strong>${incident.notifySector || incident.sector}</strong>,
                    </p>

                    <!-- Data Grid -->
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

                    <!-- Description Box -->
                    <div style="background-color: #fffde7; border-left: 5px solid #ffb300; padding: 20px; margin-bottom: 20px;">
                        <h3 style="color: #ffb300; margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">DESCRIÇÃO DO EVENTO:</h3>
                        <p style="margin: 0; font-style: italic; color: #555; line-height: 1.5;">"${incident.description}"</p>
                    </div>

                    <!-- Recommendation Box -->
                    <div style="background-color: #e8f5e9; border-left: 5px solid #4caf50; padding: 20px; margin-bottom: 40px;">
                        <h3 style="color: #4caf50; margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase;">💡 RECOMENDAÇÃO DA QUALIDADE:</h3>
                        <p style="margin: 0; color: #555; line-height: 1.5;">${incident.aiAnalysis || '-'}</p>
                    </div>

                    <!-- Button -->
                    <div style="text-align: center; margin-bottom: 50px;">
                        <a href="http://localhost:5173/tratativa/${incident.id}" style="background-color: #003366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: 700; font-size: 14px; text-transform: uppercase; display: inline-block;">RESPONDER PLANO DE AÇÃO</a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 30px;">

                    <!-- Signature -->
                    <div>
                        <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 18px; font-weight: 700;">Sheldon L. A. Feitosa</h2>
                        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">Gerente da Qualidade | INMCEB</p>
                        
                        <div style="display: flex; gap: 30px;">
                            <div style="flex: 1;">
                                <div style="color: #2e7d32; font-weight: bold; margin-bottom: 8px; font-size: 12px; display: flex; align-items: center;">
                                    ✅ ESPECIALISTA
                                </div>
                                <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #555; line-height: 1.6;">
                                    <li>Gestão da Qualidade (ONA)</li>
                                    <li>Saúde Mental (Estácio)</li>
                                    <li>Lean Six Sigma Yellow Belt</li>
                                </ul>
                            </div>
                            
                            <div style="flex: 1;">
                                <div style="color: #1565c0; font-weight: bold; margin-bottom: 8px; font-size: 12px;">
                                    🚀 EM FORMAÇÃO (2026)
                                </div>
                                <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #555; line-height: 1.6;">
                                    <li>Arquitetura de Software & Dados (PUCPR)</li>
                                    <li>MBA Gestão Saúde (Monte Pascoal)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        try {
            console.log(`📧 Attempting to send Incident Notification to: ${riskManagerEmail}`);
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: riskManagerEmail,
                subject: `[SENTINELA AI] NOTIFICAÇÃO: Nº ${incident.id}`,
                html: html
            });
            console.log('✅ Incident Notification sent successfully:', result);
        } catch (error) {
            console.error('❌ Failed to send Incident Notification:', error);
            throw error;
        }
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
                <a href="http://localhost:5173/tratativa/${incident.id}" 
                   style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                   Acessar Tratativa
                </a>
            </div>
        `;

        try {
            console.log(`📧 Sending Action Request FROM: ${this.fromEmail} TO: ${sectorManagerEmail}`);
            await this.resend.emails.send({
                from: this.fromEmail,
                to: sectorManagerEmail,
                subject: `[AÇÃO NECESSÁRIA] Notificação #${incident.id}`,
                html: html
            });
            console.log('✅ Action Request Email sent successfully');
        } catch (error) {
            console.error('❌ Failed to send Action Request Email:', error);
            throw error;
        }
    }

    async sendHighManagementReport(incident: any, highManagementEmails: string[]) {
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #b71c1c 0%, #880e4f 100%); padding: 30px; border-radius: 8px 8px 0 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2); text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); font-family: 'Segoe UI', sans-serif; font-weight: 800;">
                        NOTA DE ESCALONAMENTO <br>
                        <span style="font-size: 18px; font-weight: normal; opacity: 0.9;">RISCO INSTITUCIONAL</span>
                    </h1>
                </div>

                <div style="padding: 40px;">
                    <!-- Salutation -->
                    <p style="font-size: 16px; font-weight: bold; margin-bottom: 25px;">
                        Excelentíssimo Diretor Presidente Voluntário, Sr. Zilmar Pereira,
                    </p>

                    <!-- Body Paragraph 1 -->
                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
                        No exercício da <strong>Governança Clínica e Gestão de Riscos</strong>, submeto a V.S.ª este reporte
                        de nível crítico. Identificamos o <strong>esgotamento dos prazos regulamentares</strong> para a
                        tratativa da Notificação <strong>Nº ${incident.id}</strong> (Setor: <strong>${incident.sector}</strong>), sem evidência de resolução eficaz
                        pela gestão responsável.
                    </p>

                    <!-- Body Paragraph 2 -->
                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px; text-align: justify;">
                        Esta inércia configura um <strong>passivo oculto</strong> para a instituição. A ausência de plano de
                        ação documentado expõe o hospital a riscos jurídicos, assistenciais e de imagem. A
                        melhoria contínua não pode ser interrompida por falhas de fluxo.
                    </p>

                    <!-- Dossier Box -->
                    <div style="background-color: #fff9c4; border-top: 4px solid #fbc02d; padding: 25px; margin-bottom: 30px;">
                        <h3 style="color: #d32f2f; margin-top: 0; margin-bottom: 20px; font-size: 18px;">📂 DOSSIÊ DE PENDÊNCIA:</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 4px;">
                                <strong>📅 Data do Evento:</strong> ${new Date(incident.eventDate).toLocaleDateString('pt-BR')}
                            </div>
                            <div style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 4px;">
                                <strong>⏳ Tempo Decorrido:</strong> ${this.calculateAge(incident.eventDate)} dias
                            </div>
                            <div style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 4px;">
                                <strong>🚨 Classificação:</strong> ${incident.riskLevel}
                            </div>
                            <div style="background: rgba(255,255,255,0.5); padding: 10px; border-radius: 4px;">
                                <strong>🏥 Setor Envolvido:</strong> ${incident.sector}
                            </div>
                        </div>
                    </div>

                    <!-- Call to Action -->
                    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border: 1px dashed #2196f3; text-align: center;">
                        <p style="color: #0d47a1; font-weight: bold; margin-bottom: 15px;">
                            Solicitamos sua chancela para destravar este fluxo, garantindo a blindagem institucional e a segurança do paciente, conforme diretrizes da ONA.
                        </p>
                        <a href="http://localhost:5173/tratativa/${incident.id}" style="background-color: #1565c0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            ACESSAR PAINEL DE GESTÃO
                        </a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin-bottom: 30px;">

                    <!-- Signature -->
                    <div>
                        <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 20px;">Sheldon L. A. Feitosa</h2>
                        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">Gerente da Qualidade | INMCEB - Instituto do Comportamento Eurípedes Barsanulfo</p>

                        <div style="display: flex; gap: 40px;">
                            <div style="flex: 1;">
                                <div style="color: #2e7d32; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center;">
                                    ✅ Especialista (Concluído)
                                </div>
                                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #666; line-height: 1.5;">
                                    <li>Pós-graduação em Saúde Mental e Psicossocial (Estácio)</li>
                                    <li>Lean Six Sigma Yellow Belt (FM2S)</li>
                                </ul>
                            </div>

                            <div style="flex: 1;">
                                <div style="color: #1565c0; font-weight: bold; margin-bottom: 10px;">
                                    🚀 Em Formação (2026)
                                </div>
                                <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #666; line-height: 1.5;">
                                    <li>Arquitetura de Software, C.Dados e Cybersecurity (PUCPR)</li>
                                    <li>MBA em Gestão de Saúde e Acreditação (Monte Pascoal)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (highManagementEmails.length > 0) {
            console.log(`📧 Sending High Management Report to: ${highManagementEmails.join(', ')}`);
            try {
                const result = await this.resend.emails.send({
                    from: this.fromEmail,
                    to: highManagementEmails,
                    subject: `[ALTA GESTÃO] NOTA DE ESCALONAMENTO - Notificação Nº ${incident.id}`,
                    html: html
                });
                console.log('✅ High Management Email sent successfully:', result);
            } catch (error) {
                console.error('❌ Failed to send High Management Email:', error);
                throw error;
            }
        } else {
            console.warn('⚠️ No High Management emails found to send report.');
        }
    }

    async sendRiskManagerContactEmail(incident: any, requesterEmail: string, message: string, riskManagerEmail: string, oldDeadline: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px;">
                <h2 style="color: #d32f2f;">Solicitação de Alteração de Prazo</h2>
                <p>O gestor do setor solicitou uma alteração no prazo da tratativa.</p>
                
                <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
                    <p><strong>ID da Notificação:</strong> #${incident.id}</p>
                    <p><strong>Descrição do Evento:</strong> ${incident.description}</p>
                    <p><strong>Prazo Atual:</strong> ${oldDeadline}</p>
                    <p><strong>Solicitante:</strong> ${requesterEmail || 'Gestor do Setor'}</p>
                </div>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Justificativa do Atraso:</strong><br>
                    <em style="color: #555;">"${message}"</em>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <p style="margin-bottom: 15px;">Selecione uma ação:</p>
                    
                    <a href="http://localhost:5173/tratativa/${incident.id}?action=approve_deadline" 
                       style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                       ✅ DEFERIR (Novo Prazo)
                    </a>
                    
                    <a href="http://localhost:5173/tratativa/${incident.id}?action=reject_deadline" 
                       style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       ❌ INDEFERIR
                    </a>
                </div>

                <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                    Ao clicar em "Deferir", você será redirecionado para definir a nova data.
                </p>
            </div>
        `;

        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to: riskManagerEmail,
                subject: `[SOLICITAÇÃO] Alteração de Prazo - Notificação #${incident.id}`,
                html: html
            });
            console.log('✅ Risk Manager Contact Email sent successfully');
        } catch (error) {
            console.error('❌ Failed to send Risk Manager Contact Email:', error);
            throw error;
        }
    }

    async sendDeadlineApprovalEmail(incident: any, newDeadline: string, managerEmail: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #003366;">Solicitação de Prazo Deferida</h2>
                <p>Olá,</p>
                <p>A solicitação de alteração de prazo para a Notificação <strong>#${incident.id}</strong> foi <strong>DEFERIDA</strong> pelo Gestor de Risco.</p>
                
                <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #003366; margin: 20px 0;">
                    <p><strong>Novo Prazo Definido:</strong> ${newDeadline}</p>
                </div>

                <p>Por favor, prossiga com o preenchimento do Plano de Ação dentro do novo prazo estabelecido.</p>
                
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/tratativa/${incident.id}" 
                   style="display: inline-block; background-color: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                   Acessar Tratativa
                </a>
            </div>
        `;

        await this.resend.emails.send({
            from: 'Sentinela AI <onboarding@resend.dev>',
            to: managerEmail,
            subject: `[DEFERIDO] Novo Prazo para Notificação #${incident.id}`,
            html
        });
    }

    async sendDeadlineRejectionEmail(incident: any, managerEmail: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #d32f2f;">Solicitação de Prazo Indeferida</h2>
                <p>Olá,</p>
                <p>A solicitação de alteração de prazo para a Notificação <strong>#${incident.id}</strong> foi <strong>INDEFERIDA</strong> pelo Gestor de Risco.</p>
                
                <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
                    <p><strong>O prazo original permanece inalterado.</strong></p>
                </div>

                <p>Por favor, priorize o preenchimento do Plano de Ação o mais breve possível.</p>
                
                <a href="${process.env.APP_URL || 'http://localhost:5173'}/tratativa/${incident.id}" 
                   style="display: inline-block; background-color: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
                   Acessar Tratativa
                </a>
            </div>
        `;

        await this.resend.emails.send({
            from: 'Sentinela AI <onboarding@resend.dev>',
            to: managerEmail,
            subject: `[INDEFERIDO] Solicitação de Prazo - Notificação #${incident.id}`,
            html
        });
    }
    async sendPasswordResetEmail(email: string, name: string, newPassword: string) {
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003366;">Recuperação de Senha - Sentinela AI</h2>
                <p>Olá <strong>${name}</strong>,</p>
                <p>Recebemos uma solicitação de recuperação de senha para sua conta.</p>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #003366;">
                    <p style="margin: 5px 0;">Sua nova senha temporária é:</p>
                    <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #003366;">
                        <code style="background-color: #e0e0e0; padding: 5px 10px; border-radius: 4px;">${newPassword}</code>
                    </p>
                </div>

                <p style="color: #666; font-size: 14px;"><strong>IMPORTANTE:</strong> Por segurança, recomendamos que você altere esta senha após o primeiro login.</p>
                
                <p>Se você não solicitou esta alteração, por favor ignore este e-mail ou entre em contato com o suporte.</p>
                
                <br>
                <a href="https://sentinela-ai.vercel.app/login" style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Acessar Sistema</a>
            </div>
        `;

        try {
            await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Sua Nova Senha - Sentinela AI',
                html
            });
            console.log(`✅ Password reset email sent to ${email}`);
        } catch (error) {
            console.error('❌ Failed to send password reset email:', error);
            throw error;
        }
    }

    async sendTrialRequestNotification(data: { name: string; hospital: string; email: string; phone: string }) {
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0;">
                <h2 style="color: #003366;">🚀 Nova Solicitação de Teste Grátis</h2>
                <p>Um novo lead solicitou acesso de 30 dias na Landing Page.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Nome:</strong> ${data.name}</p>
                    <p><strong>Instituição:</strong> ${data.hospital}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Telefone:</strong> ${data.phone}</p>
                </div>
                
                <p>Entre em contato o mais rápido possível para liberar o acesso.</p>
            </div>
        `;

        // Send to yourself (Admin)
        await this.resend.emails.send({
            from: this.fromEmail,
            to: process.env.RISK_MANAGER_EMAIL || 'qualidade@inmceb.med.br', // Updated fallback
            subject: `[LEAD] Novo Teste Grátis: ${data.name} - ${data.hospital}`,
            html
        });
    }
}
