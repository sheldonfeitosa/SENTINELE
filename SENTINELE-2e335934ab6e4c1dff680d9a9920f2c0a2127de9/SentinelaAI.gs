/**
 * ===================================================================================
 * SISTEMA SENTINELA AI - VERSAO 131.0 (TRATAMENTO DE ERRO DE ABA/SHEET)
 * Status: Adicionado guarda contra o erro de 'sheet not found'.
 * ===================================================================================
 */

// --- 1. CONFIGURACOES GLOBAIS ---

const NOME_SISTEMA = "SENTINELA AI";
const NOME_DA_PLANILHA = "NOTIFICACOES";
const NOME_ABA_GESTORES = "GESTORES";

// Validacao inicial das constantes
(function() {
  if (typeof NOME_DA_PLANILHA === 'undefined' || NOME_DA_PLANILHA === null || NOME_DA_PLANILHA === '') {
    Logger.log("ERRO CRITICO: NOME_DA_PLANILHA nao esta definido corretamente!");
  }
  if (typeof NOME_ABA_GESTORES === 'undefined' || NOME_ABA_GESTORES === null || NOME_ABA_GESTORES === '') {
    Logger.log("ERRO CRITICO: NOME_ABA_GESTORES nao esta definido corretamente!");
  }
})(); 
const LINK_TRATATIVA = "https://forms.gle/SswJH1FFspiAbePa7"; 

const EMAIL_GESTOR_RISCO = "sheldonfeitosa@gmail.com";
const EMAIL_DIRETORIA = "qualidadeinmceb@gmail.com"; 
const NOME_PRESIDENTE = "Zilmar Pereira";

// CHAVES (MANTIDAS)
const GEMINI_API_KEY = 'AIzaSyB38UE53y-BL3j3bjI-XAfto-D1eNLBLZQ'; 
const WHATSAPP_API_URL = "https://api.z-api.io/instances/3EAA37B303BAF1CAB4A91ABB50AD3431/token/AC8EC029802C8A5DA83D0DAC/send-text"; 
const WHATSAPP_TOKEN = "AC8EC029802C8A5DA83D0DAC"; // Token da Instancia
const WHATSAPP_CLIENT_TOKEN = "F70dcf66d5e194d9d844ac11b6e079d1eS"; // Token de Seguranca da Conta (Client-Token) - COLE AQUI O TOKEN COMPLETO DA ABA SEGURANCA   

/**
 * MAPEAMENTO DAS COLUNAS
 */
const COLUNAS = {
  ID: 1, CARIMBO: 2, PACIENTE: 3, NOME_MAE: 4, DATA_NASCIMENTO: 5, SEXO: 6, 
  SETOR: 7, DESCRICAO: 8, TIPO_NOTIFICACAO: 9, DATA_EVENTO: 10, PERIODO: 11, 
  IDADE: 12, DATA_INTERNACAO: 13, TIPO_EVENTO: 14, CLASSIFICACAO_EVENTO: 15, 
  PRAZO_TRATATIVA: 16, RECOMENDACOES_QUALIDADE: 17, STATUS_TRATATIVA: 18, 
  EMAIL_CONTATO: 19, LOG_NOTIFICACAO: 20, LOG_COBRANCA: 21, LOG_ALTA_GESTAO: 22, STATUS_AGENDAMENTO: 23
};

// CORES DE STATUS
const CORES_STATUS = { ROXO: '#B4A7D6', VERDE: '#93C47D', AMARELO: '#F1C232', VERMELHO: '#E06666' };

// CORES ADICIONAIS (CORRIGIDO)
const CORES = { BRANCO: '#FFFFFF', AZUL: '#4A86E8' };

// ===================================================================================
// 2. FUNCOES AUXILIARES ESSENCIAIS
// ===================================================================================

/**
 * Funcao auxiliar para obter sheet com tratamento de erro
 */
function obterSheetSeguro(nomeSheet) {
  try {
    // Valida se o nomeSheet foi fornecido
    if (!nomeSheet || nomeSheet === undefined || nomeSheet === null || nomeSheet === "") {
      const stack = new Error().stack;
      
      // FALLBACK: Se nao foi fornecido nomeSheet mas as constantes estao definidas, usa a padrao
      // Isso pode acontecer se uma funcao for executada diretamente no editor
      if (typeof NOME_DA_PLANILHA !== 'undefined' && NOME_DA_PLANILHA) {
        Logger.log("AVISO: obterSheetSeguro chamado sem parametro - usando fallback: " + NOME_DA_PLANILHA);
        nomeSheet = NOME_DA_PLANILHA;
      } else {
        Logger.log("ERRO CRITICO: obterSheetSeguro chamado sem parametro e constantes nao definidas");
        return null;
      }
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      Logger.log("Erro: Planilha nao encontrada");
      return null;
    }
    
    const sheet = ss.getSheetByName(nomeSheet);
    if (!sheet) {
      Logger.log("ERRO: Sheet '" + nomeSheet + "' nao encontrada");
      Logger.log("Sheets disponiveis: " + ss.getSheets().map(s => s.getName()).join(", "));
      
      // Tenta mostrar alerta apenas se houver UI disponivel
      try {
        SpreadsheetApp.getUi().alert("Erro: A aba '" + nomeSheet + "' nao foi encontrada. Verifique se o nome esta correto.");
      } catch (uiError) {
        // UI nao disponivel (execucao automatica), apenas log
      }
      return null;
    }
    
    return sheet;
  } catch (e) {
    Logger.log("Erro ao obter sheet: " + e.toString());
    Logger.log("Stack trace: " + (e.stack || "N/A"));
    return null;
  }
}

function formatarData(d) { 
  if (!d || !(d instanceof Date)) return "";
  return Utilities.formatDate(d, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "dd/MM/yyyy"); 
}

function obterLinhaCompleta(sheet, linha) {
  if (!sheet || linha < 1) return null;
  try {
    const vals = sheet.getRange(linha, 1, 1, Object.keys(COLUNAS).length).getValues()[0];
    const dados = {};
    for (const k in COLUNAS) dados[k] = vals[COLUNAS[k] - 1];
    return dados;
  } catch (e) {
    Logger.log("Erro ao obter linha completa: " + e.toString());
    return null;
  }
}

function calcularIdadeExata(dataNascimento) {
  if (!dataNascimento || !(dataNascimento instanceof Date)) return "";
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const m = hoje.getMonth() - dataNascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) idade--;
  return idade;
}

function buscarDadosGestor(setorAlvo) {
  if (!setorAlvo) {
    Logger.log("buscarDadosGestor: Setor alvo vazio");
    return null;
  }
  
  if (!NOME_ABA_GESTORES) {
    Logger.log("ERRO: NOME_ABA_GESTORES nao definido em buscarDadosGestor");
    return null;
  }
  
  const sheetGestores = obterSheetSeguro(NOME_ABA_GESTORES);
  if (!sheetGestores) {
    Logger.log("buscarDadosGestor: Sheet GESTORES nao encontrada");
    return null;
  }

  try {
    const dados = sheetGestores.getDataRange().getValues();
    const setorAlvoLimpo = setorAlvo.toString().trim().toUpperCase();
    
    Logger.log("buscarDadosGestor: Procurando setor: '" + setorAlvoLimpo + "'");
    Logger.log("buscarDadosGestor: Total de linhas: " + dados.length);
    
    for (let i = 1; i < dados.length; i++) {
      const setorPlanilha = dados[i][2];
      const nomeGestor = dados[i][1];
      const emailGestor = dados[i][3];
      const whatsappGestor = dados[i][5];
      
      if (setorPlanilha) {
        const setorPlanilhaLimpo = setorPlanilha.toString().trim().toUpperCase();
        Logger.log("buscarDadosGestor: Linha " + (i+1) + " - Setor: '" + setorPlanilhaLimpo + "'");
        
        // Busca exata
        if (setorPlanilhaLimpo === setorAlvoLimpo) {
          Logger.log("buscarDadosGestor: ENCONTRADO! Nome: " + nomeGestor + ", Email: " + emailGestor + ", WhatsApp: " + whatsappGestor);
          return { nome: nomeGestor, email: emailGestor, whatsapp: whatsappGestor };
        }
        
        // Busca parcial (se contém)
        if (setorPlanilhaLimpo.includes(setorAlvoLimpo) || setorAlvoLimpo.includes(setorPlanilhaLimpo)) {
          Logger.log("buscarDadosGestor: ENCONTRADO (busca parcial)! Nome: " + nomeGestor + ", Email: " + emailGestor + ", WhatsApp: " + whatsappGestor);
          return { nome: nomeGestor, email: emailGestor, whatsapp: whatsappGestor };
        }
      }
    }
    
    Logger.log("buscarDadosGestor: Nenhum gestor encontrado para o setor: '" + setorAlvoLimpo + "'");
  } catch (e) {
    Logger.log("Erro ao buscar dados do gestor: " + e.toString());
    Logger.log("Stack: " + (e.stack || "N/A"));
  }
  return null;
}

function buscarDadosGestorPorEmail(emailAlvo) {
  if (!emailAlvo || emailAlvo === "GESTOR NAO ENCONTRADO") {
    Logger.log("buscarDadosGestorPorEmail: Email alvo vazio ou invalido");
    return null;
  }
  
  if (!NOME_ABA_GESTORES) {
    Logger.log("ERRO: NOME_ABA_GESTORES nao definido em buscarDadosGestorPorEmail");
    return null;
  }
  
  const sheetGestores = obterSheetSeguro(NOME_ABA_GESTORES);
  if (!sheetGestores) {
    Logger.log("buscarDadosGestorPorEmail: Sheet GESTORES nao encontrada");
    return null;
  }

  try {
    const dados = sheetGestores.getDataRange().getValues();
    const emailAlvoLimpo = emailAlvo.toString().trim().toLowerCase();
    
    Logger.log("buscarDadosGestorPorEmail: Procurando email: '" + emailAlvoLimpo + "'");
    Logger.log("buscarDadosGestorPorEmail: Total de linhas: " + dados.length);
    
    for (let i = 1; i < dados.length; i++) {
      const emailGestor = dados[i][3];
      const nomeGestor = dados[i][1];
      const whatsappGestor = dados[i][5];
      
      if (emailGestor) {
        const emailGestorLimpo = emailGestor.toString().trim().toLowerCase();
        Logger.log("buscarDadosGestorPorEmail: Linha " + (i+1) + " - Email: '" + emailGestorLimpo + "'");
        
        // Busca exata (case-insensitive)
        if (emailGestorLimpo === emailAlvoLimpo) {
          Logger.log("buscarDadosGestorPorEmail: ENCONTRADO! Nome: " + nomeGestor + ", Email: " + emailGestor + ", WhatsApp: " + whatsappGestor);
          return { nome: nomeGestor, email: emailGestor, whatsapp: whatsappGestor };
        }
      }
    }
    
    Logger.log("buscarDadosGestorPorEmail: Nenhum gestor encontrado para o email: '" + emailAlvoLimpo + "'");
  } catch (e) {
    Logger.log("Erro ao buscar dados do gestor por email: " + e.toString());
    Logger.log("Stack: " + (e.stack || "N/A"));
  }
  return null;
}

