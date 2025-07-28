'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SyncQueueService } from '@/services/sync/SyncQueueService';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';

interface SyncStats {
  total: number;
  pendentes: number;
  comErro: number;
  porTipo: Record<string, number>;
}

interface SyncQueueStatusProps {
  className?: string;
}

export function SyncQueueStatus({ className }: SyncQueueStatusProps) {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);

  const syncQueueService = SyncQueueService.getInstance();

  // Carregar estatísticas
  const carregarEstatisticas = async () => {
    setLoading(true);
    try {
      const result = await syncQueueService.obterEstatisticas();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas da fila:', error);
    } finally {
      setLoading(false);
    }
  };

  // Forçar processamento da fila
  const forcarProcessamento = async () => {
    setLoading(true);
    try {
      await syncQueueService.processarFila();
      await carregarEstatisticas();
    } catch (error) {
      console.error('Erro ao processar fila:', error);
    } finally {
      setLoading(false);
    }
  };

  // Monitorar status de conectividade
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Carregar estatísticas periodicamente
  useEffect(() => {
    carregarEstatisticas();
    
    const interval = setInterval(carregarEstatisticas, 10000); // A cada 10 segundos
    
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Sincronização</span>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={forcarProcessamento}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Status geral */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            {stats.total === 0 ? (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                Sincronizado
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                {stats.pendentes} pendente(s)
              </Badge>
            )}
          </div>

          {/* Estatísticas detalhadas */}
          {stats.total > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total na fila</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                
                {stats.pendentes > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendentes
                    </span>
                    <span className="font-medium text-orange-600">{stats.pendentes}</span>
                  </div>
                )}
                
                {stats.comErro > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Com erro
                    </span>
                    <span className="font-medium text-red-600">{stats.comErro}</span>
                  </div>
                )}
              </div>

              {/* Tipos de operação */}
              {Object.keys(stats.porTipo).length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Por tipo:</div>
                  <div className="space-y-1">
                    {Object.entries(stats.porTipo).map(([tipo, quantidade]) => (
                      <div key={tipo} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {tipo === 'UPDATE_ITEM' && 'Itens'}
                          {tipo === 'UPLOAD_EVIDENCE' && 'Evidências'}
                          {tipo === 'COMPLETE_VISTORIA' && 'Conclusões'}
                        </span>
                        <span className="font-medium">{quantidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Status de conectividade */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Conexão</span>
              <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 