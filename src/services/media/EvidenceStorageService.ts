/**
 * Serviço de Armazenamento de Evidências - Mobile-First
 * Task 4.4 - Sistema robusto de armazenamento local com metadados
 */

import { CRUDService } from '@/services/storage/CRUDService';
import { STORES } from '@/types/storage';

export interface EvidenceMetadata {
  id: string;
  vistoriaId: string;
  itemId: string;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outras_evidencias';
  
  // Metadados do arquivo
  nomeOriginal: string;
  tamanho: number;
  tipo: string; // MIME type
  largura?: number;
  altura?: number;
  
  // Metadados de captura
  timestamp: string; // ISO string
  dispositivo: string;
  tecnicoId?: string;
  
  // Geolocalização (se disponível)
  localizacao?: {
    latitude: number;
    longitude: number;
    precisao: number;
    timestamp: string;
  };
  
  // Status de sincronização
  status: 'local' | 'uploading' | 'synced' | 'error';
  urlLocal: string;
  urlRemota?: string;
  uploadTentativas: number;
  ultimoErroUpload?: string;
  
  // Compressão
  compressao?: {
    tamanhoOriginal: number;
    tamanhoComprimido: number;
    qualidade: number;
    formato: string;
  };
}

export interface EvidenceStorageStats {
  totalEvidencias: number;
  totalTamanho: number;
  porStatus: Record<string, number>;
  porTipo: Record<string, number>;
  maisAntigas: EvidenceMetadata[];
  naoSincronizadas: EvidenceMetadata[];
}

export class EvidenceStorageService {
  private static crudService = new CRUDService<EvidenceMetadata>(STORES.EVIDENCE_METADATA);
  
  // Configurações de limpeza
  private static readonly MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_AGE_DAYS = 30; // 30 dias
  private static readonly CLEANUP_THRESHOLD = 0.8; // 80% do limite

  /**
   * Armazena uma evidência com metadados completos
   */
  static async storeEvidence(
    blob: Blob,
    metadata: Omit<EvidenceMetadata, 'id' | 'urlLocal' | 'timestamp' | 'dispositivo' | 'status' | 'uploadTentativas'>
  ): Promise<EvidenceMetadata> {
    console.log('💾 EvidenceStorage: ARMAZENANDO evidência', {
      tipo: metadata.tipoEvidencia,
      tamanho: blob.size,
      item: metadata.itemId
    });

    // Gerar ID único
    const id = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar URL local para o blob
    const urlLocal = URL.createObjectURL(blob);
    
    // Obter geolocalização se disponível
    const localizacao = await this.getCurrentLocation();
    
    // Montar metadados completos
    const evidenceMetadata: EvidenceMetadata = {
      ...metadata,
      id,
      urlLocal,
      timestamp: new Date().toISOString(),
      dispositivo: this.getDeviceInfo(),
      status: 'local',
      uploadTentativas: 0,
      localizacao
    };

    // Salvar metadados
    await this.crudService.create(evidenceMetadata);
    
    // Verificar se precisa de limpeza
    await this.checkAndCleanup();
    
    console.log('✅ EvidenceStorage: Evidência armazenada', {
      id,
      metadados: evidenceMetadata
    });
    
    return evidenceMetadata;
  }

  /**
   * Recupera evidências por vistoria
   */
  static async getEvidencesByVistoria(vistoriaId: string): Promise<EvidenceMetadata[]> {
    const allEvidences = await this.crudService.getAll();
    return allEvidences.filter(e => e.vistoriaId === vistoriaId);
  }

  /**
   * Recupera evidências por item
   */
  static async getEvidencesByItem(
    vistoriaId: string, 
    itemId: string, 
    tipoEvidencia?: string
  ): Promise<EvidenceMetadata[]> {
    const evidences = await this.getEvidencesByVistoria(vistoriaId);
    
    return evidences.filter(e => {
      const matchItem = e.itemId === itemId;
      const matchTipo = !tipoEvidencia || e.tipoEvidencia === tipoEvidencia;
      return matchItem && matchTipo;
    });
  }

  /**
   * Atualiza status de uma evidência
   */
  static async updateEvidenceStatus(
    id: string,
    status: EvidenceMetadata['status'],
    urlRemota?: string,
    erro?: string
  ): Promise<void> {
    const evidence = await this.crudService.getById(id);
    
    if (evidence) {
      const updates: Partial<EvidenceMetadata> = { status };
      
      if (urlRemota) {
        updates.urlRemota = urlRemota;
      }
      
      if (erro) {
        updates.ultimoErroUpload = erro;
        updates.uploadTentativas = evidence.uploadTentativas + 1;
      }
      
      if (status === 'synced') {
        updates.ultimoErroUpload = undefined;
      }
      
      await this.crudService.update(id, updates);
      
      console.log(`📱 EvidenceStorage: Status atualizado ${id}`, {
        novoStatus: status,
        urlRemota,
        erro
      });
    }
  }

  /**
   * Obtém evidências não sincronizadas
   */
  static async getUnsyncedEvidences(): Promise<EvidenceMetadata[]> {
    const allEvidences = await this.crudService.getAll();
    return allEvidences.filter(e => e.status === 'local' || e.status === 'error');
  }

