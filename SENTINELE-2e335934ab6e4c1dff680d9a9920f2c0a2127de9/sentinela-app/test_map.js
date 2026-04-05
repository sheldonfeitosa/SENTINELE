const jwt = require('./server/node_modules/jsonwebtoken');

// Directly simulate mapToNotification from ApiService.ts
function mapToNotification(item) {
    function calculateAge(birthDate) {
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    
    function calculateDeadline(date, risk) {
        const deadline = new Date(date);
        switch (risk) {
            case 'GRAVE':
                deadline.setDate(deadline.getDate() + 1); // 24h
                break;
            case 'MODERADO':
                deadline.setDate(deadline.getDate() + 3); // 72h
                break;
            default: // LEVE
                deadline.setDate(deadline.getDate() + 5); // 5 days
                break;
        }
        return deadline.toLocaleDateString('pt-BR');
    }

    return {
        id: item.id,
        created_at: new Date(item.createdAt).toLocaleString('pt-BR'),
        paciente: item.patientName,
        nome_mae: item.motherName,
        nascimento: item.birthDate ? new Date(item.birthDate).toLocaleDateString('pt-BR') : undefined,
        sexo: item.sex,
        setor: item.sector,
        setor_notificado: item.notifySector,
        descricao: item.description,
        tipo_notificacao: item.type,
        data_evento: new Date(item.eventDate).toLocaleDateString('pt-BR'),
        periodo: item.period,
        idade: item.birthDate ? calculateAge(new Date(item.birthDate)) : undefined,
        data_internacao: item.admissionDate ? new Date(item.admissionDate).toLocaleDateString('pt-BR') : undefined,
        tipo_evento: item.eventTypeAi || 'EM ANÁLISE',
        classificacao: item.riskLevel || 'MODERADO',
        prazo: calculateDeadline(new Date(item.eventDate), item.riskLevel || 'MODERADO'),
        status: item.status,
        recomendacao_ia: item.aiAnalysis || 'Aguardando análise...',
        rootCause: item.rootCause,
        actionPlan: item.actionPlan,
        actionPlanStatus: item.actionPlanStatus || 'NOT_STARTED',
        actionPlanStartDate: item.actionPlanStartDate ? new Date(item.actionPlanStartDate).toLocaleDateString('pt-BR') : undefined,
        actionPlanDeadline: item.actionPlanDeadline ? new Date(item.actionPlanDeadline).toLocaleDateString('pt-BR') : undefined,
        investigationList: item.investigationList,
        notivisaNumber: item.notivisaNumber
    };
}

async function main() {
    const JWT_SECRET = "sentinela-secret-key-change-me";
    const token = jwt.sign({ userId: 62, email: 'qualidade@inmceb.med.br', role: 'TENANT_ADMIN', tenantId: '0ca52289-b1bf-431f-8790-bff3749420be' }, JWT_SECRET, { expiresIn: '1d' });
    const response = await fetch('https://sentinelaai.com.br/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) return console.log("Failed API:", response.status);
    const data = await response.json();
    console.log("Parsing", data.length, "items...");
    
    let errorCount = 0;
    for (let i = 0; i < data.length; i++) {
        try {
            mapToNotification(data[i]);
        } catch(e) {
            console.error("Error at item index", i, "ID:", data[i].id, e.message);
            errorCount++;
        }
    }
    console.log("Total errors:", errorCount);
}
main().catch(console.error);
