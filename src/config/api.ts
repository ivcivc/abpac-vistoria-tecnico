/**
 * Configuração da API do Backend - ENDPOINTS REAIS EXISTENTES
 *
 * BACKEND: AdonisJS rodando na porta 3333
 * FRONTEND: Next.js rodando na porta 3000
 */

// Determinar a URL base da API com base no ambiente
const getApiBaseUrl = () => {
  // Verificar se estamos no navegador
  if (typeof window !== 'undefined') {
    // Em produção (hostname diferente de localhost)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://api.abpac.com.br/api';
    }
    
    // Em desenvolvimento - detectar se frontend está em HTTPS/HTTP
    // Backend sempre roda em HTTP na porta 3333
    const frontendProtocol = window.location.protocol;
    
    console.log(`🔗 Frontend rodando em: ${frontendProtocol}//${window.location.host}`);
    console.log(`🔗 Backend configurado para: http://localhost:3333/api`);
    
    // Backend sempre em HTTP na porta 3333 para desenvolvimento
    return 'http://localhost:3333/api';
  }
  
  // Fallback para SSR
  return 'http://localhost:3333/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
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

    // Timeline de status (GET) - Task 20
    TIMELINE_STATUS: '/estoque-remessa', // Usar como: GET /api/estoque-remessa/:id/timeline-status

    // Aprovar vistoria (POST) - Task 20
    APPROVE_VISTORIA: '/estoque-remessa', // Usar como: POST /api/estoque-remessa/:id/aprovar

    // Solicitar correção (POST) - Task 20
    REQUEST_CORRECTION: '/estoque-remessa', // Usar como: POST /api/estoque-remessa/:id/solicitar-correcao

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
 * REQUEST:
 * {
 *   "observacoes_gerais": "Texto com observações gerais sobre a vistoria (opcional, max 1000 chars)",
 *   "confirmacao_completa": true
 * }
 * 
 * SUCCESS RESPONSE (200):
 * {
 *   "type": true,
 *   "message": "Vistoria concluída com sucesso",
 *   "data": {
 *     "id": 123,
 *     "status": "AGUARDANDO_APROVACAO",
 *     "data_vistoria_concluida": "2023-07-26T15:30:00.000Z",
 *     ...
 *   }
 * }
 * 
 * ERROR RESPONSE (422):
 * {
 *   "type": false,
 *   "code": "VALIDATION_ERROR",
 *   "message": "Existem 2 item(s) pendente(s) de conclusão",
 *   "details": {
 *     "itens_pendentes": [
 *       { "id": 456, "status": "PENDENTE", "descricao": "Item #456" },
 *       { "id": 789, "status": "EM_EXECUCAO", "descricao": "Item #789" }
 *     ]
 *   }
 * }
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
 *
 *
 * 6. GET /api/estoque-remessa/:id/timeline-status
 * ===============================================
 * Obter timeline de status de uma vistoria
 * 
 * MIDDLEWARE: auth
 * CONTROLLER: EstoqueRemessaController.timelineStatus
 * 
 * SUCCESS RESPONSE (200):
 * {
 *   "type": true,
 *   "timeline": [
 *     {
 *       "id": 123,
 *       "status": "Vistoria iniciada",
 *       "tipo_acao": "INICIO_VISTORIA",
 *       "data": "2023-07-25T10:00:00.000Z",
 *       "data_registro": "2023-07-25T10:00:00.000Z",
 *       "usuario": "João Silva",
 *       "tecnico_id": 789,
 *       "tecnico_email": "joao@example.com",
 *       "icone": "plus-circle"
 *     },
 *     {
 *       "id": 124,
 *       "status": "Vistoria concluída e enviada para aprovação",
 *       "tipo_acao": "CONCLUSAO_VISTORIA",
 *       "data": "2023-07-26T15:30:00.000Z",
 *       "data_registro": "2023-07-26T15:30:00.000Z",
 *       "usuario": "João Silva",
 *       "tecnico_id": 789,
 *       "tecnico_email": "joao@example.com",
 *       "icone": "check-all"
 *     }
 *   ]
 * }
 *
 * 
 * 7. POST /api/estoque-remessa/:id/aprovar
 * =======================================
 * Aprovar uma vistoria
 * 
 * MIDDLEWARE: auth + podeAprovar
 * VALIDATOR: EstoqueRemessa/AprovarVistoria
 * CONTROLLER: EstoqueRemessaController.aprovarVistoria
 * 
 * REQUEST:
 * {
 *   "observacoes": "Observações sobre a aprovação (opcional)"
 * }
 * 
 * SUCCESS RESPONSE (200):
 * {
 *   "type": true,
 *   "data": {
 *     "id": 123,
 *     "status": "FINALIZADA",
 *     "data_aprovacao": "2023-07-27T10:00:00.000Z"
 *   }
 * }
 * 
 * 
 * 8. POST /api/estoque-remessa/:id/solicitar-correcao
 * =================================================
 * Solicitar correção de itens específicos
 * 
 * MIDDLEWARE: auth + podeAprovar
 * VALIDATOR: EstoqueRemessa/SolicitarCorrecao
 * CONTROLLER: EstoqueRemessaController.solicitarCorrecaoItens
 * 
 * REQUEST:
 * {
 *   "itens_correcao": [
 *     {
 *       "item_id": 456,
 *       "motivo": "Foto com baixa qualidade",
 *       "observacoes": "Por favor, enviar foto com melhor iluminação"
 *     },
 *     {
 *       "item_id": 789,
 *       "motivo": "Informação incompleta",
 *       "observacoes": "Faltou informar o número de série do equipamento"
 *     }
 *   ]
 * }
 * 
 * SUCCESS RESPONSE (200):
 * {
 *   "type": true,
 *   "data": {
 *     "id": 123,
 *     "status": "REQUER_CORRECAO",
 *     "data_solicitacao_correcao": "2023-07-27T11:30:00.000Z",
 *     "itens_correcao": [...]
 *   }
 * }
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
 *
 * - estoque_remessa_log (histórico de ações)
 *   - id, estoque_remessa_id, tipo_acao, descricao, data_registro
 *   - tecnico_id, dados_adicionais
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
  UNAUTHORIZED: 'Não autorizado a realizar esta ação',
  FORBIDDEN: 'Permissão negada para esta ação',

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
