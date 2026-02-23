
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Resend } from 'resend';

async function main() {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = (process.env.EMAIL_FROM || 'onboarding@resend.dev').replace(/[\r\n]/g, '').trim();
    const targetEmail = 'sheldonfeitosa@gmail.com';

    const emailList = `
        <h2>Lista de E-mails do Sistema Sentinela AI</h2>
        
        <h3>1. E-mails de Configuração/Sistema:</h3>
        <ul>
            <li>qualidade@inmceb.med.br</li>
            <li>sheldonfeitosa@gmail.com</li>
            <li>admin@inmceb.med.br</li>
            <li>onboarding@resend.dev</li>
            <li>risk.manager@hospital.com</li>
        </ul>

        <h3>2. E-mails de Usuários (Banco de Dados):</h3>
        <ul>
            <li>qualidade@inmceb.med.br</li>
            <li>sheldonfeitosafotografia@gmail.com</li>
            <li>qualidadeinmceb@gmail.com</li>
            <li>tecnologia@inmceb.med.br</li>
            <li>sheldonfeitosa@gmail.com</li>
            <li>sheldonfeiotosa@gmail.com (Erro de digitação detectado)</li>
            <li>gestor1.1771242980490@test.com</li>
            <li>gestor2.1771242980635@test.com</li>
        </ul>

        <hr>
        <p>Enviado automaticamente pelo Assistente Sentinela AI.</p>
    `;

    console.log(`🚀 Enviando lista de e-mails para ${targetEmail}...`);

    try {
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: targetEmail,
            subject: '[SENTINELA AI] Relatório Completo de E-mails do Sistema',
            html: emailList
        });

        if (error) {
            console.error('❌ Erro ao enviar e-mail:', error);
        } else {
            console.log('✅ E-mail enviado com sucesso!', data);
        }
    } catch (err) {
        console.error('❌ Falha crítica no envio:', err);
    }
}

main();
