/**
 * Serviço para integração com a API do Backend - Sistema de Vistorias ABPAC
 * 
 * Este serviço implementa as chamadas HTTP para o backend AdonisJS
 * rodando na porta 3333, seguindo a documentação dos endpoints reais.
 */

import { API_CONFIG, buildApiUrl } from '@/config/api';
import { VistoriaItem } from '@/types/storage';

interface ApiResponse<T = any> {
  type: boolean;
  data?: T;
  message?: string;
  code?: string;
  details?: any;
}

interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Dados esperados pelo backend para atualização de item da vistoria
 * Baseado no validator EstoqueRemessa/AtualizarItemVistoria
 */
interface UpdateItemRequest {
  id?: string; // ID do item para identificação no backend
  status: 'pendente' | 'concluido' | 'problema';
  acao: 'verificar' | 'instalar' | 'substituir' | 'remover';
  numeroSerieNovo?: string; // Para substituições
  observacoes: string;
  localInstalacao?: string;
  concluido: boolean;
  dataConclusao?: string; // ISO string
}

export class ApiVistoriaService {

  /**
   * Atualiza um item específico da vistoria no backend
   * 
   * Endpoint: PUT /api/vistoria/item/:id
   * Middleware: validarTokenVistoria + validarTokenWrite
   * Validator: EstoqueRemessa/AtualizarItemVistoria
   * 
   * Regras de validação:
   * 1. O item não pode ter status CANCELADO
   * 2. O status é normalizado para minúsculas antes do envio
   * 3. Apenas status válidos são aceitos: pendente, concluido, problema
   * 
   * @see /docs/REGRAS-VALIDACAO.md para documentação completa
   * 
   * @param itemId ID do item a ser atualizado
   * @param itemData Dados atualizados do item
   * @param token Token da vistoria para autenticação
   */
  async atualizarItem(
    itemId: string, 
    itemData: VistoriaItem, 
    token: string
  ): Promise<ServiceResult> {
    try {
      console.log(`🔄 [API-SERVICE] Enviando atualização do item ${itemId} para o backend...`);

      // Verificar se o ID do item é válido
      if (!itemId) {
        console.error('❌ [API-SERVICE] ID do item não fornecido ou inválido');
        return {
          success: false,
          error: 'ID do item não fornecido ou inválido',
          statusCode: 400,
        };
      }

      // Verificar se item não está cancelado (qualquer formato)
      // Verificar se status existe antes de converter para maiúsculas
      const statusUpperCase = itemData.status ? itemData.status.toUpperCase() : '';
      const itemCancelado = statusUpperCase === 'CANCELADO';
      if (itemCancelado) {
        return {
          success: false,
          error: 'Item cancelado não pode ser atualizado',
          statusCode: 400,
        };
      }

      // Construir URL do endpoint PUT
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_ITEM + `/${itemId}`);

      // Mapear dados do modelo local para formato da API
      // Normalizar status para minúsculas (formato esperado pelo backend)
      const normalizeStatus = (status: string | undefined): 'pendente' | 'concluido' | 'problema' => {
        // Verificar se status existe
        if (!status) {
          console.warn('⚠️ [API-SERVICE] Status indefinido, usando default "pendente"');
          return 'pendente';
        }
        
        try {
          const normalized = status.toLowerCase();
          if (['pendente', 'concluido', 'problema'].includes(normalized)) {
            return normalized as 'pendente' | 'concluido' | 'problema';
          }
          
          // Log para depuração
          console.warn(`⚠️ [API-SERVICE] Status inválido "${status}", usando default "pendente"`);
          return 'pendente';
        } catch (error) {
          console.error('❌ [API-SERVICE] Erro ao normalizar status:', error, 'status recebido:', status);
          return 'pendente';
        }
      };

      // Verificar e normalizar os campos antes de montar o payload
      const status = normalizeStatus(itemData.status);
      const acao = itemData.acao || 'verificar'; // Valor padrão seguro
      const observacoes = itemData.observacoes || '';
      const concluido = typeof itemData.concluido === 'boolean' ? itemData.concluido : false;
      
      // Log detalhado para depuração
      console.log('🔍 [API-SERVICE] Dados do item antes da normalização:', {
        id: itemId,
        estoque_remessa_id: (itemData as any).estoque_remessa_id,
        status: itemData.status,
        acao: itemData.acao,
        numeroSerieNovo: itemData.numeroSerieNovo,
        observacoes: itemData.observacoes,
        localInstalacao: itemData.localInstalacao,
        concluido: itemData.concluido,
        dataConclusao: itemData.dataConclusao
      });
      
      // Garantir que o ID do item seja incluído no payload
      const requestData: UpdateItemRequest = {
        id: itemId, // Adicionar ID explicitamente no payload
        status,
        acao,
        numeroSerieNovo: itemData.numeroSerieNovo,
        observacoes,
        localInstalacao: itemData.localInstalacao,
        concluido,
        dataConclusao: itemData.dataConclusao?.toISOString(),
      };

      console.log(`🔄 [API-SERVICE] URL: ${url}`);
      console.log(`🔄 [API-SERVICE] Dados enviados:`, requestData);

      // Verificar se a URL e o token são válidos antes de fazer a requisição
      if (!url || url.includes('undefined')) {
        console.error('❌ [API-SERVICE] URL inválida:', url);
        return {
          success: false,
          error: 'URL inválida para atualização do item',
          statusCode: 400,
        };
      }
      
      if (!this.isValidToken(token)) {
        console.error('❌ [API-SERVICE] Token inválido:', token?.substring(0, 5) + '...');
        return {
          success: false,
          error: 'Token de autenticação inválido ou expirado',
          statusCode: 401,
        };
      }
      
      // Tentar fazer a requisição com timeout para evitar bloqueio
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            // Header específico para validação de token de vistoria
            'X-Vistoria-Token': token,
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Processar a resposta
        const responseData: ApiResponse = await response.json();

        if (response.ok && responseData.type) {
          console.log(`✅ [API-SERVICE] Item ${itemId} atualizado com sucesso no backend`);
          return {
            success: true,
            data: responseData.data,
            statusCode: response.status,
          };
        } else {
          // Tratar diferentes tipos de erro
          const errorMessage = this.extractErrorMessage(responseData, response.status);
          console.error(`❌ [API-SERVICE] Erro ao atualizar item ${itemId}:`, errorMessage);
          
          return {
            success: false,
            error: errorMessage,
            statusCode: response.status,
          };
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('❌ [API-SERVICE] Timeout na requisição para o backend');
          return {
            success: false,
            error: 'Tempo limite excedido na comunicação com o servidor',
            statusCode: 408, // Request Timeout
          };
        }
        throw fetchError; // Re-throw para ser capturado pelo catch externo
      }

    } catch (error: any) {
      console.error(`❌ [API-SERVICE] Erro de rede ao atualizar item ${itemId}:`, error);
      
      return {
        success: false,
        error: this.handleNetworkError(error),
        statusCode: 0, // Indica erro de rede
      };
    }
  }

  /**
   * Extrai mensagem de erro da resposta da API
   */
  private extractErrorMessage(responseData: ApiResponse, statusCode: number): string {
    // Se há uma mensagem específica na resposta
    if (responseData.message) {
      return responseData.message;
    }

    // Se há um código de erro específico
    if (responseData.code) {
      switch (responseData.code) {
        case 'TOKEN_INVALID':
          return 'Token de vistoria inválido';
        case 'TOKEN_EXPIRED':
          return 'Token de vistoria expirado';
        case 'VALIDATION_ERROR':
          return `Erro de validação: ${responseData.details?.message || 'Dados inválidos'}`;
        case 'NOT_FOUND':
          return 'Item não encontrado';
        case 'UNAUTHORIZED':
          return 'Não autorizado para atualizar este item';
        default:
          return `Erro no servidor: ${responseData.code}`;
      }
    }

    // Mensagens baseadas no status HTTP
    switch (statusCode) {
      case 400:
        return 'Dados inválidos enviados';
      case 401:
        return 'Token não autorizado';
      case 403:
        return 'Permissão negada';
      case 404:
        return 'Item não encontrado';
      case 422:
        return 'Erro de validação dos dados';
      case 500:
        return 'Erro interno do servidor';
      default:
        return `Erro HTTP ${statusCode}`;
    }
  }

  /**
   * Trata erros de rede/conexão
   */
  private handleNetworkError(error: any): string {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'Erro de conexão com o servidor. Verifique sua conexão com a internet.';
    }

    if (error instanceof Error) {
      return `Erro de rede: ${error.message}`;
    }

    return 'Erro desconhecido de rede';
  }

  /**
   * Valida se o token está no formato correto
   */
  private isValidToken(token: string): boolean {
    return typeof token === 'string' && token.length > 10;
  }

  /**
   * Valida se os dados do item estão completos
   */
  private validateItemData(itemData: VistoriaItem): { valid: boolean; error?: string } {
    if (!itemData.id) {
      return { valid: false, error: 'ID do item é obrigatório' };
    }

    // Aceitar múltiplos formatos de status
    const validStatuses = ['pendente', 'concluido', 'problema', 'PENDENTE', 'CONCLUIDO', 'PROBLEMA'];
    if (!itemData.status || !validStatuses.includes(itemData.status)) {
      return { valid: false, error: 'Status inválido' };
    }

    if (!itemData.acao || !['verificar', 'instalar', 'substituir', 'remover'].includes(itemData.acao)) {
      return { valid: false, error: 'Ação inválida' };
    }

    return { valid: true };
  }
} 