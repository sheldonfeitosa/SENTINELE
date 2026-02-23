/**
 * ===================================================================================
 * SENTINELA AI - VERSÃO 138.45 (CORREÇÃO DE SELEÇÃO MANUAL)
 * Fix: Botões de menu agora detectam corretamente a linha selecionada pelo usuário.
 * ===================================================================================
 */

// --- 1. CONFIGURAÇÕES ---
const ID_PLANILHA = "15pM1FjuEig49kOa_LXzb9KHYd0yXXWcd4MlIETHKv-k";

const EMAIL_GESTOR_RISCO = "sheldonfeitosa@gmail.com";
const EMAIL_DIRETORIA = "qualidadeinmceb@gmail.com";
const NOME_PRESIDENTE = "Zilmar Pereira";
const GEMINI_API_KEY = 'AIzaSyB38UE53y-BL3j3bjI-XAfto-D1eNLBLZQ';

const NOME_SISTEMA = "SENTINELA AI";
const NOME_DA_PLANILHA = "DATA";
const NOME_ABA_GESTORES = "GESTORES";
// Link genérico
const LINK_TRATATIVA_GENERICO = "https://script.google.com/macros/s/AKfycbz.../exec";

const COLUNAS = {
    ID: 1, CARIMBO: 2, PACIENTE: 3, NOME_MAE: 4, DATA_NASCIMENTO: 5, SEXO: 6,
    SETOR: 7, SETOR_NOTIFICADO: 8, DESCRICAO: 9, TIPO_NOTIFICACAO: 10,
    DATA_EVENTO: 11, PERIODO: 12, IDADE: 13, DATA_INTERNACAO: 14,
    TIPO_EVENTO: 15, CLASSIFICACAO_EVENTO: 16, PRAZO_TRATATIVA: 17,
    RECOMENDACOES_QUALIDADE: 18, STATUS_TRATATIVA: 19, EMAIL_CONTATO: 20,
    EMAIL_SECUNDARIO: 21, LOG_NOTIFICACAO: 22, LOG_COBRANCA: 23, LOG_ALTA_GESTAO: 24,
    STATUS_AGENDAMENTO: 25, ANALISE_CAUSA: 26, PLANO_ACAO: 27, DATA_FECHAMENTO: 28
};

const CORES_STATUS = { ROXO: '#B4A7D6', VERDE: '#93C47D', AMARELO: '#F1C232', VERMELHO: '#E06666' };

// ... (rest of the code is preserved in the file for reference)
