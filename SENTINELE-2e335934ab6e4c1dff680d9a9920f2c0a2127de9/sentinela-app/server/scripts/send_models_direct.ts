
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const from = 'onboarding@resend.dev';
const to = 'sheldonfeitosa@gmail.com';

async function send(subject: string, html: string) {
    console.log(`Enviando: ${subject}...`);
    try {
        await resend.emails.send({ from, to, subject, html });
        console.log(`✅ OK: ${subject}`);
    } catch (e: any) {
        console.error(`❌ Erro em ${subject}:`, e.message);
    }
}

async function main() {
    const incident = { id: '999', patientName: 'NOME DO PACIENTE', type: 'QUEDA', riskLevel: 'ALTO', description: 'Paciente caiu ao tentar ir ao banheiro.', sector: 'ALIMENTAÇÃO', aiAnalysis: 'Instalar grades adicionais.', birthDate: '1980-01-01' };

    // 1. Notificação de Incidente
    await send('[MODELO] Notificação de Incidente', `
        <div style="font-family: Arial; padding: 20px;">
            <h1 style="color: #003366;">SENTINELA AI | OCORRÊNCIA</h1>
            <p><strong>Paciente:</strong> ${incident.patientName}</p>
            <p><strong>Evento:</strong> ${incident.type}</p>
            <p><strong>Risco:</strong> ${incident.riskLevel}</p>
            <div style="background: #fdfae6; padding: 15px; border-left: 5px solid #ffb300;">
                <p><em>"${incident.description}"</em></p>
            </div>
            <p style="color: #4caf50;">💡 <strong>Análise IA:</strong> ${incident.aiAnalysis}</p>
        </div>
    `);

    // 2. Ação Imediata (Atraso/Pendente)
    await send('[MODELO] Ação Imediata Necessária', `
        <div style="font-family: Arial; padding: 20px; border: 1px solid #e0e0e0;">
            <h1 style="color: #d32f2f;">AÇÃO IMEDIATA NECESSÁRIA</h1>
            <p>Detectamos uma pendência crítica no setor <strong>${incident.sector}</strong>.</p>
            <p>O plano de ação para a ocorrência #${incident.id} está atrasado.</p>
            <a href="#" style="background: #003366; color: white; padding: 10px 20px; text-decoration: none;">ELABORAR AGORA</a>
        </div>
    `);

    // 3. Alta Gestão (Escalonação)
    await send('[MODELO] Escalonamento Alta Gestão', `
        <div style="font-family: Arial; padding: 20px; background: #fafafa;">
            <div style="background: #b71c1c; color: white; padding: 20px;">
                <h2>NOTA DE ESCALONAMENTO - RISCO INSTITUCIONAL</h2>
            </div>
            <p>Prezado Diretor,</p>
            <p>A Notificação <strong>#${incident.id}</strong> ultrapassou os prazos regulamentares sem tratativa.</p>
            <div style="background: #fff9c4; padding: 20px; border: 1px solid #fbc02d;">
                <strong>Dossiê:</strong> Setor ${incident.sector}, Risco ${incident.riskLevel}
            </div>
            <p>Sua intervenção é solicitada para destravar o fluxo.</p>
        </div>
    `);

    // 4. Solicitação de Prazo
    await send('[MODELO] Solicitação de Alteração de Prazo', `
        <div style="font-family: Arial; padding: 20px;">
            <h2 style="color: #d32f2f;">Solicitação de Prazo</h2>
            <p>O gestor solicitou alteração no prazo da ocorrência #${incident.id}.</p>
            <p><strong>Justificativa:</strong> "Aguardando laudo técnico da engenharia clínica."</p>
            <p><strong>Status Atual:</strong> Expirado em 20/02/2026</p>
            <div style="margin-top: 20px;">
                <button style="background: #2e7d32; color: white; padding: 10px;">DEFERIR</button>
                <button style="background: #d32f2f; color: white; padding: 10px;">INDEFERIR</button>
            </div>
        </div>
    `);

    console.log('Fim do envio de modelos.');
}

main();
