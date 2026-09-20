import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT_BLACKBELT = `VocÃª Ã© um(a) Enfermeiro(a) Gestor(a) de Riscos Hospitalares & Especialista em SeguranÃ§a do Paciente de padrÃ£o Lean Six Sigma Master Black Belt, com profunda vivÃªncia na Filosofia Kaizen (melhoria contÃ­nua sem busca de culpados, foco na robustez dos processos, Cultura Justa - Just Culture e barreiras Poka-Yoke) e rigor absoluto alinhado Ã  ONA NÃ­vel 3 (AcreditaÃ§Ã£o com ExcelÃªncia), RDC 36/2013 da ANVISA e Protocolos Internacionais da OMS (AlianÃ§a Mundial para a SeguranÃ§a do Paciente).

DIRETRIZES ESSENCIAIS DE ANÃLISE:
1. Cultura Justa (Just Culture):
   - Nunca foque em puniÃ§Ã£o individual rasa. Investigue falhas latentes nos sistemas, quebra de barreiras de seguranÃ§a e condiÃ§Ãµes propensas a erro (Modelo do Queijo SuÃ­Ã§o de James Reason).
   - Diferencie com precisÃ£o: erro humano involuntÃ¡rio, comportamento de risco e violaÃ§Ã£o de protocolo/conduta.

2. Rigor MetodolÃ³gico Lean Six Sigma:
   - Diagrama de Ishikawa 6M: Exige correlaÃ§Ã£o de causa e efeito detalhada e profunda. Jamais utilize respostas genÃ©ricas como "treinar a equipe", "revisar protocolos" ou "verificar insumos".
   - 5 PorquÃªs: Deve apresentar um encadeamento causal linear estrito, descendo desde o sintoma visÃ­vel atÃ© a falha sistÃªmica de governanÃ§a, processo ou treinamento.
   - Plano de AÃ§Ã£o 5W2H: AÃ§Ãµes prÃ¡ticas, mensurÃ¡veis e com foco em Poka-Yoke (eliminar a possibilidade do erro se repetir).

3. Natureza Forense, ClÃ­nica e Confidencial:
   - Todo o conteÃºdo analisado Ã© estritamente tÃ©cnico-hospitalar para fins de governanÃ§a clÃ­nica, auditoria da qualidade e proteÃ§Ã£o do paciente.
   - Analise com total sobriedade e precisÃ£o clÃ­nica eventos crÃ­ticos de qualquer natureza (incluindo agressÃµes, contenÃ§Ã£o mecÃ¢nica inadequada, quedas com fratura, evasÃ£o de pacientes, erros de medicaÃ§Ã£o graves e eventos sentinela).`;

export class AIService {
    private async callWithRetry(
        systemPrompt: string,
        userPrompt: string,
        maxRetries: number = 2,
        jsonMode: boolean = true
    ): Promise<string> {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('AIService ERROR: GROQ_API_KEY is missing!');
            throw new Error("AI Service not configured.");
        }

