import axios from 'axios';
import type { Notification } from './MockDataService'; // Reuse interface for now

const isProduction = import.meta.env.PROD;
// In production, fallback to '/api' (relative) to use Vercel rewrites. In dev, use localhost.
const API_BASE = import.meta.env.VITE_API_URL || (isProduction ? '/api' : 'http://localhost:3001/api');
const API_URL = `${API_BASE}/notifications`;

// Add Auth Interceptor
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

class ApiService {
    // Subscription
    async createCheckoutSession(userId: number): Promise<{ url: string }> {
        const response = await axios.post(`${API_BASE}/subscription/create-checkout-session`, { userId });
        return response.data;
    }

    async getNotifications(): Promise<Notification[]> {
        const response = await axios.get(API_URL);
        return response.data.map((item: any) => this.mapToNotification(item));
    }


    async getNotificationById(id: number): Promise<Notification | undefined> {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            return this.mapToNotification(response.data);
        } catch (error) {
            return undefined;
        }
    }

    async createNotification(data: any): Promise<number> {
        const response = await axios.post(API_URL, data);
        return response.data.id;
    }

    async updateNotification(id: number, data: any): Promise<void> {
        await axios.put(`${API_URL}/${id}`, data);
    }

    async analyzeRootCause(id: number): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/analyze-root-cause`);
        return response.data;
    }

    async reanalyzeNotification(id: number): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/reanalyze`);
        return response.data;
    }

    async forwardToSector(id: number, email: string): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/forward`, { email });
        return response.data;
    }

    async notifyHighManagement(id: number): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/high-management`);
        return response.data;
    }

    async startActionPlan(id: number, deadline?: Date): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/start-action-plan`, { deadline });
        return response.data;
    }

    async chatWithAI(id: number, message: string, context?: any): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/chat`, { message, context });
        return response.data;
    }

    async generateFiveWhys(id: number): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/five-whys`);
        return response.data;
    }

    async contactRiskManager(id: number, message: string): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/contact-risk-manager`, { message });
        return response.data;
    }

    async approveDeadline(id: number, deadline: Date): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/approve-deadline`, { deadline });
        return response.data;
    }

    async rejectDeadline(id: number): Promise<any> {
        const response = await axios.post(`${API_URL}/${id}/reject-deadline`);
        return response.data;
    }

    private mapToNotification(item: any): Notification {
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
            tipo_notificacao: item.type as any,
            data_evento: new Date(item.eventDate).toLocaleDateString('pt-BR'),
            periodo: item.period,
            idade: item.birthDate ? this.calculateAge(new Date(item.birthDate)) : undefined,
            data_internacao: item.admissionDate ? new Date(item.admissionDate).toLocaleDateString('pt-BR') : undefined,
            tipo_evento: item.eventTypeAi || 'EM ANÁLISE',
            classificacao: (item.riskLevel as any) || 'MODERADO',
            prazo: this.calculateDeadline(new Date(item.eventDate), (item.riskLevel as any) || 'MODERADO'),
            status: item.status as any,
            recomendacao_ia: item.aiAnalysis || 'Aguardando análise...',
            // Action Plan Fields
            rootCause: item.rootCause,
            actionPlan: item.actionPlan,
            actionPlanStatus: item.actionPlanStatus || 'NOT_STARTED',
            actionPlanStartDate: item.actionPlanStartDate ? new Date(item.actionPlanStartDate).toLocaleDateString('pt-BR') : undefined,
            actionPlanDeadline: item.actionPlanDeadline ? new Date(item.actionPlanDeadline).toLocaleDateString('pt-BR') : undefined,
            investigationList: item.investigationList
        };
    }

    private calculateAge(birthDate: Date): number {
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    private calculateDeadline(date: Date, risk: string): string {
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

    // Risk Manager Methods
    async getManagers(): Promise<RiskManager[]> {
        const response = await axios.get(`${API_BASE}/managers`);
        return response.data;
    }

    async createManager(data: Omit<RiskManager, 'id' | 'createdAt'>): Promise<RiskManager> {
        const response = await axios.post(`${API_BASE}/managers`, data);
        return response.data;
    }

    async updateManager(id: number, data: Partial<RiskManager>): Promise<RiskManager> {
        const response = await axios.put(`${API_BASE}/managers/${id}`, data);
        return response.data;
    }

    async deleteManager(id: number): Promise<void> {
        await axios.delete(`${API_BASE}/managers/${id}`);
    }

    // Sector Methods
    async getSectors(tenantSlug?: string): Promise<Sector[]> {
        const response = await axios.get(`${API_BASE}/sectors`, {
            params: { tenantSlug }
        });
        return response.data;
    }

    async createSector(name: string): Promise<Sector> {
        const response = await axios.post(`${API_BASE}/sectors`, { name });
        return response.data;
    }

    async deleteSector(id: number): Promise<void> {
        await axios.delete(`${API_BASE}/sectors/${id}`);
    }

    // Dashboard Methods
    async getDashboardStats(): Promise<any> {
        const response = await axios.get(`${API_BASE}/dashboard/stats`);
        return response.data;
    }

    // Admin Methods
    async getAdminTenants(): Promise<any[]> {
        const response = await axios.get(`${API_BASE}/admin/tenants`);
        return response.data;
    }


    async getAdminStats(): Promise<any> {
        const response = await axios.get(`${API_BASE}/admin/stats`);
        return response.data;
    }

    async getAdminTenantsDetailed(): Promise<any[]> {
        const response = await axios.get(`${API_BASE}/admin/tenants-detailed`);
        return response.data;
    }

    async adminResetPassword(userId: number, newPassword: string): Promise<void> {
        await axios.post(`${API_BASE}/admin/reset-password`, { userId, newPassword });
    }

    async adminSendSalesEmail(email: string): Promise<void> {
        await axios.post(`${API_BASE}/admin/send-sales-email`, { email });
    }

    async adminUpdateSubscription(tenantId: string, status: string, periodEnd?: Date): Promise<void> {
        await axios.put(`${API_BASE}/admin/update-subscription`, { tenantId, status, periodEnd });
    }

    async adminCreateUser(userData: any): Promise<void> {
        await axios.post(`${API_BASE}/admin/users`, userData);
    }

    async adminDeleteUser(userId: number): Promise<void> {
        await axios.delete(`${API_BASE}/admin/users/${userId}`);
    }

    async adminDeleteTenant(id: string): Promise<void> {
        await axios.delete(`${API_BASE}/admin/tenants/${id}`);
    }

    async resetPassword(email: string): Promise<any> {
        const response = await axios.post(`${API_BASE}/auth/reset-password`, { email });
        return response.data;
    }
}

export interface RiskManager {
    id: number;
    name: string;
    email: string;
    sectors: string[];
    role: 'ADMIN' | 'GESTOR_SETOR' | 'ALTA_GESTAO';
    createdAt: string;
}

export interface Sector {
    id: number;
    name: string;
}

export const apiService = new ApiService();
export { API_BASE };
