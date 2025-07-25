'use client';

import React, { useState, useEffect } from 'react';
import { VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  X,
  Wifi,
  WifiOff,
  Upload,
  Download
} from 'lucide-react';

interface CompletionNotificationProps {
  vistoria: VistoriaLocal;
  onDismiss?: () => void;
  onSync?: () => void;
  isConnected?: boolean;
}

interface NotificationStatus {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  }>;
}

export function CompletionNotification({ 
  vistoria, 
  onDismiss, 
  onSync,
  isConnected = false 
}: CompletionNotificationProps) {
  const [notification, setNotification] = useState<NotificationStatus | null>(null);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Gerar notificação baseada no status da vistoria
  const generateNotification = (): NotificationStatus => {
    const now = new Date();
    const conclusaoRecente = vistoria.dataConclusao && 
      (now.getTime() - new Date(vistoria.dataConclusao).getTime()) < 60000; // Últimos 60 segundos

    if (vistoria.status === 'concluida') {
      if (conclusaoRecente) {
        // Vistoria recém-concluída
        if (isConnected) {
          return {
            type: 'success',
            title: '✅ Vistoria Concluída com Sucesso!',
            message: `A vistoria de ${vistoria.local} foi finalizada e está pronta para sincronização com o servidor.`,
            actions: [
              {
                label: 'Sincronizar Agora',
                action: () => onSync?.(),
                variant: 'default'
              },
              {
                label: 'Fechar',
                action: () => handleDismiss(),
                variant: 'outline'
              }
            ]
          };
        } else {
          return {
            type: 'warning',
            title: '⚠️ Vistoria Concluída - Offline',
            message: `A vistoria de ${vistoria.local} foi finalizada. Os dados serão sincronizados automaticamente quando a conexão for restabelecida.`,
            actions: [
              {
                label: 'Entendi',
                action: () => handleDismiss(),
                variant: 'default'
              }
            ]
          };
        }
      } else {
        // Vistoria já concluída há mais tempo
        if (!vistoria.sincronizada && isConnected) {
          return {
            type: 'info',
            title: '📤 Sincronização Pendente',
            message: `A vistoria de ${vistoria.local} está concluída e aguarda sincronização com o servidor.`,
            actions: [
              {
                label: 'Sincronizar',
                action: () => onSync?.(),
                variant: 'default'
              },
              {
                label: 'Fechar',
                action: () => handleDismiss(),
                variant: 'outline'
              }
            ]
          };
        } else if (vistoria.sincronizada) {
          return {
            type: 'success',
            title: '✅ Vistoria Sincronizada',
            message: `A vistoria de ${vistoria.local} foi enviada com sucesso para o servidor.`,
            actions: [
              {
                label: 'Fechar',
                action: () => handleDismiss(),
                variant: 'default'
              }
            ]
          };
        } else {
          return {
            type: 'warning',
            title: '📡 Aguardando Conexão',
            message: `A vistoria de ${vistoria.local} está concluída e será sincronizada quando houver conexão.`,
            actions: [
              {
                label: 'Fechar',
                action: () => handleDismiss(),
                variant: 'default'
              }
            ]
          };
        }
      }
    }

    // Status padrão para vistorias não concluídas
    return {
      type: 'info',
      title: '📋 Vistoria em Andamento',
      message: `Continue preenchendo os itens da vistoria de ${vistoria.local}.`,
      actions: [
        {
          label: 'Fechar',
          action: () => handleDismiss(),
          variant: 'outline'
        }
      ]
    };
  };

  // Manipular fechamento da notificação
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300); // Aguardar animação de fade-out
  };

  // Auto-hide para notificações de sucesso
  useEffect(() => {
    if (notification?.type === 'success' && vistoria.sincronizada) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000); // 5 segundos para notificações de sucesso sincronizada
      
      setAutoHideTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [notification, vistoria.sincronizada]);

  // Atualizar notificação quando vistoria ou conectividade mudar
  useEffect(() => {
    const newNotification = generateNotification();
    setNotification(newNotification);
  }, [vistoria, isConnected]);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (autoHideTimer) clearTimeout(autoHideTimer);
    };
  }, [autoHideTimer]);

  if (!notification || !isVisible) {
    return null;
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'info':
        return <Clock className="w-6 h-6 text-blue-600" />;
      case 'error':
        return <X className="w-6 h-6 text-red-600" />;
      default:
        return <CheckCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getCardStyle = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTitleStyle = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-orange-800';
      case 'info':
        return 'text-blue-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-gray-800';
    }
  };

  const getMessageStyle = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-orange-700';
      case 'info':
        return 'text-blue-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <Card className={`relative ${getCardStyle()} shadow-lg`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-3 text-lg ${getTitleStyle()}`}>
              {getIcon()}
              {notification.title}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Indicador de conectividade */}
              <Badge variant="outline" className="text-xs">
                {isConnected ? (
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-green-600" />
                    Online
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <WifiOff className="w-3 h-3 text-orange-600" />
                    Offline
                  </div>
                )}
              </Badge>
              
              {/* Indicador de sincronização */}
              {vistoria.status === 'concluida' && (
                <Badge 
                  variant={vistoria.sincronizada ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {vistoria.sincronizada ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Sincronizado
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Pendente
                    </div>
                  )}
                </Badge>
              )}
              
              {/* Botão fechar */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Mensagem */}
            <p className={`text-sm ${getMessageStyle()}`}>
              {notification.message}
            </p>
            
            {/* Informações adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium">Concluída em:</span>{' '}
                {vistoria.dataConclusao 
                  ? new Date(vistoria.dataConclusao).toLocaleString('pt-BR')
                  : 'Em andamento'
                }
              </div>
              {vistoria.ultimaSincronizacao && (
                <div>
                  <span className="font-medium">Última sincronização:</span>{' '}
                  {new Date(vistoria.ultimaSincronizacao).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
            
            {/* Ações */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex items-center justify-end gap-2 pt-2">
                {notification.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'default'}
                    size="sm"
                    onClick={action.action}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {/* Indicador de auto-hide */}
          {autoHideTimer && notification.type === 'success' && (
            <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-green-600 h-1 rounded-full transition-all duration-5000 ease-linear"
                style={{ width: '100%', animation: 'progress 5s linear' }}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
} 