
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { EmailService } = require('../src/services/email.service');
const { NotificationRepository } = require('../src/repositories/notification.repository');

async function testHighManagement() {
    const emailService = new EmailService();
    const repository = new NotificationRepository();

    // Get a real incident for inmceb
    const incident = await prisma.incident.findFirst({
        where: { tenant: { slug: 'inmceb' } }
    });

    if (!incident) {
        console.error('No incident found for inmceb');
        return;
    }

    const highManagementEmails = ['sheldonfeitosa@inmceb.med.br', 'sheldonfeitosa@gmail.com'];

    console.log('--- TESTING HIGH MANAGEMENT REPORT ---');
    try {
        await emailService.sendHighManagementReport(incident, highManagementEmails);
        console.log('SUCCESS: Method finished without error');
    } catch (error) {
        console.error('FAILURE:', error);
    }
}

testHighManagement().finally(() => prisma.$disconnect());
