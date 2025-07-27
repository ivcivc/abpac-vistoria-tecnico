'use client';

import { CheckCircle, Wifi, WifiOff, RotateCw, AlertTriangle, Clock } from 'lucide-react';

export type SyncStatus = 'synchronized' | 'pending' | 'syncing' | 'error' | 'not_synced';

interface SyncStatusIndicatorProps {
  status?: SyncStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SyncStatusIndicator({ 
  status = 'not_synced', 
  size = 'md', 
  showLabel = false,
  className = '' 
}: SyncStatusIndicatorProps) {
  
  const getStatusConfig = (status: SyncStatus) => {
    switch (status) {
      case 'synchronized':
        return {
          icon: CheckCircle,
          label: 'Sincronizado',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Aguardando Sync',
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800'
        };
      case 'syncing':
        return {
          icon: RotateCw,
          label: 'Sincronizando',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          animate: true
        };
      case 'error':
        return {
          icon: AlertTriangle,
          label: 'Erro na Sync',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'not_synced':
      default:
        return {
          icon: WifiOff,
          label: 'Não Sincronizado',
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-700'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const iconSize = sizeClasses[size];

  if (showLabel) {
    return (
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.color} ${config.borderColor} ${className}`}>
        <Icon 
          className={`${iconSize} ${config.animate ? 'animate-spin' : ''}`}
        />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center justify-center p-1 rounded-full ${config.bgColor} ${config.borderColor} border ${className}`}
      title={config.label}
    >
      <Icon 
        className={`${iconSize} ${config.color} ${config.animate ? 'animate-spin' : ''}`}
      />
    </div>
  );
}

/**
 * Hook para determinar o status de sincronização de um item
 */
export function useSyncStatus(item: any): SyncStatus {
  // Se o item tem flag de erro de upload
  if (item.upload_error) {
    return 'error';
  }
  
  // Se foi modificado localmente mas ainda não sincronizado
  if (item.modificado_localmente || item.pendente_sincronizacao) {
    return 'pending';
  }
  
  // Se tem timestamp de sincronização recente
  if (item.ultima_sincronizacao) {
    const lastSync = new Date(item.ultima_sincronizacao);
    const lastUpdate = new Date(item.ultima_atualizacao || item.dataConclusao || item.dataAcesso);
    
    // Se a sincronização é mais recente que a última atualização
    if (lastSync >= lastUpdate) {
      return 'synchronized';
    } else {
      return 'pending';
    }
  }
  
  // Se tem dados conclusão mas não tem sincronização
  if (item.status === 'CONCLUIDO' || item.concluido) {
    return 'pending';
  }
  
  // Padrão: não sincronizado
  return 'not_synced';
}

/**
 * Componente para mostrar resumo de sincronização
 */
interface SyncSummaryProps {
  itens: any[];
  className?: string;
}

export function SyncSummary({ itens = [], className = '' }: SyncSummaryProps) {
  const stats = itens.reduce((acc, item) => {
    const status = useSyncStatus(item);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<SyncStatus, number>);

  const total = itens.length;
  const synchronized = stats.synchronized || 0;
  const pending = stats.pending || 0;
  const errors = stats.error || 0;

  if (total === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Status de Sincronização
        </h4>
        <Wifi className="w-4 h-4 text-gray-500" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <SyncStatusIndicator status="synchronized" size="sm" />
            <span className="text-gray-700 dark:text-gray-300">Sincronizados</span>
          </div>
          <span className="font-medium text-green-600 dark:text-green-400">
            {synchronized}/{total}
          </span>
        </div>
        
        {pending > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <SyncStatusIndicator status="pending" size="sm" />
              <span className="text-gray-700 dark:text-gray-300">Pendentes</span>
            </div>
            <span className="font-medium text-orange-600 dark:text-orange-400">
              {pending}
            </span>
          </div>
        )}
        
        {errors > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <SyncStatusIndicator status="error" size="sm" />
              <span className="text-gray-700 dark:text-gray-300">Com Erro</span>
            </div>
            <span className="font-medium text-red-600 dark:text-red-400">
              {errors}
            </span>
          </div>
        )}
      </div>
      
      {/* Barra de progresso */}
      {total > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progresso de Sincronização</span>
            <span>{Math.round((synchronized / total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(synchronized / total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 