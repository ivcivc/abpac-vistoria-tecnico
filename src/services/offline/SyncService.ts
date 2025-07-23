import { SyncResult, SyncError, StorageStats, OFFLINE_CONFIG } from '@/types/offline';
import { OfflineOperation, STORES } from '@/types/storage';
import { CRUDService } from '@/services/storage/CRUDService';
import { IndexedDBService } from '@/services/storage/IndexedDBService';
import { buildApiUrl } from '@/config/api';
import { ConnectivityService } from './ConnectivityService';

// Tipos para melhor controle de priorização
export type SyncPriority = 'alta' | 'media' | 'baixa';
export type AutoSyncTrigger = 'connectivity_restored' | 'user_action' | 'periodic' | 'manual';

export interface SyncQueueStats {
  total: number;
  byPriority: Record<SyncPriority, number>;
  byEntity: Record<string, number>;
  oldestOperation: Date | null;
  avgRetries: number;
}

export interface EnhancedSyncResult extends SyncResult {
  trigger: AutoSyncTrigger;
  queueStats: SyncQueueStats;
  operationsProcessed: {
    priority: SyncPriority;
    entity: string;
    success: boolean;
    duration: number;
  }[];
}

export class SyncService {
  private static instance: SyncService;
  private crudService: CRUDService;
  private dbService: IndexedDBService;
  private connectivityService: ConnectivityService;
  private syncInProgress: boolean = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private lastConnectivityState: boolean = false;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  constructor() {
    this.crudService = new CRUDService();
    this.dbService = IndexedDBService.getInstance();
    this.connectivityService = ConnectivityService.getInstance();

    // Inicializar auto-sync quando instanciado
    this.initializeAutoSync();
  }

  /**
   * Inicializa o sistema de sincronização automática
   */
  private initializeAutoSync(): void {
    console.log('🔄 Inicializando sistema de auto-sync...');

    // Monitorar mudanças de conectividade
    this.startConnectivityMonitoring();

    // Configurar sincronização periódica
    this.startPeriodicSync();
  }

  /**
   * Monitora mudanças de conectividade para sync automático
   */
  private startConnectivityMonitoring(): void {
    setInterval(async () => {
      const currentState = this.connectivityService.canMakeServerRequests();

      // Se ficou online (connectivity restored)
      if (currentState && !this.lastConnectivityState) {
        console.log('📡 Conectividade restaurada - iniciando sync automático...');
        await this.syncAllDataEnhanced('connectivity_restored');
      }

      this.lastConnectivityState = currentState;
    }, OFFLINE_CONFIG.CONNECTIVITY_CHECK_INTERVAL);
  }

  /**
   * Inicia sincronização periódica quando online
   */
  private startPeriodicSync(): void {
    this.autoSyncInterval = setInterval(async () => {
      if (this.connectivityService.canMakeServerRequests() && !this.syncInProgress) {
        console.log('⏰ Executando sync periódico...');
        await this.syncAllDataEnhanced('periodic');
      }
    }, OFFLINE_CONFIG.SYNC_INTERVAL);
  }