function formatarCelulasEspecificas(sheet, row) {
  if (!sheet || row < 1) return;
  try {
    [COLUNAS.SETOR, COLUNAS.DESCRICAO, COLUNAS.TIPO_EVENTO, COLUNAS.RECOMENDACOES_QUALIDADE].forEach(col => {
      const cell = sheet.getRange(row, col);
      cell.setHorizontalAlignment("center"); 
      cell.setVerticalAlignment("middle"); 
      cell.setWrap(true);
    });
  } catch (e) {
    Logger.log("Erro ao formatar celulas: " + e.toString());
  }
}

function calcularPrazoAutomatico(sheet, linha, classif) {
  if (!sheet || linha < 1) return;
  try {
    let dataBase = sheet.getRange(linha, COLUNAS.CARIMBO).getValue();
    if (!dataBase) return;

    const tipo = sheet.getRange(linha, COLUNAS.TIPO_NOTIFICACAO).getValue().toString().toUpperCase();
    let d = 7;

    if (tipo.includes("CONFORMIDADE") || tipo.includes("AUDITORIA")) d = 10;
    else {
      const c = classif ? classif.toString().toUpperCase() : "";
      if (c.includes("LEVE") || c.includes("LONDRES")) d = 15;
      else if (c.includes("MODERADO")) d = 10;
      else if (c.includes("GRAVE")) d = 3;
    }

    let final = new Date(dataBase); 
    final.setDate(final.getDate() + d);
    sheet.getRange(linha, COLUNAS.PRAZO_TRATATIVA).setValue(final);
    aplicarCorNaLinha(sheet, linha);
  } catch (e) {
    Logger.log("Erro ao calcular prazo automatico: " + e.toString());
  }
}

function aplicarCorNaLinha(sheet, linha) {
  if (!sheet || linha < 1) return;
  try {
    const p = new Date(sheet.getRange(linha, COLUNAS.PRAZO_TRATATIVA).getValue());
    const s = sheet.getRange(linha, COLUNAS.STATUS_TRATATIVA).getValue().toString().toUpperCase();
    let cor = CORES.BRANCO;

    if (!s.includes("CONFORME") && !s.includes("OK") && !isNaN(p.getTime())) {
      const dias = Math.ceil((p.setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
      if (dias < 0) cor = CORES_STATUS.VERMELHO; 
      else if (dias <= 2) cor = CORES_STATUS.AMARELO; 
      else if (dias <= 3) cor = CORES_STATUS.VERDE; 
      else cor = CORES.AZUL;
    }

    sheet.getRange(linha, COLUNAS.PRAZO_TRATATIVA).setBackground(cor);
  } catch (e) {
    Logger.log("Erro ao aplicar cor na linha: " + e.toString());
  }
}

// ===================================================================================
// 3. MODULO DE IA
// ===================================================================================

function classificarEventoComIA(descricao) {
  if (!descricao || descricao.toString().length < 5) return null;
  
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;
  
  const prompt = `
    Atue com DUPLA PERSONA:
    1. Enfermeiro Especialista em Segurança do Paciente e Psiquiatria.
    2. Especialista Black Belt em Qualidade (Lean Six Sigma).

    CONTEXTO: Hospital de Saúde Mental.
    
    TAREFA: Classifique o evento abaixo.

    DEFINIÇÕES:
    - EVENTO ADVERSO: Dano ao paciente (físico ou psicológico) ou erro que atingiu o paciente (ex: tomou remédio errado).
    - NÃO CONFORMIDADE: Falha de processo, "quase erro" (near miss) ou incidente sem dano direto (ex: tentativa de agressão contida, queda amparada).

    EXEMPLOS DE TREINAMENTO (USE COMO REFERÊNCIA):
    1. "Paciente escorregou mas foi segurado pelo técnico, não tocou o chão." -> { "tipo_notificacao": "NÃO CONFORMIDADE", "tipo_evento": "QUASE QUEDA", "classificacao": "NA", "recomendacao_blackbelt": "Revisar piso e calçados." }
    2. "Paciente agrediu outro com soco no rosto, causou hematoma." -> { "tipo_notificacao": "EVENTO ADVERSO", "tipo_evento": "AGRESSÃO FÍSICA", "classificacao": "LEVE", "recomendacao_blackbelt": "Revisar plano terapêutico e gestão de conflitos." }
    3. "Medicação dispensada errada mas percebida antes de administrar." -> { "tipo_notificacao": "NÃO CONFORMIDADE", "tipo_evento": "NEAR MISS MEDICAÇÃO", "classificacao": "NA", "recomendacao_blackbelt": "Atenção na dupla checagem." }
    4. "Paciente ingeriu medicação trocada por falha na identificação." -> { "tipo_notificacao": "EVENTO ADVERSO", "tipo_evento": "ERRO DE MEDICAÇÃO", "classificacao": "MODERADO", "recomendacao_blackbelt": "Análise de causa raiz na dispensação." }

    EVENTO PARA ANALISAR: "${descricao}"

    SAÍDA OBRIGATÓRIA (JSON):
    {
      "tipo_notificacao": "EVENTO ADVERSO" ou "NÃO CONFORMIDADE",
      "tipo_evento": "Resumo curto",
      "classificacao": "NA" (se NC) ou "LEVE"/"MODERADO"/"GRAVE" (se EA),
      "recomendacao_blackbelt": "Ação técnica (max 25 palavras)"
    }
    
    Retorne APENAS o JSON válido.
  `;

  const payload = { "contents": [{ "parts": [{"text": prompt}] }] };
  const options = { "method": "post", "contentType": "application/json", "payload": JSON.stringify(payload), "muteHttpExceptions": true };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) return { erro: true }; 

    const jsonResponse = JSON.parse(response.getContentText());
    if (jsonResponse.candidates && jsonResponse.candidates[0].content) {
      let texto = jsonResponse.candidates[0].content.parts[0].text.replace(/```json/g, "").replace(/```/g, "").trim();
      const firstBrace = texto.indexOf('{'); 
      const lastBrace = texto.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) texto = texto.substring(firstBrace, lastBrace + 1);
      return JSON.parse(texto);
    }
  } catch (e) { 
    Logger.log("Erro na classificacao IA: " + e.toString());
    return { erro: true }; 
  }
  return null;
}

// ===================================================================================
// 4. MODULO DE ENVIO (IMPLEMENTACAO COMPLETA)
// ===================================================================================

function montarCorpoEmail(dados, tipo) {
  const assinatura = "<div style=\"margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-family: Arial, sans-serif; color: #333;\"><div style=\"font-size: 16px; font-weight: bold; color: #003366;\">Sheldon L. A. Feitosa</div><div style=\"font-size: 13px; color: #555; margin-bottom: 15px;\">Gerente da Qualidade | INMCEB - Instituto do Comportamento Euripedes Barsanulfo</div><table style=\"width: 100%; border-collapse: collapse; font-size: 11px; color: #555;\"><tr><td style=\"vertical-align: top; width: 50%; padding-right: 15px; border-right: 1px solid #eee;\"><strong style=\"color: #2E7D32; display: block; margin-bottom: 5px;\">Especialista (Concluido)</strong><div style=\"margin-bottom: 3px;\">Pos-graduacao em Saude Mental e Psicossocial (Estacio)</div><div>Lean Six Sigma Yellow Belt (FM2S)</div></td><td style=\"vertical-align: top; width: 50%; padding-left: 15px;\"><strong style=\"color: #003366; display: block; margin-bottom: 5px;\">Em Formacao (2026)</strong><div style=\"margin-bottom: 3px;\">Arquitetura de Software, C. Dados e Cybersecurity (PUCPR)</div><div>MBA em Gestao de Saude e Acreditacao (Monte Pascoal)</div></td></tr></table></div>";

  // EMAIL GESTOR DE RISCO (Resumo)
  if (tipo === 'resumo_risco') {
    const corAlerta = dados.TIPO_NOTIFICACAO.includes("EVENTO ADVERSO") ? "#D32F2F" : "#F57C00";
    return "<div style=\"font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ddd; border-radius: 5px;\"><div style=\"background-color: " + corAlerta + "; color: #FFF; padding: 12px; text-align: center;\"><h2 style=\"margin: 0; font-size: 18px;\">" + NOME_SISTEMA + " | NOVA OCORRENCIA</h2></div><div style=\"padding: 20px;\"><p><strong>ID: " + dados.ID + "</strong> | <strong>Setor:</strong> " + dados.SETOR + "</p><p><strong>Tipo:</strong> " + dados.TIPO_NOTIFICACAO + " | <strong>Prazo:</strong> " + formatarData(dados.PRAZO_TRATATIVA) + "</p><p><strong>Sugestao IA:</strong> " + dados.RECOMENDACOES_QUALIDADE + "</p></div></div>";
  }

  const isNC = dados.TIPO_NOTIFICACAO.includes("NAO CONFORMIDADE");
  let linhasTabela = "";
  
  if (isNC) {
     linhasTabela = "<tr><td><strong>Registro:</strong></td><td>" + formatarData(dados.DATA_EVENTO) + "</td></tr><tr><td><strong>Origem:</strong></td><td>" + dados.TIPO_EVENTO + "</td></tr><tr><td><strong>Prazo:</strong></td><td style=\"color:red;\">" + formatarData(dados.PRAZO_TRATATIVA) + "</td></tr>";
  } else {
     const idade = dados.IDADE ? dados.IDADE + " anos" : "N/D";
     linhasTabela = "<tr><td><strong>Paciente:</strong></td><td>" + dados.PACIENTE + "</td></tr><tr><td><strong>Idade:</strong></td><td>" + idade + "</td></tr><tr><td><strong>Internacao:</strong></td><td>" + formatarData(dados.DATA_INTERNACAO) + "</td></tr><tr><td><strong>Evento:</strong></td><td>" + dados.TIPO_EVENTO + "</td></tr><tr><td><strong>Classif.:</strong></td><td>" + dados.CLASSIFICACAO_EVENTO + "</td></tr><tr><td><strong>Prazo:</strong></td><td style=\"color:red;\">" + formatarData(dados.PRAZO_TRATATIVA) + "</td></tr>";
  }

  if (tipo === 'notificacao') {
    const titulo = isNC ? "REGISTRO DE NAO CONFORMIDADE" : "NOTIFICACAO DE OCORRENCIA";
    return "<div style=\"font-family: Arial, sans-serif; max-width: 700px; border: 1px solid #ddd;\"><div style=\"background-color: #003366; color: white; padding: 20px; text-align: center;\"><h2 style=\"margin: 0; font-size: 22px;\">" + NOME_SISTEMA + " | " + titulo + "</h2></div><div style=\"padding: 20px;\"><p>Prezado Gestor <strong>" + dados.SETOR + "</strong>,</p><table style=\"width: 100%;\">" + linhasTabela + "</table><div style=\"background-color: #FFF2CC; padding: 15px; margin-top: 15px;\"><strong>Descricao:</strong><br><i>" + dados.DESCRICAO + "</i></div><div style=\"background-color: #E8F5E9; padding: 15px; margin-top: 10px;\"><strong>Recomendacao Black Belt:</strong><br><i>" + dados.RECOMENDACOES_QUALIDADE + "</i></div><br><a href=\"" + LINK_TRATATIVA + "\">ACESSAR FORMULARIO</a>" + assinatura + "</div></div>";
  }
  
  if (tipo === 'cobranca') return "<div style=\"font-family: Arial;\">Prezado Gestor " + dados.SETOR + ",<p>O prazo da Notificacao <strong>No " + dados.ID + "</strong> venceu.</p><strong>Regularize imediatamente.</strong></div>";
  if (tipo === 'escalonamento') return "<div style=\"font-family: Arial;\"><h2>NOTA DE ESCALONAMENTO</h2><p>Sr. " + NOME_PRESIDENTE + ",</p><p>Reportamos persistencia de nao conformidade critica na Notificacao <strong>No " + dados.ID + "</strong> (Setor: <strong>" + dados.SETOR + "</strong>).</p><p>Prazo expirado. Risco institucional.</p></div>";
  return "";
}

