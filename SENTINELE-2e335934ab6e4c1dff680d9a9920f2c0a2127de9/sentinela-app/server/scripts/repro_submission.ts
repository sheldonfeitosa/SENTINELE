import { NotificationService } from './src/services/notification.service';

async function testSubmission() {
    console.log("Testing Notification Submission...");
    const service = new NotificationService();

    const data = {
        paciente: "João da Silva",
        data_evento: "2025-12-03",
        setor: "Corredor",
        setor_notificado: "Manutenção",
        descricao: "Paciente tropeçou no tapete do corredor, não caiu, apenas se desequilibrou. Sem lesões aparentes.",
        tipo_notificacao: "EVENTO ADVERSO",
        // Optional fields left empty as in the browser test
        nome_mae: "",
        nascimento: "",
        sexo: "",
        data_internacao: "",
        periodo: "",
        email_relator: ""
    };

    try {
        const result = await service.createNotification(data);
        console.log("Submission Successful:", result);
    } catch (error: any) {
        console.error("Submission Failed:");
        console.error(error);
    }
}

testSubmission();
