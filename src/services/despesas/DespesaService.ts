/**
 * Serviço para integração com endpoints de despesas do backend
 * Task 17 - Integração com endpoints reais de despesas
 */

import { Despesa, Evidencia } from '@/types/storage';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { UploadService } from '../uploadService';

export interface DespesaBackend {
  id?: number;
  estoque_remessa_id: number;
  estoque_remessa_item_id?: number;
  descricao: string;
  valor: number;
  tipo: 'SERVICO' | 'MATERIAL' | 'DESLOCAMENTO' | 'OUTROS';
  observacoes?: string;
  aprovada?: boolean;
  data_aprovacao?: string;
  usuario_aprovacao_id?: number;
  arquivo_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DespesaResponse {
  success: boolean;
  despesa?: DespesaBackend;
  error?: string;
}

export class DespesaService {
  /**
   * Adiciona uma despesa ao backend
   */
  static async adicionarDespesa(
    vistoriaId: string | number,
    despesa: Omit<Despesa, 'id' | 'vistoriaId'>,
    token: string
  ): Promise<DespesaResponse> {
    try {
      console.log('🔄 DespesaService: Adicionando despesa ao backend', {
        vistoriaId,
        despesa
      });

      // Verificar token
      if (!token || token.trim() === '') {
        console.warn('⚠️ DespesaService: Token não fornecido');
        return {
          success: false,
          error: 'Token de autenticação não fornecido'
        };
      }

      // Preparar dados para o backend
      const despesaBackend: Record<string, any> = {
        descricao: despesa.descricao,
        valor: despesa.valor,
        tipo: despesa.tipo,
        observacoes: despesa.descricao, // Duplicar descrição nas observações
        estoque_remessa_item_id: despesa.itemId
      };

      // Verificar se há comprovante para upload
      let arquivoId = null;
      if (despesa.comprovante) {
        // Fazer upload do comprovante
        console.log('📤 DespesaService: Fazendo upload do comprovante');
        
        // Obter o arquivo como Blob
        const response = await fetch(despesa.comprovante.localUrl);
        if (!response.ok) {
          throw new Error(`Falha ao obter arquivo: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Fazer upload
        const uploadResult = await UploadService.uploadFile(blob, {
          tipo: 'comprovante_despesa',
          referencia: `despesa_${vistoriaId}_${Date.now()}`,
          fileName: `comprovante_${Date.now()}.jpg`
        });
        
        if (uploadResult.success && uploadResult.arquivo) {
          arquivoId = uploadResult.arquivo.id;
          console.log('✅ DespesaService: Comprovante enviado com sucesso', arquivoId);
        } else {
          console.error('❌ DespesaService: Falha no upload do comprovante', uploadResult.error);
        }
      }

      // Se tiver arquivo, adicionar ao payload
      if (arquivoId) {
        despesaBackend['arquivo_id'] = arquivoId;
      }

      // Construir URL
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.ADD_DESPESA, { id: vistoriaId }) + '/adicionar-despesa';

      // Fazer requisição
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(despesaBackend)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token de autenticação inválido ou expirado');
        }
        throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
      }

      if (data.type !== true) {
        throw new Error(data.message || 'Resposta inválida do servidor');
      }

      console.log('✅ DespesaService: Despesa adicionada com sucesso', data);

      return {
        success: true,
        despesa: data.data
      };
    } catch (error) {
      console.error('❌ DespesaService: Erro ao adicionar despesa', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao adicionar despesa'
      };
    }
  }

  /**
   * Obtém despesas de uma vistoria do backend
   */
  static async obterDespesas(
    vistoriaId: string | number,
    token?: string
  ): Promise<{ success: boolean; despesas?: DespesaBackend[]; error?: string }> {
    try {
      console.log('🔄 DespesaService: Obtendo despesas da vistoria', vistoriaId);

      // Validar token
      if (!token || token.trim() === '') {
        console.warn('⚠️ DespesaService: Tentativa de obter despesas sem token');
        return {
          success: false,
          error: 'Token de autenticação não fornecido'
        };
      }

      // Construir URL correta usando o endpoint definido na configuração
      // Importante: Verificar se a URL está correta para o endpoint
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.GET_DESPESAS, { id: vistoriaId }) + '/despesas';
      console.log('🔄 DespesaService: URL da requisição:', url);

      // Configurar headers
      // Importante: Verificar se o formato do token está correto
      // Alguns backends esperam "Bearer TOKEN", outros apenas "TOKEN"
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log('🔄 DespesaService: Headers da requisição:', JSON.stringify(headers, null, 2));

      // Fazer requisição com tratamento de erros melhorado
      try {
        // Tentar primeiro com o formato "Bearer TOKEN"
        let response = await fetch(url, {
          method: 'GET',
          headers
        });

        // Se receber 401, tentar sem o prefixo "Bearer"
        if (response.status === 401) {
          console.log('🔄 DespesaService: Tentando autenticação sem prefixo Bearer');
          
          const headersSimples = {
            'Content-Type': 'application/json',
            'Authorization': token
          };
          
          response = await fetch(url, {
            method: 'GET',
            headers: headersSimples
          });
        }

        // Verificar erros de autenticação primeiro
        if (response.status === 401) {
          console.error('❌ DespesaService: Erro de autenticação (401) ao obter despesas');
          return {
            success: false,
            error: 'Token de autenticação inválido ou expirado'
          };
        }

        // Verificar outros erros HTTP
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          
          try {
            // Tentar parsear como JSON
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || `Erro ${response.status}: ${response.statusText}`;
          } catch (e) {
            // Se não for JSON, usar o texto bruto
            errorMessage = errorText || `Erro ${response.status}: ${response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ DespesaService: Resposta do servidor:', data);

        if (data.type !== true) {
          throw new Error(data.message || 'Resposta inválida do servidor');
        }

        console.log('✅ DespesaService: Despesas obtidas com sucesso', data);

        return {
          success: true,
          despesas: data.data || []
        };
      } catch (fetchError) {
        // Capturar erros específicos do fetch
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          console.error('❌ DespesaService: Erro de conexão com o servidor');
          return {
            success: false,
            error: 'Não foi possível conectar ao servidor. Verifique sua conexão ou se o servidor está em execução.'
          };
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ DespesaService: Erro ao obter despesas', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao obter despesas'
      };
    }
  }

  /**
   * Converte despesa do backend para o formato do frontend
   */
  static convertFromBackend(despesaBackend: DespesaBackend): Despesa {
    return {
      id: `despesa_${despesaBackend.id}`,
      itemId: despesaBackend.estoque_remessa_item_id?.toString() || '',
      vistoriaId: despesaBackend.estoque_remessa_id.toString(),
      tipo: despesaBackend.tipo,
      valor: despesaBackend.valor,
      descricao: despesaBackend.descricao,
      timestamp: despesaBackend.created_at ? new Date(despesaBackend.created_at) : new Date(),
      aprovada: despesaBackend.aprovada || false,
      // Se tiver arquivo_id, criar um objeto de evidência básico
      comprovante: despesaBackend.arquivo_id ? {
        id: `arquivo_${despesaBackend.arquivo_id}`,
        itemId: despesaBackend.estoque_remessa_item_id?.toString() || '',
        tipo: 'foto', // Usar 'foto' em vez de 'image/jpeg' para compatibilidade com o tipo Evidencia
        url: `/api/arquivos/${despesaBackend.arquivo_id}`,
        localUrl: `/api/arquivos/${despesaBackend.arquivo_id}`,
        tamanho: 0,
        timestamp: new Date(),
        tipoEvidencia: 'outro',
        descricao: 'Comprovante de despesa'
      } : undefined
    };
  }

  /**
   * Converte despesa do frontend para o formato do backend
   */
  static convertToBackend(despesa: Despesa): Partial<DespesaBackend> {
    return {
      estoque_remessa_id: parseInt(despesa.vistoriaId),
      estoque_remessa_item_id: despesa.itemId ? parseInt(despesa.itemId) : undefined,
      descricao: despesa.descricao,
      valor: despesa.valor,
      tipo: despesa.tipo,
      observacoes: despesa.descricao // Duplicar descrição nas observações
    };
  }
} 