function ENVIAR_WHATSAPP_API(telefone, nome, dados) {
  if (!WHATSAPP_API_URL || !telefone) {
    Logger.log("WhatsApp: URL ou telefone nao configurado");
    Logger.log("WhatsApp: URL = " + WHATSAPP_API_URL);
    Logger.log("WhatsApp: Telefone = " + telefone);
    return false;
  }
  
  try {
    let foneLimpo = telefone.toString().replace(/\D/g, "");
    Logger.log("WhatsApp: Telefone original: " + telefone);
    Logger.log("WhatsApp: Telefone limpo: " + foneLimpo);
    Logger.log("WhatsApp: Tamanho do telefone: " + foneLimpo.length);
    
    if (foneLimpo.length < 10) {
      Logger.log("WhatsApp: Telefone invalido - muito curto: " + foneLimpo);
      return false;
    }
    
    // Se o telefone ja tem codigo do pais (comeca com 55 e tem 12 ou 13 digitos), nao adiciona novamente
    if (foneLimpo.startsWith("55") && (foneLimpo.length === 12 || foneLimpo.length === 13)) {
      Logger.log("WhatsApp: Telefone ja tem codigo do pais (55)");
    } else if (foneLimpo.length === 10 || foneLimpo.length === 11) {
      foneLimpo = "55" + foneLimpo;
      Logger.log("WhatsApp: Adicionado codigo do pais. Novo numero: " + foneLimpo);
    }
    
    const texto = "*" + NOME_SISTEMA + "* Nova notificacao.\nOla " + (nome || "Gestor") + ", nova notificacao.\n\n*ID:* " + (dados.ID || "N/A") + "\n*Tipo:* " + (dados.TIPO_NOTIFICACAO || "N/A") + "\n*Prazo:* " + (formatarData(dados.PRAZO_TRATATIVA) || "N/A") + "\n\n*Recomendacao:* " + (dados.RECOMENDACOES_QUALIDADE || "Verifique o e-mail para mais detalhes") + "\n\nAcesse seu e-mail para tratar.";

    Logger.log("WhatsApp: Preparando envio para " + foneLimpo + "...");
    Logger.log("WhatsApp: URL: " + WHATSAPP_API_URL);
    
    const payloadPadrao = {
      "phone": foneLimpo,
      "message": texto
    };
    
    // Verifica se tem Client-Token configurado
    const clientTokenParaUsar = WHATSAPP_CLIENT_TOKEN && WHATSAPP_CLIENT_TOKEN.trim() !== "" 
      ? WHATSAPP_CLIENT_TOKEN 
      : WHATSAPP_TOKEN; // Fallback para token da instancia se nao tiver Client-Token
    
    // TENTATIVA 1: Com Client-Token no header (se configurado)
    if (WHATSAPP_CLIENT_TOKEN && WHATSAPP_CLIENT_TOKEN.trim() !== "") {
      Logger.log("WhatsApp: Tentativa 1 - Com Client-Token de Seguranca da Conta...");
      Logger.log("WhatsApp: Client-Token usado: " + WHATSAPP_CLIENT_TOKEN.substring(0, 5) + "***");
      
      try {
        const optionsComClientToken = {
          "method": "post",
          "contentType": "application/json",
          "headers": {
            "Client-Token": WHATSAPP_CLIENT_TOKEN
          },
          "payload": JSON.stringify(payloadPadrao),
          "muteHttpExceptions": true
        };
        
        const response1 = UrlFetchApp.fetch(WHATSAPP_API_URL, optionsComClientToken);
        const responseCode1 = response1.getResponseCode();
        const responseText1 = response1.getContentText();
        
        Logger.log("WhatsApp: Codigo resposta (com Client-Token): " + responseCode1);
        Logger.log("WhatsApp: Resposta (com Client-Token): " + responseText1);
        
        if (responseCode1 >= 200 && responseCode1 < 300) {
          try {
            const jsonResponse = JSON.parse(responseText1);
            if (jsonResponse.success === true || jsonResponse.success === "true") {
              Logger.log("WhatsApp: SUCESSO! Mensagem enviada com Client-Token de Seguranca.");
              return true;
            } else if (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) {
              // API retornou IDs de mensagem = sucesso (mesmo sem campo success)
              Logger.log("WhatsApp: SUCESSO! Mensagem enviada com Client-Token de Seguranca.");
              Logger.log("WhatsApp: ID Mensagem: " + (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld));
              return true;
            } else if (jsonResponse.error) {
              Logger.log("WhatsApp: Erro na resposta: " + JSON.stringify(jsonResponse));
              if (!jsonResponse.error.includes("client-token")) {
                return false;
              }
            } else {
              Logger.log("WhatsApp: Resposta 200 - assumindo sucesso");
              return true;
            }
          } catch (parseError) {
            if (responseCode1 === 200) {
              Logger.log("WhatsApp: Codigo 200 sem JSON - assumindo sucesso");
              return true;
            }
          }
        }
      } catch (e) {
        Logger.log("WhatsApp: Erro na tentativa com Client-Token: " + e.toString());
      }
    }
    
    // TENTATIVA 2: Sem Client-Token no header (token ja esta na URL)
    Logger.log("WhatsApp: Tentativa 2 - Sem Client-Token no header (token na URL)...");
    Logger.log("WhatsApp: Payload: " + JSON.stringify(payloadPadrao));
    
    try {
      const optionsSemHeader = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payloadPadrao),
        "muteHttpExceptions": true
      };
      
      const response2 = UrlFetchApp.fetch(WHATSAPP_API_URL, optionsSemHeader);
      const responseCode2 = response2.getResponseCode();
      const responseText2 = response2.getContentText();
      
      Logger.log("WhatsApp: Codigo resposta (sem header): " + responseCode2);
      Logger.log("WhatsApp: Resposta (sem header): " + responseText2);
      
      if (responseCode2 >= 200 && responseCode2 < 300) {
        try {
          const jsonResponse = JSON.parse(responseText2);
          if (jsonResponse.success === true || jsonResponse.success === "true") {
            Logger.log("WhatsApp: SUCESSO! Mensagem enviada sem Client-Token no header.");
            return true;
          } else if (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) {
            // API retornou IDs de mensagem = sucesso (mesmo sem campo success)
            Logger.log("WhatsApp: SUCESSO! Mensagem enviada sem Client-Token no header.");
            Logger.log("WhatsApp: ID Mensagem: " + (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld));
            return true;
          } else if (jsonResponse.error) {
            Logger.log("WhatsApp: Erro na resposta: " + JSON.stringify(jsonResponse));
            return false;
          } else {
            Logger.log("WhatsApp: Resposta 200 - assumindo sucesso");
            return true;
          }
        } catch (parseError) {
          if (responseCode2 === 200) {
            Logger.log("WhatsApp: Codigo 200 sem JSON - assumindo sucesso");
            return true;
          }
        }
      } else if (responseCode2 === 400) {
        try {
          const jsonResponse = JSON.parse(responseText2);
          if (jsonResponse.error && jsonResponse.error.includes("client-token")) {
            Logger.log("WhatsApp: ERRO - Client-Token e obrigatorio mas nao configurado!");
            Logger.log("WhatsApp: Configure o WHATSAPP_CLIENT_TOKEN no codigo com o token da aba Seguranca");
          }
        } catch (e) {
          Logger.log("WhatsApp: Erro 400 mas nao e JSON");
        }
      }
    } catch (e) {
      Logger.log("WhatsApp: Erro na tentativa sem header: " + e.toString());
    }
    
    // TENTATIVA 3: Com token da instancia no header (fallback)
    Logger.log("WhatsApp: Tentativa 3 - Com token da instancia no header (fallback)...");
    try {
      const optionsComTokenInstancia = {
        "method": "post",
        "contentType": "application/json",
        "headers": {
          "Client-Token": WHATSAPP_TOKEN
        },
        "payload": JSON.stringify(payloadPadrao),
        "muteHttpExceptions": true
      };
      
      Logger.log("WhatsApp: Token da instancia usado: " + WHATSAPP_TOKEN);
      
      const response3 = UrlFetchApp.fetch(WHATSAPP_API_URL, optionsComTokenInstancia);
      const responseCode3 = response3.getResponseCode();
      const responseText3 = response3.getContentText();
      
      Logger.log("WhatsApp: Codigo resposta (token instancia): " + responseCode3);
      Logger.log("WhatsApp: Resposta (token instancia): " + responseText3);
      
      if (responseCode3 >= 200 && responseCode3 < 300) {
        try {
          const jsonResponse = JSON.parse(responseText3);
          if (jsonResponse.success === true || jsonResponse.success === "true") {
            Logger.log("WhatsApp: SUCESSO! Mensagem enviada com token da instancia no header.");
            return true;
          } else if (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) {
            // API retornou IDs de mensagem = sucesso (mesmo sem campo success)
            Logger.log("WhatsApp: SUCESSO! Mensagem enviada com token da instancia no header.");
            Logger.log("WhatsApp: ID Mensagem: " + (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld));
            return true;
          } else {
            Logger.log("WhatsApp: Erro mesmo com token da instancia: " + JSON.stringify(jsonResponse));
            return false;
          }
        } catch (parseError) {
          if (responseCode3 === 200) {
            Logger.log("WhatsApp: Codigo 200 sem JSON - assumindo sucesso");
            return true;
          }
        }
      }
    } catch (e) {
      Logger.log("WhatsApp: Erro na tentativa com token da instancia: " + e.toString());
    }
    
    Logger.log("WhatsApp: Todas as tentativas falharam");
    Logger.log("WhatsApp: Resumo - Telefone usado: " + foneLimpo);
    Logger.log("WhatsApp: Resumo - URL: " + WHATSAPP_API_URL);
    Logger.log("WhatsApp: Resumo - Token: " + WHATSAPP_TOKEN.substring(0, 10) + "...");
    return false;
    
  } catch (e) { 
    Logger.log("WhatsApp: Erro geral ao enviar mensagem: " + e.toString());
    Logger.log("WhatsApp: Stack trace: " + (e.stack || "N/A"));
    Logger.log("WhatsApp: Telefone que causou erro: " + telefone);
    return false;
  }
}

