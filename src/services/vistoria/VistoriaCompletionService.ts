/**
 * Serviço para integração com o endpoint de conclusão de vistoria
 * Task 19 - Integração com endpoints reais de conclusão de vistoria
 */

import { VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { API_CONFIG, buildApiUrl } from '@/config/api';

export interface CompletionResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
}

export class VistoriaCompletionService {
  /**
   * Conclui uma vistoria no backend
   * @param vistoriaId ID da vistoria
   * @param observacoes Observações gerais da vistoria
   * @param token Token de autenticação
   */
  static async concluirVistoria(
    vistoriaId: string | number,
    observacoes: string,
    token: string
  ): Promise<CompletionResponse> {
    try {
      console.log('🔄 VistoriaCompletionService: Concluindo vistoria no backend', {
        vistoriaId,
        observacoes: observacoes?.substring(0, 20) + '...'
      });

      // Verificar token
      if (!token || token.trim() === '') {
        console.warn('⚠️ VistoriaCompletionService: Token não fornecido');
        return {
          success: false,
          error: 'Token de autenticação não fornecido'
        };
      }

      // Preparar dados para o backend
      const payload = {
        observacoes_gerais: observacoes,
        confirmacao_completa: true
      };

      // Construir URL
      const url = buildApiUrl('/vistoria/:id/concluir', { id: vistoriaId });
      console.log('🔄 VistoriaCompletionService: URL da requisição:', url);

      // Fazer requisição
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Verificar erros específicos
        if (response.status === 401) {
          throw new Error('Token de autenticação inválido ou expirado');
        } else if (response.status === 403) {
          throw new Error('Não autorizado a concluir esta vistoria');
        } else if (response.status === 422) {
          // Erro de validação - pode ter itens pendentes
          const errorDetails = data.details || {};
          const itemsPendentes = errorDetails.pending_items || 0;
          
          if (itemsPendentes > 0) {
            throw new Error(`Existem ${itemsPendentes} itens pendentes que precisam ser concluídos`);
          } else {
            throw new Error(data.message || `Erro de validação: ${response.status}`);
          }
        }
        
        throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
      }

      if (data.type !== true) {
        throw new Error(data.message || 'Resposta inválida do servidor');
      }

      console.log('✅ VistoriaCompletionService: Vistoria concluída com sucesso', data);

      return {
        success: true,
        message: data.message || 'Vistoria concluída com sucesso',
        details: data.data
      };
    } catch (error) {
      console.error('❌ VistoriaCompletionService: Erro ao concluir vistoria', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao concluir vistoria'
      };
    }
  }

  /**
   * Tenta concluir uma vistoria no backend, com fallback para conclusão local
   * @param vistoria Dados da vistoria
   * @param observacoes Observações gerais
   * @param token Token de autenticação (opcional)
   */
  static async concluirVistoriaComFallback(
    vistoria: VistoriaLocal,
    observacoes: string,
    token?: string | null
  ): Promise<CompletionResponse> {
    try {
      // Se tiver token, tentar concluir no backend primeiro
      if (token) {
        const result = await this.concluirVistoria(vistoria.id, observacoes, token);
        
        if (result.success) {
          return result;
        }
        
        // Se falhar, logar o erro mas continuar com fallback local
        console.warn('⚠️ VistoriaCompletionService: Falha ao concluir no backend, usando fallback local', result.error);
      }
      
      // Fallback: Marcar como concluída localmente (será sincronizada depois)
      console.log('🔄 VistoriaCompletionService: Usando fallback local para conclusão');
      
      // Aqui apenas retornamos uma resposta simulando sucesso
      // A lógica real de salvar localmente deve ser feita no componente
      return {
        success: true,
        message: 'Vistoria concluída localmente (pendente de sincronização)',
        details: {
          syncStatus: 'pending',
          localOnly: true,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ VistoriaCompletionService: Erro crítico na conclusão', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no processo de conclusão'
      };
    }
  }
} 