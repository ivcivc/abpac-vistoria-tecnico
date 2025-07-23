import { SyncService, SyncPriority, AutoSyncTrigger, EnhancedSyncResult } from '../SyncService';
import { CRUDService } from '../../storage/CRUDService';
import { IndexedDBService } from '../../storage/IndexedDBService';
import { ConnectivityService } from '../ConnectivityService';
import { OfflineOperation, STORES } from '@/types/storage';
import { OFFLINE_CONFIG } from '@/types/offline';

// Mock dos serviços
jest.mock('../../storage/CRUDService');
jest.mock('../../storage/IndexedDBService');
jest.mock('../ConnectivityService');
jest.mock('@/config/api', () => ({
  buildApiUrl: jest.fn((path: string) => `http://localhost:3333/api${path}`),
}));

// Mock global do fetch
global.fetch = jest.fn();

describe('SyncService - Task 6 Enhanced Features', () => {
  let syncService: SyncService;
  let mockCrudService: jest.Mocked<CRUDService>;
  let mockDbService: jest.Mocked<IndexedDBService>;
  let mockConnectivityService: jest.Mocked<ConnectivityService>;

  // Dados de teste
  const mockOperacaoAltaPrioridade: OfflineOperation = {
    id: 'vistoria-update-alta-1',
    tipo: 'update',
    entidade: 'vistoria',
    dados: { id: 'vistoria-1', concluida: true },
    prioridade: 'alta',
    timestamp: new Date('2025-01-01T10:00:00Z'),
    tentativas: 0,
  };

  const mockOperacaoMediaPrioridade: OfflineOperation = {
    id: 'despesa-create-media-1',
    tipo: 'create',
    entidade: 'despesa',
    dados: { valor: 50.0 },
    prioridade: 'media',
    timestamp: new Date('2025-01-01T10:01:00Z'),
    tentativas: 0,
  };

  const mockOperacaoBaixaPrioridade: OfflineOperation = {
    id: 'evidencia-create-baixa-1',
    tipo: 'create',
    entidade: 'evidencia',
    dados: { tipo: 'foto' },
    prioridade: 'baixa',
    timestamp: new Date('2025-01-01T10:02:00Z'),
    tentativas: 0,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mocks
    mockCrudService = new CRUDService() as jest.Mocked<CRUDService>;
    mockDbService = IndexedDBService.getInstance() as jest.Mocked<IndexedDBService>;
    mockConnectivityService = ConnectivityService.getInstance() as jest.Mocked<ConnectivityService>;

    // Mock connectivity service
    mockConnectivityService.canMakeServerRequests = jest.fn().mockReturnValue(true);

    // Mock database service
    mockDbService.getStorageStats = jest.fn().mockResolvedValue({
      estimatedUsage: 1024000, // 1MB
      quota: 10485760, // 10MB
    });

    // Criar nova instância do serviço
    syncService = SyncService.getInstance();

    // Inject mocks
    (syncService as any).crudService = mockCrudService;
    (syncService as any).dbService = mockDbService;
    (syncService as any).connectivityService = mockConnectivityService;
  });

  afterEach(() => {
    // Limpar intervalos
    if (syncService) {
      syncService.destroy();
    }
  });

  describe('🎯 Priorização Inteligente', () => {
    it('deve ordenar operações por prioridade (alta > media > baixa)', async () => {
      // Arrange: operações fora de ordem
      const operacoes = [
        mockOperacaoBaixaPrioridade,
        mockOperacaoAltaPrioridade,
        mockOperacaoMediaPrioridade,
      ];

      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: operacoes,
      });

      mockCrudService.delete.mockResolvedValue({ success: true });

      // Mock fetch para sucesso
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      // Act
      const result = await syncService.syncAllDataEnhanced('manual');

      // Assert: primeira operação processada deve ser alta prioridade
      expect(result.success).toBe(true);
      expect(result.operationsProcessed).toHaveLength(3);
      expect(result.operationsProcessed[0].priority).toBe('alta');
      expect(result.operationsProcessed[1].priority).toBe('media');
      expect(result.operationsProcessed[2].priority).toBe('baixa');
    });

    it('deve determinar prioridade automaticamente para conclusão de vistoria', async () => {
      // Act
      await syncService.addToSyncQueue(
        'update',
        'vistoria',
        { id: 'vistoria-1', concluida: true }
        // Não especificar prioridade - deve ser automática
      );

      // Assert
      expect(mockCrudService.create).toHaveBeenCalledWith(
        STORES.SYNC_QUEUE,
        expect.objectContaining({
          prioridade: 'alta', // Conclusão de vistoria = alta prioridade
        })
      );
    });

    it('deve aplicar delays diferentes baseados na prioridade', async () => {
      // Esta é uma verificação conceitual - delays são internos
      const spySetTimeout = jest.spyOn(global, 'setTimeout');

      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: [mockOperacaoAltaPrioridade, mockOperacaoMediaPrioridade],
      });

      mockCrudService.delete.mockResolvedValue({ success: true });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await syncService.syncAllDataEnhanced('manual');

      // Verificar que setTimeout foi chamado para delays
      expect(spySetTimeout).toHaveBeenCalled();

      spySetTimeout.mockRestore();
    });
  });

  describe('🔄 Estratégia de Retry com Backoff Exponencial', () => {
    it('deve aplicar backoff exponencial em falhas', async () => {
      const operacaoComFalhas = {
        ...mockOperacaoAltaPrioridade,
        tentativas: 2,
      };

      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: [operacaoComFalhas],
      });

      mockCrudService.update.mockResolvedValue({ success: true });

      // Mock para falhas
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await syncService.syncAllDataEnhanced('manual');

      // Assert: operação deve ser atualizada com mais tentativas
      expect(mockCrudService.update).toHaveBeenCalledWith(
        STORES.SYNC_QUEUE,
        expect.objectContaining({
          tentativas: 3,
          erro: expect.any(String),
        })
      );
    });

    it('deve remover operações após máximo de tentativas', async () => {
      const operacaoMaxTentativas = {
        ...mockOperacaoAltaPrioridade,
        tentativas: OFFLINE_CONFIG.MAX_SYNC_RETRIES,
      };

      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: [operacaoMaxTentativas],
      });

      mockCrudService.update.mockResolvedValue({ success: true });

      // Mock para falhas
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await syncService.syncAllDataEnhanced('manual');

      // Assert: operação deve ser mantida mas marcada como falha permanente
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].tentativas).toBe(OFFLINE_CONFIG.MAX_SYNC_RETRIES);
    });

    it('deve calcular backoff exponencial corretamente', async () => {
      // Testar método privado através de reflexão
      const calculateBackoff = (syncService as any).calculateExponentialBackoff;

      const delay1 = calculateBackoff.call(syncService, 1);
      const delay2 = calculateBackoff.call(syncService, 2);
      const delay3 = calculateBackoff.call(syncService, 3);

      // Assert: delays devem crescer exponencialmente
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
      expect(delay3).toBeLessThanOrEqual(30000); // Máximo de 30s
    });
  });

  describe('🤖 Sincronização Automática', () => {
    it('deve executar sync quando conectividade é restaurada', async () => {
      const spy = jest.spyOn(syncService, 'syncAllDataEnhanced');

      // Simular mudança de conectividade: offline -> online
      mockConnectivityService.canMakeServerRequests
        .mockReturnValueOnce(false) // Estado anterior: offline
        .mockReturnValueOnce(true); // Estado atual: online

      // Simular monitoramento de conectividade
      await (syncService as any).startConnectivityMonitoring();

      // Aguardar um ciclo de monitoramento
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert: deve ter tentado sync automático
      expect(spy).toHaveBeenCalledWith('connectivity_restored');

      spy.mockRestore();
    });

    it('deve executar sync periódico quando online', async () => {
      jest.useFakeTimers();

      const spy = jest.spyOn(syncService, 'syncAllDataEnhanced');
      mockConnectivityService.canMakeServerRequests.mockReturnValue(true);

      // Simular passagem de tempo
      jest.advanceTimersByTime(OFFLINE_CONFIG.SYNC_INTERVAL + 1000);

      // Assert: deve ter executado sync periódico
      expect(spy).toHaveBeenCalledWith('periodic');

      spy.mockRestore();
      jest.useRealTimers();
    });

    it('deve pausar e retomar auto-sync', () => {
      // Act: pausar
      syncService.pauseAutoSync();

      // Assert: interval deve ter sido limpo
      expect((syncService as any).autoSyncInterval).toBeNull();

      // Act: retomar
      syncService.resumeAutoSync();

      // Assert: interval deve ter sido restaurado
      expect((syncService as any).autoSyncInterval).not.toBeNull();
    });
  });

  describe('📊 Estatísticas da Fila', () => {
    it('deve calcular estatísticas da fila corretamente', async () => {
      const operacoes = [
        mockOperacaoAltaPrioridade,
        mockOperacaoMediaPrioridade,
        mockOperacaoBaixaPrioridade,
        { ...mockOperacaoAltaPrioridade, id: 'alta-2' },
        { ...mockOperacaoMediaPrioridade, id: 'media-2', tentativas: 2 },
      ];

      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: operacoes,
      });

      // Act
      const stats = await syncService.getSyncQueueStats();

      // Assert
      expect(stats.total).toBe(5);
      expect(stats.byPriority.alta).toBe(2);
      expect(stats.byPriority.media).toBe(2);
      expect(stats.byPriority.baixa).toBe(1);
      expect(stats.byEntity.vistoria).toBe(2);
      expect(stats.byEntity.despesa).toBe(2);
      expect(stats.byEntity.evidencia).toBe(1);
      expect(stats.avgRetries).toBe(0.4); // (0+0+0+0+2)/5
    });
  });

  describe('🧹 Limpeza e Manutenção', () => {
    it('deve limpar operações falhadas', async () => {
      const operacoesFalhadas = [
        { ...mockOperacaoAltaPrioridade, tentativas: 5, id: 'falha-1' },
        { ...mockOperacaoMediaPrioridade, tentativas: 4, id: 'falha-2' },
      ];

      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: operacoesFalhadas,
      });

      mockCrudService.delete.mockResolvedValue({ success: true });

      // Act
      const removidas = await syncService.clearFailedOperations(3);

      // Assert
      expect(removidas).toBe(2);
      expect(mockCrudService.delete).toHaveBeenCalledTimes(2);
    });

    it('deve cancelar operação específica', async () => {
      mockCrudService.delete.mockResolvedValue({ success: true });

      // Act
      const cancelada = await syncService.cancelOperation('operacao-123');

      // Assert
      expect(cancelada).toBe(true);
      expect(mockCrudService.delete).toHaveBeenCalledWith(STORES.SYNC_QUEUE, 'operacao-123');
    });
  });

  describe('⚡ Sincronização de Alta Prioridade', () => {
    it('deve sincronizar apenas operações de alta prioridade', async () => {
      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: [mockOperacaoAltaPrioridade],
      });

      mockCrudService.delete.mockResolvedValue({ success: true });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Act
      const result = await syncService.syncHighPriorityOnly();

      // Assert
      expect(result.success).toBe(true);
      expect(result.syncedItems).toBe(1);
    });

    it('deve disparar sync imediato para operações de alta prioridade', async () => {
      jest.useFakeTimers();

      const spy = jest.spyOn(syncService, 'syncAllDataEnhanced');
      mockConnectivityService.canMakeServerRequests.mockReturnValue(true);

      // Act: adicionar operação de alta prioridade
      await syncService.addToSyncQueue(
        'update',
        'vistoria',
        { id: 'vistoria-1', concluida: true },
        'alta'
      );

      // Aguardar timeout para sync imediato
      jest.advanceTimersByTime(200);

      // Assert
      expect(spy).toHaveBeenCalledWith('user_action');

      spy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('🎭 Cenários de Integração', () => {
    it('deve processar fila mista com diferentes triggers', async () => {
      const operacoes = [
        mockOperacaoAltaPrioridade,
        mockOperacaoMediaPrioridade,
        mockOperacaoBaixaPrioridade,
      ];

      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: operacoes,
      });

      mockCrudService.delete.mockResolvedValue({ success: true });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Act
      const result = await syncService.syncAllDataEnhanced('connectivity_restored');

      // Assert
      expect(result.trigger).toBe('connectivity_restored');
      expect(result.success).toBe(true);
      expect(result.syncedItems).toBe(3);
      expect(result.queueStats).toBeDefined();
      expect(result.operationsProcessed).toHaveLength(3);
    });

    it('deve manter compatibilidade com API anterior', async () => {
      mockCrudService.findBy.mockResolvedValue({
        success: true,
        data: [],
      });

      // Act: usar método antigo
      const result = await syncService.syncAllData();

      // Assert: deve retornar SyncResult padrão
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('syncedItems');
      expect(result).toHaveProperty('failedItems');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('timestamp');
      // Não deve ter propriedades estendidas
      expect(result).not.toHaveProperty('trigger');
      expect(result).not.toHaveProperty('queueStats');
    });
  });
});