function ENVIAR_WHATSAPP_SIMPLES(telefone, nomeGestor) {
  if (!WHATSAPP_API_URL || !telefone) {
    Logger.log("WhatsApp Simples: URL ou telefone nao configurado");
    return false;
  }
  
  try {
    let foneLimpo = telefone.toString().replace(/\D/g, "");
    
    if (foneLimpo.length < 10) {
      Logger.log("WhatsApp Simples: Telefone invalido - muito curto: " + foneLimpo);
      return false;
    }
    
    if (foneLimpo.startsWith("55") && (foneLimpo.length === 12 || foneLimpo.length === 13)) {
      // Ja tem codigo do pais
    } else if (foneLimpo.length === 10 || foneLimpo.length === 11) {
      foneLimpo = "55" + foneLimpo;
    }
    
    const texto = "Estimado Gestor, voce recebeu uma notificacao. Confira seu e-mail.";
    
    Logger.log("WhatsApp Simples: Enviando para " + foneLimpo + "...");
    
    const payload = {
      "phone": foneLimpo,
      "message": texto
    };
    
    // TENTATIVA 1: Com Client-Token de Seguranca (se configurado)
    if (WHATSAPP_CLIENT_TOKEN && WHATSAPP_CLIENT_TOKEN.trim() !== "") {
      try {
        const optionsComClientToken = {
          "method": "post",
          "contentType": "application/json",
          "headers": {
            "Client-Token": WHATSAPP_CLIENT_TOKEN
          },
          "payload": JSON.stringify(payload),
          "muteHttpExceptions": true
        };
        
        const response1 = UrlFetchApp.fetch(WHATSAPP_API_URL, optionsComClientToken);
        const responseCode1 = response1.getResponseCode();
        const responseText1 = response1.getContentText();
        
        if (responseCode1 >= 200 && responseCode1 < 300) {
          try {
            const jsonResponse = JSON.parse(responseText1);
            if (jsonResponse.success === true || jsonResponse.success === "true" || jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) {
              Logger.log("WhatsApp Simples: Mensagem enviada com sucesso (Client-Token)");
              return true;
            }
          } catch (parseError) {
            if (responseCode1 === 200) {
              Logger.log("WhatsApp Simples: Mensagem enviada (codigo 200)");
              return true;
            }
          }
        }
      } catch (e) {
        Logger.log("WhatsApp Simples: Erro na tentativa com Client-Token: " + e.toString());
      }
    }
    
    // TENTATIVA 2: Sem Client-Token no header
    try {
      const optionsSemHeader = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };
      
      const response2 = UrlFetchApp.fetch(WHATSAPP_API_URL, optionsSemHeader);
      const responseCode2 = response2.getResponseCode();
      const responseText2 = response2.getContentText();
      
      if (responseCode2 >= 200 && responseCode2 < 300) {
        try {
          const jsonResponse = JSON.parse(responseText2);
          if (jsonResponse.success === true || jsonResponse.success === "true" || jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) {
            Logger.log("WhatsApp Simples: Mensagem enviada com sucesso (sem header)");
            return true;
          }
        } catch (parseError) {
          if (responseCode2 === 200) {
            Logger.log("WhatsApp Simples: Mensagem enviada (codigo 200)");
            return true;
          }
        }
      }
    } catch (e) {
      Logger.log("WhatsApp Simples: Erro na tentativa sem header: " + e.toString());
    }
    
    Logger.log("WhatsApp Simples: Falha ao enviar mensagem");
    return false;
    
  } catch (e) {
    Logger.log("WhatsApp Simples: Erro geral: " + e.toString());
    return false;
  }
}

function ENVIAR_NOTIFICACAO_INICIAL_AUTO(linha) {
  if (!NOME_DA_PLANILHA) {
    Logger.log("ERRO: NOME_DA_PLANILHA nao definido em ENVIAR_NOTIFICACAO_INICIAL_AUTO");
    return;
  }
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  if (!sheet) return;

  const dados = obterLinhaCompleta(sheet, linha);
  if (!dados || !dados.EMAIL_CONTATO || dados.EMAIL_CONTATO === "GESTOR NAO ENCONTRADO") return;

  try {
    let prazoFinal = dados.PRAZO_TRATATIVA;
    if (!prazoFinal || !(prazoFinal instanceof Date)) {
      calcularPrazoAutomatico(sheet, linha, dados.CLASSIFICACAO_EVENTO);
      dados.PRAZO_TRATATIVA = sheet.getRange(linha, COLUNAS.PRAZO_TRATATIVA).getValue();
    }

    sheet.getRange(linha, COLUNAS.EMAIL_CONTATO).setBackground(CORES_STATUS.ROXO);
    if (!dados.RECOMENDACOES_QUALIDADE) dados.RECOMENDACOES_QUALIDADE = sheet.getRange(linha, COLUNAS.RECOMENDACOES_QUALIDADE).getValue();

    // Envia e-mail
    MailApp.sendEmail({ 
      to: dados.EMAIL_CONTATO, 
      subject: "[" + NOME_SISTEMA + "] NOTIFICACAO: No " + dados.ID, 
      htmlBody: montarCorpoEmail(dados, 'notificacao') 
    });

    // Envia WhatsApp automaticamente junto com o e-mail
    // Busca o gestor pelo email que ja esta selecionado na linha
    const gestor = buscarDadosGestorPorEmail(dados.EMAIL_CONTATO);
    if (gestor && gestor.whatsapp) {
      Logger.log("ENVIAR_NOTIFICACAO_INICIAL_AUTO: Enviando WhatsApp para " + gestor.nome + " (" + gestor.whatsapp + ")");
      const whatsappEnviado = ENVIAR_WHATSAPP_SIMPLES(gestor.whatsapp, gestor.nome);
      if (whatsappEnviado) {
        Logger.log("ENVIAR_NOTIFICACAO_INICIAL_AUTO: WhatsApp enviado com sucesso");
      } else {
        Logger.log("ENVIAR_NOTIFICACAO_INICIAL_AUTO: Falha ao enviar WhatsApp");
      }
    } else {
      Logger.log("ENVIAR_NOTIFICACAO_INICIAL_AUTO: Gestor nao encontrado ou sem WhatsApp cadastrado para o email: " + dados.EMAIL_CONTATO);
    }

    sheet.getRange(linha, COLUNAS.LOG_NOTIFICACAO).setValue("[" + formatarData(new Date()) + "] Enviado.").setBackground(CORES_STATUS.VERDE);
  } catch (e) {
    Logger.log("Erro ao enviar notificacao inicial: " + e.toString());
    SpreadsheetApp.getUi().alert("Erro ao enviar notificacao: " + e.toString());
  }
}

function ENVIAR_NOTIFICACAO_INICIAL() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getName() !== NOME_DA_PLANILHA) {
    SpreadsheetApp.getUi().alert("Por favor, selecione a aba 'NOTIFICACOES'.");
    return;
  }
  
  const linha = sheet.getActiveCell().getRow();
  if (linha < 2) {
    SpreadsheetApp.getUi().alert("Por favor, selecione uma linha de dados valida.");
    return;
  }
  
  ENVIAR_NOTIFICACAO_INICIAL_AUTO(linha);
  SpreadsheetApp.getActiveSpreadsheet().toast("Notificacao enviada!", "Sucesso");
}

function ENVIAR_ALERTA_RISCO_ADMIN(linha) {
  if (!NOME_DA_PLANILHA) {
    Logger.log("ERRO: NOME_DA_PLANILHA nao definido em ENVIAR_ALERTA_RISCO_ADMIN");
    return;
  }
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  if (!sheet) return;

  const dados = obterLinhaCompleta(sheet, linha);
  if (!dados) return;
  
  if (!dados.RECOMENDACOES_QUALIDADE) dados.RECOMENDACOES_QUALIDADE = sheet.getRange(linha, COLUNAS.RECOMENDACOES_QUALIDADE).getValue();
  
  try {
    MailApp.sendEmail({ 
      to: EMAIL_GESTOR_RISCO, 
      subject: "[" + NOME_SISTEMA + "] ALERTA DE RISCO - ID " + dados.ID, 
      htmlBody: montarCorpoEmail(dados, 'resumo_risco') 
    }); 
  } catch (e) { 
    Logger.log("Erro gestor risco: " + e.toString()); 
  }
}

function ENVIAR_ALERTA_RISCO_MANUAL() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getName() !== NOME_DA_PLANILHA) {
    SpreadsheetApp.getUi().alert("Por favor, selecione a aba 'NOTIFICACOES'.");
    return;
  }
  
  ENVIAR_ALERTA_RISCO_ADMIN(sheet.getActiveCell().getRow());
  SpreadsheetApp.getActiveSpreadsheet().toast("Alerta enviado!", "Sucesso");
}

function ENVIAR_COBRANCA_SELECIONADA() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getName() !== NOME_DA_PLANILHA) {
    SpreadsheetApp.getUi().alert("Por favor, selecione a aba 'NOTIFICACOES'.");
    return;
  }

  const linha = sheet.getActiveCell().getRow();
  if (linha < 2) {
    SpreadsheetApp.getUi().alert("Por favor, selecione uma linha de dados valida.");
    return;
  }

  const dados = obterLinhaCompleta(sheet, linha);
  if (!dados || !dados.EMAIL_CONTATO) { 
    SpreadsheetApp.getUi().alert("Sem e-mail cadastrado para este gestor."); 
    return; 
  }

  try {
    MailApp.sendEmail({ 
      to: dados.EMAIL_CONTATO, 
      subject: "[" + NOME_SISTEMA + "] URGENTE: ID " + dados.ID, 
      htmlBody: montarCorpoEmail(dados, 'cobranca') 
    });

    const logCell = sheet.getRange(linha, COLUNAS.LOG_COBRANCA);
    logCell.setValue("[" + formatarData(new Date()) + "] Cobranca Manual.").setBackground(CORES_STATUS.AMARELO);
    SpreadsheetApp.getActiveSpreadsheet().toast("Cobranca enviada.");
  } catch (e) {
    Logger.log("Erro ao enviar cobranca: " + e.toString());
    SpreadsheetApp.getUi().alert("Erro ao enviar cobranca: " + e.toString());
  }
}

function ENVIAR_COBRANCA_ALTA_GESTAO() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getName() !== NOME_DA_PLANILHA) {
    SpreadsheetApp.getUi().alert("Por favor, selecione a aba 'NOTIFICACOES'.");
    return;
  }

  const linha = sheet.getActiveCell().getRow();
  if (linha < 2) {
    SpreadsheetApp.getUi().alert("Por favor, selecione uma linha de dados valida.");
    return;
  }

  const dados = obterLinhaCompleta(sheet, linha);
  if (!dados) {
    SpreadsheetApp.getUi().alert("Erro ao obter dados da linha.");
    return;
  }

  const corpo = montarCorpoEmail(dados, 'escalonamento');

  try {
    MailApp.sendEmail({ 
      to: EMAIL_DIRETORIA, 
      subject: "[" + NOME_SISTEMA + "] ESCALONAMENTO: ID " + dados.ID, 
      htmlBody: corpo 
    });

    sheet.getRange(linha, COLUNAS.LOG_ALTA_GESTAO).setValue("Escalado.").setBackground(CORES_STATUS.VERMELHO);
    SpreadsheetApp.getUi().alert("Enviado a Diretoria.");
  } catch (e) { 
    Logger.log("Erro ao enviar escalonamento: " + e.toString());
    SpreadsheetApp.getUi().alert("Erro ao enviar: " + e.toString()); 
  }
}

