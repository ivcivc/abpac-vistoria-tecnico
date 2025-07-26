/**
 * StorageManagerService
 * 
 * Serviço para gerenciamento centralizado de armazenamento local
 * Implementa Task 21 - Gerenciamento de Armazenamento
 */

import { IndexedDBService } from './IndexedDBService';
import { CRUDService } from './CRUDService';
import { STORES, StorageQuery } from '@/types/storage';
import { StorageStats, OFFLINE_CONFIG } from '@/types/offline';

export interface StorageSettings {
  maxStorageMB: number;
  cleanupThresholdPercentage: number;
  dataRetentionDays: number;
  autoCleanupEnabled: boolean;
}

export interface StorageItem {
  id: string;
  store: string;
  size: number;
  lastModified: Date;
}

export interface CleanupResult {
  success: boolean;
  itemsRemoved: number;
  bytesFreed: number;
  errors: string[];
}

export class StorageManagerService {
  private static instance: StorageManagerService;
  private indexedDBService: IndexedDBService;
  private crudService: CRUDService;
  
  // Configurações padrão
  private settings: StorageSettings = {
    maxStorageMB: OFFLINE_CONFIG.MAX_STORAGE_MB,
    cleanupThresholdPercentage: OFFLINE_CONFIG.CLEANUP_THRESHOLD_PERCENTAGE,
    dataRetentionDays: OFFLINE_CONFIG.DATA_RETENTION_DAYS,
    autoCleanupEnabled: true
  };

  private constructor() {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') return;
    
    this.indexedDBService = IndexedDBService.getInstance();
    this.crudService = new CRUDService();
    
    // Inicializar monitoramento automático
    this.initAutoCleanup();
  }

  static getInstance(): StorageManagerService {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') {
      // Retornar uma instância mock para SSR
      const mockInstance = new StorageManagerService();
      return mockInstance;
    }
    
