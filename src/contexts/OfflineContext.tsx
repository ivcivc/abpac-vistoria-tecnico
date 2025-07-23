'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Tipos minimalistas inline (sem importações externas)
interface OfflineState {
  isOnline: boolean;
  isServerReachable: boolean;
  lastPingTime: Date | null;
  pendingSyncs: number;
  syncInProgress: boolean;
  lastSyncTime: Date | null;
  syncErrors: any[];
  storageUsage: number;
  storageLimit: number;
  storagePercentage: number;
}

interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: any[];
  duration: number;
  timestamp: Date;
}

interface StorageStats {
  totalUsage: number;
  availableSpace: number;
  percentageUsed: number;
  itemCounts: {
    vistorias: number;
    itens: number;
    evidencias: number;
    despesas: number;
    syncQueue: number;
  };
  oldestItem: Date | null;
  newestItem: Date | null;
}

interface OfflineContextProps {
  offlineState: OfflineState;
  checkConnectivity: () => Promise<boolean>;
  pingServer: () => Promise<boolean>;
  syncData: () => Promise<SyncResult>;
  syncDataSilent: () => Promise<SyncResult>;
  clearOldData: (daysOld?: number) => Promise<void>;
  getStorageStats: () => Promise<StorageStats>;
  showOfflineMessage: (message: string, type?: 'info' | 'warning' | 'error') => void;
}

// Estado inicial simples
const initialOfflineState: OfflineState = {
  isOnline: true,
  isServerReachable: false,
  lastPingTime: null,
  pendingSyncs: 0,
  syncInProgress: false,
  lastSyncTime: null,
  syncErrors: [],
  storageUsage: 0,
  storageLimit: 100 * 1024 * 1024, // 100MB
  storagePercentage: 0,
};

// Context simples
const OfflineContext = createContext<OfflineContextProps | undefined>(undefined);

// Hook simples para usar o contexto
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline deve ser usado dentro de um OfflineProvider');
  }
  return context;
};

// Props do provider
interface OfflineProviderProps {
  children: ReactNode;
}

// Provider completamente minimalista
export function OfflineProvider({ children }: OfflineProviderProps) {
  const [state] = useState<OfflineState>(initialOfflineState);

  // Funções completamente simples (sem dependências externas)
  const syncData = useCallback(async (): Promise<SyncResult> => {
    console.log('📡 SyncData - modo ULTRA simplificado');
    return {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: [],
      duration: 0,
      timestamp: new Date(),
    };
  }, []);

  const syncDataSilent = useCallback(async (): Promise<SyncResult> => {
    console.log('📡 SyncDataSilent - modo ULTRA simplificado');
    return syncData();
  }, [syncData]);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    console.log('📡 CheckConnectivity - modo ULTRA simplificado');
    return true;
  }, []);

  const pingServer = useCallback(async (): Promise<boolean> => {
    console.log('📡 PingServer - modo ULTRA simplificado');
    return true;
  }, []);

  const getStorageStats = useCallback(async (): Promise<StorageStats> => {
    console.log('📊 GetStorageStats - modo ULTRA simplificado');
    return {
      totalUsage: 0,
      availableSpace: 1024 * 1024 * 100,
      percentageUsed: 0,
      itemCounts: {
        vistorias: 0,
        itens: 0,
        evidencias: 0,
        despesas: 0,
        syncQueue: 0,
      },
      oldestItem: null,
      newestItem: null,
    };
  }, []);

  const clearOldData = useCallback(async (): Promise<void> => {
    console.log('🗑️ ClearOldData - modo ULTRA simplificado');
  }, []);

  const showOfflineMessage = useCallback((message: string) => {
    console.log('📱 Mensagem offline (ULTRA simplificado):', message);
  }, []);

  const value: OfflineContextProps = {
    offlineState: state,
    syncData,
    syncDataSilent,
    checkConnectivity,
    pingServer,
    getStorageStats,
    clearOldData,
    showOfflineMessage,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

// Hooks auxiliares completamente simples
export function useConnectivity() {
  const { offlineState } = useOffline();
  return {
    isOnline: offlineState.isOnline,
    isServerReachable: offlineState.isServerReachable,
    lastPingTime: offlineState.lastPingTime,
  };
}

export function useSyncStatus() {
  const { offlineState, syncData } = useOffline();
  return {
    syncInProgress: offlineState.syncInProgress,
    pendingSyncs: offlineState.pendingSyncs,
    lastSyncTime: offlineState.lastSyncTime,
    syncErrors: offlineState.syncErrors,
    triggerSync: syncData,
  };
}

export function useStorageStatus() {
  const { offlineState, getStorageStats } = useOffline();
  return {
    storageUsage: offlineState.storageUsage,
    storageLimit: offlineState.storageLimit,
    storagePercentage: offlineState.storagePercentage,
    refreshStats: getStorageStats,
  };
}
