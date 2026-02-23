import { RiskManagerRepository } from './src/repositories/risk-manager.repository';
import dotenv from 'dotenv';

dotenv.config();

const repo = new RiskManagerRepository();

async function checkManagers() {
    try {
        const managers = await repo.findAll();
        console.log('Total Managers:', managers.length);
        console.log('Managers:', JSON.stringify(managers.map(m => ({ id: m.id, name: m.name, email: m.email, role: m.role })), null, 2));

        const highManagement = managers.filter(m => m.role === 'ALTA_GESTAO');
        console.log('High Management Count:', highManagement.length);

        if (highManagement.length === 0) {
            console.log('WARNING: No High Management users found!');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkManagers();
