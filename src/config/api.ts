/**
 * Configuração da API do Backend - ENDPOINTS REAIS EXISTENTES
 *
 * BACKEND: AdonisJS rodando na porta 3333
 * FRONTEND: Next.js rodando na porta 3000
 */

export const API_CONFIG = {
  BASE_URL: 'http://localhost:3333/api',
  ENDPOINTS: {
    // ENDPOINTS REAIS QUE JÁ EXISTEM NO BACKEND:

    // Obter vistoria por token (GET)
    GET_VISTORIA: '/vistoria', // Usar como: GET /api/vistoria/:token

    // Atualizar item da vistoria (PUT)
    UPDATE_ITEM: '/vistoria/item', // Usar como: PUT /api/vistoria/item/:id

    // Concluir vistoria (POST)
    CONCLUDE_VISTORIA: '/vistoria', // Usar como: POST /api/vistoria/:id/concluir

    // Adicionar despesa (POST)
    ADD_DESPESA: '/vistoria', // Usar como: POST /api/vistoria/:id/adicionar-despesa

    // Obter despesas (GET)
    GET_DESPESAS: '/estoque-remessa', // Usar como: GET /api/estoque-remessa/:id/despesas

    // Health check (se existir)
    HEALTH: '/health',
  },
} as const;

/**
 * DOCUMENTAÇÃO DOS ENDPOINTS REAIS DO BACKEND:
 *
 * 1. GET /api/vistoria/:token
 * ================================
 * Obter dados completos da vistoria pelo token
 *
 * MIDDLEWARE: validarTokenVistoria
 * CONTROLLER: EstoqueRemessaController.obterVistoriaPorToken
 * SERVICE: EstoqueRemessaVistoria.obterVistoriaPorToken
 *
 * SUCCESS RESPONSE (200):
 * {
 *   "type": true,
 *   "vistoria": {
 *     "id": 123,
 *     "status": "EM_VISTORIA",
 *     "endereco": "Rua das Flores, 123 - Centro - São Paulo, SP",
 *     "data_agendada": "2025-01-23T10:00:00.000Z",
 *     "tipo_vistoria": "Instalação",
 *     "equipamento": {
 *       "id": 456,
 *       "nome": "Sistema de Proteção ABPAC",
 *       "placa": "ABC-1234",
 *       "modelo": "Honda Civic",
 *       "marca": "Honda"
 *     },
 *     "tecnico": {
 *       "id": 789,
 *       "nome": "João Silva"
 *     },
 *     "itens": [...],
 *     "despesas": [...],
 *     "historico": [...]
 *   }
 * }
 *
 * ERROR RESPONSE:
 * {
 *   "code": "TOKEN_INVALID|TOKEN_EXPIRED|NOT_FOUND",
 *   "message": "Descrição do erro",
 *   "name": "EstoqueRemessaError"
 * }
 *
 *
 * 2. PUT /api/vistoria/item/:id
 * =============================
 * Atualizar item específico da vistoria
 *
 * MIDDLEWARE: validarTokenVistoria + validarTokenWrite
 * VALIDATOR: EstoqueRemessa/AtualizarItemVistoria
 *
 *
 * 3. POST /api/vistoria/:id/concluir
 * ==================================
 * Concluir vistoria completa
 *
 * MIDDLEWARE: validarTokenVistoria + validarTokenConclude
 * VALIDATOR: EstoqueRemessa/ConcluirVistoria
 *
 *
 * 4. POST /api/vistoria/:id/adicionar-despesa
 * ===========================================
 * Adicionar despesa à vistoria
 *
 * MIDDLEWARE: validarTokenVistoria + validarTokenWrite
 * VALIDATOR: EstoqueRemessa/AdicionarDespesa
 * 
 * 
 * 5. GET /api/estoque-remessa/:id/despesas
 * =======================================
 * Obter despesas de uma vistoria
 * 
 * MIDDLEWARE: auth
 * CONTROLLER: EstoqueRemessaController.obterDespesasVistoria
 */

/**
 * TABELAS DO BANCO DE DADOS RELACIONADAS:
 *
 * - estoque_remessa (dados principais da vistoria)
 *   - id, token_vistoria, endereco, data_agendada, tipo_vistoria
 *   - equipamento_id, tecnico_id, status, observacoes
 *
 * - equipamentos (dados do equipamento/veículo)
 *   - id, nome, placa, modelo, marca, cor
 *
 * - pessoas (dados do técnico)
 *   - id, nome, email, tipo: 'TECNICO'
 *
 * - estoque_remessa_itens (itens da vistoria)
 *   - id, estoque_remessa_id, status_item, observacoes
 *
 * - estoque_remessa_despesas (despesas da vistoria)
 *   - id, estoque_remessa_id, valor, descricao, tipo
 */

export const API_ERRORS = {
  // Erros retornados pelo backend
  TOKEN_INVALID: 'Token inválido ou vistoria não encontrada',
  TOKEN_EXPIRED: 'Token de vistoria expirado',
  TOKEN_REQUIRED: 'Token de vistoria não informado',
  VISTORIA_UNAVAILABLE: 'Vistoria não está mais disponível para edição',
  EDIT_NOT_ALLOWED: 'Vistoria não pode ser editada no status atual',
  CONCLUDE_NOT_ALLOWED: 'Vistoria não pode ser concluída no status atual',
  ITEMS_PENDING: 'Existem itens que ainda não foram executados',
  CONTEXT_MISSING: 'Contexto de vistoria não encontrado',
  NOT_FOUND: 'Vistoria não encontrada',
  VALIDATION_ERROR: 'Erro de validação dos dados',
  INTERNAL_ERROR: 'Erro interno do servidor',

  // Erros de conectividade (frontend)
  CONNECTION_FAILED: 'Não foi possível conectar ao servidor',
} as const;

export type ApiError = keyof typeof API_ERRORS;

/**
 * Helper para construir URLs dos endpoints
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }

  return url;
};

/**
 * Exemplos de uso:
 *
 * buildApiUrl('/vistoria/:token', { token: 'ABC123' })
 * // Retorna: 'http://localhost:3333/api/vistoria/ABC123'
 *
 * buildApiUrl('/vistoria/item/:id', { id: 456 })
 * // Retorna: 'http://localhost:3333/api/vistoria/item/456'
 */