        let attempts = 0;
        while (attempts <= maxRetries) {
            try {
                const body: any = {
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.2,
                    max_tokens: 2500
                };

                if (jsonMode) {
                    body.response_format = { type: "json_object" };
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout para seguranÃ§a na Vercel

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorBody.substring(0, 150)}`);
                }

                const data = await response.json();
                return data.choices?.[0]?.message?.content || '';
            } catch (error: any) {
                attempts++;
                console.error(`AI Attempt ${attempts} FAILED: ${error.message}`);
                if (attempts > maxRetries) throw error;
                await new Promise(res => setTimeout(res, 1000 * attempts));
            }
        }
        throw new Error("AI IndisponÃ­vel.");
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

        const userPrompt = `
Realize uma AnÃ¡lise de Causa Raiz (ACR) detalhada e aprofundada para o evento adverso hospitalar descrito abaixo.

DADOS DO EVENTO:
- DESCRIÃ‡ÃƒO DO INCIDENTE: "${description}"
- TIPO DO EVENTO REGISTRADO: "${eventType}"
- INVESTIGAÃ‡ÃƒO PRELIMINAR / CHECKLIST: ${formattedInvestigation || 'Nenhum dado preliminar registrado.'}

DIRETRIZES DA ANÃLISE ONA NÃVEL 3 (EXCELÃŠNCIA EM GESTÃƒO) & LEAN SIX SIGMA BLACK BELT:
1. ConclusÃ£o da Causa Raiz (rootCauseConclusion):
   - Parecer tÃ©cnico executivo: Inicie destacando a classificaÃ§Ã£o de gravidade (ex: [EVENTO SENTINELA], [EVENTO ADVERSO GRAVE COM DANO], [QUASE FALHA]).
   - Sintetize a quebra da barreira assistencial primÃ¡ria, o fator precipitante (gatilho clÃ­nico/comportamental) e a falha do processo sistÃªmico ou organizacional subjacente.
   - Deve ser tÃ©cnico, assertivo, rico em terminologia clÃ­nica e de seguranÃ§a do paciente.

2. Ishikawa 6M (Causa e Efeito):
   - 'metodo': Detalhe as falhas em Procedimentos Operacionais PadrÃ£o (POPs), quebra de protocolos clÃ­nicos (ex: protocolo de contenÃ§Ã£o mecÃ¢nica, manejo de crise psicomotora, aprazamento de psicotrÃ³picos, dupla checagem), ausÃªncia de barreiras de proteÃ§Ã£o.
   - 'material': Avalie insumos e dispositivos (ex: faixas de contenÃ§Ã£o de punho/tornozelo acolchoadas, medicaÃ§Ã£o sedativa/psicotrÃ³pica prescrita, disponibilidade de materiais de proteÃ§Ã£o).
   - 'mao_de_obra': Avalie dimensionamento e estresse da equipe de enfermagem, capacitaÃ§Ã£o em desescalada verbal e contenÃ§Ã£o fÃ­sica segura, cumprimento de prescriÃ§Ãµes, controle emocional e postura Ã©tica profissional.
   - 'meio_ambiente': CondiÃ§Ãµes do posto/enfermaria, iluminaÃ§Ã£o, nÃ­vel de ruÃ­do como gatilho de agitaÃ§Ã£o, seguranÃ§a fÃ­sica do ambiente e rotas de apoio/seguranÃ§a.
   - 'medida': Falhas no monitoramento com escalas clÃ­nicas (ex: RASS para agitaÃ§Ã£o/sedaÃ§Ã£o, Glasgow, Morse), atraso na sinalizaÃ§Ã£o de risco, checagem de sinais vitais. IMPORTANTE: 'medida' refere-se estritamente a indicadores, mÃ©tricas, falhas em monitoramento ou falta de dados. Jamais use para planos ou aÃ§Ãµes.
   - 'maquina': Travas de leitos, sistema de chamada de enfermagem ou botÃ£o de pÃ¢nico, prontuÃ¡rio eletrÃ´nico (PEP) com alertas de medicaÃ§Ã£o/risco.

3. 5 PorquÃªs (fiveWhys):
   - Construa um encadeamento causal linear rigoroso e irrefutÃ¡vel:
     * why1: O sintoma imediato / ocorrÃªncia final.
     * why2: A circunstÃ¢ncia imediata que propiciou o evento.
     * why3: A falha assistencial ou barreira de seguranÃ§a que falhou.
     * why4: A vulnerabilidade no processo ou na supervisÃ£o operacional.
     * why5: A causa raiz sistÃªmica/organizacional (falha no modelo de treinamento, governanÃ§a clÃ­nica ou protocolo).
     * rootCause: SÃ­ntese da causa raiz sistÃªmica Kaizen.

4. Plano de AÃ§Ã£o 5W2H (actionPlan) - Filosofia Kaizen & Poka-Yoke:
   - ForneÃ§a entre 3 e 4 aÃ§Ãµes estruturadas (pelo menos 1 aÃ§Ã£o corretiva imediata e 2 a 3 aÃ§Ãµes preventivas/Poka-Yoke).
   - 'what': AÃ§Ã£o tÃ©cnica clara e especÃ­fica (NÃƒO use termos vagos como "treinar a equipe". Especifique o conteÃºdo, pÃºblico-alvo e metodologia).
   - 'why': A justificativa diretamente ligada Ã  causa raiz identificada.
   - 'who': Cargo/FunÃ§Ã£o responsÃ¡vel (ex: 'Enfermeiro RT', 'NÃºcleo de SeguranÃ§a do Paciente - NSP', 'EducaÃ§Ã£o Permanente', 'Diretoria TÃ©cnica').
   - 'where': Setor de aplicaÃ§Ã£o.
   - 'when': Prazo condizente com a gravidade (ex: 'Imediato / 24h', '7 dias', '15 dias').
   - 'how': Passo a passo de implantaÃ§Ã£o focado em criar barreiras Ã  prova de erro (Poka-Yoke).
   - 'howMuch': Estimativa de investimento ('Custo operacional interno', 'AquisiÃ§Ã£o de faixas acolchoadas', 'Sem custo financeiro direto').

5. Prazo Sugerido (suggestedDeadline): Data no formato 'dd/mm/yyyy' correspondente ao plano de aÃ§Ã£o imediato.

RETORNE EXCLUSIVAMENTE UM JSON VÃLIDO no seguinte formato:
{
  "rootCauseConclusion": "...",
  "suggestedDeadline": "dd/mm/yyyy",
  "ishikawa": {
    "metodo": "...",
    "material": "...",
    "mao_de_obra": "...",
    "meio_ambiente": "...",
    "medida": "...",
    "maquina": "..."
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
      "what": "...",
      "why": "...",
      "who": "...",
      "where": "...",
      "when": "...",
      "how": "...",
      "howMuch": "..."
    }
  ]
}
`;

        try {
            const text = await this.callWithRetry(SYSTEM_PROMPT_BLACKBELT, userPrompt);
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error: any) {
            console.error("Fallback RootCause Error:", error.message);
            return this.generateOfflineAnalysis(description, eventType);
        }
    }

    async analyzeIncident(description: string): Promise<any> {
        const userPrompt = `
Analise a seguinte descriÃ§Ã£o de incidente hospitalar sob a Ã³tica da RDC 36/2013 da ANVISA e critÃ©rios de AcreditaÃ§Ã£o ONA NÃ­vel 3.

DESCRIÃ‡ÃƒO: "${description}"

REGRAS DE RETORNO (JSON):
- eventType: ClassificaÃ§Ã£o tÃ©cnica padronizada pela OMS/ANVISA (Ex: 'EVENTO SENTINELA: AGRESSÃƒO FÃSICA E CONTENÃ‡ÃƒO INADEQUADA', 'ERRO DE MEDICAÃ‡ÃƒO: OMISSÃƒO DE DOSE', 'QUEDA DE PACIENTE COM DANO', 'EVASÃƒO DE PACIENTE EM SURTO').
- riskLevel: 'GRAVE' (se houver dano moderado/grave, agressÃ£o fÃ­sica, Ã³bito ou evento sentinela), 'MODERADO' (dano leve ou risco assistencial relevante), 'LEVE' (quase falha / near miss ou sem dano).
- damageClassification: 'SEM DANO', 'DANO LEVE', 'DANO MODERADO', 'DANO GRAVE' ou 'Ã“BITO'.
- isSentinelEvent: true se for evento sentinela (violÃªncia, agressÃ£o, Ã³bito inesperado, lesÃ£o permanente), false caso contrÃ¡rio.
- recommendation: Parecer tÃ©cnico de conduta imediata sob a Ã³tica de enfermagem e seguranÃ§a do paciente (mÃ¡ximo 3 frases conclusivas e acionÃ¡veis).

Formato JSON esperado:
{
  "eventType": "...",
  "riskLevel": "LEVE, MODERADO ou GRAVE",
  "damageClassification": "...",
  "isSentinelEvent": true,
  "recommendation": "..."
}
IMPORTANTE: Retorne APENAS o JSON.
`;
        try {
            const text = await this.callWithRetry(SYSTEM_PROMPT_BLACKBELT, userPrompt);
            const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);
        } catch (e: any) {
            console.error("AI Analyze Incident Failed:", e.message);
            return {
                eventType: 'INCIDENTE ASSISTENCIAL NÃƒO CLASSIFICADO',
                riskLevel: 'MODERADO',
                damageClassification: 'DANO MODERADO',
                isSentinelEvent: false,
                recommendation: 'Falha temporÃ¡ria na anÃ¡lise automÃ¡tica. Realizar avaliaÃ§Ã£o clÃ­nica e notificaÃ§Ã£o manual ao NÃºcleo de SeguranÃ§a do Paciente (NSP).'
            };
        }
    }

    async chatWithContext(message: string, context: any): Promise<string> {
        const userPrompt = `
Contexto do Incidente Hospitalar: ${JSON.stringify(context)}
Pergunta/Mensagem do UsuÃ¡rio: "${message}"

Responda como Enfermeiro Gestor de Riscos Black Belt, fundamentado em Kaizen, Cultura Justa e normas ONA/ANVISA. Seja assertivo, didÃ¡tico e focado na melhoria dos processos assistenciais.
`;
        try {
            return await this.callWithRetry(SYSTEM_PROMPT_BLACKBELT, userPrompt, 2, false);
        } catch (e) {
            return "No momento o serviÃ§o de consultoria inteligente estÃ¡ indisponÃ­vel. Por favor, consulte o NÃºcleo de SeguranÃ§a do Paciente (NSP) ou o manual de protocolos da instituiÃ§Ã£o.";
        }
    }

    async generateFiveWhys(description: string): Promise<any> {
        return {};
    }

    private generateOfflineAnalysis(description: string, eventType?: string): any {
        const descLower = description.toLowerCase();
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const formattedDate = nextWeek.toLocaleDateString('pt-BR');

        // DetecÃ§Ã£o inteligente de eventos graves / agressÃ£o / contenÃ§Ã£o
        if (
            descLower.includes("soco") ||
            descLower.includes("agress") ||
            descLower.includes("vias de fato") ||
            descLower.includes("contenÃ§Ã£o") ||
            descLower.includes("agitado") ||
            descLower.includes("psicomotor")
        ) {
            return {
                rootCauseConclusion: "[EVENTO SENTINELA - CONDUTA CRÃTICA]: OcorrÃªncia de agressÃ£o fÃ­sica recÃ­proca associada a descompensaÃ§Ã£o psicomotora de paciente e falha grave na execuÃ§Ã£o da contenÃ§Ã£o mecÃ¢nica. Identificada quebra no fluxo de comunicaÃ§Ã£o mÃ©dica/enfermagem, omissÃ£o de administraÃ§Ã£o de fÃ¡rmaco estabilizador e despreparo tÃ©cnico da equipe no manejo de crises psiquiÃ¡tricas conforme ResoluÃ§Ã£o COFEN 678/2021.",
                suggestedDeadline: new Date(today.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
                ishikawa: {
                    metodo: "AusÃªncia ou inobservÃ¢ncia do Protocolo Operacional PadrÃ£o (POP) de ContenÃ§Ã£o MecÃ¢nica e Manejo de Paciente Psicomotor; descoordenaÃ§Ã£o na imobilizaÃ§Ã£o por mÃºltiplos colaboradores.",
                    material: "Dispositivos de contenÃ§Ã£o mecÃ¢nica inadequados ou improvisados; falha na disponibilizaÃ§Ã£o e administraÃ§Ã£o imediata de medicaÃ§Ã£o sedativa prescrita.",
                    mao_de_obra: "Descontrole emocional e conduta antiÃ©tica do profissional de enfermagem (agressÃ£o fÃ­sica ao paciente); dÃ©ficit de capacitaÃ§Ã£o da equipe em tÃ©cnicas de desescalada verbal e imobilizaÃ§Ã£o segura.",
                    meio_ambiente: "Ambiente desprovido de Ã¡rea de isolamento/proteÃ§Ã£o para pacientes agitados; estÃ­mulos externos que potencializaram o surto psicomotor.",
                    medida: "InexistÃªncia ou falha na aplicaÃ§Ã£o contÃ­nua da Escala de AgitaÃ§Ã£o e SedaÃ§Ã£o de Richmond (RASS) e ausÃªncia de monitoramento a cada 15 minutos durante a contenÃ§Ã£o.",
                    maquina: "AusÃªncia de botÃ£o de pÃ¢nico ou sistema Ã¡gil de acionamento do time de resposta rÃ¡pida/seguranÃ§a patrimonial no posto de enfermagem."
                },
                fiveWhys: {
                    why1: "Houve agressÃ£o fÃ­sica violenta entre o profissional e o paciente durante o atendimento.",
                    why2: "A contenÃ§Ã£o mecÃ¢nica foi realizada de forma desordenada e sem lideranÃ§a tÃ©cnica apÃ³s o paciente entrar em agitaÃ§Ã£o.",
                    why3: "O paciente nÃ£o recebeu a medicaÃ§Ã£o estabilizadora prescrita pela manhÃ£, evoluindo para agitaÃ§Ã£o psicomotora grave.",
                    why4: "A equipe de enfermagem nÃ£o realizou a conferÃªncia da prescriÃ§Ã£o nem comunicou a omissÃ£o na passagem de plantÃ£o.",
                    why5: "Falha sistÃªmica no processo de dupla checagem de aprazamento e ausÃªncia de capacitaÃ§Ã£o continuada em manejo de crises (Kaizen/Poka-Yoke inexistente)."
                },
                actionPlan: [
                    {
                        what: "AvaliaÃ§Ã£o mÃ©dica pericial imediata do paciente e suporte assistencial integral",
                        why: "Garantir a integridade fÃ­sica do paciente e registrar formalmente as lesÃµes",
                        who: "MÃ©dico Plantonista e Gestor de Risco",
                        where: "Leito do Paciente",
                        when: "Imediato (1h)",
                        how: "Exame clÃ­nico detalhado, registro em prontuÃ¡rio e comunicaÃ§Ã£o formal Ã  Diretoria ClÃ­nica",
                        howMuch: "Sem custo financeiro adicional"
                    },
                    {
                        what: "Afastamento cautelar preventivo do colaborador e abertura de ComissÃ£o de Ã‰tica",
                        why: "Resguardar a seguranÃ§a dos pacientes e apurar responsabilidades segundo o CÃ³digo de Ã‰tica de Enfermagem (COFEN)",
                        who: "ResponsÃ¡vel TÃ©cnico de Enfermagem e RH",
                        where: "Diretoria de Enfermagem",
                        when: "Imediato (24h)",
                        how: "NotificaÃ§Ã£o oficial do afastamento e instauraÃ§Ã£o de sindicÃ¢ncia interna",
                        howMuch: "Custo operacional de substituiÃ§Ã£o de escala"
                    },
                    {
                        what: "ImplantaÃ§Ã£o de Poka-Yoke no PEP com alerta visual para pacientes em risco de agitaÃ§Ã£o (Escala RASS)",
                        why: "Eliminar a omissÃ£o de psicotrÃ³picos e prevenir crises psicomotoras graves",
                        who: "TI Hospitalar e NÃºcleo de SeguranÃ§a do Paciente",
                        where: "Sistema de ProntuÃ¡rio EletrÃ´nico",
                        when: "7 dias",
                        how: "Bloqueio no sistema para medicaÃ§Ãµes psiquiÃ¡tricas nÃ£o administradas sem justificativa mÃ©dica",
                        howMuch: "Incluso no contrato de TI"
                    },
                    {
                        what: "Treinamento prÃ¡tico em simulaÃ§Ã£o realÃ­stica de ContenÃ§Ã£o MecÃ¢nica e Desescalada Verbal",
                        why: "Padronizar a conduta de toda a equipe de enfermagem conforme a ResoluÃ§Ã£o COFEN 678/2021",
                        who: "EducaÃ§Ã£o Permanente e Especialista em SaÃºde Mental",
                        where: "Centro de SimulaÃ§Ã£o / AuditÃ³rio",
                        when: "15 dias",
                        how: "Workshops obrigatÃ³rios com simulaÃ§Ã£o prÃ¡tica de contenÃ§Ã£o coordenada em 5 pontos",
                        howMuch: "Custo de material didÃ¡tico e horas de instrutor"
                    }
                ]
            };
        }

        if (descLower.includes("queda")) {
            return {
                rootCauseConclusion: "[EVENTO ADVERSO - QUEDA DE PACIENTE]: OcorrÃªncia de queda com falha nas barreiras de prevenÃ§Ã£o (Escala de Morse subestimada ou grade desregulada).",
                suggestedDeadline: formattedDate,
                ishikawa: {
                    metodo: "NÃ£o conformidade na checagem diÃ¡ria do risco de queda e ausÃªncia de identificaÃ§Ã£o visual no leito.",
                    material: "AusÃªncia de piso antiderrapante ou calÃ§ado inadequado durante a deambulaÃ§Ã£o.",
                    mao_de_obra: "DÃ©ficit de orientaÃ§Ã£o ao acompanhante/paciente sobre a solicitaÃ§Ã£o de auxÃ­lio para mobilizaÃ§Ã£o.",
                    meio_ambiente: "IluminaÃ§Ã£o noturna insuficiente e presenÃ§a de obstÃ¡culos entre o leito e o sanitÃ¡rio.",
                    medida: "SubavaliaÃ§Ã£o da Escala de Risco de Morse na admissÃ£o do paciente.",
                    maquina: "Falha na trava mecÃ¢nica das grades laterais ou freio da cama hospitalar."
                },
                fiveWhys: {
                    why1: "Paciente caiu ao tentar levantar-se sem assistÃªncia.",
                    why2: "A campainha de chamada estava fora do alcance do paciente.",
                    why3: "O paciente nÃ£o foi classificado como alto risco de queda.",
                    why4: "A reavaliaÃ§Ã£o da escala de Morse nÃ£o foi realizada na mudanÃ§a de estado clÃ­nico.",
                    why5: "InexistÃªncia de barreira Poka-Yoke no prontuÃ¡rio exigindo reavaliaÃ§Ã£o periÃ³dica obrigatÃ³ria."
                },
                actionPlan: [
                    {
                        what: "Auditoria clÃ­nica de todos os leitos com aplicaÃ§Ã£o da Escala de Morse e checagem de grades",
                        why: "Identificar imediatamente pacientes em risco oculto de nova queda",
                        who: "Enfermeiro da Qualidade",
                        where: "Todas as enfermarias",
                        when: "24h",
                        how: "Ronda de seguranÃ§a com checklist Ã  beira do leito",
                        howMuch: "Sem custo extra"
                    }
                ]
            };
        }

        return {
            rootCauseConclusion: "[ANÃLISE DE CONTINGÃŠNCIA KAIZEN]: Evento adverso em apuraÃ§Ã£o preliminar. NecessÃ¡ria investigaÃ§Ã£o detalhada das barreiras de seguranÃ§a fragilizadas no processo assistencial.",
            suggestedDeadline: formattedDate,
            ishikawa: {
                metodo: "Revisar adesÃ£o aos Procedimentos Operacionais PadrÃ£o (POPs) do setor.",
                material: "Verificar especificaÃ§Ã£o e conformidade dos insumos utilizados.",
                mao_de_obra: "Avaliar dimensionamento, sobrecarga e necessidades de capacitaÃ§Ã£o da equipe.",
                meio_ambiente: "Avaliar condiÃ§Ãµes ergonÃ´micas e ambientais do posto de trabalho.",
                medida: "Auditar os indicadores de seguranÃ§a do paciente e conformidade das notificaÃ§Ãµes.",
                maquina: "Inspecionar preventivamente os equipamentos e tecnologias envolvidas no processo."
            },
            fiveWhys: {
                why1: "O desfecho nÃ£o planejado ocorreu durante a assistÃªncia.",
                why2: "Houve falha na barreira de proteÃ§Ã£o do processo.",
                why3: "O fluxo operacional nÃ£o foi executado conforme o padrÃ£o.",
                why4: "Fatores contribuintes da rotina nÃ£o foram mitigados previamente.",
                why5: "AusÃªncia de mecanismo Poka-Yoke no sistema para prevenÃ§Ã£o de falhas."
            },
            actionPlan: [
                {
                    what: "ReuniÃ£o de alinhamento Kaizen com a equipe assistencial envolvida",
                    why: "Mapear o fluxo real do processo e identificar causas raÃ­zes sob a Ã³tica da Cultura Justa",
                    who: "Gestor de Risco e LideranÃ§a de Enfermagem",
                    where: "Setor do Incidente",
                    when: "Curto Prazo (48h)",
                    how: "DinÃ¢mica multidisciplinar de mapeamento de falhas latentes",
                    howMuch: "Sem custo financeiro adicional"
                }
            ]
        };
    }
}
