'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Signal, SignalHigh, SignalLow, Clock } from 'lucide-react';

interface ConnectivityIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

/**
 * Indicador de conectividade para o sistema
 * - Status online/offline
 * - Informações detalhadas opcionais
 * - Responsivo ao tema ABPAC
 */
export function ConnectivityIndicator({
  showDetails = true,
  className = '',
}: ConnectivityIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Estado inicial
    setIsOnline(navigator.onLine);

    // Event listeners para mudanças de conectividade
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // SSR safety
  if (!mounted) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="w-3 h-3 bg-muted/50 rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground">Conectando...</span>
      </div>
    );
  }

  const formatLastOnline = (date: Date | null) => {
    if (!date) return '';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `${minutes}min atrás`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;

    return date.toLocaleDateString('pt-BR');
  };

  // Versão compacta
  if (!showDetails) {
    return (
      <div className={cn('flex items-center space-x-1.5', className)}>
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-600">Offline</span>
          </>
        )}
      </div>
    );
  }

  // Versão detalhada
  return (
    <div
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg border transition-all',
        isOnline
          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
          : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
        className
      )}
    >
      {/* Ícone de Status */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full',
          isOnline ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
        )}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
      </div>

      {/* Informações de Status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span
            className={cn(
              'text-sm font-medium',
              isOnline ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            )}
          >
            {isOnline ? 'Conectado' : 'Desconectado'}
          </span>

          {/* Indicador de sinal (apenas quando online) */}
          {isOnline && <Signal className="h-3 w-3 text-green-600 dark:text-green-400" />}
        </div>

        <p
          className={cn(
            'text-xs',
            isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {isOnline
            ? 'Sincronização ativa'
            : lastOnline
              ? `Última conexão: ${formatLastOnline(lastOnline)}`
              : 'Trabalhando offline'}
        </p>
      </div>

      {/* Indicador adicional quando offline */}
      {!isOnline && (
        <div className="flex flex-col items-center space-y-1">
          <Clock className="h-3 w-3 text-red-600 dark:text-red-400" />
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">Offline</span>
        </div>
      )}
    </div>
  );
}

/**
 * Componente simples para header/navbar
 */
export function ConnectivityBadge({ className = '' }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getIcon = () => {
    return isOnline ? '🟢' : '🔴';
  };

  const getMessage = () => {
    return isOnline ? 'Online' : 'Offline';
  };

  const getColor = () => {
    return isOnline
      ? 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800'
      : 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
  };

  return (
    <div
      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium border ${getColor()} ${className}`}
    >
      <span>{getIcon()}</span>
      <span>{getMessage()}</span>
    </div>
  );
}
