// Tipos para o Sistema Offline - Sistema de Vistoria ABPAC

export interface OfflineState {
  // Status de conectividade
  isOnline: boolean;
  isServerReachable: boolean;
  lastPingTime: Date | null;

  // Status de sincronização
  pendingSyncs: number;
  syncInProgress: boolean;
  lastSyncTime: Date | null;
  syncErrors: SyncError[];

  // Uso de armazenamento
  storageUsage: number; // Em bytes
  storageLimit: number; // Em bytes
  storagePercentage: number; // 0-100
}

export interface OfflineContextProps {
  offlineState: OfflineState;
  // Funções de conectividade
  checkConnectivity: () => Promise<boolean>;
  pingServer: () => Promise<boolean>;
  // Funções de sincronização
  syncData: () => Promise<SyncResult>;
  syncDataSilent: () => Promise<SyncResult>;
  // Gestão de armazenamento
  clearOldData: (daysOld?: number) => Promise<void>;
  getStorageStats: () => Promise<StorageStats>;
  // Feedback para usuário
  showOfflineMessage: (message: string, type?: 'info' | 'warning' | 'error') => void;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: SyncError[];
  duration: number; // Em milissegundos
  timestamp: Date;
}

export interface SyncError {
  id: string;
  tipo: 'vistoria' | 'item' | 'evidencia' | 'despesa';
  operacao: 'create' | 'update' | 'delete';
  erro: string;
  timestamp: Date;
  tentativas: number;
  dados?: any; // Dados que causaram erro
}

export interface StorageStats {
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

// Tipos para operações de rede
export interface NetworkCheck {
  online: boolean;
  serverReachable: boolean;
  latency: number | null; // Em milissegundos
  timestamp: Date;
}

export interface PingResult {
  success: boolean;
  latency: number | null;
  error?: string;
  timestamp: Date;
}

// Configurações do sistema offline
export const OFFLINE_CONFIG = {
  // Intervalos de verificação (em milissegundos)
  PING_INTERVAL: 30000, // 30 segundos
  SYNC_INTERVAL: 60000, // 1 minuto (quando online)
  CONNECTIVITY_CHECK_INTERVAL: 5000, // 5 segundos

  // Tentativas de sincronização
  MAX_SYNC_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // 1 segundo base para backoff exponencial

  // Limpeza de dados
  DATA_RETENTION_DAYS: 30, // Manter dados por 30 dias
  MAX_STORAGE_MB: 100, // Máximo de 100MB
  CLEANUP_THRESHOLD_PERCENTAGE: 85, // Limpar quando usar 85% do espaço

  // URLs do backend
  PING_ENDPOINT: '/health', // Sem /api pois buildApiUrl já adiciona baseUrl com /api
  BASE_URL:
    process.env.NODE_ENV === 'production' ? 'https://api.abpac.com.br' : 'http://localhost:3333',
} as const;

// Estados da conexão para melhor UX
export type ConnectionStatus =
  | 'online' // Online com servidor acessível
  | 'offline' // Completamente offline
  | 'limited' // Online mas servidor inacessível
  | 'checking'; // Verificando conectividade

export interface ConnectionInfo {
  status: ConnectionStatus;
  message: string;
  icon: '🟢' | '🔴' | '🟡' | '🔄';
  lastCheck: Date;
}