function CLASSIFICAR_MANUALMENTE() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();
  
  if (sheet.getName() !== NOME_DA_PLANILHA) { 
    ui.alert("Por favor, selecione a aba 'NOTIFICACOES'."); 
    return; 
  }
  
  const linha = sheet.getActiveCell().getRow();
  if (linha < 2) { 
    ui.alert("Selecione uma linha de dados valida."); 
    return; 
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("IA analisando...", "Sentinela AI", 5);
  
  const descricao = sheet.getRange(linha, COLUNAS.DESCRICAO).getValue();
  formatarCelulasEspecificas(sheet, linha);
  
  let gestor = buscarDadosGestor(sheet.getRange(linha, COLUNAS.SETOR).getValue());
  
  // Se nao encontrou gestor, permite selecionar manualmente
  if (!gestor) {
    const resposta = ui.alert(
      "Gestor nao encontrado para o setor.\n\nDeseja selecionar um gestor manualmente?",
      ui.ButtonSet.YES_NO
    );
    
    if (resposta === ui.Button.YES) {
      SELECIONAR_GESTOR_MANUALMENTE();
      // Recarrega os dados apos selecao
      gestor = buscarDadosGestor(sheet.getRange(linha, COLUNAS.SETOR).getValue());
    }
  }
  
  if (gestor && gestor.email) {
    sheet.getRange(linha, COLUNAS.EMAIL_CONTATO).setValue(gestor.email);
  } else {
    sheet.getRange(linha, COLUNAS.EMAIL_CONTATO).setValue("GESTOR NAO ENCONTRADO");
  }

  if (!descricao) { 
    ui.alert("Descricao vazia."); 
    return; 
  }

  const ia = classificarEventoComIA(descricao);

  if (ia && !ia.erro) {
    const tipo = ia.tipo_notificacao ? ia.tipo_notificacao.toUpperCase() : "N/A";
    sheet.getRange(linha, COLUNAS.TIPO_NOTIFICACAO).setValue(tipo);
    sheet.getRange(linha, COLUNAS.TIPO_EVENTO).setValue(ia.tipo_evento ? ia.tipo_evento.toUpperCase() : "N/A");
    
    let classif = ia.classificacao ? ia.classificacao.toUpperCase() : "NA";
    if (tipo.includes("NAO CONFORMIDADE")) classif = "NA";
    sheet.getRange(linha, COLUNAS.CLASSIFICACAO_EVENTO).setValue(classif);
    
    if (ia.recomendacao_blackbelt) {
      sheet.getRange(linha, COLUNAS.RECOMENDACOES_QUALIDADE).setValue(ia.recomendacao_blackbelt);
    }
    
    calcularPrazoAutomatico(sheet, linha, classif);
    ENVIAR_ALERTA_RISCO_ADMIN(linha);
    
    if (gestor && gestor.whatsapp) {
      ENVIAR_WHATSAPP_API(gestor.whatsapp, gestor.nome, obterLinhaCompleta(sheet, linha));
    }
    
    ui.alert("Classificado!", ui.ButtonSet.OK);
  } else { 
    ui.alert("Erro na classificacao pela IA. Tente novamente.", ui.ButtonSet.OK); 
  }
}

function APLICAR_FORMATACAO_VISUAL_COMPLETA() {
  if (!NOME_DA_PLANILHA) {
    Logger.log("ERRO: NOME_DA_PLANILHA nao definido em APLICAR_FORMATACAO_VISUAL_COMPLETA");
    SpreadsheetApp.getUi().alert("Erro: Configuracao incompleta. NOME_DA_PLANILHA nao definido.");
    return;
  }
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Nao ha dados para formatar.", "Aviso");
    return;
  }

  try {
    APLICAR_CORES_VISUAL();
    const colunasAlvo = [COLUNAS.SETOR, COLUNAS.DESCRICAO, COLUNAS.TIPO_EVENTO, COLUNAS.RECOMENDACOES_QUALIDADE];
    
    colunasAlvo.forEach(col => {
      const range = sheet.getRange(2, col, lastRow - 1, 1);
      range.setHorizontalAlignment("center"); 
      range.setVerticalAlignment("middle"); 
      range.setWrap(true);
    });
    
    SpreadsheetApp.getActiveSpreadsheet().toast("Visual aplicado.", "Concluido");
  } catch (e) {
    Logger.log("Erro ao aplicar formatacao visual: " + e.toString());
    SpreadsheetApp.getUi().alert("Erro ao aplicar formatacao: " + e.toString());
  }
}

function APLICAR_CORES_VISUAL() {
  if (!NOME_DA_PLANILHA) {
    Logger.log("ERRO: NOME_DA_PLANILHA nao definido em APLICAR_CORES_VISUAL");
    return;
  }
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  try {
    const rangeEmail = sheet.getRange(2, COLUNAS.EMAIL_CONTATO, lastRow-1, 1);
    rangeEmail.setBackgrounds(rangeEmail.getValues().map(r => r[0] ? [CORES_STATUS.ROXO] : [null]));
    
    const rangeNotif = sheet.getRange(2, COLUNAS.LOG_NOTIFICACAO, lastRow-1, 1);
    rangeNotif.setBackgrounds(rangeNotif.getValues().map(r => r[0] ? [CORES_STATUS.VERDE] : [null]));
    
    const rangeCob = sheet.getRange(2, COLUNAS.LOG_COBRANCA, lastRow-1, 1);
    rangeCob.setBackgrounds(rangeCob.getValues().map(r => r[0] ? [CORES_STATUS.AMARELO] : [null]));
    
    const rangePres = sheet.getRange(2, COLUNAS.LOG_ALTA_GESTAO, lastRow-1, 1);
    rangePres.setBackgrounds(rangePres.getValues().map(r => r[0] ? [CORES_STATUS.VERMELHO] : [null]));
  } catch (e) {
    Logger.log("Erro ao aplicar cores visuais: " + e.toString());
  }
}

function FILTRAR_SOMENTE_VENCIDAS() {
  if (!NOME_DA_PLANILHA) {
    Logger.log("ERRO: NOME_DA_PLANILHA nao definido em FILTRAR_SOMENTE_VENCIDAS");
    return;
  }
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  if (!sheet) return;

  try {
    if (sheet.getFilter()) sheet.getFilter().remove();
    const range = sheet.getDataRange();
    const filter = range.createFilter();
    filter.setColumnFilterCriteria(COLUNAS.PRAZO_TRATATIVA, SpreadsheetApp.newFilterCriteria().whenDateBefore(new Date()).build());
    SpreadsheetApp.getActiveSpreadsheet().toast("Filtro: Apenas Vencidas");
  } catch (e) {
    Logger.log("Erro ao filtrar vencidas: " + e.toString());
    SpreadsheetApp.getUi().alert("Erro ao aplicar filtro: " + e.toString());
  }
}

function MOSTRAR_TUDO() {
  if (!NOME_DA_PLANILHA) {
    Logger.log("ERRO: NOME_DA_PLANILHA nao definido em MOSTRAR_TUDO");
    return;
  }
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  if (!sheet) return;

  try {
    if (sheet.getFilter()) {
      sheet.getFilter().remove();
      SpreadsheetApp.getActiveSpreadsheet().toast("Filtros removidos.");
    }
  } catch (e) {
    Logger.log("Erro ao remover filtros: " + e.toString());
  }
}

function ABRIR_CADASTRO_GESTOR() {
  const ui = SpreadsheetApp.getUi();
  
  if (!NOME_ABA_GESTORES) {
    Logger.log("ERRO: NOME_ABA_GESTORES nao definido em ABRIR_CADASTRO_GESTOR");
    ui.alert("Erro: Configuracao incompleta. NOME_ABA_GESTORES nao definido.");
    return;
  }
  
  const sheetGestores = obterSheetSeguro(NOME_ABA_GESTORES);
  
  if (!sheetGestores) {
    ui.alert("A aba 'GESTORES' nao foi encontrada. Verifique se ela existe na planilha.");
    return;
  }

  const response = ui.prompt(
    'Cadastrar Novo Gestor',
    'Preencha os dados do gestor:\n\nFormato: Nome | Setor | Email | Telefone | WhatsApp\n\nExemplo:\nJoao Silva | Enfermagem | joao@email.com | (85) 99999-9999 | 5585999999999',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const dados = response.getResponseText();
    const partes = dados.split('|').map(p => p.trim());
    
    if (partes.length < 5) {
      ui.alert('Formato invalido. Use: Nome | Setor | Email | Telefone | WhatsApp');
      return;
    }

    try {
      const ultimaLinha = sheetGestores.getLastRow() + 1;
      sheetGestores.getRange(ultimaLinha, 1).setValue(ultimaLinha - 1);
      sheetGestores.getRange(ultimaLinha, 2).setValue(partes[0]);
      sheetGestores.getRange(ultimaLinha, 3).setValue(partes[1]);
      sheetGestores.getRange(ultimaLinha, 4).setValue(partes[2]);
      sheetGestores.getRange(ultimaLinha, 5).setValue(partes[3]);
      sheetGestores.getRange(ultimaLinha, 6).setValue(partes[4]);
      
      ui.alert('Gestor cadastrado com sucesso!');
      SpreadsheetApp.getActiveSpreadsheet().toast("Gestor cadastrado!", "Sucesso");
    } catch (e) {
      Logger.log("Erro ao cadastrar gestor: " + e.toString());
      ui.alert('Erro ao cadastrar gestor: ' + e.toString());
    }
  }
}

function SELECIONAR_GESTOR_MANUALMENTE() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getName() !== NOME_DA_PLANILHA) {
    ui.alert("Por favor, selecione a aba 'NOTIFICACOES'.");
    return;
  }
  
  const linha = sheet.getActiveCell().getRow();
  if (linha < 2) {
    ui.alert("Por favor, selecione uma linha de dados valida.");
    return;
  }
  
  if (!NOME_ABA_GESTORES) {
    ui.alert("Erro: Configuracao incompleta.");
    return;
  }
  
  const sheetGestores = obterSheetSeguro(NOME_ABA_GESTORES);
  if (!sheetGestores) {
    ui.alert("A aba 'GESTORES' nao foi encontrada.");
    return;
  }
  
  try {
    const dadosGestores = sheetGestores.getDataRange().getValues();
    if (dadosGestores.length < 2) {
      ui.alert("Nenhum gestor cadastrado. Por favor, cadastre gestores primeiro.");
      return;
    }
    
    // Monta lista de gestores para selecao
    let listaGestores = "Selecione um gestor:\n\n";
    const gestores = [];
    
    for (let i = 1; i < dadosGestores.length; i++) {
      const nome = dadosGestores[i][1] || "Sem nome";
      const setor = dadosGestores[i][2] || "Sem setor";
      const email = dadosGestores[i][3] || "Sem email";
      const whatsapp = dadosGestores[i][5] || "";
      
      listaGestores += (i) + ". " + nome + " - " + setor + "\n";
      gestores.push({
        nome: nome,
        setor: setor,
        email: email,
        whatsapp: whatsapp
      });
    }
    
    const response = ui.prompt(
      'Selecionar Gestor',
      listaGestores + "\nDigite o numero do gestor:",
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() === ui.Button.OK) {
      const escolha = parseInt(response.getResponseText().trim());
      
      if (isNaN(escolha) || escolha < 1 || escolha > gestores.length) {
        ui.alert("Numero invalido. Por favor, selecione um numero entre 1 e " + gestores.length);
        return;
      }
      
      const gestorSelecionado = gestores[escolha - 1];
      
      // Atualiza a linha com os dados do gestor selecionado
      sheet.getRange(linha, COLUNAS.SETOR).setValue(gestorSelecionado.setor);
      sheet.getRange(linha, COLUNAS.EMAIL_CONTATO).setValue(gestorSelecionado.email);
      
      ui.alert("Gestor selecionado com sucesso!\n\nNome: " + gestorSelecionado.nome + "\nSetor: " + gestorSelecionado.setor + "\nEmail: " + gestorSelecionado.email);
      SpreadsheetApp.getActiveSpreadsheet().toast("Gestor selecionado: " + gestorSelecionado.nome, "Sucesso");
    }
  } catch (e) {
    Logger.log("Erro ao selecionar gestor: " + e.toString());
    ui.alert("Erro ao selecionar gestor: " + e.toString());
  }
}