  /**
   * Remove evidências antigas automaticamente
   */
  static async cleanupOldEvidences(): Promise<{
    removed: number;
    freedSpace: number;
  }> {
    console.log('🧹 EvidenceStorage: INICIANDO limpeza automática');
    
    const allEvidences = await this.crudService.getAll();
    const now = new Date();
    const maxAge = this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    
    let removed = 0;
    let freedSpace = 0;
    
    // Encontrar evidências antigas sincronizadas
    const oldSyncedEvidences = allEvidences.filter(e => {
      const age = now.getTime() - new Date(e.timestamp).getTime();
      return age > maxAge && e.status === 'synced';
    });
    
    // Remover evidências antigas
    for (const evidence of oldSyncedEvidences) {
      try {
        // Revogar URL local
        URL.revokeObjectURL(evidence.urlLocal);
        
        // Remover do IndexedDB
        await this.crudService.delete(evidence.id);
        
        removed++;
        freedSpace += evidence.tamanho;
        
        console.log(`🗑️ EvidenceStorage: Removida evidência antiga ${evidence.id}`);
        
      } catch (error) {
        console.error(`❌ EvidenceStorage: Erro ao remover ${evidence.id}:`, error);
      }
    }
    
    console.log('✅ EvidenceStorage: Limpeza concluída', {
      removidas: removed,
      espacoLiberado: `${(freedSpace / 1024 / 1024).toFixed(1)}MB`
    });
    
    return { removed, freedSpace };
  }

  /**
   * Verifica estatísticas de armazenamento
   */
  static async getStorageStats(): Promise<EvidenceStorageStats> {
    const allEvidences = await this.crudService.getAll();
    
    const stats: EvidenceStorageStats = {
      totalEvidencias: allEvidences.length,
      totalTamanho: allEvidences.reduce((sum, e) => sum + e.tamanho, 0),
      porStatus: {},
      porTipo: {},
      maisAntigas: [],
      naoSincronizadas: []
    };
    
    // Contadores por status
    allEvidences.forEach(e => {
      stats.porStatus[e.status] = (stats.porStatus[e.status] || 0) + 1;
      stats.porTipo[e.tipoEvidencia] = (stats.porTipo[e.tipoEvidencia] || 0) + 1;
    });
    
    // Evidências mais antigas (top 10)
    stats.maisAntigas = allEvidences
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 10);
    
    // Evidências não sincronizadas
    stats.naoSincronizadas = allEvidences.filter(e => e.status !== 'synced');
    
    return stats;
  }

  /**
   * Verifica se precisa de limpeza e executa
   */
  private static async checkAndCleanup(): Promise<void> {
    const stats = await this.getStorageStats();
    
    // Verificar se ultrapassou o limite de tamanho
    if (stats.totalTamanho > this.MAX_STORAGE_SIZE * this.CLEANUP_THRESHOLD) {
      console.warn('⚠️ EvidenceStorage: Limite de armazenamento próximo, iniciando limpeza');
      await this.cleanupOldEvidences();
    }
  }

  /**
   * Obtém localização atual se disponível
   */
  private static async getCurrentLocation(): Promise<EvidenceMetadata['localizacao'] | undefined> {
    if (!navigator.geolocation) {
      return undefined;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            precisao: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.warn('⚠️ EvidenceStorage: Erro ao obter localização:', error.message);
          resolve(undefined);
        },
        {
          timeout: 5000,
          maximumAge: 30000, // 30 segundos
          enableHighAccuracy: false // Para economizar bateria
        }
      );
    });
  }

  /**
   * Obtém informações do dispositivo
   */
  private static getDeviceInfo(): string {
    const ua = navigator.userAgent;
    
    // Detectar tipo de dispositivo
    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      if (/iPhone/.test(ua)) return 'iPhone';
      if (/iPad/.test(ua)) return 'iPad';
      if (/Android/.test(ua)) return 'Android';
      return 'Mobile';
    }
    
    return 'Desktop';
  }

  /**
   * Remove uma evidência específica
   */
  static async removeEvidence(id: string): Promise<boolean> {
    try {
      const evidence = await this.crudService.getById(id);
      
      if (evidence) {
        // Revogar URL local
        URL.revokeObjectURL(evidence.urlLocal);
        
        // Remover do IndexedDB
        await this.crudService.delete(id);
        
        console.log(`🗑️ EvidenceStorage: Evidência removida ${id}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ EvidenceStorage: Erro ao remover evidência ${id}:`, error);
      return false;
    }
  }

  /**
   * Exporta evidências para backup
   */
  static async exportEvidences(vistoriaId?: string): Promise<EvidenceMetadata[]> {
    const allEvidences = await this.crudService.getAll();
    
    if (vistoriaId) {
      return allEvidences.filter(e => e.vistoriaId === vistoriaId);
    }
    
    return allEvidences;
  }

  /**
   * Limpa todas as evidências (usar com cuidado!)
   */
  static async clearAllEvidences(): Promise<number> {
    const allEvidences = await this.crudService.getAll();
    
    // Revogar todas as URLs
    allEvidences.forEach(e => {
      URL.revokeObjectURL(e.urlLocal);
    });
    
    // Limpar store
    await this.crudService.clear();
    
    console.log(`🧹 EvidenceStorage: ${allEvidences.length} evidências removidas`);
    
    return allEvidences.length;
  }
}