    if (!StorageManagerService.instance) {
      StorageManagerService.instance = new StorageManagerService();
    }
    return StorageManagerService.instance;
  }

  /**
   * Inicializa o monitoramento automático de armazenamento
   */
  private initAutoCleanup(): void {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') return;
    
    // Verificar armazenamento a cada hora
    setInterval(async () => {
      if (!this.settings.autoCleanupEnabled) return;
      
      try {
        const stats = await this.getStorageStats();
        
        // Se uso estiver acima do limite, executar limpeza automática
        if (stats.percentageUsed > this.settings.cleanupThresholdPercentage) {
          console.log(`🧹 Uso de armazenamento (${stats.percentageUsed}%) acima do limite (${this.settings.cleanupThresholdPercentage}%). Iniciando limpeza automática...`);
          await this.cleanupOldData();
        }
      } catch (error) {
        console.error('❌ Erro ao verificar armazenamento para limpeza automática:', error);
      }
    }, 60 * 60 * 1000); // 1 hora
  }

  /**
   * Obtém estatísticas detalhadas de uso de armazenamento
   */
  async getStorageStats(): Promise<StorageStats> {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') {
      return {
        totalUsage: 0,
        availableSpace: 0,
        percentageUsed: 0,
        itemCounts: {
          vistorias: 0,
          itens: 0,
          evidencias: 0,
          despesas: 0,
          syncQueue: 0
        },
        oldestItem: null,
        newestItem: null
      };
    }
    
    // Obter estatísticas básicas do IndexedDB
    const basicStats = await this.indexedDBService.getStorageStats();
    
    // Contar itens em cada store
    const vistoriasCount = await this.getStoreCount(STORES.VISTORIAS);
    const itensCount = await this.getStoreCount(STORES.ITENS);
    const evidenciasCount = await this.getStoreCount(STORES.EVIDENCIAS);
    const despesasCount = await this.getStoreCount(STORES.DESPESAS);
    const syncQueueCount = await this.getStoreCount(STORES.SYNC_QUEUE);
    
    // Obter datas mais antiga e mais recente
    const oldestDate = await this.getOldestItemDate();
    const newestDate = await this.getNewestItemDate();
    
    return {
      totalUsage: basicStats.estimatedUsage,
      availableSpace: basicStats.quota - basicStats.estimatedUsage,
      percentageUsed: basicStats.usagePercentage,
      itemCounts: {
        vistorias: vistoriasCount,
        itens: itensCount,
        evidencias: evidenciasCount,
        despesas: despesasCount,
        syncQueue: syncQueueCount
      },
      oldestItem: oldestDate,
      newestItem: newestDate
    };
  }

  /**
   * Obtém a contagem de itens em uma store
   */
  private async getStoreCount(storeName: string): Promise<number> {
    try {
      const result = await this.crudService.getAll(storeName);
      return result.success ? (result.data?.length || 0) : 0;
    } catch (error) {
      console.error(`❌ Erro ao contar itens na store ${storeName}:`, error);
      return 0;
    }
  }

  /**
   * Obtém a data do item mais antigo no banco
   */
  private async getOldestItemDate(): Promise<Date | null> {
    try {
      // Verificar vistorias locais primeiro
      const vistoriasResult = await this.crudService.getAll(STORES.VISTORIAS_LOCAIS);
      if (vistoriasResult.success && vistoriasResult.data && vistoriasResult.data.length > 0) {
        const dates = vistoriasResult.data
          .map(item => new Date(item.dataAcesso || item.dataAgendada))
          .filter(date => !isNaN(date.getTime()));
        
        if (dates.length > 0) {
          return new Date(Math.min(...dates.map(d => d.getTime())));
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter data mais antiga:', error);
      return null;
    }
  }

  /**
   * Obtém a data do item mais recente no banco
   */
  private async getNewestItemDate(): Promise<Date | null> {
    try {
      // Verificar vistorias locais primeiro
      const vistoriasResult = await this.crudService.getAll(STORES.VISTORIAS_LOCAIS);
      if (vistoriasResult.success && vistoriasResult.data && vistoriasResult.data.length > 0) {
        const dates = vistoriasResult.data
          .map(item => new Date(item.dataAcesso || item.dataAgendada))
          .filter(date => !isNaN(date.getTime()));
        
        if (dates.length > 0) {
          return new Date(Math.max(...dates.map(d => d.getTime())));
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter data mais recente:', error);
      return null;
    }
  }

  /**
   * Limpa dados antigos com base na configuração de retenção
   */
  async cleanupOldData(daysToKeep?: number): Promise<CleanupResult> {
    const retentionDays = daysToKeep || this.settings.dataRetentionDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`🧹 Iniciando limpeza de dados anteriores a ${cutoffDate.toLocaleDateString()}`);
    
    const result: CleanupResult = {
      success: true,
      itemsRemoved: 0,
      bytesFreed: 0,
      errors: []
    };
    
    try {
      // Limpar vistorias antigas (concluídas e sincronizadas)
      const oldVistorias = await this.findOldVistorias(cutoffDate);
      
      for (const vistoria of oldVistorias) {
        try {
          // Primeiro remover itens, evidências e despesas relacionadas
          await this.removeRelatedItems(vistoria.id);
          
          // Depois remover a vistoria
          await this.crudService.delete(STORES.VISTORIAS, vistoria.id);
          await this.crudService.delete(STORES.VISTORIAS_LOCAIS, vistoria.id);
          
          result.itemsRemoved++;
          // Estimativa de tamanho baseada em JSON
          result.bytesFreed += JSON.stringify(vistoria).length;
          
          console.log(`✅ Removida vistoria antiga: ${vistoria.id}`);
        } catch (error) {
          console.error(`❌ Erro ao remover vistoria ${vistoria.id}:`, error);
          result.errors.push(`Erro ao remover vistoria ${vistoria.id}: ${error}`);
        }
      }
      
      // Limpar evidências antigas sem referência
      await this.cleanupOrphanedItems();
      
      console.log(`🧹 Limpeza concluída: ${result.itemsRemoved} vistorias removidas, ~${(result.bytesFreed / 1024).toFixed(2)} KB liberados`);
      
      return result;
    } catch (error) {
      console.error('❌ Erro durante limpeza de dados:', error);
      result.success = false;
      result.errors.push(`Erro geral: ${error}`);
      return result;
    }
  }

  /**
   * Encontra vistorias antigas que podem ser removidas
   */
  private async findOldVistorias(cutoffDate: Date): Promise<any[]> {
    try {
      // Buscar vistorias locais antigas
      const query: StorageQuery = {
        conditions: [
          {
            field: 'dataAgendada',
            operator: '<',
            value: cutoffDate.toISOString()
          },
          {
            field: 'status',
            operator: 'in',
            value: ['CONCLUIDA', 'FINALIZADA', 'APROVADA']
          },
          {
            field: 'sincronizada',
            operator: '==',
            value: true
          }
        ]
      };
      
      const result = await this.crudService.findBy(STORES.VISTORIAS_LOCAIS, query);
      return result.success ? (result.data || []) : [];
    } catch (error) {
      console.error('❌ Erro ao buscar vistorias antigas:', error);
      return [];
    }
  }

  /**
   * Remove itens, evidências e despesas relacionadas a uma vistoria
   */
  private async removeRelatedItems(vistoriaId: string): Promise<void> {
    try {
      // Buscar itens da vistoria
      const itensQuery: StorageQuery = {
        conditions: [
          {
            field: 'vistoriaId',
            operator: '==',
            value: vistoriaId
          }
        ]
      };
      
      const itensResult = await this.crudService.findBy(STORES.ITENS, itensQuery);
      if (itensResult.success && itensResult.data) {
        // Para cada item, remover evidências e despesas
        for (const item of itensResult.data) {
          await this.removeEvidencias(item.id);
          await this.removeDespesas(item.id);
          
          // Remover o item
          await this.crudService.delete(STORES.ITENS, item.id);
        }
      }
      
      // Remover despesas da vistoria (não vinculadas a itens específicos)
      const despesasQuery: StorageQuery = {
        conditions: [
          {
            field: 'vistoriaId',
            operator: '==',
            value: vistoriaId
          }
        ]
      };
      
      const despesasResult = await this.crudService.findBy(STORES.DESPESAS, despesasQuery);
      if (despesasResult.success && despesasResult.data) {
        for (const despesa of despesasResult.data) {
          await this.crudService.delete(STORES.DESPESAS, despesa.id);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao remover itens relacionados à vistoria ${vistoriaId}:`, error);
      throw error;
    }
  }

  /**
   * Remove evidências relacionadas a um item
   */
  private async removeEvidencias(itemId: string): Promise<void> {
    try {
      const query: StorageQuery = {
        conditions: [
          {
            field: 'itemId',
            operator: '==',
            value: itemId
          }
        ]
      };
      
      const result = await this.crudService.findBy(STORES.EVIDENCIAS, query);
      if (result.success && result.data) {
        for (const evidencia of result.data) {
          // Remover blob da URL local se existir
          if (evidencia.localUrl && evidencia.localUrl.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(evidencia.localUrl);
            } catch (e) {
              console.warn(`⚠️ Não foi possível revogar URL: ${evidencia.localUrl}`);
            }
          }
          
          // Remover registro
          await this.crudService.delete(STORES.EVIDENCIAS, evidencia.id);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao remover evidências do item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Remove despesas relacionadas a um item
   */
  private async removeDespesas(itemId: string): Promise<void> {
    try {
      const query: StorageQuery = {
        conditions: [
          {
            field: 'itemId',
            operator: '==',
            value: itemId
          }
        ]
      };
      
      const result = await this.crudService.findBy(STORES.DESPESAS, query);
      if (result.success && result.data) {
        for (const despesa of result.data) {
          await this.crudService.delete(STORES.DESPESAS, despesa.id);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao remover despesas do item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Limpa itens órfãos (sem referência a vistorias existentes)
   */
  private async cleanupOrphanedItems(): Promise<void> {
    try {
      // Obter todas as vistorias existentes
      const vistoriasResult = await this.crudService.getAll(STORES.VISTORIAS);
      const vistoriaIds = vistoriasResult.success && vistoriasResult.data 
        ? vistoriasResult.data.map(v => v.id) 
        : [];
      
      // Limpar itens órfãos
      const itensResult = await this.crudService.getAll(STORES.ITENS);
      if (itensResult.success && itensResult.data) {
        for (const item of itensResult.data) {
          if (!vistoriaIds.includes(item.vistoriaId)) {
            await this.removeEvidencias(item.id);
            await this.removeDespesas(item.id);
            await this.crudService.delete(STORES.ITENS, item.id);
          }
        }
      }
      
      // Limpar despesas órfãs
      const despesasResult = await this.crudService.getAll(STORES.DESPESAS);
      if (despesasResult.success && despesasResult.data) {
        for (const despesa of despesasResult.data) {
          if (!vistoriaIds.includes(despesa.vistoriaId)) {
            await this.crudService.delete(STORES.DESPESAS, despesa.id);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao limpar itens órfãos:', error);
      throw error;
    }
  }

  /**
   * Atualiza as configurações de armazenamento
   */
  updateSettings(newSettings: Partial<StorageSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    console.log('⚙️ Configurações de armazenamento atualizadas:', this.settings);
    
    // Salvar configurações no IndexedDB para persistência
    this.saveSettings();
  }

  /**
   * Salva configurações no IndexedDB
   */
  private async saveSettings(): Promise<void> {
    try {
      await this.crudService.upsert(STORES.CONFIG, {
        id: 'storage-settings',
        chave: 'storage-settings',
        valor: this.settings,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao salvar configurações de armazenamento:', error);
    }
  }

  /**
   * Carrega configurações do IndexedDB
   */
  async loadSettings(): Promise<void> {
    try {
      const result = await this.crudService.getById(STORES.CONFIG, 'storage-settings');
      if (result.success && result.data) {
        this.settings = {
          ...this.settings,
          ...(result.data.valor || {})
        };
        console.log('⚙️ Configurações de armazenamento carregadas:', this.settings);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações de armazenamento:', error);
    }
  }

  /**
   * Força limpeza completa do armazenamento (apenas para desenvolvimento/debug)
   */
  async clearAllData(): Promise<void> {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') return;
    
    await this.indexedDBService.clearAllData();
    
    // Limpar localStorage relacionado à aplicação
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('vistoria') || 
        key.includes('abpac') || 
        key.includes('auth') ||
        key.includes('approval')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido do localStorage: ${key}`);
    });
    
    console.log('🧹 Todos os dados foram limpos');
  }
} 