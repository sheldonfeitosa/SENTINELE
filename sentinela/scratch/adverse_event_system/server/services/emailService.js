const nodemailer = require('nodemailer');
const { Resend } = require('resend');
require('dotenv').config();

console.log('[DEBUG] Loading email config...');
console.log('[DEBUG] RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
console.log('[DEBUG] EMAIL_USER present:', !!process.env.EMAIL_USER);

let transporter;
let resend;

if (process.env.RESEND_API_KEY) {
  // Configuração Resend (API Profissional)
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('[EMAIL] Modo Resend Ativado!');
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASS && !process.env.EMAIL_PASS.includes('COLOQUE_SUA_SENHA')) {
  // Configuração Gmail (SMTP)
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log(`[EMAIL] Modo Real Ativado: Enviando como ${process.env.EMAIL_USER}`);
} else {
  // Configuração Ethereal (Teste)
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error('Falha ao criar conta Ethereal:', err);
      return;
    }

    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });

    console.log('[EMAIL] Modo Teste (Ethereal) Configurado!');
    console.log('Preview URL disponível nos logs após envio.');
  });
}

exports.sendEmail = async (to, subject, htmlBody) => {
  // 1. Envio via Resend
  if (resend) {
    try {
      const data = await resend.emails.send({
        from: 'Sentinela AI <onboarding@resend.dev>', // Email de teste padrão
        to: [to], // Em teste, só envia para o email do cadastro (sheldonfeitosa@gmail.com)
        subject: subject,
        html: htmlBody
      });
      console.log('Email enviado via Resend:', data);
    } catch (error) {
      console.error('Erro ao enviar via Resend:', error);
    }
    return;
  }

  // 2. Envio via Nodemailer (Gmail ou Ethereal)
  if (!transporter) {
    console.log('Transporter ainda não inicializado. Tentando novamente em 2s...');
    setTimeout(() => exports.sendEmail(to, subject, htmlBody), 2000);
    return;
  }

  const mailOptions = {
    from: '"Sentinela AI" <no-reply@sentinela.ai>',
    to: to,
    subject: subject,
    html: htmlBody
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Erro ao enviar email:', error);
    } else {
      console.log('Email enviado: ' + info.messageId);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
      }
    }
  });
};

