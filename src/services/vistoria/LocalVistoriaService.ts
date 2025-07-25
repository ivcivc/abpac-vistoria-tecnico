import { CRUDService } from '@/services/storage/CRUDService';
import { STORES, StorageQuery, VistoriaItem } from '@/types/storage';

export interface VistoriaLocal {
  id: string;
  token: string;
  local: string;
  dataAgendada: string;
  dataAcesso: string; // Quando foi acessada neste dispositivo
  tipoVistoria?: string;
  tecnicoNome?: string; // Nome do técnico que acessou
  status: 'em_andamento' | 'concluida' | 'pausada';
  veiculo: {
    placa: string;
    modelo: string;
    cor: string;
    ano: number;
  };
  equipamento?: any; // Objeto completo do equipamento do backend
  nomeEquipamento?: string; // Nome do equipamento para exibição
  itens?: any[]; // Lista de itens da vistoria
  sincronizada?: boolean; // Status de sincronização com o backend
  ultimaSincronizacao?: Date; // Data da última sincronização
  observacoes?: string; // Observações gerais da vistoria
  dataConclusao?: Date; // Data em que a vistoria foi concluída
  progresso?: number; // Percentual de progresso da vistoria
}

interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Serviço para gerenciar vistorias acessadas localmente
 *
 * Funcionalidade:
 * - Cada token acessado = uma vistoria salva localmente
 * - Dashboard mostra apenas vistorias deste navegador
 * - Histórico por dispositivo/navegador
 */
export class LocalVistoriaService {
  private crudService: CRUDService;

  constructor() {
    this.crudService = new CRUDService();
  }

