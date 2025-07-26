import { useState, useEffect, useCallback } from 'react';
import { 
  ApprovalStatusService, 
  ApprovalNotification, 
  ApprovalCheckResult 
} from '@/services/vistoria/ApprovalStatusService';

interface UseApprovalNotificationsProps {
  vistoriaIds: string[];
  autoCheck?: boolean;
  checkInterval?: number;
}

interface UseApprovalNotificationsReturn {
  notifications: ApprovalNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  checkNow: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  dismissNotification: (notificationId: string) => void;
  clearAll: () => Promise<void>;
}

/**
 * Hook para gerenciar notificacoes de aprovacao/rejeicao de vistorias
 * Task 20 - Notificacoes de aprovacao/rejeicao
 */
export function useApprovalNotifications({
  vistoriaIds,
  autoCheck = true,
  checkInterval = 300000 // 5 minutos
}: UseApprovalNotificationsProps): UseApprovalNotificationsReturn {
  const [notifications, setNotifications] = useState<ApprovalNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar notificacoes pendentes do armazenamento local
  const loadPendingNotifications = useCallback(async () => {
    try {
      const pending = await ApprovalStatusService.getPendingNotifications();
      setNotifications(pending);
      console.log('Notificacoes carregadas:', pending.length);
    } catch (err) {
      console.error('Erro ao carregar notificacoes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificacoes');
    }
  }, []);

  // Verificar status de aprovacao no backend
  const checkNow = useCallback(async () => {
    if (vistoriaIds.length === 0) {
      console.log('Nenhuma vistoria para verificar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Verificando aprovacoes para:', vistoriaIds);
      
      const result: ApprovalCheckResult = await ApprovalStatusService.checkApprovalStatus(vistoriaIds);
      
      if (result.success) {
        // Recarregar notificacoes pendentes apos verificacao
        await loadPendingNotifications();
        
        if (result.notifications.length > 0) {
          console.log('Novas notificacoes encontradas:', result.notifications.length);
        }
      } else {
        setError(result.error || 'Erro ao verificar status de aprovacao');
      }
    } catch (err) {
      console.error('Erro na verificacao:', err);
      setError(err instanceof Error ? err.message : 'Erro na verificacao');
    } finally {
      setLoading(false);
    }
  }, [vistoriaIds, loadPendingNotifications]);

  // Marcar notificacao como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await ApprovalStatusService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, lida: true }
              : notification
          )
        );
        console.log('Notificacao marcada como lida:', notificationId);
      }
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  }, []);

  // Remover notificacao da lista (dismiss)
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    console.log('Notificacao removida:', notificationId);
  }, []);

  // Limpar todas as notificacoes
  const clearAll = useCallback(async () => {
    try {
      // Marcar todas como lidas
      await Promise.all(
        notifications
          .filter(n => !n.lida)
          .map(n => ApprovalStatusService.markAsRead(n.id))
      );
      
      // Limpar lista local
      setNotifications([]);
      
      console.log('Todas as notificacoes foram limpas');
    } catch (err) {
      console.error('Erro ao limpar notificacoes:', err);
    }
  }, [notifications]);

  // Calcular contagem de nao lidas
  const unreadCount = notifications.filter(n => !n.lida).length;

  // Carregar notificacoes pendentes na inicializacao
  useEffect(() => {
    loadPendingNotifications();
  }, [loadPendingNotifications]);

  // Configurar verificacao automatica
  useEffect(() => {
    if (!autoCheck || vistoriaIds.length === 0) return;

    // Verificacao inicial
    checkNow();

    // Configurar verificacao periodica
    const interval = setInterval(() => {
      if (navigator.onLine) { // So verificar se estiver online
        checkNow();
      }
    }, checkInterval);

    console.log(`Verificacao automatica configurada (${checkInterval / 1000}s)`);

    return () => {
      clearInterval(interval);
      console.log('Verificacao automatica parada');
    };
  }, [autoCheck, checkInterval, vistoriaIds, checkNow]);

  // Limpeza de notificacoes antigas periodicamente
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      ApprovalStatusService.cleanOldNotifications();
    }, 24 * 60 * 60 * 1000); // Uma vez por dia

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    checkNow,
    markAsRead,
    dismissNotification,
    clearAll
  };
}
