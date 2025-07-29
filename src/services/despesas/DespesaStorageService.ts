/**
 * Serviço de Armazenamento de Despesas - Task 5.3
 * Sistema offline-first com sincronização automática
 */

import { CRUDService } from '@/services/storage/CRUDService';
import { STORES } from '@/types/storage';
import { ComprovanteFile } from '@/components/despesas/MobileComprovanteUpload';

export interface DespesaLocal {
  id: string;
  vistoriaId: string;
  
  // Dados da despesa
  tipo: string;
  valor: number;
  descricao: string;
  data: string; // ISO string
  
  // Comprovantes
  comprovantes: ComprovanteFile[];
  
  // Metadados
  timestamp: string; // ISO string de criação
  ultimaEdicao: string; // ISO string da última edição
  tecnicoId?: string;
  
  // Status de sincronização
  status: 'local' | 'uploading' | 'synced' | 'error';
  uploadTentativas: number;
  ultimoErroUpload?: string;
  urlRemota?: string; // URL no backend após sincronização
  
  // Geolocalização (onde a despesa foi registrada)
  localizacao?: {
    latitude: number;
    longitude: number;
    precisao: number;
    timestamp: string;
  };
}

export interface DespesaStats {
  totalDespesas: number;
  valorTotal: number;
  porTipo: Record<string, { quantidade: number; valor: number }>;
  porStatus: Record<string, number>;
  naoSincronizadas: DespesaLocal[];
  maisRecentes: DespesaLocal[];
}

export class DespesaStorageService {
  private static crudService = new CRUDService<DespesaLocal>(STORES.DESPESAS);

