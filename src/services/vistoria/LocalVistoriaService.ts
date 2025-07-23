import { CRUDService } from '@/services/storage/CRUDService';
import { STORES, StorageQuery } from '@/types/storage';

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
   * Obtém todas as vistorias acessadas neste navegador
   */
  async obterVistoriasLocais(): Promise<{
    success: boolean;
    data?: VistoriaLocal[];
    error?: string;
  }> {
    try {
      const result = await this.crudService.getAll<VistoriaLocal>(STORES.VISTORIAS_LOCAIS);

      if (result.success && result.data) {
        // Ordenar por data de acesso (mais recente primeiro)
        const vistoriasOrdenadas = result.data.sort(
          (a: VistoriaLocal, b: VistoriaLocal) =>
            new Date(b.dataAcesso).getTime() - new Date(a.dataAcesso).getTime()
        );

        return { success: true, data: vistoriasOrdenadas };
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error('❌ Erro ao buscar vistorias locais:', error);
      return { success: false, error: 'Erro ao buscar histórico local' };
    }
  }

  /**
   * Atualiza o status de uma vistoria local
   */
  async atualizarStatusVistoria(
    vistoriaId: string,
    novoStatus: VistoriaLocal['status']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar vistoria existente primeiro
      const query: StorageQuery = {
        field: 'id',
        value: vistoriaId,
        operator: 'equals',
      };

      const findResult = await this.crudService.findBy<VistoriaLocal>(
        STORES.VISTORIAS_LOCAIS,
        query
      );

      if (!findResult.success || !findResult.data || findResult.data.length === 0) {
        return { success: false, error: 'Vistoria não encontrada' };
      }

      const vistoriaExistente = findResult.data[0];
      const vistoriaAtualizada = {
        ...vistoriaExistente,
        status: novoStatus,
      };

      const updateResult = await this.crudService.update(
        STORES.VISTORIAS_LOCAIS,
        vistoriaAtualizada
      );

      console.log(`📊 Status da vistoria ${vistoriaId} atualizado para: ${novoStatus}`);
      return updateResult;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return { success: false, error: 'Erro ao atualizar status' };
    }
  }

  /**
   * Remove uma vistoria do histórico local
   */
  async removerVistoriaLocal(vistoriaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.crudService.delete(STORES.VISTORIAS_LOCAIS, vistoriaId);
      console.log('🗑️ Vistoria removida do histórico local:', vistoriaId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao remover vistoria local:', error);
      return { success: false, error: 'Erro ao remover do histórico' };
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
   * Limpa todo o histórico local (função administrativa)
   * Implementação simplificada - busca todos e remove um por um
   */
  async limparHistoricoLocal(): Promise<{ success: boolean; error?: string }> {
    try {
      const allResult = await this.crudService.getAll<VistoriaLocal>(STORES.VISTORIAS_LOCAIS);

      if (!allResult.success || !allResult.data) {
        return { success: false, error: 'Erro ao buscar vistorias para limpar' };
      }

      // Remover todas as vistorias uma por uma
      for (const vistoria of allResult.data) {
        await this.crudService.delete(STORES.VISTORIAS_LOCAIS, vistoria.id);
      }

      console.log('🧹 Histórico local de vistorias limpo');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao limpar histórico:', error);
      return { success: false, error: 'Erro ao limpar histórico' };
    }
  }
}
