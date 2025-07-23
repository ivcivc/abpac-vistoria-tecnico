import { STORES, DatabaseStore, StoreNames } from '@/types/storage';

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
  async getStorageStats(): Promise<{
    estimatedUsage: number;
    quota: number;
    usagePercentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;

      return {
        estimatedUsage: usage,
        quota: quota,
        usagePercentage: quota > 0 ? Math.round((usage / quota) * 100) : 0,
      };
    }

    return {
      estimatedUsage: 0,
      quota: 0,
      usagePercentage: 0,
    };
  }

  /**
   * Limpa todos os dados do banco (útil para desenvolvimento e reset)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      throw new Error('Banco de dados não inicializado');
    }

    const transaction = this.getTransaction(Object.values(STORES), 'readwrite');

    const promises = Object.values(STORES).map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const store = this.getStore(transaction, storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Erro ao limpar store ${storeName}`));
      });
    });

    await Promise.all(promises);
    console.log('🧹 Todos os dados foram limpos do IndexedDB');
  }
}