function TESTAR_WHATSAPP() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  if (sheet.getName() !== NOME_DA_PLANILHA) {
    ui.alert("Por favor, selecione a aba 'NOTIFICACOES'.");
    return;
  }
  
  const linha = sheet.getActiveCell().getRow();
  if (linha < 2) {
    ui.alert("Por favor, selecione uma linha de dados valida.");
    return;
  }
  
  const dados = obterLinhaCompleta(sheet, linha);
  if (!dados) {
    ui.alert("Erro ao obter dados da linha.");
    return;
  }
  
  Logger.log("TESTAR_WHATSAPP: Setor da linha selecionada: '" + dados.SETOR + "'");
  
  let gestor = buscarDadosGestor(dados.SETOR);
  
  // Se nao encontrou pelo setor, permite selecionar manualmente
  if (!gestor) {
    Logger.log("TESTAR_WHATSAPP: Gestor nao encontrado para setor: '" + dados.SETOR + "'");
    const resposta = ui.alert(
      "Gestor nao encontrado para o setor:\n\n'" + dados.SETOR + "'\n\nDeseja selecionar um gestor manualmente?",
      ui.ButtonSet.YES_NO
    );
    
    if (resposta === ui.Button.YES) {
      SELECIONAR_GESTOR_MANUALMENTE();
      // Recarrega os dados apos selecao
      gestor = buscarDadosGestor(sheet.getRange(linha, COLUNAS.SETOR).getValue());
    } else {
      return;
    }
  }
  
  if (!gestor) {
    return; // Usuario cancelou
  }
  
  if (!gestor.whatsapp) {
    Logger.log("TESTAR_WHATSAPP: Gestor encontrado mas sem WhatsApp: " + gestor.nome);
    ui.alert("Gestor encontrado mas WhatsApp nao cadastrado:\n\nNome: " + gestor.nome + "\nSetor: " + dados.SETOR + "\n\nPor favor, cadastre o WhatsApp na aba GESTORES.");
    return;
  }
  
  Logger.log("TESTAR_WHATSAPP: Gestor encontrado - Nome: " + gestor.nome + ", WhatsApp: " + gestor.whatsapp);
  SpreadsheetApp.getActiveSpreadsheet().toast("Enviando WhatsApp de teste...", "Teste", 3);
  
  const sucesso = ENVIAR_WHATSAPP_API(gestor.whatsapp, gestor.nome, dados);
  
  if (sucesso) {
    ui.alert("WhatsApp enviado com sucesso!\n\nDestinatario: " + gestor.nome + "\nWhatsApp: " + gestor.whatsapp + "\n\nVerifique os logs para mais detalhes.");
    SpreadsheetApp.getActiveSpreadsheet().toast("WhatsApp enviado!", "Sucesso");
  } else {
    const telefoneFormatado = gestor.whatsapp.toString().replace(/\D/g, "");
    const telefoneComCodigo = telefoneFormatado.startsWith("55") ? telefoneFormatado : "55" + telefoneFormatado;
    
    let mensagemErro = "Erro ao enviar WhatsApp.\n\n";
    mensagemErro += "Destinatario: " + gestor.nome + "\n";
    mensagemErro += "WhatsApp: " + telefoneComCodigo + "\n\n";
    
    if (WHATSAPP_CLIENT_TOKEN && WHATSAPP_CLIENT_TOKEN.trim() !== "") {
      mensagemErro += "STATUS: Client-Token configurado (" + WHATSAPP_CLIENT_TOKEN.substring(0, 5) + "***)\n\n";
    } else {
      mensagemErro += "STATUS: Client-Token NAO configurado\n\n";
    }
    
    mensagemErro += "SOLUCOES POSSIVEIS:\n\n";
    mensagemErro += "1. Verifique se a instancia Z-API esta CONECTADA\n";
    mensagemErro += "   (deve aparecer 'Conectado' em verde)\n\n";
    mensagemErro += "2. Confirme se o numero " + telefoneComCodigo + " esta cadastrado\n";
    mensagemErro += "   na instancia Z-API\n\n";
    mensagemErro += "3. Verifique os LOGS completos:\n";
    mensagemErro += "   Executar > Ver logs de execucao\n";
    mensagemErro += "   (Procure por linhas 'WhatsApp:')\n\n";
    mensagemErro += "4. Teste a conexao:\n";
    mensagemErro += "   SENTINELA AI > TESTAR CONEXAO Z-API";
    
    ui.alert(mensagemErro);
  }
}

function TESTAR_CONEXAO_ZAPI() {
  const ui = SpreadsheetApp.getUi();
  let resultado = "=== TESTE DE CONEXAO Z-API ===\n\n";
  
  resultado += "Configuracao:\n";
  resultado += "- URL: " + WHATSAPP_API_URL + "\n";
  resultado += "- Token Instancia: " + WHATSAPP_TOKEN + "\n";
  resultado += "- Client-Token Seguranca: " + (WHATSAPP_CLIENT_TOKEN && WHATSAPP_CLIENT_TOKEN.trim() !== "" ? WHATSAPP_CLIENT_TOKEN.substring(0, 5) + "***" : "NAO CONFIGURADO") + "\n";
  resultado += "- Instance ID: 3EAA37B303BAF1CAB4A91ABB50AD3431\n\n";
  
  if (!WHATSAPP_CLIENT_TOKEN || WHATSAPP_CLIENT_TOKEN.trim() === "") {
    resultado += "ATENCAO:\n";
    resultado += "Client-Token de Seguranca nao configurado!\n";
    resultado += "Se o erro for 'client-token not configured':\n";
    resultado += "1. Copie o token da aba Seguranca da Z-API\n";
    resultado += "2. Cole na constante WHATSAPP_CLIENT_TOKEN\n";
    resultado += "3. Salve o codigo\n\n";
  }
  
  // Testa com um numero de exemplo
  const numeroTeste = "556282062014";
  const mensagemTeste = "Teste de conexao - " + new Date().toLocaleString("pt-BR");
  
  resultado += "Testando envio para: " + numeroTeste + "\n";
  resultado += "Mensagem: " + mensagemTeste + "\n\n";
  
  try {
    const payload = {
      "phone": numeroTeste,
      "message": mensagemTeste
    };
    
    // TENTATIVA 1: Com Client-Token de Seguranca (se configurado)
    if (WHATSAPP_CLIENT_TOKEN && WHATSAPP_CLIENT_TOKEN.trim() !== "") {
      Logger.log("TESTE Z-API: Tentativa 1 - Com Client-Token de Seguranca...");
      Logger.log("TESTE Z-API: Client-Token: " + WHATSAPP_CLIENT_TOKEN.substring(0, 5) + "***");
      
      try {
        const optionsComClientToken = {
          "method": "post",
          "contentType": "application/json",
          "headers": {
            "Client-Token": WHATSAPP_CLIENT_TOKEN
          },
          "payload": JSON.stringify(payload),
          "muteHttpExceptions": true
        };
        
        const response1 = UrlFetchApp.fetch(WHATSAPP_API_URL, optionsComClientToken);
        const responseCode1 = response1.getResponseCode();
        const responseText1 = response1.getContentText();
        
        Logger.log("TESTE Z-API: Codigo HTTP (com Client-Token): " + responseCode1);
        Logger.log("TESTE Z-API: Resposta (com Client-Token): " + responseText1);
        
        resultado += "Tentativa 1 (com Client-Token de Seguranca):\n";
        resultado += "- Codigo HTTP: " + responseCode1 + "\n";
        resultado += "- Resposta: " + responseText1.substring(0, 200) + "\n\n";
        
        if (responseCode1 >= 200 && responseCode1 < 300) {
          try {
            const jsonResponse = JSON.parse(responseText1);
            resultado += "Resposta JSON:\n";
            resultado += JSON.stringify(jsonResponse, null, 2) + "\n\n";
            
            if (jsonResponse.success === true || jsonResponse.success === "true") {
              resultado += "STATUS: SUCESSO! Mensagem enviada.\n";
              resultado += "(Funcionou com Client-Token de Seguranca)\n";
              ui.alert(resultado + "\nVerifique os logs para mais detalhes.");
              return;
            } else if (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) {
              // API retornou IDs de mensagem = sucesso (mesmo sem campo success)
              resultado += "STATUS: SUCESSO! Mensagem enviada.\n";
              resultado += "(API retornou IDs de mensagem - sucesso confirmado)\n";
              resultado += "ID Mensagem: " + (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) + "\n";
              ui.alert(resultado + "\nVerifique os logs para mais detalhes.");
              return;
            } else if (jsonResponse.error) {
              resultado += "STATUS: ERRO\n";
              resultado += "Erro: " + JSON.stringify(jsonResponse.error) + "\n";
              resultado += "\nTentando sem Client-Token...\n\n";
            } else {
              resultado += "STATUS: Resposta recebida mas formato desconhecido\n";
            }
          } catch (parseError) {
            if (responseCode1 === 200) {
              resultado += "STATUS: Codigo 200 - assumindo sucesso\n";
              ui.alert(resultado);
              return;
            }
          }
        }
      } catch (e) {
        Logger.log("TESTE Z-API: Erro na tentativa com Client-Token: " + e.toString());
        resultado += "Erro na tentativa com Client-Token: " + e.toString() + "\n\n";
      }
    }
    
    // TENTATIVA 2: Sem Client-Token no header (token ja esta na URL)
    Logger.log("TESTE Z-API: Tentativa 2 - Sem Client-Token no header...");
    Logger.log("TESTE Z-API: URL: " + WHATSAPP_API_URL);
    Logger.log("TESTE Z-API: Payload: " + JSON.stringify(payload));
    
    try {
      const optionsSemHeader = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };
      
      const response2 = UrlFetchApp.fetch(WHATSAPP_API_URL, optionsSemHeader);
      const responseCode2 = response2.getResponseCode();
      const responseText2 = response2.getContentText();
      
      Logger.log("TESTE Z-API: Codigo HTTP (sem header): " + responseCode2);
      Logger.log("TESTE Z-API: Resposta (sem header): " + responseText2);
      
      resultado += "Tentativa 2 (sem header):\n";
      resultado += "- Codigo HTTP: " + responseCode2 + "\n";
      resultado += "- Resposta: " + responseText2.substring(0, 200) + "\n\n";
      
      if (responseCode2 >= 200 && responseCode2 < 300) {
        try {
          const jsonResponse = JSON.parse(responseText2);
          resultado += "Resposta JSON:\n";
          resultado += JSON.stringify(jsonResponse, null, 2) + "\n\n";
          
          if (jsonResponse.success === true || jsonResponse.success === "true") {
            resultado += "STATUS: SUCESSO! Mensagem enviada.\n";
            resultado += "(Funcionou sem Client-Token no header)\n";
            ui.alert(resultado + "\nVerifique os logs para mais detalhes.");
            return;
          } else if (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) {
            // API retornou IDs de mensagem = sucesso (mesmo sem campo success)
            resultado += "STATUS: SUCESSO! Mensagem enviada.\n";
            resultado += "(API retornou IDs de mensagem - sucesso confirmado)\n";
            resultado += "ID Mensagem: " + (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) + "\n";
            ui.alert(resultado + "\nVerifique os logs para mais detalhes.");
            return;
          } else if (jsonResponse.error) {
            resultado += "STATUS: ERRO\n";
            resultado += "Erro: " + JSON.stringify(jsonResponse.error) + "\n";
            if (jsonResponse.error.includes("client-token")) {
              resultado += "\nClient-Token e obrigatorio! Configure-o.\n\n";
            } else {
              ui.alert(resultado);
              return;
            }
          } else {
            resultado += "STATUS: Resposta recebida mas formato desconhecido\n";
          }
        } catch (parseError) {
          if (responseCode2 === 200) {
            resultado += "STATUS: Codigo 200 - assumindo sucesso\n";
            ui.alert(resultado);
            return;
          }
        }
      } else if (responseCode2 === 400) {
        try {
          const jsonResponse = JSON.parse(responseText2);
          if (jsonResponse.error && jsonResponse.error.includes("client-token")) {
            resultado += "Erro: Client-Token e obrigatorio!\n";
            resultado += "Configure o WHATSAPP_CLIENT_TOKEN no codigo.\n\n";
          } else {
            resultado += "STATUS: ERRO HTTP " + responseCode2 + "\n";
            resultado += "Resposta: " + responseText2 + "\n";
            ui.alert(resultado);
            return;
          }
        } catch (e) {
          resultado += "STATUS: ERRO HTTP " + responseCode2 + "\n";
          resultado += "Resposta: " + responseText2 + "\n";
          ui.alert(resultado);
          return;
        }
      } else {
        resultado += "STATUS: ERRO HTTP " + responseCode2 + "\n";
        resultado += "Resposta: " + responseText2 + "\n";
      }
    } catch (e) {
      Logger.log("TESTE Z-API: Erro na tentativa sem header: " + e.toString());
      resultado += "Erro na tentativa sem header: " + e.toString() + "\n\n";
    }
    
    // TENTATIVA 3: Com token da instancia no header (fallback)
    Logger.log("TESTE Z-API: Tentativa 3 - Com token da instancia no header...");
    try {
      const optionsComTokenInstancia = {
        "method": "post",
        "contentType": "application/json",
        "headers": {
          "Client-Token": WHATSAPP_TOKEN
        },
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };
      
      Logger.log("TESTE Z-API: Token da instancia: " + WHATSAPP_TOKEN);
      
      const response3 = UrlFetchApp.fetch(WHATSAPP_API_URL, optionsComTokenInstancia);
      const responseCode3 = response3.getResponseCode();
      const responseText3 = response3.getContentText();
      
      Logger.log("TESTE Z-API: Codigo HTTP (token instancia): " + responseCode3);
      Logger.log("TESTE Z-API: Resposta (token instancia): " + responseText3);
      
      resultado += "Tentativa 3 (token instancia):\n";
      resultado += "- Codigo HTTP: " + responseCode3 + "\n";
      resultado += "- Resposta: " + responseText3.substring(0, 200) + "\n\n";
      
      if (responseCode3 >= 200 && responseCode3 < 300) {
        try {
          const jsonResponse = JSON.parse(responseText3);
          if (jsonResponse.success === true || jsonResponse.success === "true") {
            resultado += "STATUS: SUCESSO! Mensagem enviada.\n";
            resultado += "(Funcionou com token da instancia no header)\n";
            ui.alert(resultado + "\nVerifique os logs para mais detalhes.");
            return;
          } else if (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) {
            // API retornou IDs de mensagem = sucesso (mesmo sem campo success)
            resultado += "STATUS: SUCESSO! Mensagem enviada.\n";
            resultado += "(API retornou IDs de mensagem - sucesso confirmado)\n";
            resultado += "ID Mensagem: " + (jsonResponse.id || jsonResponse.messageld || jsonResponse.zaapld) + "\n";
            ui.alert(resultado + "\nVerifique os logs para mais detalhes.");
            return;
          } else {
            resultado += "STATUS: ERRO\n";
            resultado += "Erro: " + JSON.stringify(jsonResponse.error || jsonResponse) + "\n";
          }
        } catch (parseError) {
          if (responseCode3 === 200) {
            resultado += "STATUS: Codigo 200 - assumindo sucesso\n";
            ui.alert(resultado);
            return;
          }
        }
      } else {
        resultado += "STATUS: ERRO HTTP " + responseCode3 + "\n";
        resultado += "Resposta: " + responseText3 + "\n";
      }
    } catch (e) {
      Logger.log("TESTE Z-API: Erro na tentativa com token instancia: " + e.toString());
      resultado += "Erro na tentativa com token instancia: " + e.toString() + "\n";
    }
    
  } catch (e) {
    resultado += "ERRO ao testar conexao:\n";
    resultado += e.toString() + "\n";
    resultado += "Stack: " + (e.stack || "N/A") + "\n";
    Logger.log("TESTE Z-API: Erro: " + e.toString());
  }
  
  resultado += "\n=== VERIFICACOES ===\n";
  resultado += "1. Verifique se a instancia Z-API esta ativa\n";
  resultado += "2. Confirme se o token esta correto\n";
  resultado += "3. Verifique se o numero esta cadastrado na instancia\n";
  resultado += "4. IMPORTANTE: Se o erro for 'client-token not configured':\n";
  resultado += "   - Va no PAINEL PRINCIPAL da Z-API\n";
  resultado += "   - Va na aba 'Seguranca'\n";
  resultado += "   - Copie o 'Token de Seguranca da Conta'\n";
  resultado += "   - Cole na constante WHATSAPP_CLIENT_TOKEN\n";
  resultado += "   - Salve o codigo\n";
  resultado += "5. Confira os logs completos em Executar > Ver logs";
  
  Logger.log(resultado);
  ui.alert(resultado);
}

