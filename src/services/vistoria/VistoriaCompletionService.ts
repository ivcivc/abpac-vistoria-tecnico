/**
 * Serviço de Conclusão de Vistorias - Sistema de Vistorias ABPAC
 * 
 * Gerencia o processo de conclusão de vistorias, incluindo validações,
 * integração com backend e atualização do status local.
 */

import { VistoriaLocal, VistoriaItem } from '@/types/storage';
import { LocalVistoriaService } from './LocalVistoriaService';
import { buildApiUrl } from '@/config/api';

interface CompletionRequest {
  vistoriaId: string;
  observacoes: string;
  forceComplete?: boolean;
  itensResumo: {
    total: number;
    concluidos: number;
    pendentes: number;
    problemas: number;
  };
}

interface CompletionResult {
  success: boolean;
  data?: {
    vistoriaId: string;
    dataConclusao: string;
    status: string;
  };
  error?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canForceComplete: boolean;
}

export class VistoriaCompletionService {
  private localService: LocalVistoriaService;

  constructor() {
    this.localService = new LocalVistoriaService();
  }

  /**
   * Valida se a vistoria pode ser concluída
   */
  async validarConclusao(vistoriaId: string): Promise<ValidationResult> {
    try {
      console.log(`🔍 [COMPLETION] Validando conclusão da vistoria ${vistoriaId}`);

      const result = await this.localService.obterVistoriaPorId(vistoriaId);
      
      if (!result.success || !result.data) {
        return {
          isValid: false,
          errors: ['Vistoria não encontrada'],
          warnings: [],
          canForceComplete: false
        };
      }

      const vistoria = result.data;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Verificar se a vistoria já foi concluída
      if (vistoria.status === 'concluida') {
        errors.push('Vistoria já foi concluída anteriormente');
      }

      // Verificar se há itens na vistoria
      if (!vistoria.itens || vistoria.itens.length === 0) {
        errors.push('Vistoria não possui itens para serem verificados');
      }

      // Calcular estatísticas dos itens
      const itens = vistoria.itens || [];
      const pendentes = itens.filter(item => item.status === 'pendente');
      const problemas = itens.filter(item => item.status === 'problema');
      const concluidos = itens.filter(item => item.status === 'concluido');

      // Avisos para itens pendentes
      if (pendentes.length > 0) {
        warnings.push(`${pendentes.length} item(ns) ainda está(ão) pendente(s)`);
      }

      // Avisos para itens com problema
      if (problemas.length > 0) {
        warnings.push(`${problemas.length} item(ns) foi(ram) marcado(s) como problema`);
      }

      // Verificar se há progresso mínimo
      const progressoMinimo = 0; // Permitir conclusão mesmo sem itens concluídos
      const progressoAtual = itens.length > 0 ? (concluidos.length / itens.length) * 100 : 0;

      if (progressoAtual < progressoMinimo) {
        errors.push(`Progresso mínimo não atingido (${progressoAtual.toFixed(1)}% de ${progressoMinimo}%)`);
      }

      const isValid = errors.length === 0;
      const canForceComplete = errors.length === 0; // Pode forçar se não há erros críticos

      console.log(`✅ [COMPLETION] Validação concluída:`, {
        isValid,
        canForceComplete,
        errors,
        warnings,
        progressoAtual: progressoAtual.toFixed(1) + '%'
      });

      return {
        isValid,
        errors,
        warnings,
        canForceComplete
      };

    } catch (error) {
      console.error(`❌ [COMPLETION] Erro na validação:`, error);
      return {
        isValid: false,
        errors: ['Erro interno na validação'],
        warnings: [],
        canForceComplete: false
      };
    }
  }

