import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// removed global init

export class AIService {
    private groq: Groq | null = null;

    constructor() {
    }

    private getGroqClient() {
        if (!this.groq) {
            const apiKey = process.env.GROQ_API_KEY;
            console.log('AIService: Initializing Groq client...');
            if (!apiKey) {
                console.error('AIService ERROR: GROQ_API_KEY is missing from environment variables!');
                return null;
            }
            console.log('AIService: GROQ_API_KEY found, creating instance.');
            this.groq = new Groq({ apiKey });
        }
        return this.groq;
    }

    private async callWithRetry(prompt: string, maxRetries: number = 2): Promise<string> {
        const client = this.getGroqClient();
        if (!client) throw new Error("AI Service not configured (GROQ_API_KEY missing).");

        let attempts = 0;
        while (attempts <= maxRetries) {
            try {
                const chatCompletion = await client.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.1, // Lower temperature for more deterministic output
                    response_format: { type: "json_object" }, // Force JSON mode
                });
                return chatCompletion.choices[0]?.message?.content || '';
            } catch (error: any) {
                attempts++;
                console.error(`AI Attempt ${attempts} failed:`, error.message);
                if (attempts > maxRetries) throw error;
                await new Promise(res => setTimeout(res, 2000 * attempts)); // Exponential backoff
            }
        }
        throw new Error("Agentes IA indisponíveis.");
    }

    async generateRootCauseAnalysis(description: string, eventType: string, investigationData?: string | null): Promise<any> {
        let formattedInvestigation = '';
        if (investigationData) {
            try {
                const parsed = typeof investigationData === 'string' ? JSON.parse(investigationData) : investigationData;
                if (Array.isArray(parsed)) {
                    formattedInvestigation = parsed.map((item: any) =>
                        `- PERGUNTA: ${item.text || item.question}\n  RESPOSTA: ${item.answer}`
                    ).join('\n');
                } else {
                    formattedInvestigation = String(investigationData);
                }
            } catch (e) {
                formattedInvestigation = String(investigationData);
            }
        }

        const prompt = `
            Atue como um Enfermeiro Gestor de Risco de um Hospital ONA 3, com ampla experiência em saúde mental, especialista em gerenciamento de risco e segurança do paciente em saúde mental e psiquiatria.
            Você possui amplo conhecimento na ISO, tem o título de Master Black Belt e experiência em melhoria contínua, cultuando a filosofia KAIZEN.
            Realize uma Análise de Causa Raiz (ACR) detalhada para o evento descrito.

            DESCRIÇÃO: "${description}"
            TIPO: "${eventType}"
            INVESTIGAÇÃO PRELIMINAR: ${formattedInvestigation || 'N/A'}

            Retorne APENAS um JSON válido com a seguinte estrutura (chaves em português):
            {
                "rootCauseConclusion": "Conclusão técnica e sintetizada da causa raiz.",
                "suggestedDeadline": "dd/mm/yyyy (Data estimada para conclusão do plano)",
                "ishikawa": {
                    "metodo": "Fatores ligados aos procedimentos/rotinas",
                    "material": "Fatores ligados a insumos/medicamentos",
                    "mao_de_obra": "Fatores ligados à equipe/comportamento",
                    "meio_ambiente": "Fatores ligados ao ambiente físico/clima",
                    "medida": "Fatores ligados a indicadores/metas",
                    "maquina": "Fatores ligados a equipamentos/sistemas"
                },
                "fiveWhys": {
                    "why1": "...",
                    "why2": "...",
                    "why3": "...",
                    "why4": "...",
                    "why5": "...",
                    "rootCause": "..."
                },
                "actionPlan": [
                    {
                        "what": "O que será feito",
                        "why": "Por que será feito",
                        "who": "Quem fará (Cargo)",
                        "where": "Onde será feito",
                        "when": "Prazo (Imediato, Curto, Médio)",
                        "how": "Como será feito",
                        "howMuch": "Custo (estimado ou 'Sem custo extra')"
                    }
                ]
            }
        `;

        try {
            const text = await this.callWithRetry(prompt);
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error: any) {
            console.error("Fallback RootCause Error:", error.message);
            // Use Offline Analysis instead of generic error
            return this.generateOfflineAnalysis(description);
        }
    }

    async analyzeIncident(description: string): Promise<any> {
        const prompt = `
            Analise o seguinte incidente hospitalar e retorne um JSON com:
            - eventType: Tipo do evento (queda, medicação, etc)
            - riskLevel: Classificação de risco (LEVE, MODERADO, GRAVE)
            - recommendation: Recomendação breve.
            
            Descrição: "${description}"

            JSON de saída:
            { "eventType": "...", "riskLevel": "...", "recommendation": "..." }
        `;
        try {
            console.log('AIService: Starting analysis for description (length):', description.length);
            const text = await this.callWithRetry(prompt);
            console.log('AIService: Raw response received');
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch (e: any) {
            console.error("AIService ERROR in analyzeIncident:", {
                message: e.message,
                stack: e.stack,
                status: e.status, // Groq errors often have status
                code: e.code
            });
            return { eventType: 'ERRO', riskLevel: 'MODERADO', recommendation: 'Falha na análise automática.' };
        }
    }

    async chatWithContext(message: string, context: any): Promise<string> {
        const prompt = `
            Contexto do Incidente: ${JSON.stringify(context)}
            
            Usuário: "${message}"
            
            Responda como um especialista em gestão de risco.
        `;
        try {
            return await this.callWithRetry(prompt);
        } catch (e) {
            return "Desculpe, não consigo responder no momento.";
        }
    }

    async generateFiveWhys(description: string): Promise<any> {
        // Simple wrapper if needed, or part of root cause
        return {};
    }

    private generateOfflineAnalysis(description: string): any {
        const descLower = description.toLowerCase();
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const formattedDate = nextWeek.toLocaleDateString('pt-BR');

        let analysis = {
            rootCauseConclusion: "⚠️ ANÁLISE OFFLINE: Baseada em palavras-chave (IA indisponível).",
            suggestedDeadline: formattedDate,
            ishikawa: {
                metodo: "Revisar protocolos atuais.",
                material: "Verificar disponibilidade de insumos.",
                mao_de_obra: "Avaliar dimensionamento e treinamento.",
                meio_ambiente: "Ambiente pode ter influenciado.",
                medida: "Indicadores precisam ser monitorados.",
                maquina: "Equipamentos em funcionamento?"
            },
            fiveWhys: {
                why1: "Evento adverso ocorreu.",
                why2: "Falha em barreira de segurança.",
                why3: "Processo não seguiu fluxo ideal.",
                why4: "Fatores contribuintes não mitigados.",
                why5: "Ausência de controle preventivo.",
                rootCause: "Falha sistêmica (Análise genérica - Conexão IA falhou)."
            },
            actionPlan: [
                {
                    what: "Investigação detalhada",
                    why: "Determinar causa raiz específica",
                    who: "Gestor de Risco",
                    where: "Setor do evento",
                    when: "Curto Prazo",
                    how: "Reunião com equipe",
                    howMuch: "Sem custo"
                }
            ]
        };

        // Custom Logic based on Keywords
        if (descLower.includes("queda")) {
            analysis.ishikawa.meio_ambiente = "Piso escorregadio? Iluminação inadequada? Grade baixa?";
            analysis.ishikawa.metodo = "Protocolo de prevenção de queda seguido?";
            analysis.rootCauseConclusion = "POSSÍVEL RISCO DE QUEDA: Fatores ambientais ou fisiológicos podem ter contribuído.";
            analysis.actionPlan.push({
                what: "Revisar Score de Queda",
                why: "Atualizar risco do paciente",
                who: "Enfermeiro",
                where: "Prontuário",
                when: "Imediato",
                how: "Aplicar escala Morse",
                howMuch: "-"
            });
        } else if (descLower.includes("medicamento") || descLower.includes("medicação") || descLower.includes("dose")) {
            analysis.ishikawa.metodo = "Falha nos 9 certos?";
            analysis.ishikawa.material = "Medicamento semelhante? Rotulagem?";
            analysis.rootCauseConclusion = "ERRO DE MEDICAÇÃO: Potencial falha na prescrição, dispensação ou administração.";
        } else if (descLower.includes("fuga") || descLower.includes("evasão")) {
            analysis.ishikawa.meio_ambiente = "Portas destrancadas? Falha no controle de acesso?";
            analysis.rootCauseConclusion = "RISCO DE EVASÃO: Falha na segurança física ou observação do paciente.";
        } else if (descLower.includes("agressão") || descLower.includes("agitar")) {
            analysis.ishikawa.mao_de_obra = "Manejo de crise adequado?";
            analysis.rootCauseConclusion = "COMPORTAMENTO AGRESSIVO: Rever protocolo de contenção e manejo verbal.";
        }

        return analysis;
    }
}