  /**
   * Para o sistema de auto-sync
   */
  public stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('⏹️ Auto-sync parado');
    }
  }

  /**
   * Processa uma operação específica com o backend
   */
  private async processarOperacao(
    operacao: OfflineOperation
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (operacao.entidade) {
        case 'vistoria':
          return await this.syncVistoria(operacao);
        case 'item':
          return await this.syncItem(operacao);
        case 'evidencia':
          return await this.syncEvidencia(operacao);
        case 'despesa':
          return await this.syncDespesa(operacao);
        default:
          return { success: false, error: `Entidade não suportada: ${operacao.entidade}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Processa operação com retry inteligente e backoff exponencial
   */
  private async processarOperacaoComRetry(
    operacao: OfflineOperation
  ): Promise<{ success: boolean; error?: string }> {
    const maxRetries = OFFLINE_CONFIG.MAX_SYNC_RETRIES;
    let lastError = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Aplicar delay baseado no número de tentativas (backoff exponencial)
        if (attempt > 0) {
          const backoffDelay = this.calculateExponentialBackoff(attempt);
          console.log(
            `⏳ Aguardando ${backoffDelay}ms antes da tentativa ${attempt + 1}/${maxRetries + 1}`
          );
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }

        const resultado = await this.processarOperacao(operacao);

        if (resultado.success) {
          return resultado;
        }

        lastError = resultado.error || 'Erro desconhecido';
        console.warn(`⚠️ Tentativa ${attempt + 1}/${maxRetries + 1} falhou: ${lastError}`);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Erro desconhecido';
        console.warn(`⚠️ Exceção na tentativa ${attempt + 1}/${maxRetries + 1}: ${lastError}`);
      }
    }

    return { success: false, error: `Falha após ${maxRetries + 1} tentativas: ${lastError}` };
  }

  /**
   * Calcula delay de backoff exponencial
   */
  private calculateExponentialBackoff(attempt: number): number {
    const baseDelay = OFFLINE_CONFIG.RETRY_DELAY_BASE;
    const maxDelay = 30000; // Máximo de 30 segundos
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);

    // Adicionar jitter aleatório para evitar thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;

    return Math.min(maxDelay, exponentialDelay + jitter);
  }

  /**
   * Busca operações priorizadas (alta > media > baixa) e ordena por timestamp
   */
  private async getOperacoesPriorizadas(): Promise<OfflineOperation[]> {
    try {
      const resultOperacoes = await this.crudService.findBy<OfflineOperation>(
        STORES.SYNC_QUEUE,
        { field: 'prioridade', operator: 'contains', value: '' } // Buscar todas
      );

      if (!resultOperacoes.success || !resultOperacoes.data) {
        return [];
      }

      const operacoes = resultOperacoes.data;

      // Definir ordem de prioridade
      const prioridadeOrdem: Record<SyncPriority, number> = {
        alta: 1,
        media: 2,
        baixa: 3,
      };

      // Ordenar por prioridade primeiro, depois por timestamp (mais antigo primeiro)
      return operacoes.sort((a, b) => {
        const prioridadeA = prioridadeOrdem[a.prioridade as SyncPriority] || 99;
        const prioridadeB = prioridadeOrdem[b.prioridade as SyncPriority] || 99;

        if (prioridadeA !== prioridadeB) {
          return prioridadeA - prioridadeB;
        }

        // Se mesma prioridade, processar mais antigos primeiro
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
    } catch (error) {
      console.error('❌ Erro ao buscar operações priorizadas:', error);
      return [];
    }
  }

  /**
   * Aplica estratégia de retry inteligente
   */
  private async applyRetryStrategy(operacao: OfflineOperation, erro: string): Promise<boolean> {
    // Incrementar tentativas
    operacao.tentativas += 1;
    operacao.ultimaTentativa = new Date();
    operacao.erro = erro;

    // Verificar se ainda deve tentar
    if (operacao.tentativas >= OFFLINE_CONFIG.MAX_SYNC_RETRIES) {
      console.error(
        `❌ Falha permanente após ${operacao.tentativas} tentativas: ${operacao.entidade} ${operacao.id} - ${erro}`
      );
      await this.crudService.update(STORES.SYNC_QUEUE, operacao);
      return false; // Não deve tentar mais
    } else {
      // Atualizar na fila para próxima tentativa
      await this.crudService.update(STORES.SYNC_QUEUE, operacao);
      console.warn(
        `⚠️ Agendando retry ${operacao.tentativas}/${OFFLINE_CONFIG.MAX_SYNC_RETRIES}: ${operacao.entidade} ${operacao.id}`
      );
      return true; // Deve tentar novamente
    }
  }

  /**
   * Retorna delay baseado na prioridade da operação
   */
  private getDelayByPriority(prioridade: SyncPriority): number {
    const delays: Record<SyncPriority, number> = {
      alta: 50, // 50ms - mínimo delay para alta prioridade
      media: 100, // 100ms - delay médio
      baixa: 200, // 200ms - delay maior para baixa prioridade
    };

    return delays[prioridade] || 100;
  }

  /**
   * Obtém estatísticas detalhadas da fila de sincronização
   */
  private async getQueueStats(): Promise<SyncQueueStats> {
    try {
      const resultOperacoes = await this.crudService.findBy<OfflineOperation>(
        STORES.SYNC_QUEUE,
        { field: 'prioridade', operator: 'contains', value: '' } // Buscar todas
      );

      if (!resultOperacoes.success || !resultOperacoes.data) {
        return {
          total: 0,
          byPriority: { alta: 0, media: 0, baixa: 0 },
          byEntity: {},
          oldestOperation: null,
          avgRetries: 0,
        };
      }

      const operacoes = resultOperacoes.data;

      // Estatísticas por prioridade
      const byPriority: Record<SyncPriority, number> = {
        alta: operacoes.filter(op => op.prioridade === 'alta').length,
        media: operacoes.filter(op => op.prioridade === 'media').length,
        baixa: operacoes.filter(op => op.prioridade === 'baixa').length,
      };

      // Estatísticas por entidade
      const byEntity: Record<string, number> = {};
      operacoes.forEach(op => {
        byEntity[op.entidade] = (byEntity[op.entidade] || 0) + 1;
      });

      // Operação mais antiga
      const oldestOperation =
        operacoes.length > 0
          ? operacoes.reduce((oldest, current) =>
              new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
            ).timestamp
          : null;

      // Média de tentativas
      const avgRetries =
        operacoes.length > 0
          ? operacoes.reduce((sum, op) => sum + op.tentativas, 0) / operacoes.length
          : 0;

      return {
        total: operacoes.length,
        byPriority,
        byEntity,
        oldestOperation,
        avgRetries: Math.round(avgRetries * 100) / 100, // 2 casas decimais
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas da fila:', error);
      return {
        total: 0,
        byPriority: { alta: 0, media: 0, baixa: 0 },
        byEntity: {},
        oldestOperation: null,
        avgRetries: 0,
      };
    }
  }

  /**
   * Sincroniza operações de vistoria
   */
  private async syncVistoria(
    operacao: OfflineOperation
  ): Promise<{ success: boolean; error?: string }> {
    const { dados } = operacao;

    try {
      if (operacao.tipo === 'update') {
        // Concluir vistoria: POST /api/vistoria/:id/concluir
        const url = buildApiUrl(`/vistoria/${dados.id}/concluir`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dados.token}`, // Se necessário
          },
          body: JSON.stringify({
            observacoes: dados.observacoes || '',
            dataConclusao: dados.dataConclusao || new Date().toISOString(),
          }),
        });

        if (response.ok) {
          console.log(`✅ Vistoria ${dados.id} concluída no backend`);
          return { success: true };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: `HTTP ${response.status}: ${errorData.message || 'Erro ao concluir vistoria'}`,
          };
        }
      }

      return { success: false, error: `Operação não suportada para vistoria: ${operacao.tipo}` };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização da vistoria',
      };
    }
  }

  /**
   * Sincroniza operações de item
   */
  private async syncItem(
    operacao: OfflineOperation
  ): Promise<{ success: boolean; error?: string }> {
    const { dados } = operacao;

    try {
      if (operacao.tipo === 'update') {
        // Atualizar item: PUT /api/vistoria/item/:id
        const url = buildApiUrl(`/vistoria/item/${dados.id}`);

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dados.token}`, // Se necessário
          },
          body: JSON.stringify({
            status: dados.status,
            acao: dados.acao,
            numeroSerieNovo: dados.numeroSerieNovo,
            observacoes: dados.observacoes,
            localInstalacao: dados.localInstalacao,
            concluido: dados.concluido,
            dataConclusao: dados.dataConclusao,
          }),
        });

        if (response.ok) {
          console.log(`✅ Item ${dados.id} atualizado no backend`);
          return { success: true };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: `HTTP ${response.status}: ${errorData.message || 'Erro ao atualizar item'}`,
          };
        }
      }

      return { success: false, error: `Operação não suportada para item: ${operacao.tipo}` };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização do item',
      };
    }
  }

  /**
   * Sincroniza operações de evidência
   */
  private async syncEvidencia(
    operacao: OfflineOperation
  ): Promise<{ success: boolean; error?: string }> {
    // TODO: Implementar upload de evidências quando o backend tiver endpoint
    console.log('📸 Sincronização de evidências ainda não implementada');
    return { success: true }; // Por enquanto, considerar sucesso
  }

  /**
   * Sincroniza operações de despesa
   */
  private async syncDespesa(
    operacao: OfflineOperation
  ): Promise<{ success: boolean; error?: string }> {
    const { dados } = operacao;

    try {
      if (operacao.tipo === 'create') {
        // Adicionar despesa: POST /api/vistoria/:id/adicionar-despesa
        const url = buildApiUrl(`/vistoria/${dados.vistoriaId}/adicionar-despesa`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dados.token}`, // Se necessário
          },
          body: JSON.stringify({
            itemId: dados.itemId,
            categoria: dados.categoria,
            valor: dados.valor,
            descricao: dados.descricao,
            timestamp: dados.timestamp,
          }),
        });

        if (response.ok) {
          console.log(`✅ Despesa ${dados.id} enviada ao backend`);
          return { success: true };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: `HTTP ${response.status}: ${errorData.message || 'Erro ao adicionar despesa'}`,
          };
        }
      }

      return { success: false, error: `Operação não suportada para despesa: ${operacao.tipo}` };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização da despesa',
      };
    }
  }

  /**
   * Adiciona operação à fila de sincronização com priorização inteligente
   */
  async addToSyncQueue(
    tipo: 'create' | 'update' | 'delete',
    entidade: 'vistoria' | 'item' | 'evidencia' | 'despesa',
    dados: any,
    prioridade?: SyncPriority
  ): Promise<void> {
    // Se prioridade não especificada, determinar automaticamente
    if (!prioridade) {
      prioridade = this.determineAutomaticPriority(tipo, entidade, dados);
    }

    const operacao: OfflineOperation = {
      id: `${entidade}-${tipo}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      tipo,
      entidade,
      dados,
      prioridade,
      timestamp: new Date(),
      tentativas: 0,
    };

    await this.crudService.create(STORES.SYNC_QUEUE, operacao);
    console.log(
      `📥 Operação adicionada à fila [${prioridade.toUpperCase()}]: ${operacao.entidade} ${operacao.tipo} (${operacao.id})`
    );

    // Se está online e não há sync em andamento, tentar sync imediato para alta prioridade
    if (
      prioridade === 'alta' &&
      this.connectivityService.canMakeServerRequests() &&
      !this.syncInProgress
    ) {
      console.log('🚀 Iniciando sync imediato para operação de alta prioridade...');
      // Usar setTimeout para não bloquear
      setTimeout(() => this.syncAllDataEnhanced('user_action'), 100);
    }
  }

  /**
   * Determina prioridade automaticamente baseada no tipo e entidade
   */
  private determineAutomaticPriority(
    tipo: 'create' | 'update' | 'delete',
    entidade: 'vistoria' | 'item' | 'evidencia' | 'despesa',
    dados: any
  ): SyncPriority {
    // Conclusão de vistoria sempre alta prioridade
    if (entidade === 'vistoria' && tipo === 'update' && dados.concluida) {
      return 'alta';
    }

    // Criação de itens importantes = alta prioridade
    if (entidade === 'item' && tipo === 'update' && dados.concluido) {
      return 'alta';
    }

    // Despesas = prioridade média
    if (entidade === 'despesa') {
      return 'media';
    }

    // Evidências = prioridade baixa (grandes volumes)
    if (entidade === 'evidencia') {
      return 'baixa';
    }

    // Padrão = prioridade média
    return 'media';
  }

  /**
   * Força sincronização de operações de alta prioridade apenas
   */
  async syncHighPriorityOnly(): Promise<SyncResult> {
    console.log('⚡ Sync apenas operações de alta prioridade...');

    const resultOperacoes = await this.crudService.findBy<OfflineOperation>(STORES.SYNC_QUEUE, {
      field: 'prioridade',
      operator: 'equals',
      value: 'alta',
    });

    if (!resultOperacoes.success || !resultOperacoes.data || resultOperacoes.data.length === 0) {
      console.log('✅ Nenhuma operação de alta prioridade pendente');
      return {
        success: true,
        syncedItems: 0,
        failedItems: 0,
        errors: [],
        duration: 0,
        timestamp: new Date(),
      };
    }

    // Temporariamente filtrar apenas alta prioridade e executar sync
    const originalGetOperacoesPriorizadas = this.getOperacoesPriorizadas;
    this.getOperacoesPriorizadas = async () =>
      resultOperacoes.data!.filter(op => op.prioridade === 'alta');

    try {
      const result = await this.syncAllData();
      return result;
    } finally {
      // Restaurar método original
      this.getOperacoesPriorizadas = originalGetOperacoesPriorizadas;
    }
  }

  /**
   * Obtém estatísticas da fila (método público)
   */
  async getSyncQueueStats(): Promise<SyncQueueStats> {
    return this.getQueueStats();
  }

  /**
   * Limpa operações com muitas falhas da fila
   */
  async clearFailedOperations(
    maxTentativas: number = OFFLINE_CONFIG.MAX_SYNC_RETRIES
  ): Promise<number> {
    try {
      const resultOperacoes = await this.crudService.findBy<OfflineOperation>(STORES.SYNC_QUEUE, {
        field: 'tentativas',
        operator: 'greater',
        value: maxTentativas - 1,
      });

      if (!resultOperacoes.success || !resultOperacoes.data) {
        return 0;
      }

      const operacoesFalhadas = resultOperacoes.data.filter(op => op.tentativas >= maxTentativas);
      let removidas = 0;

      for (const operacao of operacoesFalhadas) {
        await this.crudService.delete(STORES.SYNC_QUEUE, operacao.id);
        removidas++;
        console.log(
          `🗑️ Removida operação falhada: ${operacao.entidade} ${operacao.id} (${operacao.tentativas} tentativas)`
        );
      }

      console.log(`🧹 Limpeza concluída: ${removidas} operações falhadas removidas`);
      return removidas;
    } catch (error) {
      console.error('❌ Erro na limpeza de operações falhadas:', error);
      return 0;
    }
  }

  /**
   * Cancela uma operação específica da fila
   */
  async cancelOperation(operationId: string): Promise<boolean> {
    try {
      const result = await this.crudService.delete(STORES.SYNC_QUEUE, operationId);
      if (result.success) {
        console.log(`🚫 Operação cancelada: ${operationId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao cancelar operação:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de armazenamento
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      const stats = await this.dbService.getStorageStats();

      // Contar itens em cada store
      const [vistoriasResult, itensResult, evidenciasResult, despesasResult, syncQueueResult] =
        await Promise.all([
          this.crudService.count(STORES.VISTORIAS),
          this.crudService.count(STORES.ITENS),
          this.crudService.count(STORES.EVIDENCIAS),
          this.crudService.count(STORES.DESPESAS),
          this.crudService.count(STORES.SYNC_QUEUE),
        ]);

      const totalUsage = stats.estimatedUsage || 0;
      const maxStorageBytes = OFFLINE_CONFIG.MAX_STORAGE_MB * 1024 * 1024;

      return {
        totalUsage,
        availableSpace: Math.max(0, maxStorageBytes - totalUsage),
        percentageUsed: (totalUsage / maxStorageBytes) * 100,
        itemCounts: {
          vistorias: vistoriasResult.success ? vistoriasResult.data || 0 : 0,
          itens: itensResult.success ? itensResult.data || 0 : 0,
          evidencias: evidenciasResult.success ? evidenciasResult.data || 0 : 0,
          despesas: despesasResult.success ? despesasResult.data || 0 : 0,
          syncQueue: syncQueueResult.success ? syncQueueResult.data || 0 : 0,
        },
        oldestItem: null, // TODO: Implementar se necessário
        newestItem: null, // TODO: Implementar se necessário
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        totalUsage: 0,
        availableSpace: OFFLINE_CONFIG.MAX_STORAGE_MB * 1024 * 1024,
        percentageUsed: 0,
        itemCounts: {
          vistorias: 0,
          itens: 0,
          evidencias: 0,
          despesas: 0,
          syncQueue: 0,
        },
        oldestItem: null,
        newestItem: null,
      };
    }
  }

  /**
   * Limpa dados antigos baseado na idade
   */
  async clearOldData(daysOld: number = OFFLINE_CONFIG.DATA_RETENTION_DAYS): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    console.log(`🧹 Limpando dados mais antigos que ${daysOld} dias (${cutoffDate.toISOString()})`);

    try {
      // TODO: Implementar limpeza baseada em timestamp quando estrutura suportar
      console.log('📝 Limpeza automática de dados antigos ainda não implementada');
    } catch (error) {
      console.error('❌ Erro na limpeza de dados:', error);
    }
  }

  /**
   * Verifica se há sincronização em andamento
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Conta operações pendentes
   */
  async getPendingSyncCount(): Promise<number> {
    try {
      const result = await this.crudService.count(STORES.SYNC_QUEUE);
      return result.success ? result.data || 0 : 0;
    } catch (error) {
      console.error('❌ Erro ao contar operações pendentes:', error);
      return 0;
    }
  }

  /**
   * Obtém contagem de operações por prioridade
   */
  async getPendingSyncCountByPriority(): Promise<Record<SyncPriority, number>> {
    try {
      const stats = await this.getQueueStats();
      return stats.byPriority;
    } catch (error) {
      console.error('❌ Erro ao contar operações por prioridade:', error);
      return { alta: 0, media: 0, baixa: 0 };
    }
  }

  /**
   * Método para limpeza quando o serviço for destruído
   */
  destroy(): void {
    console.log('🛑 Destruindo SyncService...');
    this.stopAutoSync();
    // Limpar instance para permitir nova criação
    SyncService.instance = null as any;
  }

  /**
   * Obtém próxima operação de alta prioridade para preview
   */
  async getNextHighPriorityOperation(): Promise<OfflineOperation | null> {
    try {
      const operacoesPriorizadas = await this.getOperacoesPriorizadas();
      const altaPrioridade = operacoesPriorizadas.find(op => op.prioridade === 'alta');
      return altaPrioridade || null;
    } catch (error) {
      console.error('❌ Erro ao buscar próxima operação de alta prioridade:', error);
      return null;
    }
  }

  /**
   * Pausa temporariamente o auto-sync
   */
  pauseAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('⏸️ Auto-sync pausado');
    }
  }

  /**
   * Retoma o auto-sync
   */
  resumeAutoSync(): void {
    if (!this.autoSyncInterval) {
      this.startPeriodicSync();
      console.log('▶️ Auto-sync retomado');
    }
  }

  /**
   * Método para teste - força trigger de connectivity restored
   */
  async forceConnectivityRestoredSync(): Promise<EnhancedSyncResult> {
    console.log('🧪 Forçando sync por connectivity restored (TESTE)...');
    return this.syncAllDataEnhanced('connectivity_restored');
  }

  /**
   * Sincroniza todos os dados com priorização inteligente e retry com backoff exponencial
   */
  async syncAllDataEnhanced(trigger: AutoSyncTrigger = 'manual'): Promise<EnhancedSyncResult> {
    const startTime = Date.now();
    console.log(`🔄 Iniciando sync inteligente (trigger: ${trigger})...`);

    if (this.syncInProgress) {
      console.warn('⚠️ Sincronização já em andamento');
      const queueStats = await this.getQueueStats();
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: [
          {
            id: 'sync-in-progress',
            tipo: 'vistoria',
            operacao: 'update',
            erro: 'Sincronização já em andamento',
            timestamp: new Date(),
            tentativas: 0,
          },
        ],
        duration: Date.now() - startTime,
        timestamp: new Date(),
        trigger,
        queueStats,
        operationsProcessed: [],
      };
    }

    this.syncInProgress = true;

    try {
      // Verificar conectividade primeiro
      if (!this.connectivityService.canMakeServerRequests()) {
        throw new Error('Sem conexão com o servidor');
      }

      // Buscar e priorizar operações
      const operacoesPriorizadas = await this.getOperacoesPriorizadas();

      if (operacoesPriorizadas.length === 0) {
        console.log('✅ Nenhuma operação pendente para sincronizar');
        const queueStats = await this.getQueueStats();
        return {
          success: true,
          syncedItems: 0,
          failedItems: 0,
          errors: [],
          duration: Date.now() - startTime,
          timestamp: new Date(),
          trigger,
          queueStats,
          operationsProcessed: [],
        };
      }

      console.log(`📋 ${operacoesPriorizadas.length} operações priorizadas encontradas`);

      let syncedCount = 0;
      let failedCount = 0;
      const errors: SyncError[] = [];
      const operationsProcessed: EnhancedSyncResult['operationsProcessed'] = [];

      // Processar cada operação com estratégia inteligente
      for (const operacao of operacoesPriorizadas) {
        const operationStart = Date.now();

        try {
          console.log(
            `🔄 Processando [${operacao.prioridade.toUpperCase()}]: ${operacao.tipo} ${operacao.entidade} (${operacao.id})`
          );

          const resultado = await this.processarOperacaoComRetry(operacao);
          const operationDuration = Date.now() - operationStart;

          if (resultado.success) {
            // Remover da fila de sincronização
            await this.crudService.delete(STORES.SYNC_QUEUE, operacao.id);
            syncedCount++;
            console.log(
              `✅ Sincronizado [${operacao.prioridade.toUpperCase()}]: ${operacao.entidade} ${operacao.id} (${operationDuration}ms)`
            );

            operationsProcessed.push({
              priority: operacao.prioridade as SyncPriority,
              entity: operacao.entidade,
              success: true,
              duration: operationDuration,
            });
          } else {
            failedCount++;
            operationsProcessed.push({
              priority: operacao.prioridade as SyncPriority,
              entity: operacao.entidade,
              success: false,
              duration: operationDuration,
            });

            // Aplicar estratégia de retry inteligente
            const shouldRetry = await this.applyRetryStrategy(
              operacao,
              resultado.error || 'Erro desconhecido'
            );

            if (!shouldRetry) {
              errors.push({
                id: operacao.id,
                tipo: operacao.entidade as any,
                operacao: operacao.tipo as any,
                erro: resultado.error || 'Erro desconhecido',
                timestamp: new Date(),
                tentativas: operacao.tentativas,
                dados: operacao.dados,
              });
            }
          }

          // Delay proporcional à prioridade (alta = menos delay)
          const delay = this.getDelayByPriority(operacao.prioridade as SyncPriority);
          await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
          const operationDuration = Date.now() - operationStart;
          console.error(`❌ Erro ao processar operação ${operacao.id}:`, error);
          failedCount++;

          operationsProcessed.push({
            priority: operacao.prioridade as SyncPriority,
            entity: operacao.entidade,
            success: false,
            duration: operationDuration,
          });
        }
      }

      const queueStats = await this.getQueueStats();
      const resultado: EnhancedSyncResult = {
        success: syncedCount > 0 || (syncedCount === 0 && failedCount === 0),
        syncedItems: syncedCount,
        failedItems: failedCount,
        errors,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        trigger,
        queueStats,
        operationsProcessed,
      };

      console.log(
        `✅ Sync [${trigger}] concluído: ${syncedCount} sucesso, ${failedCount} falhas (${resultado.duration}ms)`
      );

      return resultado;
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      const queueStats = await this.getQueueStats();

      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: [
          {
            id: 'sync-error',
            tipo: 'vistoria',
            operacao: 'update',
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date(),
            tentativas: 0,
          },
        ],
        duration: Date.now() - startTime,
        timestamp: new Date(),
        trigger,
        queueStats,
        operationsProcessed: [],
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Mantém compatibilidade com versão anterior
   */
  async syncAllData(): Promise<SyncResult> {
    const enhancedResult = await this.syncAllDataEnhanced('manual');

    // Retornar apenas os campos do SyncResult original
    return {
      success: enhancedResult.success,
      syncedItems: enhancedResult.syncedItems,
      failedItems: enhancedResult.failedItems,
      errors: enhancedResult.errors,
      duration: enhancedResult.duration,
      timestamp: enhancedResult.timestamp,
    };
  }
}