  /**
   * Conclui a vistoria localmente
   */
  async concluirVistoriaLocal(
    vistoriaId: string, 
    observacoes: string,
    forceComplete: boolean = false
  ): Promise<CompletionResult> {
    try {
      console.log(`📝 [COMPLETION] Concluindo vistoria local ${vistoriaId}`);

      // Obter vistoria atual
      const vistoriaResult = await this.localService.obterVistoriaPorId(vistoriaId);
      
      if (!vistoriaResult.success || !vistoriaResult.data) {
        return {
          success: false,
          error: 'Vistoria não encontrada para conclusão'
        };
      }

      const vistoria = vistoriaResult.data;
      const dataConclusao = new Date();

      // Atualizar vistoria com dados de conclusão
      const vistoriaAtualizada: VistoriaLocal = {
        ...vistoria,
        status: 'concluida',
        dataConclusao,
        observacoes: observacoes || vistoria.observacoes,
        progresso: 100, // Marcar como 100% ao concluir
        sincronizada: false, // Marcar para sincronização
        ultimaSincronizacao: undefined // Resetar para forçar nova sincronização
      };

      // Salvar localmente
      const updateResult = await this.localService.atualizarVistoria(vistoriaAtualizada);
      
      if (!updateResult.success) {
        return {
          success: false,
          error: 'Erro ao salvar conclusão da vistoria localmente'
        };
      }

      console.log(`✅ [COMPLETION] Vistoria ${vistoriaId} concluída localmente`);

      return {
        success: true,
        data: {
          vistoriaId,
          dataConclusao: dataConclusao.toISOString(),
          status: 'concluida'
        }
      };

    } catch (error) {
      console.error(`❌ [COMPLETION] Erro ao concluir vistoria local:`, error);
      return {
        success: false,
        error: 'Erro interno ao concluir vistoria'
      };
    }
  }

