import dotenv from 'dotenv';

dotenv.config();

export class AIService {
    // Persona sênior reutilizada em todas as análises de IA.
    private readonly SENIOR_PERSONA = `Você é um(a) Enfermeiro(a) Gestor(a) de Risco Hospitalar Sênior e Black Belt Lean Six Sigma, com mais de 15 anos de experiência prática em segurança do paciente e qualidade assistencial, atuando em instituições acreditadas (ONA nível 3 / Qmentum / Joint Commission). Você domina e aplica com rigor: RCA2 (Root Cause Analysis and Action — NPSF/IHI), o Protocolo de Londres, o modelo do Queijo Suíço de James Reason (distinguindo falhas ativas na ponta de condições latentes do sistema), a taxonomia de incidentes da OMS, o diagrama de Ishikawa, os 5 Porquês, a análise de barreiras de segurança e o ciclo DMAIC/PDCA. Suas análises são profundas, específicas ao caso, técnicas e baseadas em evidências — você JAMAIS entrega respostas genéricas ou vagas, nunca culpabiliza o indivíduo, e sempre busca a causa sistêmica e as barreiras que falharam.`;

    private async callWithRetry(prompt: string, maxRetries: number = 2, jsonMode: boolean = true, temperature: number = 0.2): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('AIService ERROR: GROQ_API_KEY is missing!');
            throw new Error("AI Service not configured.");
        }

        let attempts = 0;
        while (attempts <= maxRetries) {
            try {
                const body: any = {
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: temperature
                };

                if (jsonMode) {
                    body.response_format = { type: "json_object" };
                }

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
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
            ${this.SENIOR_PERSONA}

            Realize uma Análise de Causa Raiz (ACR) PROFUNDA e específica para o evento abaixo, no padrão RCA2 + Protocolo de Londres. Retorne APENAS um JSON válido (sem markdown).

            DESCRIÇÃO: "${description}"
            TIPO: "${eventType}"
            INVESTIGAÇÃO PRELIMINAR: ${formattedInvestigation || 'N/A'}

            EXIGÊNCIAS DE QUALIDADE (obrigatórias):
            - Cada categoria do Ishikawa deve trazer fatores CONCRETOS e plausíveis para ESTE evento específico, distinguindo falhas ativas (na ponta do cuidado) de condições latentes (sistêmicas/organizacionais). É PROIBIDO usar frases genéricas como "revisar protocolos" ou "verificar insumos" sem dizer o quê e por quê.
            - Os 5 Porquês devem encadear logicamente: cada porquê aprofunda o anterior, saindo do evento imediato até uma causa raiz SISTÊMICA e acionável (processo/organização), sem culpabilização individual.
            - rootCauseConclusion: 3 a 5 frases. Classifique o nível de dano conforme a taxonomia da OMS, identifique a(s) barreira(s) de segurança que falharam e declare a causa raiz sistêmica.
            - actionPlan (5W2H): ações SMART (específicas, mensuráveis, com responsável por FUNÇÃO, prazo realista com data, e um indicador de verificação de eficácia no campo 'howMuch' ou 'how'). Priorize ações FORTES na hierarquia de efetividade da ACR (forçantes/automação/padronização física) sobre ações fracas (treinamento, alerta, dupla checagem). Gere de 2 a 4 ações.
            - Use terminologia técnica de segurança do paciente e qualidade.

            Estrutura JSON (chaves em português):
            {
                "rootCauseConclusion": "Conclusão sistêmica detalhada (3-5 frases)",
                "suggestedDeadline": "dd/mm/yyyy",
                "ishikawa": {
                    "metodo": "Fatores de processos/procedimentos (falhas ativas e latentes)",
                    "material": "Fatores de insumos e recursos físicos",
                    "mao_de_obra": "Fatores humanos, dimensionamento, competência e fatores de desempenho (fadiga, carga)",
                    "meio_ambiente": "Fatores do ambiente físico e organizacional (cultura, layout, ruído)",
                    "medida": "Fatores de INDICADORES, métricas, monitoramento ou falta de dados (NUNCA decisões ou ações)",
                    "maquina": "Fatores de equipamentos, dispositivos e tecnologia/TI"
                },
                "fiveWhys": { "why1": "...", "why2": "...", "why3": "...", "why4": "...", "why5": "...", "rootCause": "..." },
                "actionPlan": [{ "what": "...", "why": "...", "who": "...", "where": "...", "when": "...", "how": "...", "howMuch": "..." }]
            }

            IMPORTANTE: No Ishikawa, 'Medida' refere-se estritamente a indicadores, métricas, falhas de monitoramento ou falta de dados — jamais a decisões ou planos de ação.
        `;

        try {
            const text = await this.callWithRetry(prompt, 2, true, 0.35);
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error: any) {
            console.error("Fallback RootCause Error:", error.message);
            return this.generateOfflineAnalysis(description);
        }
    }

    async analyzeIncident(description: string): Promise<any> {
        const prompt = `
            ${this.SENIOR_PERSONA}
            Classifique o incidente abaixo com rigor técnico e retorne um JSON válido.
            Descrição: "${description}"

            Estrutura JSON esperada:
            {
              "eventType": "Tipo do evento (Ex: QUEDA, ERRO DE MEDICAÇÃO, EVASÃO DE PACIENTE, HETEROAGRESSÃO)",
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
            ${this.SENIOR_PERSONA}
            Contexto do Incidente: ${JSON.stringify(context)}
            Pergunta do usuário: "${message}"
            Responda de forma técnica, objetiva e acionável, citando a metodologia aplicável quando pertinente.
        `;
        try {
            return await this.callWithRetry(prompt, 2, false, 0.4);
        } catch (e) {
            return "Desculpe, não consigo responder no momento devido a uma falha na conexão.";
        }
    }

    async generateFiveWhys(description: string): Promise<any> {
        const prompt = `
            ${this.SENIOR_PERSONA}
            Realize uma análise de "5 Porquês" para o incidente descrito, encadeando cada porquê até uma causa raiz sistêmica e acionável (sem culpabilização individual).
            Retorne APENAS um JSON válido.

            DESCRIÇÃO: "${description}"

            Estrutura JSON:
            {
                "why1": "Por que o evento imediato aconteceu?",
                "why2": "Por que o motivo acima ocorreu?",
                "why3": "Por que a falha anterior ocorreu?",
                "why4": "Por que a causa acima não foi contida?",
                "why5": "Por que a causa raiz sistêmica existe?",
                "rootCause": "Resumo da causa raiz"
            }
        `;

        try {
            const text = await this.callWithRetry(prompt);
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch (e: any) {
            console.error("AI 5 Whys Failed:", e.message);
            return {
                why1: "Falha na geração automática.",
                why2: "-",
                why3: "-",
                why4: "-",
                why5: "-",
                rootCause: "IA Indisponível."
            };
        }
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