exports.templates = {
  notification: (data) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #003366;">SENTINELA AI | NOTIFICAÇÃO DE EVENTO</h2>
      <p>Prezado Gestor do Setor <strong>${data.SETOR_NOTIFICADO}</strong>,</p>
      <p>Uma nova notificação requer sua atenção para tratativa.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #003366; margin: 20px 0;">
        <p><strong>Descrição:</strong> ${data.DESCRICAO}</p>
        <p><strong>Recomendação da Qualidade:</strong> ${data.RECOMENDACOES_QUALIDADE}</p>
      </div>

      <a href="${data.LINK_DINAMICO}" style="background-color: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        RESPONDER PLANO DE AÇÃO
      </a>
      
      <p style="font-size: 12px; color: #888; margin-top: 20px;">
        Este é um email automático. Por favor, não responda.
      </p>
    </div>
  `,

  riskAlert: (data) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-top: 5px solid #d32f2f;">
      <h2 style="color: #d32f2f;">SENTINELA AI | 🔔 ALERTA DE RISCO</h2>
      <p>Prezado Gestor de Risco,</p>
      <p>Um novo evento foi registrado e requer sua análise inicial.</p>
      
      <div style="background: #fff5f5; padding: 15px; border: 1px solid #ffcdd2; margin: 20px 0; border-radius: 5px;">
        <p><strong>ID do Evento:</strong> ${data.ID}</p>
        <p><strong>Setor Notificado:</strong> ${data.SETOR_NOTIFICADO}</p>
        <p><strong>Prazo para Tratativa:</strong> ${data.PRAZO}</p>
        <hr style="border: 0; border-top: 1px solid #ffcdd2; margin: 10px 0;">
        <p><strong>Descrição do Evento:</strong><br>${data.DESCRICAO}</p>
        <p><strong>Sugestão da IA (BlackBelt):</strong><br>${data.SUGESTAO_IA}</p>
      </div>

      <p>Por favor, acesse o painel para validar a classificação e encaminhar para o gestor responsável.</p>
      
      <p style="font-size: 12px; color: #888; margin-top: 20px;">
        Sentinela AI - Sistema de Gestão de Riscos
      </p>
    </div>
  `,

  deadlineAlert: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <p style="margin-bottom: 20px;">Prezado Gestor <strong>${data.SETOR}</strong>,</p>

      <div style="background-color: #FFEBEE; border-left: 5px solid #C62828; padding: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #C62828; font-weight: normal;">
          <span style="background-color: #FFF176; color: #000; padding: 0 4px; font-weight: bold;">ALERTA</span> 
          <span style="font-weight: bold;">DE ATRASO CRÍTICO</span>
        </h2>
        <p style="margin: 0; font-size: 14px;">
          O prazo para a tratativa da Notificação <strong>Nº ${data.ID}</strong> expirou.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
        Sob a ótica da <strong>Melhoria Contínua</strong>, cada dia de atraso na investigação de causa raiz aumenta a 
        variabilidade do nosso processo e mantém a instituição exposta ao risco de recorrência.
      </p>

      <p style="font-size: 14px; margin-bottom: 30px;">
        <strong>Ação Requerida:</strong><br>
        Favor priorizar esta análise e registrar o plano de ação imediatamente para fecharmos este ciclo PDCA.
      </p>

      <hr style="border: 0; border-top: 1px solid #ddd; margin-bottom: 20px;">

      <div style="font-family: Arial, sans-serif;">
        <h3 style="color: #003366; margin: 0; font-size: 18px;">Sheldon L. A. Feitosa</h3>
        <p style="margin: 5px 0; font-size: 13px; color: #555;">
          Gerente da Qualidade | INMCEB - Instituto do Comportamento Eurípedes Barsanulfo
        </p>
        
        <div style="display: flex; gap: 20px; margin-top: 15px;">
          <div style="flex: 1;">
            <div style="display: flex; alignItems: center; gap: 5px; color: #2E7D32; font-weight: bold; font-size: 12px; margin-bottom: 5px;">
              <span>✅</span> Especialista (Concluído)
            </div>
            <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #666; list-style-type: disc;">
              <li style="margin-bottom: 3px;">Pós-graduação em Saúde Mental e Psicossocial (Estácio)</li>
              <li>Lean Six Sigma Yellow Belt (FM2S)</li>
            </ul>
          </div>
          
          <div style="flex: 1;">
            <div style="display: flex; alignItems: center; gap: 5px; color: #003366; font-weight: bold; font-size: 12px; margin-bottom: 5px;">
              <span>🚀</span> Em Formação (2026)
            </div>
            <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #666; list-style-type: disc;">
              <li style="margin-bottom: 3px;">Arquitetura de Software, C. Dados e Cybersecurity (PUCPR)</li>
              <li>MBA em Gestão de Saúde e Acreditação (Monte Pascoal)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,

  escalationAlert: (data) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
      
      <!-- Banner Vermelho -->
      <div style="background-color: #B71C1C; color: white; padding: 20px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">
          NOTA DE ESCALONAMENTO - RISCO INSTITUCIONAL
        </h2>
      </div>

      <div style="padding: 30px;">
        <p style="font-weight: bold; font-size: 14px; margin-bottom: 20px;">
          Excelentíssimo Diretor Presidente Voluntário, Sr. Zilmar Pereira,
        </p>

        <p style="font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
          No exercício da <strong>Governança Clínica e Gestão de Riscos</strong>, submeto a V.S.ª este reporte de nível crítico. Identificamos 
          o <strong>esgotamento dos prazos regulamentares</strong> para a tratativa da Notificação <strong>Nº ${data.ID}</strong> (Setor: <strong>${data.SETOR}</strong>), sem 
          evidência de resolução eficaz pela gestão responsável.
        </p>

        <p style="font-size: 14px; line-height: 1.5; margin-bottom: 25px;">
          Esta inércia configura um <strong>passivo oculto</strong> para a instituição. A ausência de plano de ação documentado expõe o 
          hospital a riscos jurídicos, assistenciais e de imagem. A melhoria contínua não pode ser interrompida por falhas de fluxo.
        </p>

        <!-- Dossiê Box Amarelo -->
        <div style="background-color: #FFF9C4; padding: 20px; border-top: 4px solid #FBC02D; margin-bottom: 25px;">
          <h3 style="color: #C62828; font-size: 14px; margin: 0 0 15px 0; display: flex; alignItems: center; gap: 5px;">
            📂 DOSSIÊ DE PENDÊNCIA:
          </h3>
          <hr style="border: 0; border-top: 1px solid #FBC02D; margin-bottom: 15px;">

          <p style="font-size: 13px; margin-bottom: 10px;">
            <strong>1. Evento Reportado:</strong><br>
            <em style="color: #555;">"${data.DESCRICAO}"</em>
          </p>

          <p style="font-size: 13px; margin-bottom: 10px;">
            <strong>2. Histórico de Ações da Qualidade:</strong><br>
            • Cobrança formal enviada ao gestor em: <strong>${data.DATA_ALERTA}</strong>.<br>
            <span style="color: #777; font-size: 12px;">(Tentativa de resolução em nível tático esgotada).</span>
          </p>

          <p style="font-size: 13px; margin: 0;">
            <strong>3. Status Atual:</strong><br>
            <span style="color: #D32F2F; font-weight: bold;">PENDENTE DE EVIDÊNCIA DE MELHORIA.</span>
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
          Solicitamos sua chancela para destravar este fluxo, garantindo a blindagem institucional e a segurança do paciente 
          conforme as diretrizes da ONA.
        </p>

        <hr style="border: 0; border-top: 1px solid #ddd; margin-bottom: 20px;">

        <!-- Assinatura -->
        <div style="font-family: Arial, sans-serif;">
          <h3 style="color: #003366; margin: 0; font-size: 18px;">Sheldon L. A. Feitosa</h3>
          <p style="margin: 5px 0; font-size: 13px; color: #555;">
            Gerente da Qualidade | INMCEB - Instituto do Comportamento Eurípedes Barsanulfo
          </p>
          
          <div style="display: flex; gap: 20px; margin-top: 15px;">
            <div style="flex: 1;">
              <div style="display: flex; alignItems: center; gap: 5px; color: #2E7D32; font-weight: bold; font-size: 12px; margin-bottom: 5px;">
                <span>✅</span> Especialista (Concluído)
              </div>
              <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #666; list-style-type: disc;">
                <li style="margin-bottom: 3px;">Pós-graduação em Saúde Mental e Psicossocial (Estácio)</li>
                <li>Lean Six Sigma Yellow Belt (FM2S)</li>
              </ul>
            </div>
            
            <div style="flex: 1;">
              <div style="display: flex; alignItems: center; gap: 5px; color: #003366; font-weight: bold; font-size: 12px; margin-bottom: 5px;">
                <span>🚀</span> Em Formação (2026)
              </div>
              <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #666; list-style-type: disc;">
                <li style="margin-bottom: 3px;">Arquitetura de Software, C. Dados e Cybersecurity (PUCPR)</li>
                <li>MBA em Gestão de Saúde e Acreditação (Monte Pascoal)</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
};