  /**
   * Cria uma nova despesa no armazenamento local
   */
  static async criarDespesa(
    despesaData: Omit<DespesaLocal, 'id' | 'timestamp' | 'ultimaEdicao' | 'status' | 'uploadTentativas' | 'localizacao'>
  ): Promise<DespesaLocal> {
    console.log('💾 DespesaStorage: CRIANDO nova despesa', {
      tipo: despesaData.tipo,
      valor: despesaData.valor,
      vistoria: despesaData.vistoriaId
    });

    // Gerar ID único
    const id = `despesa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Obter geolocalização se disponível
    const localizacao = await this.getCurrentLocation();
    
    const despesa: DespesaLocal = {
      ...despesaData,
      id,
      timestamp: new Date().toISOString(),
      ultimaEdicao: new Date().toISOString(),
      status: 'local',
      uploadTentativas: 0,
      localizacao
    };

    await this.crudService.create(despesa);
    
    console.log('✅ DespesaStorage: Despesa criada', {
      id,
      valorFormatado: despesa.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    });
    
    return despesa;
  }

  /**
   * Obtém todas as despesas de uma vistoria
   */
  static async getDespesasByVistoria(vistoriaId: string): Promise<DespesaLocal[]> {
    const allDespesas = await this.crudService.getAll();
    return allDespesas
      .filter(d => d.vistoriaId === vistoriaId)
      .sort((a, b) => new Date(b.ultimaEdicao).getTime() - new Date(a.ultimaEdicao).getTime());
  }

  /**
   * Obtém uma despesa por ID
   */
  static async getDespesaById(id: string): Promise<DespesaLocal | null> {
    return await this.crudService.getById(id);
  }

  /**
   * Atualiza uma despesa existente
   */
  static async atualizarDespesa(
    id: string,
    updates: Partial<Omit<DespesaLocal, 'id' | 'timestamp'>>
  ): Promise<DespesaLocal | null> {
    console.log('🔄 DespesaStorage: ATUALIZANDO despesa', { id });

    const despesa = await this.crudService.getById(id);
    
    if (!despesa) {
      console.error('❌ DespesaStorage: Despesa não encontrada para atualização');
      return null;
    }

    const despesaAtualizada: DespesaLocal = {
      ...despesa,
      ...updates,
      ultimaEdicao: new Date().toISOString(),
      // Reset status de sincronização se dados principais mudaram
      status: (updates.tipo || updates.valor || updates.descricao || updates.data) 
        ? 'local' 
        : despesa.status
    };

    await this.crudService.update(id, despesaAtualizada);
    
    console.log('✅ DespesaStorage: Despesa atualizada', { id });
    
    return despesaAtualizada;
  }

  /**
   * Atualiza status de sincronização de uma despesa
   */
  static async updateSyncStatus(
    id: string,
    status: DespesaLocal['status'],
    urlRemota?: string,
    erro?: string
  ): Promise<void> {
    const despesa = await this.crudService.getById(id);
    
    if (despesa) {
      const updates: Partial<DespesaLocal> = { 
        status,
        ultimaEdicao: new Date().toISOString()
      };
      
      if (urlRemota) {
        updates.urlRemota = urlRemota;
      }
      
      if (erro) {
        updates.ultimoErroUpload = erro;
        updates.uploadTentativas = despesa.uploadTentativas + 1;
      }
      
      if (status === 'synced') {
        updates.ultimoErroUpload = undefined;
      }
      
      await this.crudService.update(id, updates);
      
      console.log(`📱 DespesaStorage: Status atualizado ${id}`, {
        novoStatus: status,
        urlRemota,
        erro
      });
    }
  }

  /**
   * Remove uma despesa
   */
  static async removerDespesa(id: string): Promise<boolean> {
    try {
      const despesa = await this.crudService.getById(id);
      
      if (despesa) {
        // Revogar URLs dos comprovantes para liberar memória
        despesa.comprovantes.forEach(comprovante => {
          URL.revokeObjectURL(comprovante.localUrl);
        });
        
        await this.crudService.delete(id);
        
        console.log(`🗑️ DespesaStorage: Despesa removida ${id}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ DespesaStorage: Erro ao remover despesa ${id}:`, error);
      return false;
    }
  }

  /**
   * Obtém despesas não sincronizadas
   */
  static async getUnsyncedDespesas(): Promise<DespesaLocal[]> {
    const allDespesas = await this.crudService.getAll();
    return allDespesas.filter(d => d.status === 'local' || d.status === 'error');
  }

  /**
   * Obtém estatísticas de despesas
   */
  static async getStats(vistoriaId?: string): Promise<DespesaStats> {
    const allDespesas = await this.crudService.getAll();
    const despesas = vistoriaId 
      ? allDespesas.filter(d => d.vistoriaId === vistoriaId)
      : allDespesas;

    const stats: DespesaStats = {
      totalDespesas: despesas.length,
      valorTotal: despesas.reduce((sum, d) => sum + d.valor, 0),
      porTipo: {},
      porStatus: {},
      naoSincronizadas: [],
      maisRecentes: []
    };

    // Contadores por tipo
    despesas.forEach(d => {
      if (!stats.porTipo[d.tipo]) {
        stats.porTipo[d.tipo] = { quantidade: 0, valor: 0 };
      }
      stats.porTipo[d.tipo].quantidade++;
      stats.porTipo[d.tipo].valor += d.valor;
      
      // Contadores por status
      stats.porStatus[d.status] = (stats.porStatus[d.status] || 0) + 1;
    });

    // Despesas não sincronizadas
    stats.naoSincronizadas = despesas.filter(d => d.status !== 'synced');

    // Despesas mais recentes (últimas 10)
    stats.maisRecentes = despesas
      .sort((a, b) => new Date(b.ultimaEdicao).getTime() - new Date(a.ultimaEdicao).getTime())
      .slice(0, 10);

    return stats;
  }

  /**
   * Obtém total de despesas por vistoria
   */
  static async getTotalByVistoria(vistoriaId: string): Promise<{
    total: number;
    quantidade: number;
    porTipo: Record<string, { quantidade: number; valor: number }>;
  }> {
    const despesas = await this.getDespesasByVistoria(vistoriaId);
    
    const result = {
      total: despesas.reduce((sum, d) => sum + d.valor, 0),
      quantidade: despesas.length,
      porTipo: {} as Record<string, { quantidade: number; valor: number }>
    };

    despesas.forEach(d => {
      if (!result.porTipo[d.tipo]) {
        result.porTipo[d.tipo] = { quantidade: 0, valor: 0 };
      }
      result.porTipo[d.tipo].quantidade++;
      result.porTipo[d.tipo].valor += d.valor;
    });

    return result;
  }

  /**
   * Limpa despesas antigas sincronizadas
   */
  static async cleanupOldDespesas(daysOld: number = 90): Promise<{
    removed: number;
    freedSpace: number;
  }> {
    console.log('🧹 DespesaStorage: INICIANDO limpeza automática');
    
    const allDespesas = await this.crudService.getAll();
    const now = new Date();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    
    let removed = 0;
    let freedSpace = 0;
    
    // Encontrar despesas antigas sincronizadas
    const oldSyncedDespesas = allDespesas.filter(d => {
      const age = now.getTime() - new Date(d.timestamp).getTime();
      return age > maxAge && d.status === 'synced';
    });
    
    // Remover despesas antigas
    for (const despesa of oldSyncedDespesas) {
      try {
        // Calcular espaço liberado (estimativa)
        const spaceUsed = despesa.comprovantes.reduce((sum, c) => sum + c.tamanho, 0);
        
        // Revogar URLs dos comprovantes
        despesa.comprovantes.forEach(c => {
          URL.revokeObjectURL(c.localUrl);
        });
        
        // Remover do IndexedDB
        await this.crudService.delete(despesa.id);
        
        removed++;
        freedSpace += spaceUsed;
        
        console.log(`🗑️ DespesaStorage: Removida despesa antiga ${despesa.id}`);
        
      } catch (error) {
        console.error(`❌ DespesaStorage: Erro ao remover ${despesa.id}:`, error);
      }
    }
    
    console.log('✅ DespesaStorage: Limpeza concluída', {
      removidas: removed,
      espacoLiberado: `${(freedSpace / 1024 / 1024).toFixed(1)}MB`
    });
    
    return { removed, freedSpace };
  }

  /**
   * Exporta despesas para backup
   */
  static async exportDespesas(vistoriaId?: string): Promise<DespesaLocal[]> {
    const allDespesas = await this.crudService.getAll();
    
    if (vistoriaId) {
      return allDespesas.filter(d => d.vistoriaId === vistoriaId);
    }
    
    return allDespesas;
  }

  /**
   * Obtém localização atual se disponível
   */
  private static async getCurrentLocation(): Promise<DespesaLocal['localizacao'] | undefined> {
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
          console.warn('⚠️ DespesaStorage: Erro ao obter localização:', error.message);
          resolve(undefined);
        },
        {
          timeout: 5000,
          maximumAge: 30000,
          enableHighAccuracy: false
        }
      );
    });
  }

  /**
   * Limpa todas as despesas (usar com cuidado!)
   */
  static async clearAllDespesas(): Promise<number> {
    const allDespesas = await this.crudService.getAll();
    
    // Revogar todas as URLs dos comprovantes
    allDespesas.forEach(d => {
      d.comprovantes.forEach(c => {
        URL.revokeObjectURL(c.localUrl);
      });
    });
    
    // Limpar store
    await this.crudService.clear();
    
    console.log(`🧹 DespesaStorage: ${allDespesas.length} despesas removidas`);
    
    return allDespesas.length;
  }
}