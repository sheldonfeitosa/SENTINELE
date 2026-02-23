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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const resend_1 = require("resend");
class EmailService {
    constructor() {
        this._resend = null;
        this.fromEmail = (process.env.EMAIL_FROM || 'onboarding@resend.dev').replace(/[\r\n]/g, '').trim();
    }
    get resend() {
        if (!this._resend) {
            if (!process.env.RESEND_API_KEY) {
                console.warn('RESEND_API_KEY is missing');
            }
            this._resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        }
        return this._resend;
    }
    sendEmailWithFallback(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let lastError = null;
            try {
                const { data, error } = yield this.resend.emails.send({
                    from: this.fromEmail,
                    to: params.to,
                    subject: params.subject,
                    html: params.html
                });
                if (!error) {
                    console.log(`✅ Email sent using primary sender (${this.fromEmail})`);
                    return { data, error };
                }
                lastError = error;
                console.warn(`⚠️ Primary sender failed (${this.fromEmail}):`, error.message);
            }
            catch (err) {
                lastError = err;
                console.warn(`⚠️ Primary sender exception (${this.fromEmail}):`, err.message);
            }
            // Fallback para onboarding@resend.dev se o primeiro falhar e não for ele mesmo
            if (this.fromEmail !== 'onboarding@resend.dev') {
                try {
                    console.log('🔄 Attempting fallback to onboarding@resend.dev...');
                    const { data, error } = yield this.resend.emails.send({
                        from: 'onboarding@resend.dev',
                        to: params.to,
                        subject: params.subject,
                        html: params.html
                    });
                    if (!error) {
                        console.log('✅ Email sent using fallback sender (onboarding@resend.dev)');
                        return { data, error };
                    }
                    console.error('❌ Fallback sender also failed:', error.message);
                    throw new Error(error.message);
                }
                catch (fallbackErr) {
                    console.error('❌ Fallback exception:', fallbackErr.message);
                    throw fallbackErr;
                }
            }
            throw new Error((lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Failed to send email');
        });
    }
    sendWelcomeEmail(email, name, password, loginUrl) {
        return __awaiter(this, void 0, void 0, function* () {
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
                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">Equipe Sentinela AI</h2>
                    <p style="color: #666; margin: 0; font-size: 12px;">Sucesso do Cliente</p>
                </div>
            </div>
        `;
            try {
                yield this.sendEmailWithFallback({
                    to: email,
                    subject: 'Bem-vindo ao Sentinela AI - Suas Credenciais de Acesso',
                    html
                });
                console.log(`✅ Welcome Email sent to ${email}`);
            }
            catch (error) {
                console.error('❌ Failed to send Welcome Email:', error);
                // Don't throw, allow flow to continue even if email fails (for dev mainly)
            }
        });
    }
    sendIncidentNotification(incident, riskManagerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
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
                        <a href="${process.env.APP_URL || 'https://sentinelaai.com.br'}/tratativa/${incident.id}" style="background-color: #003366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: 700; font-size: 14px; text-transform: uppercase; display: inline-block;">RESPONDER PLANO DE AÇÃO</a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 30px;">

                    <!-- Signature -->
                    <div>
                        <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 18px; font-weight: 700;">Equipe Sentinela AI</h2>
                        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">Gestão Inteligente de Riscos e Segurança</p>
                    </div>
                </div>
            </div>
        `;
            try {
                console.log(`📧 Attempting to send Incident Notification to: ${riskManagerEmail}`);
                const result = yield this.sendEmailWithFallback({
                    to: riskManagerEmail,
                    subject: `[SENTINELA AI] NOTIFICAÇÃO: Nº ${incident.id}`,
                    html: html
                });
                console.log('✅ Incident Notification sent successfully:', result);
            }
            catch (error) {
                console.error('❌ Failed to send Incident Notification:', error);
                throw error;
            }
        });
    }
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }
    sendActionRequest(incident, sectorManagerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; background-color: #ffffff;">
                <!-- Header -->
                <div style="background-color: #d32f2f; padding: 25px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">AÇÃO IMEDIATA NECESSÁRIA</h1>
                    <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Notificação de Incidência Nº ${incident.id}</p>
                </div>

                <div style="padding: 30px;">
                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Prezado Gestor,
                    </p>
                    
                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
                        Identificamos uma pendência crítica sob sua responsabilidade: a elaboração do <strong>Plano de Ação</strong> para a ocorrência registrada no setor <strong>${incident.sector}</strong>. 
                    </p>

                    <div style="background-color: #fff8f1; border-left: 4px solid #ff9800; padding: 20px; margin-bottom: 25px;">
                        <p style="margin: 0; font-size: 14px; color: #e65100; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">⚠️ DETALHES DA PENDÊNCIA:</p>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>ID:</strong> #${incident.id}</p>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>Evento:</strong> ${incident.description}</p>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
                        <strong>Por que sua resposta é urgente?</strong><br>
                        A gestão de incidentes é a nossa maior ferramenta de blindagem. Cada hora de atraso na tratativa é uma janela aberta para que o mesmo erro se repita, colocando em risco a segurança do paciente e a integridade da nossa operação.
                    </p>

                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 30px; text-align: justify; color: #555;">
                        Lembramos que o preenchimento eficaz do plano de ação é um requisito mandatório de <strong>Compliance e Governança Clínica</strong>. Sua liderança é fundamental para transformarmos essa falha em uma oportunidade de melhoria contínua.
                    </p>

                    <!-- Button -->
                    <div style="text-align: center; margin-bottom: 35px;">
                        <a href="${process.env.APP_URL || 'https://sentinelaai.com.br'}/tratativa/${incident.id}" 
                           style="background-color: #003366; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                           ELABORAR PLANO DE AÇÃO AGORA
                        </a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 25px;">

                    <!-- Signature -->
                    <div style="text-align: left;">
                        <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">Equipe Sentinela AI</h2>
                        <p style="color: #666; margin: 0; font-size: 12px;">Gestão de Riscos e Qualidade Hospitalar</p>
                    </div>
                </div>
            </div>
        `;
            try {
                console.log(`📧 Sending Action Request FROM: ${this.fromEmail} TO: ${sectorManagerEmail}`);
                yield this.sendEmailWithFallback({
                    to: sectorManagerEmail,
                    subject: `[AÇÃO NECESSÁRIA] Notificação #${incident.id}`,
                    html: html
                });
                console.log('✅ Action Request Email sent successfully');
            }
            catch (error) {
                console.error('❌ Failed to send Action Request Email:', error);
                throw error;
            }
        });
    }
    sendHighManagementReport(incident, highManagementEmails) {
        return __awaiter(this, void 0, void 0, function* () {
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
                        Prezado(a) Diretor(a),
                    </p>

                    <!-- Body Paragraph 1 -->
                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
                        No exercício da <strong>Governança Clínica e Gestão de Riscos</strong>, submetemos a V.S.ª este reporte de <strong>alerta crítico</strong>. Identificamos que a Notificação <strong>Nº ${incident.id}</strong> (Setor: <strong>${incident.sector}</strong>) ultrapassou todos os prazos regulamentares sem a devida tratativa.
                    </p>

                    <!-- Body Paragraph 2 -->
                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; text-align: justify;">
                        A demora na resposta a um incidente não é apenas uma falha administrativa; é um <strong>risco silencioso</strong> que corrói os pilares da instituição. Ao negligenciar a gestão de riscos, a unidade perde em diversas frentes:
                    </p>

                    <ul style="font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 30px; padding-left: 20px;">
                        <li><strong>Segurança do Paciente:</strong> Eventos não tratados têm alta probabilidade de recorrência, expondo vidas a riscos evitáveis.</li>
                        <li><strong>Passivo Jurídico:</strong> A ausência de um plano de ação documentado fragiliza a defesa institucional em casos de judicialização.</li>
                        <li><strong>Certificações (ONA/Qmentum):</strong> Pendências críticas são as principais causas de perda de selos de qualidade e acreditações.</li>
                        <li><strong>Impacto Financeiro:</strong> O retrabalho e as indenizações por eventos adversos geram custos infinitamente superiores ao investimento em prevenção.</li>
                        <li><strong>Reputação:</strong> A imagem da instituição é construída pela sua capacidade de aprender com os erros e garantir um ambiente seguro.</li>
                    </ul>

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
                    <div style="background-color: #e3f2fd; padding: 25px; border-radius: 8px; border: 1px dashed #2196f3; text-align: center;">
                        <p style="color: #0d47a1; font-weight: bold; margin-bottom: 20px; font-size: 15px; line-height: 1.5;">
                            Solicitamos sua intervenção direta para destravar este fluxo. Como Diretor, você pode chancelar a extensão do prazo ou exigir a resolução imediata.
                        </p>
                        
                        <div style="margin-bottom: 15px;">
                            <a href="${process.env.APP_URL || 'https://sentinelaai.com.br'}/tratativa/${incident.id}?action=approve_deadline" 
                               style="background-color: #2e7d32; color: white; padding: 14px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3); font-size: 13px; text-transform: uppercase; margin-right: 10px; margin-bottom: 10px;">
                               ✅ CHANCELAR NOVO PRAZO
                            </a>

                            <a href="${process.env.APP_URL || 'https://sentinelaai.com.br'}/tratativa/${incident.id}" 
                               style="background-color: #1565c0; color: white; padding: 14px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3); font-size: 13px; text-transform: uppercase;">
                               🔍 REVISAR TRATATIVA
                            </a>
                        </div>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin-bottom: 30px;">

                <!-- Signature -->
                <div style="margin-top: 40px; border-top: 1px solid #eee; pt-20;">
                    <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 18px; font-weight: 700;">Equipe Sentinela AI</h2>
                    <p style="color: #666; margin: 0; font-size: 14px;">Protocolo de Segurança Institucional</p>
                </div>
            </div>
        </div>
        `;
            if (highManagementEmails.length > 0) {
                console.log(`📧 Sending High Management Reports individually to: ${highManagementEmails.join(', ')}`);
                for (const recipient of highManagementEmails) {
                    try {
                        yield this.sendEmailWithFallback({
                            to: recipient,
                            subject: `[ALTA GESTÃO] NOTA DE ESCALONAMENTO - Notificação Nº ${incident.id}`,
                            html: html
                        });
                        console.log(`✅ High Management Email sent to ${recipient}`);
                    }
                    catch (error) {
                        console.error(`❌ Failed to send High Management Email to ${recipient}:`, error.message);
                    }
                }
                return;
            }
            else {
                console.warn('⚠️ No High Management emails found to send report.');
            }
        });
    }
    sendRiskManagerContactEmail(incident, requesterEmail, message, riskManagerEmail, oldDeadline) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    
                    <a href="${process.env.APP_URL || 'https://sentinelaai.com.br'}/tratativa/${incident.id}?action=approve_deadline" 
                       style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                       ✅ DEFERIR (Novo Prazo)
                    </a>
                    
                    <a href="${process.env.APP_URL || 'https://sentinelaai.com.br'}/tratativa/${incident.id}?action=reject_deadline" 
                       style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       ❌ INDEFERIR
                    </a>
                </div>

                <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                    <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">Sistema Sentinela AI</h2>
                    <p style="color: #666; margin: 0; font-size: 12px;">Notificação Automática de Governança</p>
                </div>
            </div>
        `;
            try {
                yield this.sendEmailWithFallback({
                    to: riskManagerEmail,
                    subject: `[SOLICITAÇÃO] Alteração de Prazo - Notificação #${incident.id}`,
                    html: html
                });
                console.log('✅ Risk Manager Contact Email sent successfully');
            }
            catch (error) {
                console.error('❌ Failed to send Risk Manager Contact Email:', error);
                throw error;
            }
        });
    }
    sendDeadlineApprovalEmail(incident, newDeadline, managerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #003366;">Solicitação de Prazo Deferida</h2>
                <p>Olá,</p>
                <p>A solicitação de alteração de prazo para a Notificação <strong>#${incident.id}</strong> foi <strong>DEFERIDA</strong> pelo Gestor de Risco.</p>
                
                <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #003366; margin: 20px 0;">
                    <p><strong>Novo Prazo Definido:</strong> ${newDeadline}</p>
                </div>

                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">Equipe Sentinela AI</h2>
                    <p style="color: #666; margin: 0; font-size: 12px;">Gestão de Prazos e Conformidade</p>
                </div>
            </div>
        `;
            yield this.sendEmailWithFallback({
                to: managerEmail,
                subject: `[DEFERIDO] Novo Prazo para Notificação #${incident.id}`,
                html
            });
        });
    }
    sendDeadlineRejectionEmail(incident, managerEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #d32f2f;">Solicitação de Prazo Indeferida</h2>
                <p>Olá,</p>
                <p>A solicitação de alteração de prazo para a Notificação <strong>#${incident.id}</strong> foi <strong>INDEFERIDA</strong> pelo Gestor de Risco.</p>
                
                <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
                    <p><strong>O prazo original permanece inalterado.</strong></p>
                </div>

                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">Equipe Sentinela AI</h2>
                    <p style="color: #666; margin: 0; font-size: 12px;">Gestão de Riscos e Qualidade</p>
                </div>
            </div>
        `;
            yield this.sendEmailWithFallback({
                to: managerEmail,
                subject: `[INDEFERIDO] Solicitação de Prazo - Notificação #${incident.id}`,
                html
            });
        });
    }
    sendPasswordResetEmail(email, name, resetLink) {
        return __awaiter(this, void 0, void 0, function* () {
            const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #003366;">Recuperação de Senha - Sentinela AI</h2>
                <p>Olá <strong>${name}</strong>,</p>
                <p>Recebemos uma solicitação de recuperação de senha para sua conta.</p>
                
                <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #003366; text-align: center;">
                    <p style="margin-bottom: 20px;">Clique no botão abaixo para definir sua nova senha. Este link expira em 1 hora.</p>
                    <a href="${resetLink}" style="background-color: #003366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">REDEFINIR MINHA SENHA</a>
                </div>

                <p style="color: #666; font-size: 14px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
                <p style="color: #003366; font-size: 12px; word-break: break-all;">${resetLink}</p>
                
                <p>Se você não solicitou esta alteração, por favor ignore este e-mail ou entre em contato com o suporte.</p>
                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
                    <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">Equipe Sentinela AI</h2>
                </div>
            </div>
        `;
            try {
                yield this.sendEmailWithFallback({
                    to: email,
                    subject: 'Redefinição de Senha - Sentinela AI',
                    html
                });
                console.log(`✅ Password reset email sent to ${email}`);
            }
            catch (error) {
                console.error('❌ Failed to send password reset email:', error);
                throw error;
            }
        });
    }
    sendTrialRequestNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    <h2 style="color: #003366; margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">Sentinela AI Bot</h2>
                </div>
            </div>
        `;
            // Send to yourself (Admin)
            yield this.sendEmailWithFallback({
                to: process.env.RISK_MANAGER_EMAIL || 'qualidade@inmceb.med.br',
                subject: `[LEAD] Novo Teste Grátis: ${data.name} - ${data.hospital}`,
                html
            });
        });
    }
}
exports.EmailService = EmailService;
