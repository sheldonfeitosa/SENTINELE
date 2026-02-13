const emailService = require('./services/emailService');

const testData = {
    ID: 'TESTE-MANUAL-001',
    SETOR_NOTIFICADO: 'Setor de Teste',
    DESCRICAO: 'Este é um teste de envio solicitado para validar o novo cabeçalho e a entrega na caixa de entrada.',
    PRAZO: new Date().toLocaleDateString('pt-BR'),
    SUGESTAO_IA: 'Confirme se o cabeçalho está correto: SENTINELA AI | ATENÇÃO GESTOR DE RISCO...'
};

const htmlBody = emailService.templates.riskAlert(testData);

console.log('Iniciando envio de email de teste para sheldonfeitosa@gmail.com...');

// A função sendEmail original não retorna Promise, então vamos chamar e esperar um pouco
emailService.sendEmail(
    'sheldonfeitosa@gmail.com',
    'SENTINELA AI | NOTIFICAÇÃO DE TESTE',
    htmlBody
);

// Manter o processo vivo por alguns segundos para garantir o envio
setTimeout(() => {
    console.log('Aguardando conclusão do envio...');
}, 5000);
