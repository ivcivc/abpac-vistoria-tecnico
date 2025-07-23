import { IndexedDBService } from '../IndexedDBService';
import { STORES } from '@/types/storage';

describe('IndexedDBService', () => {
  let service: IndexedDBService;

  beforeEach(() => {
    service = IndexedDBService.getInstance();
    // Resetar a instância para cada teste
    (IndexedDBService as any).instance = null;
    service = IndexedDBService.getInstance();
  });

  afterEach(() => {
    service.close();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar sempre a mesma instância', () => {
      const instance1 = IndexedDBService.getInstance();
      const instance2 = IndexedDBService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Inicialização', () => {
    it('deve inicializar o banco de dados com sucesso', async () => {
      expect(service.isInitialized()).toBe(false);

      await service.initialize();

      expect(service.isInitialized()).toBe(true);
    });

    it('deve criar todas as stores necessárias', async () => {
      await service.initialize();

      const transaction = service.getTransaction(Object.values(STORES));

      Object.values(STORES).forEach(storeName => {
        expect(() => service.getStore(transaction, storeName)).not.toThrow();
      });
    });

    it('deve falhar se IndexedDB não estiver disponível', async () => {
      // Simular que IndexedDB não está disponível
      const originalIndexedDB = global.indexedDB;
      delete (global as any).indexedDB;

      await expect(service.initialize()).rejects.toThrow(
        'IndexedDB não é suportado neste navegador'
      );

      // Restaurar IndexedDB
      global.indexedDB = originalIndexedDB;
    });
  });

  describe('Transações', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('deve criar transação para uma única store', () => {
      const transaction = service.getTransaction(STORES.VISTORIAS);

      expect(transaction).toBeDefined();
      expect(transaction.mode).toBe('readonly');
      expect(Array.from(transaction.objectStoreNames)).toContain(STORES.VISTORIAS);
    });

    it('deve criar transação para múltiplas stores', () => {
      const storeNames = [STORES.VISTORIAS, STORES.ITENS];
      const transaction = service.getTransaction(storeNames, 'readwrite');

      expect(transaction).toBeDefined();
      expect(transaction.mode).toBe('readwrite');
      storeNames.forEach(storeName => {
        expect(Array.from(transaction.objectStoreNames)).toContain(storeName);
      });
    });

    it('deve falhar ao criar transação sem inicializar', () => {
      service.close();

      expect(() => service.getTransaction(STORES.VISTORIAS)).toThrow(
        'Banco de dados não inicializado. Chame initialize() primeiro.'
      );
    });
  });

  describe('Estatísticas de Armazenamento', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('deve retornar estatísticas de uso', async () => {
      const stats = await service.getStorageStats();

      expect(stats).toHaveProperty('estimatedUsage');
      expect(stats).toHaveProperty('quota');
      expect(stats).toHaveProperty('usagePercentage');
      expect(stats.usagePercentage).toBeGreaterThanOrEqual(0);
      expect(stats.usagePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Limpeza de Dados', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('deve limpar todos os dados', async () => {
      // Adicionar alguns dados primeiro
      const transaction = service.getTransaction(STORES.VISTORIAS, 'readwrite');
      const store = service.getStore(transaction, STORES.VISTORIAS);

      const testData = {
        id: 'test-1',
        token: 'test-token',
        tecnico: { nome: 'Test', identificacao: '123' },
        veiculo: { placa: 'ABC-1234', modelo: 'Test', cor: 'Branco', ano: 2023 },
        local: 'Test Location',
        dataAgendada: new Date(),
        status: 'pendente' as const,
        sincronizada: false,
        observacoes: 'Test',
        progresso: 0,
        itens: [],
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(testData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Verificar que dados existem
      await new Promise<void>((resolve, reject) => {
        const readTransaction = service.getTransaction(STORES.VISTORIAS, 'readonly');
        const readStore = service.getStore(readTransaction, STORES.VISTORIAS);
        const countRequest = readStore.count();

        countRequest.onsuccess = () => {
          expect(countRequest.result).toBeGreaterThan(0);
          resolve();
        };
        countRequest.onerror = () => reject(countRequest.error);
      });

      // Limpar todos os dados
      await service.clearAllData();

      // Verificar que dados foram removidos
      await new Promise<void>((resolve, reject) => {
        const readTransaction = service.getTransaction(STORES.VISTORIAS, 'readonly');
        const readStore = service.getStore(readTransaction, STORES.VISTORIAS);
        const countRequest = readStore.count();

        countRequest.onsuccess = () => {
          expect(countRequest.result).toBe(0);
          resolve();
        };
        countRequest.onerror = () => reject(countRequest.error);
      });
    });

    it('deve falhar ao limpar dados sem inicializar', async () => {
      service.close();

      await expect(service.clearAllData()).rejects.toThrow('Banco de dados não inicializado');
    });
  });

  describe('Fechamento', () => {
    it('deve fechar a conexão corretamente', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);

      service.close();
      expect(service.isInitialized()).toBe(false);
    });
  });
});
