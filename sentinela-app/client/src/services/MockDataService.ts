export interface Notification {
    id: number;
    created_at: string; // Carimbo de data/hora
    paciente: string;
    nome_mae?: string;
    nascimento?: string;
    sexo?: string;
    setor: string; // Setor Onde Ocorreu
    setor_notificado?: string;
    descricao: string;
    tipo_notificacao: 'EVENTO ADVERSO' | 'NÃO CONFORMIDADE';
    data_evento: string;
    periodo?: string;
    idade?: number;
    data_internacao?: string;
    tipo_evento: string; // TIPO DE EVENTO (IA)
    classificacao: 'LEVE' | 'MODERADO' | 'GRAVE' | 'NA';
    prazo: string;
    status: 'Aberto' | 'Em Análise' | 'Concluído';
    recomendacao_ia?: string;
    // Action Plan Fields
    rootCause?: string;
    actionPlan?: string;
    actionPlanStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    actionPlanStartDate?: string;
    actionPlanDeadline?: string;
    investigationList?: string;
}

class MockDataService {
    private notifications: Notification[] = [
        {
            id: 99,
            created_at: "12/10/2025 17:12:23",
            paciente: "João Silva",
            nome_mae: "Maria Silva",
            nascimento: "29/09/1997",
            sexo: "MASCULINO",
            setor: "Belmiro Azeredo",
            setor_notificado: "Segurança",
            descricao: "Paciente realizou fuga pelo telhado da enfermaria BA, por volta das 13h tomando rumo desconhecido. Mãe ciente. Realizo BO, número da ocorrência: 44119830.",
            tipo_notificacao: "EVENTO ADVERSO",
            data_evento: "12/10/2025",
            periodo: "TARDE",
            idade: 28,
            data_internacao: "10/10/2025",
            tipo_evento: "FUGA PACIENTE",
            classificacao: "LEVE",
            prazo: "27/10/2025",
            status: "Aberto",
            recomendacao_ia: "Revisar protocolos de segurança física da unidade."
        },
        {
            id: 100,
            created_at: "14/10/2025 10:05:52",
            paciente: "Carlos Souza",
            nome_mae: "Ana Souza",
            nascimento: "15/05/1980",
            sexo: "MASCULINO",
            setor: "Cândida Pereira",
            setor_notificado: "Enfermagem",
            descricao: "Evadiu no horário da visita, outro paciente auxiliou para pular pelo telhado da CP.",
            tipo_notificacao: "EVENTO ADVERSO",
            data_evento: "13/10/2025",
            periodo: "TARDE",
            idade: 45,
            data_internacao: "01/10/2025",
            tipo_evento: "EVASÃO PACIENTE",
            classificacao: "LEVE",
            prazo: "29/10/2025",
            status: "Em Análise",
            recomendacao_ia: "Aumentar supervisão durante horários de visita."
        },
        {
            id: 101,
            created_at: "14/10/2025 10:08:13",
            paciente: "Pedro Santos",
            nome_mae: "Lucia Santos",
            nascimento: "20/11/1990",
            sexo: "MASCULINO",
            setor: "Belmiro Azeredo",
            setor_notificado: "Psicologia",
            descricao: "Evadiu no horário da sessão, estava sendo acompanhado pelo sr Divino.",
            tipo_notificacao: "EVENTO ADVERSO",
            data_evento: "13/10/2025",
            periodo: "NOITE",
            idade: 34,
            data_internacao: "05/10/2025",
            tipo_evento: "EVASÃO PACIENTE",
            classificacao: "GRAVE",
            prazo: "17/10/2025",
            status: "Aberto",
            recomendacao_ia: "Avaliar risco de fuga antes de deslocamentos."
        },
        {
            id: 102,
            created_at: "14/10/2025 10:12:13",
            paciente: "Ana Costa",
            nome_mae: "Beatriz Costa",
            nascimento: "10/02/1995",
            sexo: "FEMININO",
            setor: "Apartamentos",
            setor_notificado: "Segurança",
            descricao: "Subiu no horário da visita, viu o portão aberto do acesso à avenida Universitária e evadiu. Mas a equipe conseguiu intervir.",
            tipo_notificacao: "EVENTO ADVERSO",
            data_evento: "13/10/2025",
            periodo: "TARDE",
            idade: 30,
            data_internacao: "12/10/2025",
            tipo_evento: "FUGA PACIENTE",
            classificacao: "MODERADO",
            prazo: "24/10/2025",
            status: "Concluído",
            recomendacao_ia: "Manter portões trancados e verificar fechaduras."
        },
        {
            id: 108,
            created_at: "08/11/2025 22:32:30",
            paciente: "Maria Vieira",
            nome_mae: "Clara Vieira",
            nascimento: "19/08/1984",
            sexo: "FEMININO",
            setor: "Maria Vieira",
            setor_notificado: "Médico",
            descricao: "Paciente relata que teve queda da própria altura após escorregar em um degrau, causando entorse em tornozelo E.",
            tipo_notificacao: "EVENTO ADVERSO",
            data_evento: "06/11/2025",
            periodo: "NOITE",
            idade: 41,
            data_internacao: "01/11/2025",
            tipo_evento: "QUEDA PROPRIA ALTURA",
            classificacao: "MODERADO",
            prazo: "18/11/2025",
            status: "Em Análise",
            recomendacao_ia: "Sinalizar degraus e melhorar iluminação."
        }
    ];

    async getNotifications(): Promise<Notification[]> {
        return new Promise((resolve) => {
            setTimeout(() => resolve([...this.notifications]), 500);
        });
    }

    async getNotificationById(id: number): Promise<Notification | undefined> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(this.notifications.find(n => n.id === id)), 300);
        });
    }

    async createNotification(data: any): Promise<number> {
        return new Promise((resolve) => {
            const newId = Math.floor(Math.random() * 1000) + 1000;
            // Calculate age roughly
            const birthDate = new Date(data.nascimento);
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

            const newNotification: Notification = {
                id: newId,
                created_at: new Date().toLocaleString('pt-BR'),
                paciente: data.paciente,
                nome_mae: data.nome_mae,
                nascimento: data.nascimento,
                sexo: data.sexo === 'M' ? 'MASCULINO' : 'FEMININO',
                setor: data.setor,
                setor_notificado: data.setor_notificado,
                descricao: data.descricao,
                tipo_notificacao: "EVENTO ADVERSO", // Default for now
                data_evento: data.data_evento,
                periodo: data.periodo,
                idade: calculatedAge,
                data_internacao: data.data_internacao,
                tipo_evento: "EM ANÁLISE", // AI would determine this
                classificacao: "MODERADO", // AI would determine this
                prazo: "Calculando...",
                status: "Aberto",
                recomendacao_ia: "Aguardando análise da IA..."
            };
            this.notifications.push(newNotification);
            setTimeout(() => resolve(newId), 800);
        });
    }
}

export const dataService = new MockDataService();