function GUIA_CONFIGURAR_CLIENT_TOKEN() {
  const ui = SpreadsheetApp.getUi();
  
  let guia = "=== GUIA: CONFIGURAR CLIENT-TOKEN Z-API ===\n\n";
  guia += "STATUS ATUAL:\n";
  guia += "Client-Token: " + (WHATSAPP_CLIENT_TOKEN && WHATSAPP_CLIENT_TOKEN.trim() !== "" ? "CONFIGURADO (" + WHATSAPP_CLIENT_TOKEN.substring(0, 5) + "***)" : "NAO CONFIGURADO") + "\n\n";
  
  if (!WHATSAPP_CLIENT_TOKEN || WHATSAPP_CLIENT_TOKEN.trim() === "") {
    guia += "COMO CONFIGURAR:\n\n";
    guia += "1. COPIE O TOKEN DA ABA SEGURANCA:\n";
    guia += "   - Va em Z-API > Seguranca\n";
    guia += "   - Copie o token completo (ex: F0a...)\n\n";
    guia += "2. ATUALIZE O CODIGO:\n";
    guia += "   - Abra o arquivo SentinelaAI.gs\n";
    guia += "   - Procure por: WHATSAPP_CLIENT_TOKEN\n";
    guia += "   - Cole o token entre as aspas:\n";
    guia += "     const WHATSAPP_CLIENT_TOKEN = \"SEU_TOKEN_AQUI\";\n\n";
    guia += "3. SALVE E TESTE:\n";
    guia += "   - Salve o codigo (Ctrl+S)\n";
    guia += "   - Use: TESTAR CONEXAO Z-API\n\n";
  } else {
    guia += "Client-Token ja esta configurado!\n";
    guia += "Se ainda nao funciona, verifique:\n";
    guia += "1. Se o token esta correto\n";
    guia += "2. Se o token esta ativado na Z-API\n";
    guia += "3. Os logs para mais detalhes\n\n";
  }
  
  guia += "IMPORTANTE:\n";
  guia += "- Client-Token e DIFERENTE do Token da Instancia\n";
  guia += "- E um token de SEGURANCA DA CONTA\n";
  guia += "- Deve estar na aba Seguranca do painel\n\n";
  guia += "LOCALIZACAO NO CODIGO:\n";
  guia += "Linha ~33: const WHATSAPP_CLIENT_TOKEN = \"F70dc...\";";
  
  ui.alert(guia);
}

function VER_ULTIMOS_LOGS_WHATSAPP() {
  const ui = SpreadsheetApp.getUi();
  
  let mensagem = "=== ULTIMOS LOGS WHATSAPP ===\n\n";
  
  // Status do Client-Token
  if (WHATSAPP_CLIENT_TOKEN && WHATSAPP_CLIENT_TOKEN.trim() !== "") {
    mensagem += "STATUS: Client-Token CONFIGURADO\n";
    mensagem += "Token: " + WHATSAPP_CLIENT_TOKEN.substring(0, 5) + "***\n\n";
  } else {
    mensagem += "STATUS: Client-Token NAO CONFIGURADO\n\n";
  }
  
  mensagem += "COMO VER OS LOGS:\n";
  mensagem += "1. Vá em: Executar > Ver logs de execucao\n";
  mensagem += "2. Procure por linhas que comecam com:\n";
  mensagem += "   - 'WhatsApp:'\n";
  mensagem += "   - 'TESTE Z-API:'\n\n";
  
  mensagem += "O QUE PROCURAR NOS LOGS:\n";
  mensagem += "1. Codigo HTTP (200 = sucesso, 400/401/403 = erro)\n";
  mensagem += "2. Resposta da API (JSON com 'success' ou 'error')\n";
  mensagem += "3. Qual tentativa funcionou (Client-Token, sem header, etc)\n\n";
  
  mensagem += "ERROS COMUNS:\n";
  mensagem += "- 'client-token is not configured'\n";
  mensagem += "  Solucao: Token ja configurado, verifique se esta ativo na Z-API\n\n";
  mensagem += "- 'instance not connected'\n";
  mensagem += "  Solucao: Conecte a instancia Z-API\n\n";
  mensagem += "- 'number not registered'\n";
  mensagem += "  Solucao: Cadastre o numero na instancia Z-API\n\n";
  
  mensagem += "TESTE AGORA:\n";
  mensagem += "Use: TESTAR CONEXAO Z-API\n";
  mensagem += "Isso mostrara detalhes de cada tentativa.";
  
  ui.alert(mensagem);
}

function VERIFICAR_CONFIGURACAO() {
  const ui = SpreadsheetApp.getUi();
  let mensagem = "=== VERIFICACAO DO SISTEMA ===\n\n";
  
  // Verifica constantes
  mensagem += "Constantes:\n";
  mensagem += "- NOME_SISTEMA: " + (NOME_SISTEMA || "UNDEFINED") + "\n";
  mensagem += "- NOME_DA_PLANILHA: " + (NOME_DA_PLANILHA || "UNDEFINED") + "\n";
  mensagem += "- NOME_ABA_GESTORES: " + (NOME_ABA_GESTORES || "UNDEFINED") + "\n\n";
  
  // Verifica configuracoes Z-API
  mensagem += "Configuracao Z-API:\n";
  mensagem += "- URL: " + WHATSAPP_API_URL + "\n";
  mensagem += "- Token: " + WHATSAPP_TOKEN + "\n\n";
  
  // Verifica sheets
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    mensagem += "Sheets disponiveis (" + sheets.length + "):\n";
    sheets.forEach((sheet, index) => {
      mensagem += (index + 1) + ". " + sheet.getName() + "\n";
    });
    mensagem += "\n";
    
    // Verifica se as sheets necessarias existem
    const sheetNotificacoes = ss.getSheetByName(NOME_DA_PLANILHA);
    const sheetGestores = ss.getSheetByName(NOME_ABA_GESTORES);
    
    mensagem += "Status das Sheets:\n";
    mensagem += "- '" + NOME_DA_PLANILHA + "': " + (sheetNotificacoes ? "OK" : "NAO ENCONTRADA") + "\n";
    mensagem += "- '" + NOME_ABA_GESTORES + "': " + (sheetGestores ? "OK" : "NAO ENCONTRADA") + "\n";
    
  } catch (e) {
    mensagem += "ERRO ao verificar sheets: " + e.toString() + "\n";
  }
  
  Logger.log(mensagem);
  ui.alert(mensagem);
}

