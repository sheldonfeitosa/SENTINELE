
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();
const service = new NotificationService();

async function testManualForward() {
    console.log('--- Unit Test: Manual Email Forwarding ---');

    // 1. Get an existing incident
    const incident = await prisma.incident.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    if (!incident) {
        console.error('No incident found to test.');
        return;
    }

    console.log(`Testing with Incident ID: ${incident.id} (Tenant: ${incident.tenantId})`);

    // 2. Try to forward to a test email
    const targetEmail = 'sheldonfeitosa@gmail.com'; // User's email from context
    console.log(`Attempting to forward to: ${targetEmail}`);

    try {
        const result = await service.forwardToSector(incident.id, incident.tenantId, targetEmail);
        console.log('Result:', result);
    } catch (error) {
        console.error('Error forwarding email:', error);
    }
}

testManualForward()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
