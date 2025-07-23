import {
  NetworkCheck,
  PingResult,
  ConnectionStatus,
  ConnectionInfo,
  OFFLINE_CONFIG,
} from '@/types/offline';
import { buildApiUrl } from '@/config/api';

export class ConnectivityService {
  private static instance: ConnectivityService;
  private lastNetworkCheck: NetworkCheck | null = null;
  private pingTimeoutId: NodeJS.Timeout | null = null;

  static getInstance(): ConnectivityService {
    if (!ConnectivityService.instance) {
      ConnectivityService.instance = new ConnectivityService();
    }
    return ConnectivityService.instance;
  }

  /**
   * Verifica conectividade completa (navegador + servidor)
   */
  async checkConnectivity(): Promise<NetworkCheck> {
    const timestamp = new Date();

    try {
      // 1. Verificar se navegador está online
      const isOnline = typeof window !== 'undefined' ? navigator.onLine : false;

      if (!isOnline) {
        this.lastNetworkCheck = {
          online: false,
          serverReachable: false,
          latency: null,
          timestamp,
        };
        return this.lastNetworkCheck;
      }

      // 2. Fazer ping ao servidor
      const pingResult = await this.pingServer();

      this.lastNetworkCheck = {
        online: true,
        serverReachable: pingResult.success,
        latency: pingResult.latency,
        timestamp,
      };

      return this.lastNetworkCheck;
    } catch (error) {
      console.error('❌ Erro ao verificar conectividade:', error);

      this.lastNetworkCheck = {
        online: false,
        serverReachable: false,
        latency: null,
        timestamp,
      };

      return this.lastNetworkCheck;
    }
  }

  /**
   * Faz ping específico ao backend usando /api/health
   */
  async pingServer(): Promise<PingResult> {
    const startTime = Date.now();

    try {
      const url = buildApiUrl(OFFLINE_CONFIG.PING_ENDPOINT);
      console.log('🏓 Ping ao servidor:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ping bem-sucedido:', { latency: `${latency}ms`, status: data.status });

        return {
          success: true,
          latency,
          timestamp: new Date(),
        };
      } else {
        console.warn('⚠️ Servidor respondeu com erro:', response.status);
        return {
          success: false,
          latency,
          error: `HTTP ${response.status}`,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;

      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⏱️ Ping timeout (10s)');
        return {
          success: false,
          latency: null,
          error: 'Timeout (10s)',
          timestamp: new Date(),
        };
      }

      console.error('❌ Erro no ping:', error);
      return {
        success: false,
        latency: latency > 100 ? latency : null,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Determina status da conexão baseado nos checks
   */
  getConnectionStatus(networkCheck?: NetworkCheck): ConnectionInfo {
    const check = networkCheck || this.lastNetworkCheck;

    if (!check) {
      return {
        status: 'checking',
        message: 'Verificando conectividade...',
        icon: '🔄',
        lastCheck: new Date(),
      };
    }

    if (!check.online) {
      return {
        status: 'offline',
        message: 'Sem conexão com a internet',
        icon: '🔴',
        lastCheck: check.timestamp,
      };
    }

    if (!check.serverReachable) {
      return {
        status: 'limited',
        message: 'Conectado, mas servidor indisponível',
        icon: '🟡',
        lastCheck: check.timestamp,
      };
    }

    const latencyMessage = check.latency ? ` (${check.latency}ms)` : '';

    return {
      status: 'online',
      message: `Online - Servidor acessível${latencyMessage}`,
      icon: '🟢',
      lastCheck: check.timestamp,
    };
  }

  /**
   * Monitora conectividade em intervalos
   */
  startConnectivityMonitoring(callback: (info: ConnectionInfo) => void): () => void {
    console.log('🔄 Iniciando monitoramento de conectividade');

    // Check inicial
    this.checkConnectivity().then(check => {
      const info = this.getConnectionStatus(check);
      callback(info);
    });

    // Checks periódicos
    const intervalId = setInterval(async () => {
      try {
        const check = await this.checkConnectivity();
        const info = this.getConnectionStatus(check);
        callback(info);
      } catch (error) {
        console.error('❌ Erro no monitoramento:', error);
      }
    }, OFFLINE_CONFIG.CONNECTIVITY_CHECK_INTERVAL);

    // Listener de eventos de rede do navegador
    const handleOnline = () => {
      console.log('🌐 Navegador detectou conexão online');
      this.checkConnectivity().then(check => {
        const info = this.getConnectionStatus(check);
        callback(info);
      });
    };

    const handleOffline = () => {
      console.log('📵 Navegador detectou desconexão');
      callback({
        status: 'offline',
        message: 'Sem conexão com a internet',
        icon: '🔴',
        lastCheck: new Date(),
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Retorna função de cleanup
    return () => {
      console.log('⏹️ Parando monitoramento de conectividade');
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }

  /**
   * Verifica se está em um estado onde pode fazer operações que requerem servidor
   */
  canMakeServerRequests(): boolean {
    if (!this.lastNetworkCheck) return false;
    return this.lastNetworkCheck.online && this.lastNetworkCheck.serverReachable;
  }

  /**
   * Obtém última verificação de conectividade
   */
  getLastCheck(): NetworkCheck | null {
    return this.lastNetworkCheck;
  }

  /**
   * Força uma nova verificação
   */
  async forceCheck(): Promise<NetworkCheck> {
    console.log('🔄 Forçando verificação de conectividade');
    return await this.checkConnectivity();
  }
}
