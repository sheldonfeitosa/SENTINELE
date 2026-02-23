"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class AIService {
    callWithRetry(prompt_1) {
        return __awaiter(this, arguments, void 0, function* (prompt, maxRetries = 2, jsonMode = true) {
            var _a, _b, _c;
            const apiKey = process.env.GROQ_API_KEY;
            if (!apiKey) {
                console.error('AIService ERROR: GROQ_API_KEY is missing!');
                throw new Error("AI Service not configured.");
            }
            let attempts = 0;
            while (attempts <= maxRetries) {
                try {
                    const body = {
                        messages: [{ role: 'user', content: prompt }],
                        model: 'llama-3.3-70b-versatile',
                        temperature: 0.1
                    };
                    if (jsonMode) {
                        body.response_format = { type: "json_object" };
                    }
                    const response = yield fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    });
                    if (!response.ok) {
                        const errorBody = yield response.text();
                        throw new Error(`HTTP ${response.status}: ${errorBody.substring(0, 100)} `);
                    }
                    const data = yield response.json();
                    return ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '';
                }
                catch (error) {
                    attempts++;
                    console.error(`AI Attempt ${attempts} FAILED: ${error.message} `);
                    if (attempts > maxRetries)
                        throw error;
                    yield new Promise(res => setTimeout(res, 2000 * attempts));
                }
            }
            throw new Error("AI Indisponível.");
        });
    }
    generateRootCauseAnalysis(description, eventType, investigationData) {
        return __awaiter(this, void 0, void 0, function* () {
            let formattedInvestigation = '';
            if (investigationData) {
                try {
                    const parsed = typeof investigationData === 'string' ? JSON.parse(investigationData) : investigationData;
                    if (Array.isArray(parsed)) {
                        formattedInvestigation = parsed.map((item) => `- PERGUNTA: ${item.text || item.question} \n  RESPOSTA: ${item.answer} `).join('\n');
                    }
                    else {
                        formattedInvestigation = String(investigationData);
                    }
                }
                catch (e) {
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
                const text = yield this.callWithRetry(prompt);
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanText);
            }
            catch (error) {
                console.error("Fallback RootCause Error:", error.message);
                return this.generateOfflineAnalysis(description);
            }
        });
    }
    analyzeIncident(description) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const text = yield this.callWithRetry(prompt);
                const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(clean);
            }
            catch (e) {
                console.error("AI Analyze Incident Failed:", e.message);
                return {
                    eventType: 'ERRO',
                    riskLevel: 'MODERADO',
                    recommendation: 'Falha na análise automática. Por favor, revise manualmente.'
                };
            }
        });
    }
    chatWithContext(message, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = `
            Contexto do Incidente: ${JSON.stringify(context)}
            Usuário: "${message}"
            Responda como um especialista em gestão de risco hospitalar.
        `;
            try {
                return yield this.callWithRetry(prompt, 2, false);
            }
            catch (e) {
                return "Desculpe, não consigo responder no momento devido a uma falha na conexão.";
            }
        });
    }
    generateFiveWhys(description) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = `
            Atue como um especialista em segurança do paciente.
            Realize uma análise de "5 Porquês" para o incidente descrito.
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
                const text = yield this.callWithRetry(prompt);
                const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(clean);
            }
            catch (e) {
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
        });
    }
    generateOfflineAnalysis(description) {
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
        }
        else if (descLower.includes("medicamento") || descLower.includes("medicação")) {
            analysis.rootCauseConclusion = "ERRO DE MEDICAÇÃO: Revisar processos de dispensação e administração.";
        }
        return analysis;
    }
}
exports.AIService = AIService;
