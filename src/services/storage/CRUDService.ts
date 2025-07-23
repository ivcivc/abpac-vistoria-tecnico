import { IndexedDBService } from './IndexedDBService';
import { STORES, StoreNames, StorageResult, StorageQuery } from '@/types/storage';

export class CRUDService {
  private indexedDB: IndexedDBService;

  constructor() {
    this.indexedDB = IndexedDBService.getInstance();
  }

  /**
   * Cria um novo registro na store especificada
   */
  async create<T extends { id: string }>(
    storeName: StoreNames,
    data: T
  ): Promise<StorageResult<T>> {
    try {
      if (!this.indexedDB.isInitialized()) {
        await this.indexedDB.initialize();
      }

      return new Promise(resolve => {
        const transaction = this.indexedDB.getTransaction(storeName, 'readwrite');
        const store = this.indexedDB.getStore(transaction, storeName);

        // Adicionar timestamp de criação se não existir
        const dataWithTimestamp = {
          ...data,
          createdAt: (data as any).createdAt || new Date(),
          updatedAt: new Date(),
        };

        const request = store.add(dataWithTimestamp);

        request.onsuccess = () => {
          resolve({
            success: true,
            data: dataWithTimestamp as T,
          });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: `Erro ao criar registro: ${request.error?.message}`,
          });
        };
      });
    } catch (error) {
      return {
        success: false,
        error: `Erro ao criar registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Busca um registro pelo ID
   */
  async getById<T>(storeName: StoreNames, id: string): Promise<StorageResult<T>> {
    try {
      if (!this.indexedDB.isInitialized()) {
        await this.indexedDB.initialize();
      }

      return new Promise(resolve => {
        const transaction = this.indexedDB.getTransaction(storeName, 'readonly');
        const store = this.indexedDB.getStore(transaction, storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve({
              success: true,
              data: result as T,
            });
          } else {
            resolve({
              success: false,
              error: 'Registro não encontrado',
            });
          }
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: `Erro ao buscar registro: ${request.error?.message}`,
          });
        };
      });
    } catch (error) {
      return {
        success: false,
        error: `Erro ao buscar registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Busca todos os registros de uma store
   */
  async getAll<T>(storeName: StoreNames): Promise<StorageResult<T[]>> {
    try {
      if (!this.indexedDB.isInitialized()) {
        await this.indexedDB.initialize();
      }

      return new Promise(resolve => {
        const transaction = this.indexedDB.getTransaction(storeName, 'readonly');
        const store = this.indexedDB.getStore(transaction, storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve({
            success: true,
            data: request.result as T[],
          });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: `Erro ao buscar registros: ${request.error?.message}`,
          });
        };
      });
    } catch (error) {
      return {
        success: false,
        error: `Erro ao buscar registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Busca registros com filtros usando índices
   */
  async findBy<T>(storeName: StoreNames, query: StorageQuery): Promise<StorageResult<T[]>> {
    try {
      if (!this.indexedDB.isInitialized()) {
        await this.indexedDB.initialize();
      }

      return new Promise(resolve => {
        const transaction = this.indexedDB.getTransaction(storeName, 'readonly');
        const store = this.indexedDB.getStore(transaction, storeName);

        let request: IDBRequest;

        // Verificar se existe um índice para o campo
        if (store.indexNames.contains(query.field)) {
          const index = store.index(query.field);

          switch (query.operator) {
            case 'equals':
            default:
              request = index.getAll(query.value);
              break;
            case 'greater':
              request = index.getAll(IDBKeyRange.lowerBound(query.value, true));
              break;
            case 'less':
              request = index.getAll(IDBKeyRange.upperBound(query.value, true));
              break;
            case 'contains':
              // Para contains, precisamos fazer busca manual
              request = index.getAll();
              break;
          }
        } else {
          // Se não há índice, buscar todos e filtrar manualmente
          request = store.getAll();
        }

        request.onsuccess = () => {
          let results = request.result as T[];

          // Aplicar filtro manual se necessário
          if (query.operator === 'contains' || !store.indexNames.contains(query.field)) {
            results = results.filter((item: any) => {
              const fieldValue = this.getNestedValue(item, query.field);

              switch (query.operator) {
                case 'contains':
                  return (
                    fieldValue &&
                    fieldValue
                      .toString()
                      .toLowerCase()
                      .includes(query.value.toString().toLowerCase())
                  );
                case 'equals':
                default:
                  return fieldValue === query.value;
                case 'greater':
                  return fieldValue > query.value;
                case 'less':
                  return fieldValue < query.value;
              }
            });
          }

          resolve({
            success: true,
            data: results,
          });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: `Erro ao buscar com filtro: ${request.error?.message}`,
          });
        };
      });
    } catch (error) {
      return {
        success: false,
        error: `Erro ao buscar com filtro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Atualiza um registro existente
   */
  async update<T extends { id: string }>(
    storeName: StoreNames,
    data: T
  ): Promise<StorageResult<T>> {
    try {
      if (!this.indexedDB.isInitialized()) {
        await this.indexedDB.initialize();
      }

      return new Promise(resolve => {
        const transaction = this.indexedDB.getTransaction(storeName, 'readwrite');
        const store = this.indexedDB.getStore(transaction, storeName);

        // Adicionar timestamp de atualização
        const dataWithTimestamp = {
          ...data,
          updatedAt: new Date(),
        };

        const request = store.put(dataWithTimestamp);

        request.onsuccess = () => {
          resolve({
            success: true,
            data: dataWithTimestamp as T,
          });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: `Erro ao atualizar registro: ${request.error?.message}`,
          });
        };
      });
    } catch (error) {
      return {
        success: false,
        error: `Erro ao atualizar registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Remove um registro pelo ID
   */
  async delete(storeName: StoreNames, id: string): Promise<StorageResult<boolean>> {
    try {
      if (!this.indexedDB.isInitialized()) {
        await this.indexedDB.initialize();
      }

      return new Promise(resolve => {
        const transaction = this.indexedDB.getTransaction(storeName, 'readwrite');
        const store = this.indexedDB.getStore(transaction, storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve({
            success: true,
            data: true,
          });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: `Erro ao deletar registro: ${request.error?.message}`,
          });
        };
      });
    } catch (error) {
      return {
        success: false,
        error: `Erro ao deletar registro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Remove múltiplos registros baseado em filtro
   */
  async deleteMany(storeName: StoreNames, query: StorageQuery): Promise<StorageResult<number>> {
    try {
      // Primeiro buscar os registros que correspondem ao filtro
      const findResult = await this.findBy(storeName, query);

      if (!findResult.success || !findResult.data) {
        return {
          success: false,
          error: 'Erro ao buscar registros para deletar',
        };
      }

      let deletedCount = 0;
      const deletePromises = findResult.data.map(async (item: any) => {
        const deleteResult = await this.delete(storeName, item.id);
        if (deleteResult.success) {
          deletedCount++;
        }
        return deleteResult;
      });

      await Promise.all(deletePromises);

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro ao deletar múltiplos registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Conta o número de registros em uma store
   */
  async count(storeName: StoreNames, query?: StorageQuery): Promise<StorageResult<number>> {
    try {
      if (query) {
        const result = await this.findBy(storeName, query);
        return {
          success: true,
          data: result.data?.length || 0,
        };
      }

      if (!this.indexedDB.isInitialized()) {
        await this.indexedDB.initialize();
      }

      return new Promise(resolve => {
        const transaction = this.indexedDB.getTransaction(storeName, 'readonly');
        const store = this.indexedDB.getStore(transaction, storeName);
        const request = store.count();

        request.onsuccess = () => {
          resolve({
            success: true,
            data: request.result,
          });
        };

        request.onerror = () => {
          resolve({
            success: false,
            error: `Erro ao contar registros: ${request.error?.message}`,
          });
        };
      });
    } catch (error) {
      return {
        success: false,
        error: `Erro ao contar registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }

  /**
   * Utilitário para acessar propriedades aninhadas de um objeto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Operação de upsert (insert ou update)
   */
  async upsert<T extends { id: string }>(
    storeName: StoreNames,
    data: T
  ): Promise<StorageResult<T>> {
    try {
      // Primeiro tentar buscar o registro
      const existingResult = await this.getById(storeName, data.id);

      if (existingResult.success && existingResult.data) {
        // Registro existe, fazer update
        return await this.update(storeName, data);
      } else {
        // Registro não existe, fazer create
        return await this.create(storeName, data);
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro ao fazer upsert: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      };
    }
  }
}
