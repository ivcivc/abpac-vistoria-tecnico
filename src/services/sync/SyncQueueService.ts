/**
 * Serviço de Fila de Sincronização - Sistema de Vistorias ABPAC
 * 
 * Gerencia operações que falharam na sincronização com o backend,
 * implementando retry automático com backoff exponencial.
 */

import { CRUDService } from '@/services/storage/CRUDService';
import { STORES } from '@/types/storage';
import { ApiVistoriaService } from '@/services/vistoria/ApiVistoriaService';

export interface SyncQueueItem {
  id: string;
  tipo: 'UPDATE_ITEM' | 'UPLOAD_EVIDENCE' | 'COMPLETE_VISTORIA';
  entidade: string; // ID da entidade (item, vistoria, etc.)
  dados: any; // Dados a serem sincronizados
  prioridade: number; // 1 = alta, 2 = média, 3 = baixa
  tentativas: number;
  maxTentativas: number;
  proximaTentativa: string; // ISO timestamp
  ultimoErro?: string;
  timestamp: string; // ISO timestamp de criação
  vistoriaId: string;
  token: string;
}

interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class SyncQueueService {
  private static instance: SyncQueueService;
  private crudService: CRUDService;
  private apiService: ApiVistoriaService;
  private processandoFila = false;
  private intervalId?: NodeJS.Timeout;

  private constructor() {
    this.crudService = new CRUDService();
    this.apiService = new ApiVistoriaService();
  }

  static getInstance(): SyncQueueService {
    if (!SyncQueueService.instance) {
      SyncQueueService.instance = new SyncQueueService();
    }
    return SyncQueueService.instance;
  }

  /**
   * Adiciona uma operação na fila de sincronização
   */
  async adicionarOperacao(
    tipo: SyncQueueItem['tipo'],
    entidade: string,
    dados: any,
    vistoriaId: string,
    token: string,
    prioridade: number = 2
  ): Promise<ServiceResult<SyncQueueItem>> {
    try {
      console.log(`📥 [SYNC-QUEUE] Adicionando operação na fila: ${tipo} para ${entidade}`);

      const item: SyncQueueItem = {
        id: `${tipo}_${entidade}_${Date.now()}`,
        tipo,
        entidade,
        dados,
        prioridade,
        tentativas: 0,
        maxTentativas: 5,
        proximaTentativa: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        vistoriaId,
        token
      };

      const result = await this.crudService.create(STORES.SYNC_QUEUE, item);

      if (result.success) {
        console.log(`✅ [SYNC-QUEUE] Operação ${item.id} adicionada na fila`);
        
        // Iniciar processamento se não estiver rodando
        this.iniciarProcessamento();
        
        return {
          success: true,
          data: item
        };
      } else {
        console.error(`❌ [SYNC-QUEUE] Erro ao adicionar operação na fila:`, result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error(`❌ [SYNC-QUEUE] Erro inesperado ao adicionar operação:`, error);
      return {
        success: false,
        error: 'Erro interno ao adicionar operação na fila'
      };
    }
  }

  /**
   * Inicia o processamento automático da fila
   */
  iniciarProcessamento(): void {
    if (this.intervalId) {
      return; // Já está rodando
    }

    console.log(`🚀 [SYNC-QUEUE] Iniciando processamento automático da fila`);
    
    // Processar imediatamente
    this.processarFila();
    
    // Processar a cada 30 segundos
    this.intervalId = setInterval(() => {
      this.processarFila();
    }, 30000);
  }

  /**
   * Para o processamento automático da fila
   */
  pararProcessamento(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log(`⏹️ [SYNC-QUEUE] Processamento automático parado`);
    }
  }

  /**
   * Processa todos os itens pendentes na fila
   */
  async processarFila(): Promise<void> {
    if (this.processandoFila) {
      return; // Já está processando
    }

    try {
      this.processandoFila = true;
      console.log(`🔄 [SYNC-QUEUE] Iniciando processamento da fila`);

      // Verificar conectividade básica
      if (!navigator.onLine) {
        console.log(`📴 [SYNC-QUEUE] Sem conexão - pulando processamento`);
        return;
      }

      // Buscar itens prontos para processamento
      const agora = new Date().toISOString();
      const itens = await this.obterItensProntos(agora);

      if (!itens.success || !itens.data || itens.data.length === 0) {
        console.log(`📭 [SYNC-QUEUE] Nenhum item pronto para processamento`);
        return;
      }

      console.log(`📋 [SYNC-QUEUE] Processando ${itens.data.length} item(s) da fila`);

      for (const item of itens.data) {
        await this.processarItem(item);
      }

      console.log(`✅ [SYNC-QUEUE] Processamento da fila concluído`);

    } catch (error) {
      console.error(`❌ [SYNC-QUEUE] Erro no processamento da fila:`, error);
    } finally {
      this.processandoFila = false;
    }
  }

  /**
   * Obtém itens prontos para processamento
   */
  private async obterItensProntos(agora: string): Promise<ServiceResult<SyncQueueItem[]>> {
    try {
      const result = await this.crudService.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
      
      if (!result.success || !result.data) {
        return { success: false, error: 'Erro ao buscar itens da fila' };
      }

      // Filtrar itens prontos para processamento
      const itensProntos = result.data.filter(item => {
        // Não ultrapassou max tentativas
        if (item.tentativas >= item.maxTentativas) {
          return false;
        }
        
        // Chegou a hora da próxima tentativa
        return item.proximaTentativa <= agora;
      });

      // Ordenar por prioridade e timestamp
      itensProntos.sort((a, b) => {
        if (a.prioridade !== b.prioridade) {
          return a.prioridade - b.prioridade; // Menor número = maior prioridade
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      return {
        success: true,
        data: itensProntos
      };
    } catch (error) {
      console.error(`❌ [SYNC-QUEUE] Erro ao obter itens prontos:`, error);
      return {
        success: false,
        error: 'Erro interno ao buscar itens'
      };
    }
  }

  /**
   * Processa um item individual da fila
   */
  private async processarItem(item: SyncQueueItem): Promise<void> {
    try {
      console.log(`🔄 [SYNC-QUEUE] Processando item ${item.id} (tentativa ${item.tentativas + 1}/${item.maxTentativas})`);

      let resultado: ServiceResult;

      switch (item.tipo) {
        case 'UPDATE_ITEM':
          resultado = await this.apiService.atualizarItem(item.entidade, item.dados, item.token);
          break;
        
        case 'UPLOAD_EVIDENCE':
          // TODO: Implementar quando tiver o serviço de upload
          resultado = { success: false, error: 'Upload de evidências não implementado ainda' };
          break;
        
        case 'COMPLETE_VISTORIA':
          // Implementar conclusão de vistoria via API
          const completionService = new (await import('../vistoria/VistoriaCompletionService')).VistoriaCompletionService();
          resultado = await completionService.sincronizarConclusao(
            item.vistoriaId,
            item.dados.observacoes || '',
            item.token,
            item.dados.forceComplete || false
          );
          break;
        
        default:
          resultado = { success: false, error: `Tipo de operação não suportado: ${item.tipo}` };
      }

      if (resultado.success) {
        console.log(`✅ [SYNC-QUEUE] Item ${item.id} sincronizado com sucesso`);
        await this.removerItem(item.id);
      } else {
        console.warn(`⚠️ [SYNC-QUEUE] Falha na sincronização do item ${item.id}: ${resultado.error}`);
        await this.atualizarTentativa(item, resultado.error || 'Erro desconhecido');
      }

    } catch (error) {
      console.error(`❌ [SYNC-QUEUE] Erro ao processar item ${item.id}:`, error);
      await this.atualizarTentativa(item, `Erro inesperado: ${error}`);
    }
  }

  /**
   * Atualiza as informações de tentativa de um item
   */
  private async atualizarTentativa(item: SyncQueueItem, erro: string): Promise<void> {
    try {
      const novasTentativas = item.tentativas + 1;
      
      if (novasTentativas >= item.maxTentativas) {
        console.error(`❌ [SYNC-QUEUE] Item ${item.id} excedeu máximo de tentativas - removendo da fila`);
        await this.removerItem(item.id);
        return;
      }

      // Calcular próxima tentativa com backoff exponencial
      const delayMinutos = Math.min(Math.pow(2, novasTentativas), 60); // Max 60 minutos
      const proximaTentativa = new Date(Date.now() + delayMinutos * 60 * 1000).toISOString();

      const itemAtualizado: SyncQueueItem = {
        ...item,
        tentativas: novasTentativas,
        proximaTentativa,
        ultimoErro: erro
      };

      await this.crudService.update(STORES.SYNC_QUEUE, itemAtualizado);
      
      console.log(`🔄 [SYNC-QUEUE] Item ${item.id} reagendado para ${new Date(proximaTentativa).toLocaleString()}`);

    } catch (error) {
      console.error(`❌ [SYNC-QUEUE] Erro ao atualizar tentativa do item ${item.id}:`, error);
    }
  }

  /**
   * Remove um item da fila
   */
  private async removerItem(itemId: string): Promise<void> {
    try {
      await this.crudService.delete(STORES.SYNC_QUEUE, itemId);
      console.log(`🗑️ [SYNC-QUEUE] Item ${itemId} removido da fila`);
    } catch (error) {
      console.error(`❌ [SYNC-QUEUE] Erro ao remover item ${itemId}:`, error);
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  async obterEstatisticas(): Promise<ServiceResult<{
    total: number;
    pendentes: number;
    comErro: number;
    porTipo: Record<string, number>;
  }>> {
    try {
      const result = await this.crudService.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
      
      if (!result.success || !result.data) {
        return { success: false, error: 'Erro ao buscar estatísticas' };
      }

      const itens = result.data;
      const agora = new Date().toISOString();

      const estatisticas = {
        total: itens.length,
        pendentes: itens.filter(item => item.proximaTentativa <= agora && item.tentativas < item.maxTentativas).length,
        comErro: itens.filter(item => item.ultimoErro && item.tentativas > 0).length,
        porTipo: itens.reduce((acc, item) => {
          acc[item.tipo] = (acc[item.tipo] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        success: true,
        data: estatisticas
      };
    } catch (error) {
      console.error(`❌ [SYNC-QUEUE] Erro ao obter estatísticas:`, error);
      return {
        success: false,
        error: 'Erro interno ao obter estatísticas'
      };
    }
  }

  /**
   * Limpa itens antigos da fila (mais de 7 dias)
   */
  async limparItensAntigos(): Promise<ServiceResult> {
    try {
      const result = await this.crudService.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
      
      if (!result.success || !result.data) {
        return { success: false, error: 'Erro ao buscar itens para limpeza' };
      }

      const setediasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const itensAntigos = result.data.filter(item => item.timestamp < setediasAtras);

      let removidos = 0;
      for (const item of itensAntigos) {
        await this.removerItem(item.id);
        removidos++;
      }

      console.log(`🧹 [SYNC-QUEUE] ${removidos} item(s) antigo(s) removido(s) da fila`);

      return {
        success: true,
        data: { removidos }
      };
    } catch (error) {
      console.error(`❌ [SYNC-QUEUE] Erro na limpeza de itens antigos:`, error);
      return {
        success: false,
        error: 'Erro interno na limpeza'
      };
    }
  }
} 