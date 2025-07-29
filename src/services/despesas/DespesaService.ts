/**
 * Serviço de Despesas - Task 5.4
 * Integra armazenamento local com API backend usando padrão offline-first
 */

import { DespesaStorageService, DespesaLocal } from './DespesaStorageService';
import { SyncQueueService } from '@/services/sync/SyncQueueService';
import { buildApiUrl } from '@/config/api';
import { DespesaFormData } from '@/components/despesas/MobileDespesaForm';

export interface DespesaApiResponse {
  success?: boolean;
  type?: boolean; // Formato do backend usa 'type' em vez de 'success'
  data?: {
    id?: string;
    url?: string;
    message?: string;
    despesa?: any; // Backend retorna o objeto despesa completo
    success?: boolean;
  };
  error?: string;
  message?: string; // Backend usa 'message' para mensagens de erro
  code?: string; // Backend usa 'code' para códigos de erro
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

      // Tentar upload
      try {
        console.log('🔄 DespesaService: Iniciando upload da despesa', {
          id: despesa.id,
          tipo: despesa.tipo,
          valor: despesa.valor,
          descricao: despesa.descricao.substring(0, 20) + (despesa.descricao.length > 20 ? '...' : ''),
          data: despesa.data,
          vistoriaId: despesa.vistoriaId
        });

        // Construir URL da API
        const apiUrl = buildApiUrl(`/vistoria/${despesa.vistoriaId}/adicionar-despesa`);

        // Verificar se o token está presente
        if (!token) {
          throw new Error('Token de autenticação não fornecido');
        }

        // Preparar FormData para multipart upload
        const formData = new FormData();

        // Dados da despesa
        formData.append('tipo', despesa.tipo);
        formData.append('valor', despesa.valor.toString());
        formData.append('descricao', despesa.descricao);
        formData.append('data_informada', despesa.data);
        formData.append('observacoes', despesa.observacoes || '');
        formData.append('fornecedor', 'Técnico ABPAC');
        formData.append('vistoria_id', despesa.vistoriaId);
        formData.append('token', token);

        // Geolocalização se disponível
        if (despesa.latitude && despesa.longitude) {
          formData.append('latitude', despesa.latitude.toString());
          formData.append('longitude', despesa.longitude.toString());
          formData.append('localizacao_precisao', (despesa.precisao || 0).toString());
        }

        // Adicionar comprovantes se houver
        despesa.comprovantes.forEach((comprovante, index) => {
          if (comprovante.blob) {
            formData.append(`comprovante_${index}`, comprovante.blob, comprovante.nome);
          }
        });

        console.log('🚀 DespesaService: Enviando requisição para API', {
          url: apiUrl,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.substring(0, 10)}...`,
            'X-Vistoria-Token': token.substring(0, 10) + '...'
          },
          formData: {
            tipo: despesa.tipo,
            valor: despesa.valor,
            descricao: despesa.descricao.substring(0, 20) + (despesa.descricao.length > 20 ? '...' : ''),
            data_informada: despesa.data,
            observacoes: despesa.observacoes ? 'presente' : 'ausente',
            fornecedor: 'Técnico ABPAC',
            vistoria_id: despesa.vistoriaId,
            token: token.substring(0, 10) + '...',
            comprovantes: despesa.comprovantes.length
          }
        });
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Vistoria-Token': token,
            // NÃO definir Content-Type - deixar o navegador definir para FormData
          },
          body: formData
        });

        console.log('📥 DespesaService: Resposta recebida da API', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: {
            'content-type': response.headers.get('content-type'),
            'content-length': response.headers.get('content-length')
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ DespesaService: Resposta de erro da API:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          
          // Tentar parsear o erro como JSON
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(`HTTP ${response.status}: ${errorJson.message || errorJson.error || errorText}`);
          } catch (parseError) {
            // Se não conseguir parsear como JSON, usar o texto bruto
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
          }
        }

        const responseText = await response.text();
        console.log('📄 DespesaService: Texto da resposta:', responseText);

        let result: DespesaApiResponse;
        try {
          result = JSON.parse(responseText);
          console.log('🔍 DespesaService: Resposta parseada:', result);
        } catch (parseError) {
          console.error('❌ DespesaService: Erro ao parsear resposta JSON:', parseError);
          throw new Error(`Erro ao parsear resposta: ${responseText}`);
        }

        // Mapear resposta do backend para o formato esperado pelo frontend
        const mappedResult: DespesaApiResponse = {
          success: result.type === true || result.success === true,
          data: result.data || {
            message: result.data?.message || result.message,
            despesa: result.data?.despesa
          },
          error: result.error || result.message
        };

        console.log('🔄 DespesaService: Resposta mapeada:', mappedResult);

        if (mappedResult.success) {
          // Upload bem-sucedido
          await DespesaStorageService.updateSyncStatus(
            despesa.id,
            'synced',
            mappedResult.data?.url || mappedResult.data?.despesa?.id
          );

          console.log('✅ DespesaService: Upload concluído', {
            id: despesa.id,
            urlRemota: mappedResult.data?.url || mappedResult.data?.despesa?.id
          });

          return mappedResult;
        } else {
          // API retornou erro
          const errorMessage = mappedResult.error || 'Erro desconhecido da API';
          console.error('❌ DespesaService: API retornou erro:', errorMessage);
          
          await DespesaStorageService.updateSyncStatus(
            despesa.id,
            'error',
            undefined,
            errorMessage
          );

          return mappedResult;
        }

      } catch (error) {
        console.error('❌ DespesaService: Erro no upload:', error);

        let errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
        
        // Tentar extrair mensagens de validação mais específicas
        if (error instanceof Error && error.message.includes('422')) {
          try {
            const errorData = JSON.parse(error.message.split('HTTP 422: ')[1]);
            if (errorData.errors && errorData.errors.length > 0) {
              // Usar a primeira mensagem de validação como mensagem de erro
              errorMessage = errorData.errors[0].message;
            }
          } catch (e) {
            // Se não conseguir parsear, manter a mensagem original
            console.warn('Não foi possível extrair detalhes do erro de validação', e);
          }
        }
        
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
    } catch (error) {
      console.error('❌ DespesaService: Erro no upload:', error);

      let errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
      
      // Tentar extrair mensagens de validação mais específicas
      if (error instanceof Error && error.message.includes('422')) {
        try {
          const errorData = JSON.parse(error.message.split('HTTP 422: ')[1]);
          if (errorData.errors && errorData.errors.length > 0) {
            // Usar a primeira mensagem de validação como mensagem de erro
            errorMessage = errorData.errors[0].message;
          }
        } catch (e) {
          // Se não conseguir parsear, manter a mensagem original
          console.warn('Não foi possível extrair detalhes do erro de validação', e);
        }
      }
      
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
      await SyncQueueService.adicionarUploadDespesa(despesaId, token, 'media');
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