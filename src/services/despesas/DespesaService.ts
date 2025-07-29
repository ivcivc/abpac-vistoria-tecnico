/**
 * Serviço de Despesas - Task 5.4
 * Integra armazenamento local com API backend usando padrão offline-first
 */

import { DespesaStorageService, DespesaLocal } from './DespesaStorageService';
import { SyncQueueService } from '@/services/sync/SyncQueueService';
import { buildApiUrl } from '@/config/api';
import { DespesaFormData } from '@/components/despesas/MobileDespesaForm';

export interface DespesaApiResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    message: string;
  };
  error?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  needsSync?: boolean;
}

export class DespesaService {
  /**
   * Cria uma nova despesa - padrão offline-first
   */
  static async criarDespesa(
    despesaData: DespesaFormData,
    token: string,
    options: {
      uploadImmediate?: boolean;
      onProgress?: (progress: { stage: string; message: string }) => void;
    } = {}
  ): Promise<ServiceResult<DespesaLocal>> {
    const { uploadImmediate = true, onProgress } = options;

    try {
      onProgress?.({ stage: 'saving', message: 'Salvando despesa localmente...' });

      // 1. SALVAR LOCALMENTE (SEMPRE)
      const despesaLocal = await DespesaStorageService.criarDespesa({
        vistoriaId: despesaData.vistoriaId,
        tipo: despesaData.tipo,
        valor: despesaData.valor,
        descricao: despesaData.descricao,
        data: despesaData.data,
        comprovantes: despesaData.comprovantes,
        tecnicoId: undefined // TODO: pegar do contexto de auth
      });

      console.log('✅ DespesaService: Despesa salva localmente', {
        id: despesaLocal.id,
        valor: despesaLocal.valor,
        tipo: despesaLocal.tipo
      });

      // 2. TENTAR UPLOAD IMEDIATO (SE ONLINE)
      if (uploadImmediate && navigator.onLine) {
        onProgress?.({ stage: 'uploading', message: 'Sincronizando com servidor...' });

        try {
          const uploadResult = await this.uploadDespesa(despesaLocal, token);
          
          if (uploadResult.success) {
            onProgress?.({ stage: 'success', message: 'Despesa sincronizada com sucesso!' });
            
            return {
              success: true,
              data: despesaLocal,
              needsSync: false
            };
          } else {
            // Upload falhou - adicionar à fila
            await this.adicionarNaFilaDeSincronizacao(despesaLocal.id, token);
            
            onProgress?.({ stage: 'queued', message: 'Despesa será sincronizada automaticamente' });
          }
        } catch (error) {
          console.warn('⚠️ DespesaService: Upload imediato falhou, adicionando à fila');
          await this.adicionarNaFilaDeSincronizacao(despesaLocal.id, token);
        }
      } else {
        // Offline ou sem upload imediato - adicionar à fila
        await this.adicionarNaFilaDeSincronizacao(despesaLocal.id, token);
        
        onProgress?.({ stage: 'offline', message: 'Despesa será sincronizada quando online' });
      }

      return {
        success: true,
        data: despesaLocal,
        needsSync: true
      };

    } catch (error) {
      console.error('❌ DespesaService: Erro ao criar despesa:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao salvar despesa'
      };
    }
  }