  /**
   * Adiciona uma vistoria ao histórico local quando acessada via token
   */
  async adicionarVistoriaAcessada(
    token: string,
    dadosVistoria: any,
    tecnicoNome: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const vistoriaLocal: VistoriaLocal = {
        id: dadosVistoria.id,
        token,
        local: dadosVistoria.local,
        dataAgendada: dadosVistoria.dataAgendada,
        dataAcesso: new Date().toISOString(),
        tipoVistoria: dadosVistoria.tipoVistoria,
        tecnicoNome,
        status: 'em_andamento',
        veiculo: dadosVistoria.veiculo,
        equipamento: dadosVistoria.equipamento, // Objeto completo do equipamento
        nomeEquipamento: dadosVistoria.nomeEquipamento, // Nome para exibição
        itens: dadosVistoria.itens || [], // Lista de itens
      };

      // Verificar se já existe (evitar duplicatas)
      const existingQuery: StorageQuery = {
        field: 'id',
        value: dadosVistoria.id,
        operator: 'equals',
      };

      const existingResult = await this.crudService.findBy(STORES.VISTORIAS_LOCAIS, existingQuery);

      if (existingResult.success && existingResult.data && existingResult.data.length > 0) {
        // Atualizar dados se já existe - usar dados completos
        const vistoriaAtualizada = {
          ...vistoriaLocal,
          dataAcesso: new Date().toISOString(), // Atualizar último acesso
        };

        const updateResult = await this.crudService.update(
          STORES.VISTORIAS_LOCAIS,
          vistoriaAtualizada
        );

        console.log('📝 Vistoria atualizada no histórico local:', dadosVistoria.id);
        return updateResult;
      } else {
        // Criar nova entrada
        const createResult = await this.crudService.create(STORES.VISTORIAS_LOCAIS, vistoriaLocal);
        console.log('✅ Vistoria adicionada ao histórico local:', dadosVistoria.id);
        return createResult;
      }
    } catch (error) {
      console.error('❌ Erro ao salvar vistoria local:', error);
      return { success: false, error: 'Erro ao salvar no histórico local' };
    }
  }

  /**
   * Obtém todas as vistorias do histórico local
   */
  async obterVistoriasLocais(): Promise<ServiceResult<VistoriaLocal[]>> {
    try {
      const result = await this.crudService.getAll<VistoriaLocal>(STORES.VISTORIAS_LOCAIS);

      if (result.success && result.data) {
        // Ordenar por data de acesso (mais recente primeiro)
        const vistoriasOrdenadas = result.data.sort((a: VistoriaLocal, b: VistoriaLocal) => {
          return new Date(b.dataAcesso).getTime() - new Date(a.dataAcesso).getTime();
        });

        return {
          success: true,
          data: vistoriasOrdenadas,
        };
      } else {
        return {
          success: true,
          data: [],
        };
      }
    } catch (error) {
      console.error('❌ Erro ao obter vistorias locais:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar dados',
      };
    }
  }

  /**
   * Obtém uma vistoria específica pelo ID
   */
  async obterVistoriaPorId(id: string): Promise<ServiceResult<VistoriaLocal>> {
    try {
      console.log('🔍 [LOCAL-SERVICE] Buscando vistoria por ID:', id, '(tipo:', typeof id, ')');
      
      const query: StorageQuery = {
        field: 'id',
        value: id,
        operator: 'equals',
      };

      console.log('🔍 [LOCAL-SERVICE] Query de busca:', query);
      let result = await this.crudService.findBy<VistoriaLocal>(STORES.VISTORIAS_LOCAIS, query);
      console.log('🔍 [LOCAL-SERVICE] Resultado da busca (string):', result);

      // Se não encontrou como string, tentar como number
      if (!result.success || !result.data || result.data.length === 0) {
        console.log('🔍 [LOCAL-SERVICE] Tentando buscar como number...');
        const numericQuery: StorageQuery = {
          field: 'id',
          value: parseInt(id, 10),
          operator: 'equals',
        };
        result = await this.crudService.findBy<VistoriaLocal>(STORES.VISTORIAS_LOCAIS, numericQuery);
        console.log('🔍 [LOCAL-SERVICE] Resultado da busca (number):', result);
      }

      if (result.success && result.data && result.data.length > 0) {
        console.log('✅ [LOCAL-SERVICE] Vistoria encontrada:', result.data[0]);
        return {
          success: true,
          data: result.data[0],
        };
      } else {
        console.warn('⚠️ [LOCAL-SERVICE] Nenhuma vistoria encontrada com ID:', id);
        return {
          success: false,
          error: 'Vistoria não encontrada no histórico local',
        };
      }
    } catch (error) {
      console.error('❌ Erro ao obter vistoria por ID:', error);
      return {
        success: false,
        error: 'Erro interno ao buscar dados',
      };
    }
  }

  /**
   * Atualiza o status de uma vistoria local
   */
  async atualizarStatusVistoria(
    id: string,
    novoStatus: VistoriaLocal['status']
  ): Promise<ServiceResult> {
    try {
      // Primeiro, obter a vistoria atual
      const vistoriaResult = await this.obterVistoriaPorId(id);

      if (!vistoriaResult.success || !vistoriaResult.data) {
        return {
          success: false,
          error: 'Vistoria não encontrada',
        };
      }

      // Atualizar o status
      const vistoriaAtualizada = {
        ...vistoriaResult.data,
        status: novoStatus,
        dataAcesso: new Date().toISOString(), // Atualizar último acesso
      };

      const updateResult = await this.crudService.update(STORES.VISTORIAS_LOCAIS, vistoriaAtualizada);

      if (updateResult.success) {
        console.log(`✅ Status da vistoria ${id} atualizado para: ${novoStatus}`);
      }

      return updateResult;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return {
        success: false,
        error: 'Erro interno ao atualizar dados',
      };
    }
  }

  /**
   * Atualiza um item específico de uma vistoria
   */
  async atualizarItem(vistoriaId: string, itemAtualizado: VistoriaItem): Promise<ServiceResult> {
    try {
      // Primeiro, obter a vistoria atual
      const vistoriaResult = await this.obterVistoriaPorId(vistoriaId);

      if (!vistoriaResult.success || !vistoriaResult.data) {
        return {
          success: false,
          error: 'Vistoria não encontrada',
        };
      }

      const vistoria = vistoriaResult.data;

      // Verificar se a vistoria tem itens
      if (!vistoria.itens || !Array.isArray(vistoria.itens)) {
        return {
          success: false,
          error: 'Vistoria não possui itens válidos',
        };
      }

      // Encontrar e atualizar o item usando estoque_remessa_id como ID principal
      const itemIndex = vistoria.itens.findIndex((item: any) => 
        item.estoque_remessa_id === (itemAtualizado as any).estoque_remessa_id ||
        item.id === itemAtualizado.id
      );
      
      if (itemIndex === -1) {
        return {
          success: false,
          error: 'Item não encontrado na vistoria',
        };
      }

      // Atualizar o item
      vistoria.itens[itemIndex] = itemAtualizado;

      // Atualizar a vistoria no armazenamento
      const vistoriaAtualizada = {
        ...vistoria,
        dataAcesso: new Date().toISOString(),
      };

      const updateResult = await this.crudService.update(STORES.VISTORIAS_LOCAIS, vistoriaAtualizada);

      if (updateResult.success) {
        console.log(`✅ Item ${itemAtualizado.id} da vistoria ${vistoriaId} atualizado`);
      }

      return updateResult;
    } catch (error) {
      console.error('❌ Erro ao atualizar item:', error);
      return {
        success: false,
        error: 'Erro interno ao atualizar item',
      };
    }
  }

  /**
   * Remove uma vistoria do histórico local
   */
  async removerVistoria(id: string): Promise<ServiceResult> {
    try {
      const result = await this.crudService.delete(STORES.VISTORIAS_LOCAIS, id);

      if (result.success) {
        console.log(`🗑️ Vistoria ${id} removida do histórico local`);
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao remover vistoria:', error);
      return {
        success: false,
        error: 'Erro interno ao remover dados',
      };
    }
  }

  /**
   * Obtém estatísticas das vistorias locais
   */
  async obterEstatisticasLocais(): Promise<{
    total: number;
    emAndamento: number;
    concluidas: number;
    pausadas: number;
  }> {
    try {
      const result = await this.obterVistoriasLocais();

      if (!result.success || !result.data) {
        return { total: 0, emAndamento: 0, concluidas: 0, pausadas: 0 };
      }

      const vistorias = result.data;
      return {
        total: vistorias.length,
        emAndamento: vistorias.filter(v => v.status === 'em_andamento').length,
        concluidas: vistorias.filter(v => v.status === 'concluida').length,
        pausadas: vistorias.filter(v => v.status === 'pausada').length,
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return { total: 0, emAndamento: 0, concluidas: 0, pausadas: 0 };
    }
  }

  /**
   * Limpa todo o histórico de vistorias locais
   */
  async limparHistorico(): Promise<ServiceResult> {
    try {
      // Primeiro obter todas as vistorias
      const allResult = await this.obterVistoriasLocais();

      if (!allResult.success || !allResult.data) {
        return { success: false, error: 'Erro ao buscar vistorias para limpar' };
      }

      // Remover todas as vistorias uma por uma
      for (const vistoria of allResult.data) {
        await this.crudService.delete(STORES.VISTORIAS_LOCAIS, vistoria.id);
      }

      console.log('🧹 Histórico de vistorias locais limpo');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao limpar histórico:', error);
      return {
        success: false,
        error: 'Erro interno ao limpar dados',
      };
    }
  }
}
