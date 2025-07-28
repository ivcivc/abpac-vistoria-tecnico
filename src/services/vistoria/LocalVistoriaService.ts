import { CRUDService } from '@/services/storage/CRUDService';
import { STORES, StorageQuery, VistoriaItem } from '@/types/storage';

export interface VistoriaLocal {
  id: string;
  titulo?: string; // Nome/título da vistoria
  token?: string;
  local: string;
  dataAgendada?: string;
  dataAcesso?: string; // Quando foi acessada neste dispositivo
  dataCriacao?: Date; // Data de criação da vistoria
  tipoVistoria?: string;
  tecnicoNome?: string; // Nome do técnico que acessou
  status: 'em_andamento' | 'concluida' | 'pausada';
  veiculo?: {
    placa: string;
    modelo: string;
    cor: string;
    ano: number;
  };
  equipamento?: any; // Objeto completo do equipamento do backend
  nomeEquipamento?: string; // Nome do equipamento para exibição
  itens?: any[]; // Lista de itens da vistoria
  sincronizada?: boolean; // Status de sincronização com o backend
  sincronizado?: boolean; // Indica se a conclusão foi sincronizada com o backend
  ultimaSincronizacao?: Date; // Data da última sincronização
  ultimaAtualizacao?: Date; // Data da última atualização local
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
        local: dadosVistoria.local || 'Local não especificado',
        dataAgendada: dadosVistoria.dataAgendada || new Date().toISOString(),
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
      console.error('❌ Erro ao adicionar vistoria ao histórico local:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
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
      console.log(`🔄 [LOCAL-SERVICE] Iniciando atualização do item na vistoria ${vistoriaId}...`);
      
      // Primeiro, obter a vistoria atual
      const vistoriaResult = await this.obterVistoriaPorId(vistoriaId);

      if (!vistoriaResult.success || !vistoriaResult.data) {
        console.error(`❌ [LOCAL-SERVICE] Vistoria ${vistoriaId} não encontrada`);
        return {
          success: false,
          error: 'Vistoria não encontrada',
        };
      }

      const vistoria = vistoriaResult.data;

      // Verificar se a vistoria tem itens
      if (!vistoria.itens || !Array.isArray(vistoria.itens)) {
        console.error(`❌ [LOCAL-SERVICE] Vistoria ${vistoriaId} não possui array de itens válido`);
        return {
          success: false,
          error: 'Vistoria não possui itens válidos',
        };
      }

      // Log detalhado dos itens antes da atualização
      console.log(`📊 [LOCAL-SERVICE] Vistoria ${vistoriaId} possui ${vistoria.itens.length} itens antes da atualização:`);
      vistoria.itens.forEach((item, idx) => {
        console.log(`   Item ${idx + 1}: id=${item.id}, estoque_remessa_id=${item.estoque_remessa_id}, status=${item.status}`);
      });

      // Fazer uma cópia profunda dos itens para não modificar o array original diretamente
      const itensAtualizados = JSON.parse(JSON.stringify(vistoria.itens));
      console.log(`📊 [LOCAL-SERVICE] Cópia profunda criada com ${itensAtualizados.length} itens`);

      // Encontrar e atualizar o item usando ID único
      // Buscar por ID primeiro (mais confiável e único)
      let itemIndex = itensAtualizados.findIndex((item: any) => 
        item.id === itemAtualizado.id
      );
      
      if (itemIndex === -1) {
        console.warn(`⚠️ [LOCAL-SERVICE] Item não encontrado na vistoria ${vistoriaId}:`, {
          itemAtualizado_id: itemAtualizado.id,
          itens_existentes: itensAtualizados.map((item: any) => ({
            id: item.id,
            estoque_remessa_id: item.estoque_remessa_id
          }))
        });
        return {
          success: false,
          error: 'Item não encontrado na vistoria',
        };
      }

      console.log(`✅ [LOCAL-SERVICE] Item encontrado na posição ${itemIndex + 1} de ${itensAtualizados.length}`);

      // CORREÇÃO: Usar ID único para identificar duplicados, não estoque_remessa_id
      // O estoque_remessa_id pode ser igual para vários itens diferentes da mesma remessa
      const itemUniqueId = itemAtualizado.id;
      
      // Verificar se há duplicados REAIS (mesmo ID único)
      const duplicados = itensAtualizados.filter((item: any, index: number) => {
        return item.id === itemUniqueId && index !== itemIndex;
      });

      if (duplicados.length > 0) {
        console.warn(`🔧 [LOCAL-SERVICE] Removendo ${duplicados.length} item(s) duplicado(s) REAIS para ID ${itemUniqueId}`);
        // Remover duplicados mantendo apenas o que será atualizado
        const itensSemDuplicados = itensAtualizados.filter((item: any, index: number) => {
          return item.id !== itemUniqueId || index === itemIndex;
        });
        
        // Atualizar a lista de itens sem duplicados
        console.log(`📊 [LOCAL-SERVICE] Itens após remoção de duplicados: ${itensSemDuplicados.length}`);
        itensAtualizados.length = 0;
        itensAtualizados.push(...itensSemDuplicados);
        
        // Recalcular índice após remoção de duplicados
        itemIndex = itensAtualizados.findIndex((item: any) => item.id === itemAtualizado.id);
      } else {
        console.log(`✅ [LOCAL-SERVICE] Nenhum duplicado encontrado para ID ${itemUniqueId}`);
      }

      // Atualizar o item específico mantendo os demais
      const itemAnterior = { ...itensAtualizados[itemIndex] };
      itensAtualizados[itemIndex] = { 
        ...itemAtualizado,
        // Garantir que campos importantes sejam preservados
        id: itemAnterior.id || itemAtualizado.id,
        estoque_remessa_id: itemAnterior.estoque_remessa_id || (itemAtualizado as any).estoque_remessa_id
      };

      // Log para verificação
      console.log(`📊 [LOCAL-SERVICE] Atualizando item ${itemIndex + 1} de ${itensAtualizados.length} itens`);
      console.log(`📊 [LOCAL-SERVICE] Item anterior:`, itemAnterior);
      console.log(`📊 [LOCAL-SERVICE] Item atualizado:`, itensAtualizados[itemIndex]);

      // Atualizar a vistoria no armazenamento com todos os itens
      const vistoriaAtualizada = {
        ...vistoria,
        itens: itensAtualizados,
        dataAcesso: new Date().toISOString(),
      };

      console.log(`📊 [LOCAL-SERVICE] Vistoria atualizada com ${vistoriaAtualizada.itens.length} itens`);
      
      // Verificar se todos os itens estão presentes
      if (vistoriaAtualizada.itens.length !== itensAtualizados.length) {
        console.error(`❌ [LOCAL-SERVICE] ERRO CRÍTICO: Perda de itens detectada! Original: ${itensAtualizados.length}, Final: ${vistoriaAtualizada.itens.length}`);
      }

      const updateResult = await this.crudService.update(STORES.VISTORIAS_LOCAIS, vistoriaAtualizada);

      if (updateResult.success) {
        console.log(`✅ [LOCAL-SERVICE] Item ${itemAtualizado.id} da vistoria ${vistoriaId} atualizado (${itensAtualizados.length} itens preservados)`);
        
        // Verificar se a atualização foi bem-sucedida
        const verificacao = await this.obterVistoriaPorId(vistoriaId);
        if (verificacao.success && verificacao.data) {
          console.log(`✅ [LOCAL-SERVICE] Verificação pós-atualização: Vistoria tem ${verificacao.data.itens?.length || 0} itens`);
        }
      } else {
        console.error(`❌ [LOCAL-SERVICE] Falha ao atualizar vistoria:`, updateResult.error);
      }

      return updateResult;
    } catch (error) {
      console.error('❌ [LOCAL-SERVICE] Erro ao atualizar item:', error);
      return {
        success: false,
        error: 'Erro interno ao atualizar item',
      };
    }
  }

  /**
   * Limpa duplicações de itens em uma vistoria específica
   */
  async limparDuplicacoes(vistoriaId: string): Promise<ServiceResult> {
    try {
      console.log(`🔧 [LOCAL-SERVICE] Limpando duplicações na vistoria ${vistoriaId}`);
      
      // Obter a vistoria atual
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
          success: true,
          data: 'Vistoria não possui itens para limpar',
        };
      }

      const itensOriginais = vistoria.itens.length;
      const itensUnicos: any[] = [];
      const itensVistos = new Set();
      let duplicadosRemovidos = 0;

      // Processar itens removendo duplicados
      vistoria.itens.forEach((item: any) => {
        const itemKey = item.estoque_remessa_id || item.id;
        
        if (!itensVistos.has(itemKey)) {
          itensVistos.add(itemKey);
          itensUnicos.push(item);
        } else {
          duplicadosRemovidos++;
          console.log(`🗑️ Removendo item duplicado: ${itemKey} (status: ${item.status})`);
        }
      });

      // Atualizar apenas se houve mudanças
      if (duplicadosRemovidos > 0) {
        const vistoriaAtualizada = {
          ...vistoria,
          itens: itensUnicos,
          dataAcesso: new Date().toISOString(),
        };

        const updateResult = await this.crudService.update(STORES.VISTORIAS_LOCAIS, vistoriaAtualizada);

        if (updateResult.success) {
          console.log(`✅ Duplicações removidas da vistoria ${vistoriaId}: ${duplicadosRemovidos} itens duplicados removidos (${itensOriginais} → ${itensUnicos.length})`);
        }

        return {
          ...updateResult,
          data: `${duplicadosRemovidos} duplicações removidas`,
        };
      } else {
        return {
          success: true,
          data: 'Nenhuma duplicação encontrada',
        };
      }
    } catch (error) {
      console.error('❌ Erro ao limpar duplicações:', error);
      return {
        success: false,
        error: 'Erro interno ao limpar duplicações',
      };
    }
  }

  /**
   * Verifica a integridade dos dados de uma vistoria
   * Útil para depuração e validação após operações de atualização
   */
  async verificarIntegridade(vistoriaId: string): Promise<ServiceResult<{
    totalItens: number;
    itensPorStatus: Record<string, number>;
    duplicados: number;
    integridadeOk: boolean;
  }>> {
    try {
      console.log(`🔍 [LOCAL-SERVICE] Verificando integridade da vistoria ${vistoriaId}`);
      
      // Obter a vistoria atual
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
          success: true,
          data: {
            totalItens: 0,
            itensPorStatus: {},
            duplicados: 0,
            integridadeOk: true
          }
        };
      }

      // Contagem de itens por status
      const itensPorStatus: Record<string, number> = {};
      vistoria.itens.forEach((item: any) => {
        const status = item.status || 'desconhecido';
        itensPorStatus[status] = (itensPorStatus[status] || 0) + 1;
      });

      // Verificar duplicados
      const itensVistos = new Set();
      let duplicados = 0;

      vistoria.itens.forEach((item: any) => {
        const itemKey = item.estoque_remessa_id || item.id;
        
        if (itensVistos.has(itemKey)) {
          duplicados++;
        } else {
          itensVistos.add(itemKey);
        }
      });

      // Verificar integridade geral
      const integridadeOk = duplicados === 0;

      const resultado = {
        totalItens: vistoria.itens.length,
        itensPorStatus,
        duplicados,
        integridadeOk
      };

      console.log(`📊 [LOCAL-SERVICE] Resultado da verificação de integridade:`, resultado);

      return {
        success: true,
        data: resultado
      };
    } catch (error) {
      console.error('❌ Erro ao verificar integridade:', error);
      return {
        success: false,
        error: 'Erro interno ao verificar integridade',
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