  /**
   * Upload direto de despesa para o backend
   */
  static async uploadDespesa(
    despesa: DespesaLocal,
    token: string
  ): Promise<DespesaApiResponse> {
    try {
      console.log('🔄 DespesaService: UPLOAD para API', {
        id: despesa.id,
        tipo: despesa.tipo,
        valor: despesa.valor
      });

      // Atualizar status para 'uploading'
      await DespesaStorageService.updateSyncStatus(despesa.id, 'uploading');

      // Preparar FormData para multipart upload
      const formData = new FormData();
      
      // Dados da despesa
      formData.append('tipo', despesa.tipo);
      formData.append('valor', despesa.valor.toString());
      formData.append('descricao', despesa.descricao);
      formData.append('data', despesa.data);
      formData.append('vistoria_id', despesa.vistoriaId);
      formData.append('local_id', despesa.id); // ID local para referência
      
      // Geolocalização se disponível
      if (despesa.localizacao) {
        formData.append('latitude', despesa.localizacao.latitude.toString());
        formData.append('longitude', despesa.localizacao.longitude.toString());
        formData.append('localizacao_precisao', despesa.localizacao.precisao.toString());
      }

      // Comprovantes (arquivos)
      despesa.comprovantes.forEach((comprovante, index) => {
        formData.append(`comprovante_${index}`, comprovante.file, comprovante.nome);
      });

      // Metadados dos comprovantes
      formData.append('comprovantes_metadata', JSON.stringify(
        despesa.comprovantes.map(c => ({
          nome: c.nome,
          tipo: c.tipo,
          tamanho: c.tamanho,
          timestamp: c.timestamp
        }))
      ));

      // Fazer requisição para API
      const response = await fetch(buildApiUrl(`/vistoria/${despesa.vistoriaId}/despesa`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // NÃO definir Content-Type - deixar o navegador definir para FormData
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: DespesaApiResponse = await response.json();

      if (result.success) {
        // Upload bem-sucedido
        await DespesaStorageService.updateSyncStatus(
          despesa.id,
          'synced',
          result.data?.url
        );

        console.log('✅ DespesaService: Upload concluído', {
          id: despesa.id,
          urlRemota: result.data?.url
        });

        return result;
      } else {
        // API retornou erro
        await DespesaStorageService.updateSyncStatus(
          despesa.id,
          'error',
          undefined,
          result.error || 'Erro desconhecido da API'
        );

        return result;
      }

    } catch (error) {
      console.error('❌ DespesaService: Erro no upload:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
      
      await DespesaStorageService.updateSyncStatus(
        despesa.id,
        'error',
        undefined,
        errorMessage
      );

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Adiciona despesa na fila de sincronização
   */
  private static async adicionarNaFilaDeSincronizacao(
    despesaId: string,
    token: string
  ): Promise<void> {
    try {
      await SyncQueueService.adicionarOperacao({
        tipo: 'UPLOAD_DESPESA',
        dados: { despesaId, token },
        prioridade: 'media',
        tentativas: 0,
        proximaTentativa: new Date().toISOString()
      });

      console.log('📝 DespesaService: Despesa adicionada à fila de sincronização', { despesaId });
    } catch (error) {
      console.error('❌ DespesaService: Erro ao adicionar na fila:', error);
    }
  }

  /**
   * Obtém despesas de uma vistoria
   */
  static async getDespesasByVistoria(vistoriaId: string): Promise<ServiceResult<DespesaLocal[]>> {
    try {
      const despesas = await DespesaStorageService.getDespesasByVistoria(vistoriaId);
      
      return {
        success: true,
        data: despesas
      };
    } catch (error) {
      console.error('❌ DespesaService: Erro ao buscar despesas:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar despesas'
      };
    }
  }

  /**
   * Atualiza uma despesa existente
   */
  static async atualizarDespesa(
    id: string,
    updates: Partial<Pick<DespesaLocal, 'tipo' | 'valor' | 'descricao' | 'data' | 'comprovantes'>>,
    token: string,
    options: {
      uploadImmediate?: boolean;
      onProgress?: (progress: { stage: string; message: string }) => void;
    } = {}
  ): Promise<ServiceResult<DespesaLocal>> {
    const { uploadImmediate = true, onProgress } = options;

    try {
      onProgress?.({ stage: 'updating', message: 'Atualizando despesa...' });

      // Atualizar localmente
      const despesaAtualizada = await DespesaStorageService.atualizarDespesa(id, updates);
      
      if (!despesaAtualizada) {
        return {
          success: false,
          error: 'Despesa não encontrada'
        };
      }

      // Tentar sincronizar se online
      if (uploadImmediate && navigator.onLine) {
        onProgress?.({ stage: 'uploading', message: 'Sincronizando alterações...' });

        try {
          const uploadResult = await this.uploadDespesa(despesaAtualizada, token);
          
          if (uploadResult.success) {
            onProgress?.({ stage: 'success', message: 'Alterações sincronizadas!' });
          } else {
            await this.adicionarNaFilaDeSincronizacao(id, token);
            onProgress?.({ stage: 'queued', message: 'Alterações serão sincronizadas automaticamente' });
          }
        } catch (error) {
          await this.adicionarNaFilaDeSincronizacao(id, token);
        }
      } else {
        await this.adicionarNaFilaDeSincronizacao(id, token);
        onProgress?.({ stage: 'offline', message: 'Alterações serão sincronizadas quando online' });
      }

      return {
        success: true,
        data: despesaAtualizada,
        needsSync: despesaAtualizada.status !== 'synced'
      };

    } catch (error) {
      console.error('❌ DespesaService: Erro ao atualizar despesa:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar despesa'
      };
    }
  }

  /**
   * Remove uma despesa
   */
  static async removerDespesa(
    id: string,
    token: string
  ): Promise<ServiceResult<boolean>> {
    try {
      const despesa = await DespesaStorageService.getDespesaById(id);
      
      if (!despesa) {
        return {
          success: false,
          error: 'Despesa não encontrada'
        };
      }

      // Se foi sincronizada, precisamos avisar o backend
      if (despesa.status === 'synced' && despesa.urlRemota) {
        // TODO: Implementar endpoint DELETE no backend
        console.log('⚠️ DespesaService: Despesa sincronizada - seria necessário DELETE na API');
      }

      // Remover localmente
      const removida = await DespesaStorageService.removerDespesa(id);

      return {
        success: removida,
        data: removida
      };

    } catch (error) {
      console.error('❌ DespesaService: Erro ao remover despesa:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover despesa'
      };
    }
  }

  /**
   * Obtém estatísticas de despesas
   */
  static async getStats(vistoriaId?: string): Promise<ServiceResult<any>> {
    try {
      const stats = await DespesaStorageService.getStats(vistoriaId);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('❌ DespesaService: Erro ao obter estatísticas:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter estatísticas'
      };
    }
  }

  /**
   * Retry manual de sincronização para despesa específica
   */
  static async retrySyncDespesa(
    id: string,
    token: string
  ): Promise<ServiceResult<DespesaLocal>> {
    try {
      const despesa = await DespesaStorageService.getDespesaById(id);
      
      if (!despesa) {
        return {
          success: false,
          error: 'Despesa não encontrada'
        };
      }

      if (despesa.status === 'synced') {
        return {
          success: true,
          data: despesa,
          needsSync: false
        };
      }

      const uploadResult = await this.uploadDespesa(despesa, token);
      
      if (uploadResult.success) {
        const despesaAtualizada = await DespesaStorageService.getDespesaById(id);
        
        return {
          success: true,
          data: despesaAtualizada!,
          needsSync: false
        };
      } else {
        return {
          success: false,
          error: uploadResult.error || 'Falha na sincronização'
        };
      }

    } catch (error) {
      console.error('❌ DespesaService: Erro no retry:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no retry de sincronização'
      };
    }
  }
} 