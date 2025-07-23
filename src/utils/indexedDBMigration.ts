/**
 * Utilitário para migração e limpeza do IndexedDB
 * Sistema de Vistoria ABPAC
 */

export class IndexedDBMigration {
  private readonly dbName = 'VistoriaABPAC';

  /**
   * Limpa completamente o banco IndexedDB (desenvolvimento)
   */
  async clearIndexedDB(): Promise<{ success: boolean; message: string }> {
    try {
      // Fechar qualquer conexão aberta
      const databases = await indexedDB.databases();

      for (const db of databases) {
        if (db.name === this.dbName && db.version) {
          console.log(`🗑️ Deletando banco: ${db.name} v${db.version}`);

          const deleteRequest = indexedDB.deleteDatabase(db.name);

          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve(true);
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onblocked = () => {
              console.warn('⚠️ Deleção bloqueada - feche todas as abas do aplicativo');
              setTimeout(() => resolve(true), 1000);
            };
          });
        }
      }

      // Limpar também o localStorage relacionado
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('vistoria') || key.includes('abpac') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removido do localStorage: ${key}`);
      });

      return {
        success: true,
        message: `✅ IndexedDB e localStorage limpos com sucesso! Recarregue a página.`,
      };
    } catch (error) {
      console.error('❌ Erro ao limpar IndexedDB:', error);
      return {
        success: false,
        message: `❌ Erro ao limpar: ${error}`,
      };
    }
  }

  /**
   * Verifica a versão atual do banco
   */
  async checkDatabaseVersion(): Promise<{ currentVersion: number; expectedVersion: number }> {
    try {
      const databases = await indexedDB.databases();
      const currentDb = databases.find(db => db.name === this.dbName);

      return {
        currentVersion: currentDb?.version || 0,
        expectedVersion: 2, // Versão atual esperada
      };
    } catch (error) {
      console.error('❌ Erro ao verificar versão do banco:', error);
      return {
        currentVersion: 0,
        expectedVersion: 2,
      };
    }
  }

  /**
   * Força migração do banco para nova versão
   */
  async forceMigration(): Promise<{ success: boolean; message: string }> {
    try {
      const versionInfo = await this.checkDatabaseVersion();

      if (versionInfo.currentVersion < versionInfo.expectedVersion) {
        console.log(
          `🔄 Migração necessária: v${versionInfo.currentVersion} → v${versionInfo.expectedVersion}`
        );

        // Limpar banco antigo
        const clearResult = await this.clearIndexedDB();
        if (!clearResult.success) {
          return clearResult;
        }

        return {
          success: true,
          message: `✅ Migração concluída! Recarregue a página para reinicializar o banco v${versionInfo.expectedVersion}.`,
        };
      } else {
        return {
          success: true,
          message: `✅ Banco já está na versão correta (v${versionInfo.currentVersion}).`,
        };
      }
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      return {
        success: false,
        message: `❌ Erro na migração: ${error}`,
      };
    }
  }

  /**
   * Diagnóstico completo do estado do IndexedDB
   */
  async diagnose(): Promise<{
    databases: Array<{ name: string; version: number }>;
    stores: string[];
    storageUsed: number;
    issues: string[];
  }> {
    try {
      // Listar bancos existentes
      const databases = await indexedDB.databases();
      const dbList = databases.map(db => ({
        name: db.name || 'Unknown',
        version: db.version || 0,
      }));

      // Verificar stores (se banco existir)
      let stores: string[] = [];
      let issues: string[] = [];

      const currentDb = databases.find(db => db.name === this.dbName);
      if (currentDb && currentDb.version) {
        try {
          const openRequest = indexedDB.open(this.dbName, currentDb.version);
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            openRequest.onsuccess = () => resolve(openRequest.result);
            openRequest.onerror = () => reject(openRequest.error);
          });

          stores = Array.from(db.objectStoreNames);

          // Verificar se VISTORIAS_LOCAIS existe
          if (!stores.includes('vistorias-locais')) {
            issues.push('Store VISTORIAS_LOCAIS não encontrada');
          }

          db.close();
        } catch (error) {
          issues.push(`Erro ao acessar stores: ${error}`);
        }
      } else {
        issues.push('Banco VistoriaABPAC não encontrado');
      }

      // Estimar uso de storage
      let storageUsed = 0;
      if ('estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        storageUsed = estimate.usage || 0;
      }

      return {
        databases: dbList,
        stores,
        storageUsed,
        issues,
      };
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
      return {
        databases: [],
        stores: [],
        storageUsed: 0,
        issues: [`Erro no diagnóstico: ${error}`],
      };
    }
  }
}

// Instância singleton
export const indexedDBMigration = new IndexedDBMigration();

// Função helper para uso no console do navegador
(window as any).clearVistoriaDB = async () => {
  const migration = new IndexedDBMigration();
  const result = await migration.clearIndexedDB();
  console.log(result.message);
  return result;
};

(window as any).diagnoseVistoriaDB = async () => {
  const migration = new IndexedDBMigration();
  const result = await migration.diagnose();
  console.table(result.databases);
  console.log('Stores:', result.stores);
  console.log('Storage usado:', (result.storageUsed / 1024 / 1024).toFixed(2), 'MB');
  if (result.issues.length > 0) {
    console.warn('Problemas encontrados:', result.issues);
  }
  return result;
};
