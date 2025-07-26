'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  RefreshCw,
  Info,
  Check
} from 'lucide-react';
import { useApprovalNotifications } from '@/hooks/useApprovalNotifications';
import { ApprovalNotification as NotificationType } from '@/services/vistoria/ApprovalStatusService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface ApprovalNotificationProps {
  vistoriaId?: string;
  autoCheck?: boolean;
  checkInterval?: number;
  onlyUnread?: boolean;
  maxHeight?: string;
}

/**
 * Componente para exibir notificações de aprovação/rejeição de vistorias
 */
export function ApprovalNotification({
  vistoriaId,
  autoCheck = true,
  checkInterval = 5,
  onlyUnread = false,
  maxHeight = '300px'
}: ApprovalNotificationProps) {
  // Estados locais
  const [isOpen, setIsOpen] = useState(false);
  const [animateCount, setAnimateCount] = useState(false);
  const [lastUnreadCount, setLastUnreadCount] = useState(0);

  // Obter token do contexto de autenticação
  const { token } = useAuth().authState;

  // Usar hook de notificações
  const {
    notifications,
    unreadCount,
    loading,
    error,
    checkForNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification
  } = useApprovalNotifications({
    vistoriaId: vistoriaId || null,
    autoCheck,
    checkInterval
  });

  // Filtrar notificações não lidas se necessário
  const displayNotifications = onlyUnread
    ? notifications.filter(n => !n.read)
    : notifications;

  // Efeito para animação quando chegam novas notificações
  useEffect(() => {
    if (unreadCount > lastUnreadCount) {
      setAnimateCount(true);
      setTimeout(() => setAnimateCount(false), 1000);
    }
    setLastUnreadCount(unreadCount);
  }, [unreadCount, lastUnreadCount]);

  // Verificar notificações manualmente
  const handleCheckNow = () => {
    if (token) {
      checkForNotifications();
    }
  };

  // Marcar uma notificação como lida
  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  // Remover uma notificação
  const handleRemove = (id: string) => {
    removeNotification(id);
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Formatar data relativa
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  // Obter ícone para o tipo de notificação
  const getNotificationIcon = (notification: NotificationType) => {
    switch (notification.type) {
      case 'approval':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'correction':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Obter cor de fundo para o tipo de notificação
  const getNotificationBgClass = (notification: NotificationType): string => {
    if (notification.read) return 'bg-gray-50';
    
    switch (notification.type) {
      case 'approval':
        return 'bg-green-50 border-green-200';
      case 'correction':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Botão de notificações com contador */}
      <Button
        variant="outline"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4 mr-1" />
        <span>Notificações</span>
        {unreadCount > 0 && (
          <Badge
            className={`absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5 bg-red-500 text-white ${
              animateCount ? 'animate-pulse' : ''
            }`}
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Painel de notificações */}
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 sm:w-96 z-50 p-0 shadow-lg">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="font-medium">
              Notificações
              {unreadCount > 0 && (
                <Badge variant="outline" className="ml-2">
                  {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCheckNow}
                disabled={loading}
                title="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsOpen(false)}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista de notificações */}
          <div 
            className="overflow-y-auto" 
            style={{ maxHeight }}
          >
            {displayNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {loading ? 'Carregando notificações...' : 'Nenhuma notificação disponível'}
              </div>
            ) : (
              <ul className="divide-y">
                {displayNotifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`p-3 ${getNotificationBgClass(notification)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-0.5">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                        {notification.details?.usuario && (
                          <p className="text-xs text-gray-500 mt-1">
                            Por: {notification.details.usuario}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Marcar como lida
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleRemove(notification.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Rodapé */}
          {displayNotifications.length > 0 && (
            <div className="border-t p-2 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {displayNotifications.length} {displayNotifications.length === 1 ? 'notificação' : 'notificações'}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Marcar todas como lidas
              </Button>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="p-2 text-xs text-red-500 border-t">
              Erro: {error}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
