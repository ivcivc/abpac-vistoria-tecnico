/**
 * Utilitários para cálculo de progresso de vistorias
 * Sistema de Vistoria ABPAC - Técnicos de Campo
 */

import { VistoriaItem } from '@/types/storage';

export interface ProgressInfo {
  percentage: number; // 0-100
  completed: number;
  total: number;
  pending: number;
  status: 'not_started' | 'in_progress' | 'completed';
  description: string;
}

/**
 * Calcula o progresso de uma vistoria baseado nos seus itens
 */
export function calculateVistoriaProgress(itens: VistoriaItem[] = []): ProgressInfo {
  if (!itens || itens.length === 0) {
    return {
      percentage: 0,
      completed: 0,
      total: 0,
      pending: 0,
      status: 'not_started',
      description: 'Nenhum item para processar'
    };
  }

  const total = itens.length;
  const completed = itens.filter(item => item.status === 'concluido').length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  let status: ProgressInfo['status'];
  let description: string;

  if (completed === 0) {
    status = 'not_started';
    description = `${total} itens aguardando`;
  } else if (completed === total) {
    status = 'completed';
    description = 'Todos os itens concluídos';
  } else {
    status = 'in_progress';
    description = `${completed} de ${total} itens concluídos`;
  }

  return {
    percentage,
    completed,
    total,
    pending,
    status,
    description
  };
}

/**
 * Calcula progresso baseado apenas no status da vistoria (fallback)
 */
export function calculateProgressFromStatus(status: string): ProgressInfo {
  switch (status.toLowerCase()) {
    case 'concluida':
    case 'finalizada':
    case 'aprovada':
      return {
        percentage: 100,
        completed: 1,
        total: 1,
        pending: 0,
        status: 'completed',
        description: 'Vistoria concluída'
      };
    
    case 'em_andamento':
    case 'em_vistoria':
      return {
        percentage: 50,
        completed: 0,
        total: 1,
        pending: 1,
        status: 'in_progress',
        description: 'Vistoria em andamento'
      };
    
    case 'pausada':
      return {
        percentage: 25,
        completed: 0,
        total: 1,
        pending: 1,
        status: 'in_progress',
        description: 'Vistoria pausada'
      };
    
    default:
      return {
        percentage: 0,
        completed: 0,
        total: 1,
        pending: 1,
        status: 'not_started',
        description: 'Vistoria pendente'
      };
  }
}

/**
 * Determina se uma vistoria está sincronizada baseado em critérios
 */
export function calculateSyncStatus(vistoria: any): {
  isSynced: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  pendingOperations: number;
} {
  // Por enquanto, implementação simplificada
  // TODO: Integrar com SyncService real
  
  const isSynced = vistoria.sincronizada || vistoria.status === 'aprovada';
  const isSyncing = false; // TODO: Verificar se há operações em andamento
  const pendingOperations = 0; // TODO: Contar operações na fila
  
  return {
    isSynced,
    isSyncing,
    lastSync: vistoria.ultimaSincronizacao ? new Date(vistoria.ultimaSincronizacao) : undefined,
    pendingOperations
  };
}

/**
 * Obtém cor do progresso baseada na porcentagem
 */
export function getProgressColor(percentage: number): string {
  if (percentage < 25) return 'bg-red-500';
  if (percentage < 50) return 'bg-orange-500';
  if (percentage < 75) return 'bg-yellow-500';
  if (percentage < 100) return 'bg-blue-500';
  return 'bg-green-500';
}

/**
 * Obtém cor do texto do progresso
 */
export function getProgressTextColor(percentage: number): string {
  if (percentage < 25) return 'text-red-700';
  if (percentage < 50) return 'text-orange-700';
  if (percentage < 75) return 'text-yellow-700';
  if (percentage < 100) return 'text-blue-700';
  return 'text-green-700';
} 