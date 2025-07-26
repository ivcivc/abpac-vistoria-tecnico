import { useState, useEffect, useCallback } from 'react';
import { ApprovalStatusService, ApprovalNotification } from '@/services/vistoria/ApprovalStatusService';
import { useAuth } from '@/contexts/AuthContext';

interface UseApprovalNotificationsProps {
  vistoriaId?: string | null;
  checkInterval?: number; // em minutos
  autoCheck?: boolean;
}

/**
 * Hook para gerenciar notificações de aprovação/rejeição de vistorias
 */
export function useApprovalNotifications({
  vistoriaId = null,
  checkInterval = 5,
  autoCheck = true
}: UseApprovalNotificationsProps = {}) {
  // Estados
  const [notifications, setNotifications] = useState<ApprovalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Contexto de autenticação
  const { token } = useAuth().authState;

  // Função para carregar notificações do cache local
  const loadNotifications = useCallback(() => {
    try {
      const allNotifications = ApprovalStatusService.getNotifications();
      
      // Filtrar por vistoriaId se fornecido
      const filteredNotifications = vistoriaId 
        ? allNotifications.filter(n => n.vistoriaId === vistoriaId)
        : allNotifications;
      
      setNotifications(filteredNotifications);
      setUnreadCount(filteredNotifications.filter(n => !n.read).length);
      
      return filteredNotifications;
    } catch (error) {
      console.error('❌ useApprovalNotifications: Erro ao carregar notificações', error);
      setError('Erro ao carregar notificações');
      return [];
    }
  }, [vistoriaId]);

  // Função para verificar novas notificações
  const checkForNotifications = useCallback(async () => {
    if (!token || (vistoriaId === null && !notifications.length)) {
      console.log('⚠️ useApprovalNotifications: Token ou vistoriaId não disponível');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Se temos um vistoriaId específico, verificar apenas essa vistoria
      if (vistoriaId) {
        console.log('🔄 useApprovalNotifications: Verificando notificações para vistoria', vistoriaId);
        await ApprovalStatusService.checkApprovalStatus(vistoriaId, token);
      } 
      // Caso contrário, verificar todas as vistorias que já temos notificações
      else {
        // Obter IDs únicos de vistorias das notificações existentes
        const vistoriaIds = [...new Set(notifications.map(n => n.vistoriaId))];
        
        if (vistoriaIds.length > 0) {
          console.log('🔄 useApprovalNotifications: Verificando notificações para múltiplas vistorias', vistoriaIds);
          
          // Verificar cada vistoria individualmente
          for (const id of vistoriaIds) {
            await ApprovalStatusService.checkApprovalStatus(id, token);
          }
        }
      }
      
      // Atualizar estado com notificações do cache
      const updatedNotifications = loadNotifications();
      console.log('✅ useApprovalNotifications: Notificações atualizadas', updatedNotifications.length);
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('❌ useApprovalNotifications: Erro ao verificar notificações', error);
      setError(error instanceof Error ? error.message : 'Erro ao verificar notificações');
    } finally {
      setLoading(false);
    }
  }, [token, vistoriaId, notifications, loadNotifications]);

  // Marcar notificação como lida
  const markAsRead = useCallback((notificationId: string) => {
    ApprovalStatusService.markAsRead(notificationId);
    loadNotifications();
  }, [loadNotifications]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    ApprovalStatusService.markAllAsRead();
    loadNotifications();
  }, [loadNotifications]);

  // Remover notificação
  const removeNotification = useCallback((notificationId: string) => {
    ApprovalStatusService.removeNotification(notificationId);
    loadNotifications();
  }, [loadNotifications]);

  // Limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    ApprovalStatusService.clearAllNotifications();
    loadNotifications();
  }, [loadNotifications]);

  // Efeito para carregar notificações iniciais
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Efeito para verificação automática periódica
  useEffect(() => {
    if (!autoCheck || !token) return;

    // Verificar imediatamente na primeira vez
    checkForNotifications();

    // Configurar verificação periódica
    const intervalId = setInterval(() => {
      if (ApprovalStatusService.shouldCheck(checkInterval)) {
        checkForNotifications();
      }
    }, checkInterval * 60 * 1000); // Converter minutos para milissegundos

    return () => clearInterval(intervalId);
  }, [autoCheck, token, checkInterval, checkForNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    lastChecked,
    checkForNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  };
}
