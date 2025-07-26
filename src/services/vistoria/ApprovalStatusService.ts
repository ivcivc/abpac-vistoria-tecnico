/**
 * Servico para verificar status de aprovacao/rejeicao de vistorias
 * Task 20 - Notificacoes de aprovacao/rejeicao
 */

interface ApprovalStatus {
  vistoriaId: string;
  status: 'aprovada' | 'rejeitada' | 'pendente' | 'em_analise';
  dataAlteracao: Date;
  observacoes?: string;
  responsavel?: string;
  motivoRejeicao?: string;
}

export interface ApprovalNotification {
  id: string;
  vistoriaId: string;
  tipo: 'aprovacao' | 'rejeicao';
  titulo: string;
  mensagem: string;
  dataNotificacao: Date;
  lida: boolean;
  metadata?: {
    responsavel?: string;
    observacoes?: string;
    motivoRejeicao?: string;
  };
}

interface ApprovalCheckResult {
  success: boolean;
  notifications: ApprovalNotification[];
  error?: string;
}

export class ApprovalStatusService {
  private static readonly STORAGE_KEY = 'approval-notifications';
  private static readonly API_BASE_URL = 'http://localhost:3333';

  /**
   * Verificar status de aprovacao de vistorias no backend
   */
  static async checkApprovalStatus(vistoriaIds: string[]): Promise<ApprovalCheckResult> {
    try {
      console.log('Verificando status de aprovacao para:', vistoriaIds);

      // Simular verificacao no backend (substituir por chamada real)
      const notifications = await this.simulateBackendCheck(vistoriaIds);
      
      // Armazenar notificacoes localmente
      await this.storeNotifications(notifications);

      return {
        success: true,
        notifications
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return {
        success: false,
        notifications: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verificar notificacoes pendentes armazenadas localmente
   */
  static async getPendingNotifications(): Promise<ApprovalNotification[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const notifications: ApprovalNotification[] = JSON.parse(stored);
      
      // Filtrar apenas notificacoes nao lidas dos ultimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      return notifications.filter(notification => 
        !notification.lida && 
        new Date(notification.dataNotificacao) > sevenDaysAgo
      );
    } catch (error) {
      console.error('Erro ao buscar notificacoes:', error);
      return [];
    }
  }

  /**
   * Marcar notificacao como lida
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      const notifications: ApprovalNotification[] = JSON.parse(stored);
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.lida = true;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
        console.log('Notificacao marcada como lida:', notificationId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }
  }

  /**
   * Limpar notificacoes antigas (mais de 30 dias)
   */
  static async cleanOldNotifications(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const notifications: ApprovalNotification[] = JSON.parse(stored);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filteredNotifications = notifications.filter(notification => 
        new Date(notification.dataNotificacao) > thirtyDaysAgo
      );

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredNotifications));
      console.log('Notificacoes antigas removidas');
    } catch (error) {
      console.error('Erro ao limpar notificacoes:', error);
    }
  }

  /**
   * PRIVADO: Simular verificacao no backend
   */
  private static async simulateBackendCheck(vistoriaIds: string[]): Promise<ApprovalNotification[]> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    const notifications: ApprovalNotification[] = [];

    // Simular algumas aprovacoes/rejeicoes aleatorias para demonstracao
    vistoriaIds.forEach((vistoriaId, index) => {
      const random = Math.random();
      
      if (random > 0.7) { // 30% de chance de ter uma notificacao
        const isApproval = random > 0.85; // 15% aprovacao, 15% rejeicao
        
        if (isApproval) {
          notifications.push({
            id: `approval-${vistoriaId}-${Date.now()}`,
            vistoriaId,
            tipo: 'aprovacao',
            titulo: 'Vistoria Aprovada!',
            mensagem: `Sua vistoria foi aprovada pela supervisao. Parabens pelo excelente trabalho!`,
            dataNotificacao: new Date(),
            lida: false,
            metadata: {
              responsavel: 'Supervisor Joao Silva',
              observacoes: 'Vistoria executada de acordo com os padroes estabelecidos.'
            }
          });
        } else {
          notifications.push({
            id: `rejection-${vistoriaId}-${Date.now()}`,
            vistoriaId,
            tipo: 'rejeicao',
            titulo: 'Vistoria Rejeitada',
            mensagem: `Sua vistoria foi rejeitada e precisa ser revisada. Verifique os pontos destacados.`,
            dataNotificacao: new Date(),
            lida: false,
            metadata: {
              responsavel: 'Supervisor Maria Santos',
              motivoRejeicao: 'Evidencias fotograficas insuficientes para alguns itens',
              observacoes: 'Por favor, refaca as fotos dos equipamentos com melhor iluminacao.'
            }
          });
        }
      }
    });

    console.log('Simulacao gerou:', notifications);
    return notifications;
  }

  /**
   * PRIVADO: Armazenar notificacoes localmente
   */
  private static async storeNotifications(newNotifications: ApprovalNotification[]): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const existingNotifications: ApprovalNotification[] = stored ? JSON.parse(stored) : [];

      // Combinar notificacoes, evitando duplicatas
      const allNotifications = [...existingNotifications];
      
      newNotifications.forEach(newNotification => {
        const exists = existingNotifications.some(existing => 
          existing.id === newNotification.id
        );
        
        if (!exists) {
          allNotifications.push(newNotification);
        }
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allNotifications));
      console.log('Notificacoes armazenadas:', allNotifications.length);
    } catch (error) {
      console.error('Erro ao armazenar notificacoes:', error);
    }
  }
}

export type { ApprovalStatus, ApprovalCheckResult };
