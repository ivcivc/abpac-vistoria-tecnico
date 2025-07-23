import { useState, useCallback, useEffect } from 'react';
import { CRUDService } from '@/services/storage/CRUDService';
import { IndexedDBService } from '@/services/storage/IndexedDBService';
import { StoreNames, StorageResult, StorageQuery } from '@/types/storage';

interface UseStorageState<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
}

interface UseStorageActions<T> {
  create: (item: T) => Promise<StorageResult<T>>;
  getById: (id: string) => Promise<StorageResult<T>>;
  getAll: () => Promise<StorageResult<T[]>>;
  findBy: (query: StorageQuery) => Promise<StorageResult<T[]>>;
  update: (item: T) => Promise<StorageResult<T>>;
  upsert: (item: T) => Promise<StorageResult<T>>;
  delete: (id: string) => Promise<StorageResult<boolean>>;
  deleteMany: (query: StorageQuery) => Promise<StorageResult<number>>;
  count: (query?: StorageQuery) => Promise<StorageResult<number>>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

interface UseStorageReturn<T> extends UseStorageState<T>, UseStorageActions<T> {
  isInitialized: boolean;
  storageStats: {
    estimatedUsage: number;
    quota: number;
    usagePercentage: number;
  } | null;
}

/**
 * Hook para gerenciar operações de armazenamento local
 */
export function useStorage<T extends { id: string }>(
  storeName: StoreNames,
  autoLoad: boolean = false
): UseStorageReturn<T> {
  const [state, setState] = useState<UseStorageState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [storageStats, setStorageStats] = useState<{
    estimatedUsage: number;
    quota: number;
    usagePercentage: number;
  } | null>(null);

  const crudService = new CRUDService();
  const indexedDBService = IndexedDBService.getInstance();

  // Inicializar IndexedDB se necessário
  useEffect(() => {
    const initializeDB = async () => {
      try {
        if (!indexedDBService.isInitialized()) {
          await indexedDBService.initialize();
        }
        setIsInitialized(true);

        // Carregar estatísticas de armazenamento
        const stats = await indexedDBService.getStorageStats();
        setStorageStats(stats);

        // Auto carregar dados se especificado
        if (autoLoad) {
          await getAll();
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Erro ao inicializar banco de dados',
        }));
      }
    };

    initializeDB();
  }, [storeName, autoLoad]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, loading: false, error }));
  }, []);

  const create = useCallback(
    async (item: T): Promise<StorageResult<T>> => {
      setLoading(true);
      clearError();

      try {
        const result = await crudService.create(storeName, item);

        if (result.success && result.data) {
          // Adicionar item aos dados locais se estão carregados
          setState(prev => ({
            ...prev,
            data: prev.data ? [...prev.data, result.data!] : null,
            loading: false,
          }));
        } else {
          setError(result.error || 'Erro ao criar item');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao criar item';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [storeName, crudService, setLoading, clearError, setError]
  );

  const getById = useCallback(
    async (id: string): Promise<StorageResult<T>> => {
      setLoading(true);
      clearError();

      try {
        const result = await crudService.getById<T>(storeName, id);
        setLoading(false);

        if (!result.success) {
          setError(result.error || 'Erro ao buscar item');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar item';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [storeName, crudService, setLoading, clearError, setError]
  );

  const getAll = useCallback(async (): Promise<StorageResult<T[]>> => {
    setLoading(true);
    clearError();

    try {
      const result = await crudService.getAll<T>(storeName);

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          data: result.data!,
          loading: false,
        }));
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dados';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [storeName, crudService, setLoading, clearError, setError]);

  const findBy = useCallback(
    async (query: StorageQuery): Promise<StorageResult<T[]>> => {
      setLoading(true);
      clearError();

      try {
        const result = await crudService.findBy<T>(storeName, query);
        setLoading(false);

        if (!result.success) {
          setError(result.error || 'Erro ao buscar dados');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar dados';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [storeName, crudService, setLoading, clearError, setError]
  );

  const update = useCallback(
    async (item: T): Promise<StorageResult<T>> => {
      setLoading(true);
      clearError();

      try {
        const result = await crudService.update(storeName, item);

        if (result.success && result.data) {
          // Atualizar item nos dados locais se estão carregados
          setState(prev => ({
            ...prev,
            data: prev.data
              ? prev.data.map(existingItem =>
                  existingItem.id === item.id ? result.data! : existingItem
                )
              : null,
            loading: false,
          }));
        } else {
          setError(result.error || 'Erro ao atualizar item');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar item';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [storeName, crudService, setLoading, clearError, setError]
  );

  const upsert = useCallback(
    async (item: T): Promise<StorageResult<T>> => {
      setLoading(true);
      clearError();

      try {
        const result = await crudService.upsert(storeName, item);

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            data: prev.data
              ? prev.data
                  .map(existingItem => (existingItem.id === item.id ? result.data! : existingItem))
                  .concat(prev.data.find(i => i.id === item.id) ? [] : [result.data!])
              : null,
            loading: false,
          }));
        } else {
          setError(result.error || 'Erro ao salvar item');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar item';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [storeName, crudService, setLoading, clearError, setError]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<StorageResult<boolean>> => {
      setLoading(true);
      clearError();

      try {
        const result = await crudService.delete(storeName, id);

        if (result.success) {
          // Remover item dos dados locais se estão carregados
          setState(prev => ({
            ...prev,
            data: prev.data ? prev.data.filter(item => item.id !== id) : null,
            loading: false,
          }));
        } else {
          setError(result.error || 'Erro ao deletar item');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar item';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [storeName, crudService, setLoading, clearError, setError]
  );

  const deleteMany = useCallback(
    async (query: StorageQuery): Promise<StorageResult<number>> => {
      setLoading(true);
      clearError();

      try {
        const result = await crudService.deleteMany(storeName, query);

        if (result.success) {
          // Recarregar dados após deletar múltiplos itens
          if (state.data) {
            await getAll();
          }
        } else {
          setError(result.error || 'Erro ao deletar itens');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar itens';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [storeName, crudService, state.data, getAll, setLoading, clearError, setError]
  );

  const count = useCallback(
    async (query?: StorageQuery): Promise<StorageResult<number>> => {
      try {
        return await crudService.count(storeName, query);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao contar itens';
        return { success: false, error: errorMessage };
      }
    },
    [storeName, crudService]
  );

  const refresh = useCallback(async (): Promise<void> => {
    await getAll();

    // Atualizar estatísticas de armazenamento
    try {
      const stats = await indexedDBService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.warn('Erro ao atualizar estatísticas de armazenamento:', error);
    }
  }, [getAll, indexedDBService]);

  return {
    // Estado
    data: state.data,
    loading: state.loading,
    error: state.error,
    isInitialized,
    storageStats,

    // Ações
    create,
    getById,
    getAll,
    findBy,
    update,
    upsert,
    delete: deleteItem,
    deleteMany,
    count,
    refresh,
    clearError,
  };
}