function onOpen() {
  // Verifica se as constantes estao definidas antes de criar o menu
  try {
    if (!NOME_SISTEMA || !NOME_DA_PLANILHA || !NOME_ABA_GESTORES) {
      Logger.log("ERRO: Constantes nao definidas corretamente!");
      SpreadsheetApp.getUi().alert("ERRO: Configuracao incompleta. Verifique o codigo.");
      return;
    }
    
    SpreadsheetApp.getUi().createMenu(NOME_SISTEMA)
      .addItem('CADASTRAR GESTOR (Pop-up)', 'ABRIR_CADASTRO_GESTOR')
      .addItem('SELECIONAR GESTOR MANUALMENTE', 'SELECIONAR_GESTOR_MANUALMENTE')
      .addSeparator()
      .addItem('CLASSIFICAR COM IA (Linha Selecionada)', 'CLASSIFICAR_MANUALMENTE')
      .addSeparator()
      .addItem('FILTRAR VENCIDAS', 'FILTRAR_SOMENTE_VENCIDAS')
      .addItem('MOSTRAR TUDO', 'MOSTRAR_TUDO')
      .addSeparator()
      .addItem('FORMATAR VISUAL COMPLETO', 'APLICAR_FORMATACAO_VISUAL_COMPLETA')
      .addSeparator()
      .addItem('ENVIAR NOTIFICACAO (Gestor Setor)', 'ENVIAR_NOTIFICACAO_INICIAL') 
      .addItem('REENVIAR ALERTA RISCO (Admin)', 'ENVIAR_ALERTA_RISCO_MANUAL') 
      .addItem('COBRANCA GESTOR', 'ENVIAR_COBRANCA_SELECIONADA')
      .addItem('COBRANCA DIRETORIA', 'ENVIAR_COBRANCA_ALTA_GESTAO')
      .addSeparator()
      .addItem('TESTAR WHATSAPP (Linha Selecionada)', 'TESTAR_WHATSAPP')
      .addItem('TESTAR CONEXAO Z-API', 'TESTAR_CONEXAO_ZAPI')
      .addSeparator()
      .addItem('GUIA: CONFIGURAR CLIENT-TOKEN', 'GUIA_CONFIGURAR_CLIENT_TOKEN')
      .addItem('VER ULTIMOS LOGS WHATSAPP', 'VER_ULTIMOS_LOGS_WHATSAPP')
      .addSeparator()
      .addItem('VERIFICAR CONFIGURACAO', 'VERIFICAR_CONFIGURACAO')
      .addToUi();
  } catch (e) {
    Logger.log("Erro ao criar menu: " + e.toString());
    Logger.log("Stack: " + (e.stack || "N/A"));
  }
}

// ===================================================================================
// 5. WEB APP & FORMULARIO
// ===================================================================================

function doGet(e) {
  let page = e.parameter.page;
  
  if (page === 'tratativa') {
    return HtmlService.createTemplateFromFile('tratativa_template')
      .evaluate()
      .setTitle('Sentinela AI - Tratativa')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  if (page === 'dashboard') {
    return HtmlService.createTemplateFromFile('dashboard_template')
      .evaluate()
      .setTitle('Sentinela AI - Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  return HtmlService.createTemplateFromFile('form_template')
    .evaluate()
    .setTitle('Sentinela AI - Notificação')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getDashboardData() {
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  const data = sheet.getDataRange().getValues();
  const result = [];
  
  // Pula cabeçalho
  for (let i = 1; i < data.length; i++) {
    result.push({
      id: data[i][COLUNAS.ID - 1],
      data: data[i][COLUNAS.DATA_EVENTO - 1],
      setor: data[i][COLUNAS.SETOR - 1],
      tipo: data[i][COLUNAS.TIPO_NOTIFICACAO - 1],
      classif: data[i][COLUNAS.CLASSIFICACAO_EVENTO - 1],
      status: data[i][COLUNAS.STATUS_TRATATIVA - 1]
    });
  }
  return result;
}

function processarFormulario(formObject) {
  try {
    const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
    if (!sheet) throw new Error("Planilha não encontrada");
    
    const lastRow = sheet.getLastRow();
    const newId = lastRow; 
    
    const rowData = [];
    for(let i=0; i<30; i++) rowData.push("");
    
    rowData[COLUNAS.ID - 1] = newId;
    rowData[COLUNAS.CARIMBO - 1] = new Date();
    rowData[COLUNAS.PACIENTE - 1] = formObject.paciente;
    rowData[COLUNAS.NOME_MAE - 1] = formObject.nome_mae;
    rowData[COLUNAS.DATA_NASCIMENTO - 1] = formObject.nascimento ? new Date(formObject.nascimento) : "";
    rowData[COLUNAS.SEXO - 1] = formObject.sexo;
    rowData[COLUNAS.SETOR - 1] = formObject.setor; 
    rowData[COLUNAS.DESCRICAO - 1] = formObject.descricao;
    rowData[COLUNAS.DATA_EVENTO - 1] = formObject.data_evento ? new Date(formObject.data_evento) : "";
    rowData[COLUNAS.PERIODO - 1] = formObject.periodo;
    rowData[COLUNAS.DATA_INTERNACAO - 1] = formObject.data_internacao ? new Date(formObject.data_internacao) : "";
    rowData[COLUNAS.STATUS_TRATATIVA - 1] = "PENDENTE";
    
    if (rowData[COLUNAS.DATA_NASCIMENTO - 1]) {
      rowData[COLUNAS.IDADE - 1] = calcularIdadeExata(rowData[COLUNAS.DATA_NASCIMENTO - 1]);
    }
    
    sheet.appendRow(rowData);
    const novaLinha = sheet.getLastRow();
    
    const ia = classificarEventoComIA(formObject.descricao);
    if (ia && !ia.erro) {
      sheet.getRange(novaLinha, COLUNAS.TIPO_NOTIFICACAO).setValue(ia.tipo_notificacao || "N/A");
      sheet.getRange(novaLinha, COLUNAS.TIPO_EVENTO).setValue(ia.tipo_evento || "N/A");
      sheet.getRange(novaLinha, COLUNAS.CLASSIFICACAO_EVENTO).setValue(ia.classificacao || "NA");
      sheet.getRange(novaLinha, COLUNAS.RECOMENDACOES_QUALIDADE).setValue(ia.recomendacao_blackbelt || "");
      
      calcularPrazoAutomatico(sheet, novaLinha, ia.classificacao);
    }
    
    const setorParaBuscar = formObject.setor_notificado || formObject.setor;
    const gestor = buscarDadosGestor(setorParaBuscar);
    
    if (gestor && gestor.email) {
      sheet.getRange(novaLinha, COLUNAS.EMAIL_CONTATO).setValue(gestor.email);
      ENVIAR_NOTIFICACAO_INICIAL_AUTO(novaLinha);
    } else {
      sheet.getRange(novaLinha, COLUNAS.EMAIL_CONTATO).setValue("GESTOR NAO ENCONTRADO");
    }
    
    return { success: true, id: newId };
    
  } catch (e) {
    Logger.log("Erro ao processar formulario: " + e.toString());
    return { success: false, error: e.toString() };
  }
}

function getTratativaData(id) {
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      return {
        found: true,
        paciente: data[i][COLUNAS.PACIENTE - 1],
        descricao: data[i][COLUNAS.DESCRICAO - 1],
        recomendacao: data[i][COLUNAS.RECOMENDACOES_QUALIDADE - 1],
        causa: data[i][COLUNAS.ANALIZE_CAUSA - 1] || "", 
        plano: data[i][COLUNAS.PLANO_ACAO - 1] || ""
      };
    }
  }
  return { found: false };
}

function salvarTratativa(id, causa, plano) {
  const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      const linha = i + 1;
      const colCausa = COLUNAS.ANALISE_CAUSA || 26; 
      const colPlano = COLUNAS.PLANO_ACAO || 27;
      const colStatus = COLUNAS.STATUS_TRATATIVA;
      
      sheet.getRange(linha, colCausa).setValue(causa);
      sheet.getRange(linha, colPlano).setValue(plano);
      sheet.getRange(linha, colStatus).setValue("CONCLUIDO");
      sheet.getRange(linha, COLUNAS.DATA_FECHAMENTO || 28).setValue(new Date());
      
      gerarPDF(id, linha);
      
      return { success: true };
    }
  }
  return { success: false, error: "ID não encontrado" };
}

function gerarPDF(id, linha) {
  try {
    const sheet = obterSheetSeguro(NOME_DA_PLANILHA);
    const dados = obterLinhaCompleta(sheet, linha);
    
    const htmlTemplate = HtmlService.createTemplate(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="color: #003366; margin: 0;">RELATÓRIO DE TRATATIVA</h1>
          <p style="color: #666; margin: 5px 0;">ID: <?= id ?></p>
        </div>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #2E7D32; border-bottom: 1px solid #ddd; padding-bottom: 5px;">DADOS DO EVENTO</h3>
          <p><strong>Paciente:</strong> <?= dados.PACIENTE ?></p>
          <p><strong>Data Evento:</strong> <?= formatarData(dados.DATA_EVENTO) ?></p>
          <p><strong>Setor:</strong> <?= dados.SETOR ?></p>
          <p><strong>Tipo:</strong> <?= dados.TIPO_NOTIFICACAO ?></p>
          <p><strong>Descrição:</strong><br><?= dados.DESCRICAO ?></p>
        </div>
        
        <div style="background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <h3 style="color: #003366; border-bottom: 1px solid #ddd; padding-bottom: 5px;">PLANO DE AÇÃO</h3>
          <p><strong>Análise de Causa:</strong><br><?= dados.ANALISE_CAUSA || sheet.getRange(linha, COLUNAS.ANALISE_CAUSA || 26).getValue() ?></p>
          <p><strong>Ação Corretiva:</strong><br><?= dados.PLANO_ACAO || sheet.getRange(linha, COLUNAS.PLANO_ACAO || 27).getValue() ?></p>
          <p><strong>Status:</strong> CONCLUÍDO</p>
          <p><strong>Data Fechamento:</strong> <?= formatarData(new Date()) ?></p>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          Gerado automaticamente por Sentinela AI
        </div>
      </div>
    `);
    
    htmlTemplate.id = id;
    htmlTemplate.dados = dados;
    htmlTemplate.sheet = sheet;
    htmlTemplate.linha = linha;
    htmlTemplate.COLUNAS = COLUNAS;
    htmlTemplate.formatarData = formatarData;
    
    const htmlContent = htmlTemplate.evaluate().getContent();
    const blob = Utilities.newBlob(htmlContent, MimeType.HTML).getAs(MimeType.PDF).setName("Tratativa_" + id + ".pdf");
    
    MailApp.sendEmail({
      to: EMAIL_GESTOR_RISCO,
      subject: "[SENTINELA AI] Tratativa Concluída - ID " + id,
      body: "Segue em anexo o relatório de tratativa do evento ID " + id + ".",
      attachments: [blob]
    });
    
    return true;
  } catch (e) {
    Logger.log("Erro ao gerar PDF: " + e.toString());
    return false;
  }
}
