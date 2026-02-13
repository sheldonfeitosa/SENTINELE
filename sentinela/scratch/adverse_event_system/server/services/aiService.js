// server/services/aiService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Chave da API do Gemini (Extraída de SentinelaAI.gs)
const GEMINI_API_KEY = 'AIzaSyB38UE53y-BL3j3bjI-XAfto-D1eNLBLZQ';

// Caminhos para a base de conhecimento (ajuste conforme necessário para o ambiente local)
const BRAIN_PATH = 'C:/Users/sheld/.gemini/antigravity/brain/bf6599dc-6215-4fe8-ba63-c402205e30d9';

const loadKnowledgeBase = () => {
    try {
        const regras = fs.readFileSync(path.join(BRAIN_PATH, 'regras_classificacao.md'), 'utf8');
        const persona = fs.readFileSync(path.join(BRAIN_PATH, 'persona_enfermeiro.md'), 'utf8');
        const exemplos = fs.readFileSync(path.join(BRAIN_PATH, 'exemplos_treinamento.json'), 'utf8');
        return { regras, persona, exemplos };
    } catch (e) {
        console.error("Erro ao carregar base de conhecimento:", e);
        return null;
    }
};

exports.classifyEvent = async (description) => {
    console.log(`[IA] Analisando com Gemini (Base de Conhecimento Avançada): "${description}"`);

    if (!description || description.length < 5) {
        return {
            tipo_notificacao: "NÃO CONFORMIDADE",
            tipo_evento: "DESCRIÇÃO INSUFICIENTE",
            classificacao: "NA",
            recomendacao_blackbelt: "Fornecer descrição mais detalhada do evento."
        };
    }

    const kb = loadKnowledgeBase();
    let promptContext = "";

    if (kb) {
        promptContext = `
        BASE DE CONHECIMENTO ABSOLUTA (Siga estritamente):
        
        --- PERSONA ---
        ${kb.persona}
        
        --- REGRAS DE CLASSIFICAÇÃO ---
        ${kb.regras}
        
        --- EXEMPLOS DE TREINAMENTO (Few-Shot) ---
        ${kb.exemplos}
        `;
    } else {
        promptContext = "Erro ao carregar arquivos de regras. Use conhecimento padrão de segurança do paciente.";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
    ${promptContext}

    TAREFA: Analise a seguinte descrição de incidente no contexto psiquiátrico: "${description}"

    DIFERENCIAÇÃO CRÍTICA (Reforço):
    - Near Miss (Quase Falha): Interceptado ANTES de atingir o paciente.
    - Circunstância de Risco: Potencial de dano, mas NENHUM incidente ocorreu (ex: grade solta).
    
    SAÍDA OBRIGATÓRIA (JSON estrito):
    {
      "resumo_tecnico": "Resumo técnico usando terminologia correta (ex: Evasão, Heteroagressão)",
      "classificacao": "Circunstância de Risco", "Near Miss", "Incidente sem Dano" ou "Evento Adverso",
      "categoria": "Categoria do incidente (ex: Medicação, Queda, Comportamento)",
      "ferramenta_sugerida": "Ferramenta da qualidade recomendada (ex: Ishikawa, 5 Porquês)",
      "alerta_blackbelt": "Recomendação técnica direta e sistêmica (sem culpar indivíduos)"
    }
    
    Retorne APENAS o JSON válido.
    `;

    try {
        const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.candidates && response.data.candidates[0].content) {
            let texto = response.data.candidates[0].content.parts[0].text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const firstBrace = texto.indexOf('{');
            const lastBrace = texto.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                texto = texto.substring(firstBrace, lastBrace + 1);
            }

            const jsonResponse = JSON.parse(texto);

            // Mapeamento para compatibilidade com frontend
            const mappedResponse = {
                tipo_notificacao: jsonResponse.classificacao === "Evento Adverso" ? "EVENTO ADVERSO" : "NÃO CONFORMIDADE",
                tipo_evento: jsonResponse.resumo_tecnico || jsonResponse.categoria,
                classificacao: jsonResponse.classificacao === "Evento Adverso" ? "LEVE" : "NA",
                recomendacao_blackbelt: jsonResponse.alerta_blackbelt,
                _raw_classificacao: jsonResponse.classificacao,
                _ferramenta: jsonResponse.ferramenta_sugerida
            };

            console.log("[IA] Resposta Gemini Refinada:", mappedResponse);
            return mappedResponse;
        }

        // Se não houver candidatos (ex: bloqueio de segurança)
        console.warn("[IA] Sem candidatos na resposta da API.");
        return {
            tipo_notificacao: "ERRO IA",
            tipo_evento: "SEM RESPOSTA",
            classificacao: "NA",
            recomendacao_blackbelt: "IA não retornou resultados. Verificar filtros de segurança."
        };

    } catch (error) {
        console.error("Erro na chamada Gemini:", error.response ? error.response.data : error.message);
        return {
            tipo_notificacao: "ERRO IA",
            tipo_evento: "FALHA NA ANÁLISE",
            classificacao: "NA",
            recomendacao_blackbelt: "Realizar análise manual. IA indisponível."
        };
    }
};

exports.generateACR = async (description) => {
    console.log(`[IA] Gerando ACR (Ishikawa + 5W2H) para: "${description}"`);

    const kb = loadKnowledgeBase();
    let promptContext = "";
    if (kb) {
        promptContext = `
        BASE DE CONHECIMENTO (Persona e Regras):
        ${kb.persona}
        ${kb.regras}
        `;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
    ${promptContext}

    TAREFA: Realizar Análise de Causa Raiz (ACR) completa para o evento: "${description}"

    SAÍDA OBRIGATÓRIA (JSON estrito):
    {
      "ishikawa": {
        "metodo": ["Causa 1", "Causa 2"],
        "maquina": ["Causa 1"],
        "mao_de_obra": ["Causa 1"],
        "material": ["Causa 1"],
        "meio_ambiente": ["Causa 1"],
        "medida": ["Causa 1"]
      },
      "plano_5w2h": [
        {
          "what": "O que fazer",
          "why": "Por que fazer",
          "where": "Onde",
          "who": "Quem (cargo)",
          "when": "Quando (prazo sugerido)",
          "how": "Como fazer",
          "how_much": "Custo estimado (ou 'Sem custo')"
        }
      ],
      "analise_conclusiva": "Texto resumindo a causa raiz principal identificada."
    }
    
    Retorne APENAS o JSON válido.
    `;

    try {
        const payload = { "contents": [{ "parts": [{ "text": prompt }] }] };
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.candidates && response.data.candidates[0].content) {
            let texto = response.data.candidates[0].content.parts[0].text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const firstBrace = texto.indexOf('{');
            const lastBrace = texto.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                texto = texto.substring(firstBrace, lastBrace + 1);
            }

            const jsonResponse = JSON.parse(texto);
            console.log("[IA] ACR Gerada:", jsonResponse);
            return jsonResponse;
        }

        console.warn("[IA] Sem candidatos na resposta da ACR.");
        throw new Error("Sem resposta da IA");

    } catch (error) {
        console.error("Erro na ACR Gemini:", error.response ? error.response.data : error.message);
        return {
            ishikawa: {
                metodo: ["Análise manual necessária"],
                maquina: [],
                mao_de_obra: [],
                material: [],
                meio_ambiente: [],
                medida: []
            },
            plano_5w2h: [],
            analise_conclusiva: "Não foi possível gerar a análise automática devido a uma instabilidade na IA. Por favor, preencha manualmente."
        };
    }
};
