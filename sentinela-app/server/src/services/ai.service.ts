import dotenv from 'dotenv';

dotenv.config();

export class AIService {
    private async callWithRetry(prompt: string, maxRetries: number = 2): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('AIService ERROR: GROQ_API_KEY is missing!');
            throw new Error("AI Service not configured.");
        }

        let attempts = 0;
        while (attempts <= maxRetries) {
            try {
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey} `,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: [{ role: 'user', content: prompt }],
                        model: 'llama-3.3-70b-versatile',
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorBody.substring(0, 100)} `);
                }

                const data = await response.json();
                return data.choices?.[0]?.message?.content || '';
            } catch (error: any) {
                attempts++;
                console.error(`AI Attempt ${attempts} FAILED: ${error.message} `);
                if (attempts > maxRetries) throw error;
                await new Promise(res => setTimeout(res, 2000 * attempts));
            }
        }
        throw new Error("AI Indisponível.");
    }

    async generateRootCauseAnalysis(description: string, eventType: string, investigationData?: string | null): Promise<any> {
        let formattedInvestigation = '';
        if (investigationData) {
            try {
                const parsed = typeof investigationData === 'string' ? JSON.parse(investigationData) : investigationData;
                if (Array.isArray(parsed)) {
                    formattedInvestigation = parsed.map((item: any) =>
                        `- PERGUNTA: ${item.text || item.question} \n  RESPOSTA: ${item.answer} `
                    ).join('\n');
                } else {
                    formattedInvestigation = String(investigationData);
                }
            } catch (e) {
                formattedInvestigation = String(investigationData);
            }
        }

        const prompt = `
            Atue como um Enfermeiro Gestor de Risco Hospitalar experiente(ONA 3).
            Realize uma Análise de Causa Raiz(ACR) detalhada para o evento descrito.
            Retorne APENAS um JSON válido.

    DESCRIÇÃO: "${description}"
TIPO: "${eventType}"
            INVESTIGAÇÃO PRELIMINAR: ${formattedInvestigation || 'N/A'}

            Estrutura JSON(chaves em português):
{
    "rootCauseConclusion": "...",
        "suggestedDeadline": "dd/mm/yyyy",
            "ishikawa": { "metodo": "...", "material": "...", "mao_de_obra": "...", "meio_ambiente": "...", "medida": "...", "maquina": "..." },
    "fiveWhys": { "why1": "...", "why2": "...", "why3": "...", "why4": "...", "why5": "...", "rootCause": "..." },
    "actionPlan": [{ "what": "...", "why": "...", "who": "...", "where": "...", "when": "...", "how": "...", "howMuch": "..." }]
}
`;

        try {
            const text = await this.callWithRetry(prompt);
            const cleanText = text.replace(/```json / g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error: any) {
            console.error("Fallback RootCause Error:", error.message);
            return this.generateOfflineAnalysis(description);
        }
    }

    async analyzeIncident(description: string): Promise<any> {
        const prompt = `
            Atue como um analista de risco hospitalar.
            Analise o seguinte incidente e retorne um JSON válido.
            Descrição: "${description}"

            Estrutura JSON esperada:
            {
              "eventType": "Tipo do evento",
              "riskLevel": "LEVE, MODERADO ou GRAVE",
              "recommendation": "Sua recomendação"
            }
            IMPORTANTE: Retorne APENAS o JSON.
        `;
        try {
            const text = await this.callWithRetry(prompt);
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch (e: any) {
            console.error("AI Analyze Incident Failed:", e.message);
            return {
                eventType: 'ERRO',
                riskLevel: 'MODERADO',
                recommendation: 'Falha na análise automática. Por favor, revise manualmente.'
            };
        }
    }

    async chatWithContext(message: string, context: any): Promise<string> {
        const prompt = `
            Contexto do Incidente: ${JSON.stringify(context)}
            Usuário: "${message}"
            Responda como um especialista em gestão de risco hospitalar.
        `;
        try {
            return await this.callWithRetry(prompt);
        } catch (e) {
            return "Desculpe, não consigo responder no momento devido a uma falha na conexão.";
        }
    }

    async generateFiveWhys(description: string): Promise<any> {
        return {};
    }

    private generateOfflineAnalysis(description: string): any {
        const descLower = description.toLowerCase();
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const formattedDate = nextWeek.toLocaleDateString('pt-BR');

        let analysis = {
            rootCauseConclusion: "⚠️ ANÁLISE OFFLINE: IA indisponível no momento.",
            suggestedDeadline: formattedDate,
            ishikawa: {
                metodo: "Revisar protocolos atuais.",
                material: "Verificar disponibilidade de insumos.",
                mao_de_obra: "Avaliar dimensionamento e treinamento.",
                meio_ambiente: "Verificar condições ambientais.",
                medida: "Monitorar indicadores de segurança.",
                maquina: "Verificar funcionamento de equipamentos."
            },
            fiveWhys: {
                why1: "Evento adverso ocorreu.",
                why2: "Falha barreira segurança.",
                why3: "Processo não seguiu fluxo.",
                why4: "Fatores contribuintes não mitigados.",
                why5: "Ausência de controle preventivo.",
                rootCause: "Falha sistêmica (IA indisponível)."
            },
            actionPlan: [
                {
                    what: "Investigação detalhada",
                    why: "Determinar causa raiz específica",
                    who: "Gestor de Risco",
                    where: "Setor do evento",
                    when: "Curto Prazo",
                    how: "Reunião com equipe",
                    howMuch: "Sem custo extra"
                }
            ]
        };

        if (descLower.includes("queda")) {
            analysis.rootCauseConclusion = "POSSÍVEL RISCO DE QUEDA: Analisar score de Morse e condições do leito.";
        } else if (descLower.includes("medicamento") || descLower.includes("medicação")) {
            analysis.rootCauseConclusion = "ERRO DE MEDICAÇÃO: Revisar processos de dispensação e administração.";
        }

        return analysis;
    }
}