  /**
   * Sincroniza conclusão com o backend
   */
  async sincronizarConclusao(
    vistoriaId: string,
    observacoes: string,
    token: string,
    forceComplete: boolean = false
  ): Promise<CompletionResult> {
    try {
      console.log(`🔄 [COMPLETION] Sincronizando conclusão com backend para vistoria ${vistoriaId}`);

      // Obter dados da vistoria para o resumo
      const vistoriaResult = await this.localService.obterVistoriaPorId(vistoriaId);
      
      if (!vistoriaResult.success || !vistoriaResult.data) {
        return {
          success: false,
          error: 'Vistoria não encontrada para sincronização'
        };
      }

      const vistoria = vistoriaResult.data;
      const itens = vistoria.itens || [];

      // Preparar dados para o backend
      const requestData: CompletionRequest = {
        vistoriaId,
        observacoes,
        forceComplete,
        itensResumo: {
          total: itens.length,
          concluidos: itens.filter(item => item.status === 'concluido').length,
          pendentes: itens.filter(item => item.status === 'pendente').length,
          problemas: itens.filter(item => item.status === 'problema').length,
        }
      };

      // Configurar timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

      try {
        const response = await fetch(buildApiUrl(`/api/vistoria/${vistoriaId}/concluir`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.text();
          let errorMessage = `Erro HTTP ${response.status}`;
          
          try {
            const errorJson = JSON.parse(errorData);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            // Se não for JSON válido, usar mensagem padrão
          }

          console.error(`❌ [COMPLETION] Erro na sincronização:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });

          return {
            success: false,
            error: errorMessage
          };
        }

        const responseData = await response.json();
        
        console.log(`✅ [COMPLETION] Conclusão sincronizada com sucesso:`, responseData);

        return {
          success: true,
          data: {
            vistoriaId,
            dataConclusao: responseData.dataConclusao || new Date().toISOString(),
            status: 'concluida'
          }
        };

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error(`⏱️ [COMPLETION] Timeout na sincronização da conclusão`);
          return {
            success: false,
            error: 'Timeout na comunicação com o servidor. Tente novamente.'
          };
        }

        console.error(`❌ [COMPLETION] Erro de rede na sincronização:`, fetchError);
        return {
          success: false,
          error: 'Erro de conexão com o servidor. Verifique sua internet.'
        };
      }

    } catch (error) {
      console.error(`❌ [COMPLETION] Erro inesperado na sincronização:`, error);
      return {
        success: false,
        error: 'Erro interno na sincronização'
      };
    }
  }

  /**
   * Processo completo de conclusão (local + sincronização)
   */
  async concluirVistoria(
    vistoriaId: string,
    observacoes: string,
    token?: string,
    forceComplete: boolean = false
  ): Promise<CompletionResult> {
    try {
      console.log(`🎯 [COMPLETION] Iniciando processo completo de conclusão para vistoria ${vistoriaId}`);

      // 1. Validar se pode concluir
      const validation = await this.validarConclusao(vistoriaId);
      
      if (!validation.isValid && !forceComplete) {
        return {
          success: false,
          error: `Não é possível concluir a vistoria: ${validation.errors.join(', ')}`
        };
      }

      if (!validation.canForceComplete && forceComplete) {
        return {
          success: false,
          error: `Não é possível forçar a conclusão: ${validation.errors.join(', ')}`
        };
      }

      // 2. Concluir localmente primeiro
      const localResult = await this.concluirVistoriaLocal(vistoriaId, observacoes, forceComplete);
      
      if (!localResult.success) {
        return localResult;
      }

      // 3. Tentar sincronizar com backend se token disponível
      if (token) {
        const syncResult = await this.sincronizarConclusao(vistoriaId, observacoes, token, forceComplete);
        
        if (syncResult.success) {
          // Marcar como sincronizada
          const vistoriaResult = await this.localService.obterVistoriaPorId(vistoriaId);
          if (vistoriaResult.success && vistoriaResult.data) {
            const vistoriaAtualizada = {
              ...vistoriaResult.data,
              sincronizada: true,
              ultimaSincronizacao: new Date()
            };
            await this.localService.atualizarVistoria(vistoriaAtualizada);
          }
          
          console.log(`🎉 [COMPLETION] Vistoria ${vistoriaId} concluída e sincronizada com sucesso!`);
          return syncResult;
        } else {
          // Falha na sincronização, mas conclusão local foi bem-sucedida
          console.warn(`⚠️ [COMPLETION] Vistoria concluída localmente, mas falha na sincronização:`, syncResult.error);
          
          // Adicionar à fila de sincronização para retry automático
          try {
            const { SyncQueueService } = await import('../sync/SyncQueueService');
            const syncQueueService = SyncQueueService.getInstance();
            
            await syncQueueService.adicionarOperacao(
              'COMPLETE_VISTORIA',
              vistoriaId,
              { observacoes, forceComplete },
              vistoriaId,
              token,
              1 // Alta prioridade para conclusão de vistoria
            );
            
            console.log('✅ [COMPLETION] Conclusão adicionada à fila de sincronização para retry automático');
          } catch (queueError) {
            console.error('❌ [COMPLETION] Erro ao adicionar conclusão na fila:', queueError);
          }
          
          return {
            success: true,
            data: localResult.data,
            error: `Vistoria concluída localmente. Sincronização pendente: ${syncResult.error}`
          };
        }
      } else {
        console.log(`📱 [COMPLETION] Vistoria ${vistoriaId} concluída apenas localmente (sem token)`);
        return localResult;
      }

    } catch (error) {
      console.error(`❌ [COMPLETION] Erro no processo completo de conclusão:`, error);
      return {
        success: false,
        error: 'Erro interno no processo de conclusão'
      };
    }
  }

  /**
   * Obtém resumo da vistoria para validação
   */
  async obterResumoVistoria(vistoriaId: string) {
    const result = await this.localService.obterVistoriaPorId(vistoriaId);
    
    if (!result.success || !result.data) {
      return null;
    }

    const vistoria = result.data;
    const itens = vistoria.itens || [];

    return {
      vistoria,
      resumo: {
        total: itens.length,
        concluidos: itens.filter(item => item.status === 'concluido').length,
        pendentes: itens.filter(item => item.status === 'pendente').length,
        problemas: itens.filter(item => item.status === 'problema').length,
        cancelados: itens.filter(item => item.status === 'cancelado').length,
      },
      progresso: itens.length > 0 ? Math.round((itens.filter(item => item.status === 'concluido').length / itens.length) * 100) : 0
    };
  }
} 