import { STORES, DatabaseStore, StoreNames } from '@/types/storage';

/**
 * Serviço para interação com IndexedDB
 */

export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'VistoriaABPAC';
  private readonly dbVersion = 2; // Incrementada para incluir VISTORIAS_LOCAIS

  // Definição das stores do banco de dados
  private readonly stores: DatabaseStore[] = [
    {
      name: STORES.VISTORIAS,
      keyPath: 'id',
      indexes: [
        { name: 'status', keyPath: 'status' },
        { name: 'sincronizada', keyPath: 'sincronizada' },
        { name: 'dataAgendada', keyPath: 'dataAgendada' },
        { name: 'token', keyPath: 'token', unique: true },
      ],
    },
    {
      name: STORES.VISTORIAS_LOCAIS,
      keyPath: 'id',
      indexes: [
        { name: 'token', keyPath: 'token' },
        { name: 'status', keyPath: 'status' },
        { name: 'dataAgendada', keyPath: 'dataAgendada' },
        { name: 'dataAcesso', keyPath: 'dataAcesso' },
        { name: 'local', keyPath: 'local' },
        { name: 'tecnicoNome', keyPath: 'tecnicoNome' },
        { name: 'veiculo_placa', keyPath: 'veiculo.placa' },
      ],
    },
    {
      name: STORES.ITENS,
      keyPath: 'id',
      indexes: [
        { name: 'vistoriaId', keyPath: 'vistoriaId' },
        { name: 'status', keyPath: 'status' },
        { name: 'concluido', keyPath: 'concluido' },
        { name: 'acao', keyPath: 'acao' },
      ],
    },
    {
      name: STORES.EVIDENCIAS,
      keyPath: 'id',
      indexes: [
        { name: 'itemId', keyPath: 'itemId' },
        { name: 'tipo', keyPath: 'tipo' },
        { name: 'tipoEvidencia', keyPath: 'tipoEvidencia' },
        { name: 'timestamp', keyPath: 'timestamp' },
      ],
    },
    {
      name: STORES.DESPESAS,
      keyPath: 'id',
      indexes: [
        { name: 'itemId', keyPath: 'itemId' },
        { name: 'vistoriaId', keyPath: 'vistoriaId' },
        { name: 'categoria', keyPath: 'categoria' },
        { name: 'timestamp', keyPath: 'timestamp' },
      ],
    },
    {
      name: STORES.SYNC_QUEUE,
      keyPath: 'id',
      indexes: [
        { name: 'tipo', keyPath: 'tipo' },
        { name: 'entidade', keyPath: 'entidade' },
        { name: 'prioridade', keyPath: 'prioridade' },
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'tentativas', keyPath: 'tentativas' },
      ],
    },
    {
      name: STORES.CONFIG,
      keyPath: 'id',
      indexes: [
        { name: 'chave', keyPath: 'chave', unique: true },
        { name: 'timestamp', keyPath: 'timestamp' },
      ],
    },
  ];

  private constructor() {}

  static getInstance(): IndexedDBService {
    if (typeof window === 'undefined') {
      // Mock para SSR
      return new IndexedDBService();
    }
    
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  /**
   * Inicializa o banco de dados IndexedDB
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB não é suportado neste navegador'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Erro ao abrir banco de dados: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('📦 IndexedDB inicializado com sucesso');

        // Configurar handler para erros não capturados
        this.db.onerror = event => {
          console.error('❌ Erro no IndexedDB:', event);
        };

        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 Atualizando estrutura do banco de dados...');

        this.createStores(db);
      };
    });
  }

  /**
   * Cria as stores do banco de dados
   */
  private createStores(db: IDBDatabase): void {
    this.stores.forEach(storeConfig => {
      // Remover store existente se já existe (para atualizações)
      if (db.objectStoreNames.contains(storeConfig.name)) {
        db.deleteObjectStore(storeConfig.name);
      }

      // Criar nova store
      const store = db.createObjectStore(storeConfig.name, {
        keyPath: storeConfig.keyPath,
      });

      // Criar índices
      storeConfig.indexes?.forEach(indexConfig => {
        store.createIndex(indexConfig.name, indexConfig.keyPath, {
          unique: indexConfig.unique || false,
        });
      });

      console.log(
        `✅ Store '${storeConfig.name}' criada com ${storeConfig.indexes?.length || 0} índices`
      );
    });
  }

  /**
   * Obtém uma transaction para uma ou múltiplas stores
   */
  getTransaction(
    storeNames: StoreNames | StoreNames[],
    mode: IDBTransactionMode = 'readonly'
  ): IDBTransaction {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado. Chame initialize() primeiro.');
    }

    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    return this.db.transaction(stores, mode);
  }

  /**
   * Obtém uma object store
   */
  getStore(transaction: IDBTransaction, storeName: StoreNames): IDBObjectStore {
    return transaction.objectStore(storeName);
  }

  /**
   * Verifica se o banco está inicializado
   */
  isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('📦 Conexão IndexedDB fechada');
    }
  }

  /**
   * Obtém estatísticas de uso do armazenamento
   */
  async getStorageStats(): Promise<{ quota: number; estimatedUsage: number; usagePercentage: number }> {
    if (typeof window === 'undefined') {
      return {
        quota: 0,
        estimatedUsage: 0,
        usagePercentage: 0
      };
    }
    
    try {
      // Usar API de estimativa de armazenamento
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0;

        return {
          quota,
          estimatedUsage: usage,
          usagePercentage: percentage
        };
      }

      // Fallback para browsers sem suporte à API de estimativa
      return {
        quota: 0,
        estimatedUsage: 0,
        usagePercentage: 0
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de armazenamento:', error);
      return {
        quota: 0,
        estimatedUsage: 0,
        usagePercentage: 0
      };
    }
  }

  /**
   * Limpa completamente o banco IndexedDB
   */
  async clearAllData(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Obter lista de bancos de dados
      const databases = await indexedDB.databases();

      // Deletar cada banco
      for (const db of databases) {
        if (db.name) {
          console.log(`🗑️ Deletando banco: ${db.name}`);
          await this.deleteDatabase(db.name);
        }
      }

      console.log('✅ Todos os bancos IndexedDB foram limpos');
    } catch (error) {
      console.error('❌ Erro ao limpar IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Deleta um banco de dados específico
   */
  private async deleteDatabase(dbName: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Erro ao deletar banco ${dbName}`));
      };

      request.onblocked = () => {
        console.warn(`⚠️ Deleção do banco ${dbName} bloqueada - feche todas as abas do aplicativo`);
        // Tentar novamente após um tempo
        setTimeout(() => resolve(), 1000);
      };
    });
  }
}
