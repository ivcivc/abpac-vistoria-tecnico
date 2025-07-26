/**
 * Serviço para verificação de status de aprovação/rejeição de vistorias
 * Task 20 - Integração com endpoints reais de notificações
 */

import { API_CONFIG, buildApiUrl } from '@/config/api';

// Tipos de notificações
export type NotificationType = 'approval' | 'correction' | 'info';

// Interface para notificações
export interface ApprovalNotification {
  id: string;
  vistoriaId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  details?: any;
}

// Interface para resposta da timeline
export interface TimelineItem {
  id: number;
  status: string;
  descricao?: string;
  tipo_acao: string;
  data: string;
  data_registro: string;
  usuario: string;
  tecnico_id?: number;
  tecnico_email?: string;
  item_id?: number;
  icone: string;
  dados_adicionais?: any;
}

// Interface para resposta de verificação
export interface CheckResponse {
  success: boolean;
  notifications?: ApprovalNotification[];
  error?: string;
}

// Classe principal do serviço
export class ApprovalStatusService {
  // Cache local de notificações
  private static notifications: ApprovalNotification[] = [];
  
  // Última verificação
  private static lastCheck: Date | null = null;
  
  /**
   * Verifica o status de aprovação/rejeição de uma vistoria
   * @param vistoriaId ID da vistoria
   * @param token Token de autenticação
   */
  static async checkApprovalStatus(
    vistoriaId: string | number,
    token: string
  ): Promise<CheckResponse> {
    try {
      console.log('🔄 ApprovalStatusService: Verificando status da vistoria', vistoriaId);
      
      // Validar parâmetros
      if (!vistoriaId) {
        return {
          success: false,
          error: 'ID da vistoria não informado'
        };
      }
      
      if (!token) {
        return {
          success: false,
          error: 'Token de autenticação não fornecido'
        };
      }
      
      // Construir URL para a timeline de status
      const url = buildApiUrl('/estoque-remessa/:id/timeline-status', { id: vistoriaId });
      console.log('🔄 ApprovalStatusService: URL da requisição:', url);
      
      // Fazer requisição
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Verificar resposta
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignorar erro de parse
        }
        
        throw new Error(errorMessage);
      }
      
      // Processar resposta
      const data = await response.json();
      
      if (!data || !data.type || !data.timeline) {
        throw new Error('Formato de resposta inválido');
      }
      
      // Processar timeline e gerar notificações
      const timeline: TimelineItem[] = data.timeline;
      console.log('📋 ApprovalStatusService: Timeline recebida:', timeline.length, 'itens');
      
      // Converter timeline em notificações
      const notifications = this.processTimeline(timeline, vistoriaId.toString());
      
      // Atualizar cache local
      this.updateLocalCache(notifications);
      
      // Atualizar última verificação
      this.lastCheck = new Date();
      
      return {
        success: true,
        notifications
      };
    } catch (error) {
      console.error('❌ ApprovalStatusService: Erro ao verificar status', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Processa a timeline e extrai notificações relevantes
   */
  private static processTimeline(
    timeline: TimelineItem[],
    vistoriaId: string
  ): ApprovalNotification[] {
    const notifications: ApprovalNotification[] = [];
    
    // Filtrar apenas eventos relevantes para notificações
    timeline.forEach(item => {
      // Verificar aprovação
      if (item.tipo_acao === 'APROVACAO_VISTORIA') {
        notifications.push({
          id: `approval_${item.id}`,
          vistoriaId,
          type: 'approval',
          title: 'Vistoria Aprovada',
          message: item.descricao || 'Sua vistoria foi aprovada com sucesso!',
          timestamp: new Date(item.data_registro),
          read: false,
          details: {
            usuario: item.usuario,
            data: item.data_registro
          }
        });
      }
      
      // Verificar solicitação de correção
      else if (item.tipo_acao === 'SOLICITACAO_CORRECAO') {
        notifications.push({
          id: `correction_${item.id}`,
          vistoriaId,
          type: 'correction',
          title: 'Correções Solicitadas',
          message: item.descricao || 'Foram solicitadas correções na vistoria.',
          timestamp: new Date(item.data_registro),
          read: false,
          details: {
            usuario: item.usuario,
            data: item.data_registro,
            itens_correcao: item.dados_adicionais?.itens_correcao || []
          }
        });
      }
      
      // Outros eventos importantes
      else if (['FINALIZACAO', 'CANCELAMENTO'].includes(item.tipo_acao)) {
        notifications.push({
          id: `info_${item.id}`,
          vistoriaId,
          type: 'info',
          title: item.tipo_acao === 'FINALIZACAO' ? 'Vistoria Finalizada' : 'Vistoria Cancelada',
          message: item.descricao || `Status da vistoria: ${item.status}`,
          timestamp: new Date(item.data_registro),
          read: false,
          details: {
            usuario: item.usuario,
            data: item.data_registro
          }
        });
      }
    });
    
    return notifications;
  }
  
  /**
   * Atualiza o cache local de notificações
   */
  private static updateLocalCache(newNotifications: ApprovalNotification[]): void {
    // Adicionar apenas notificações que não existem no cache
    newNotifications.forEach(notification => {
      const existingIndex = this.notifications.findIndex(n => n.id === notification.id);
      
      if (existingIndex === -1) {
        // Adicionar nova notificação
        this.notifications.push(notification);
      } else {
        // Manter o status de leitura
        notification.read = this.notifications[existingIndex].read;
        // Atualizar notificação existente
        this.notifications[existingIndex] = notification;
      }
    });
    
    // Ordenar por data (mais recente primeiro)
    this.notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Salvar no localStorage
    this.saveNotificationsToStorage();
  }
  
  /**
   * Salva notificações no localStorage
   */
  private static saveNotificationsToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('approval_notifications', JSON.stringify(this.notifications));
      }
    } catch (error) {
      console.error('❌ ApprovalStatusService: Erro ao salvar notificações', error);
    }
  }
  
  /**
   * Carrega notificações do localStorage
   */
  static loadNotificationsFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('approval_notifications');
        
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // Converter strings de data para objetos Date
          this.notifications = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          
          console.log('📋 ApprovalStatusService: Notificações carregadas do storage:', this.notifications.length);
        }
      }
    } catch (error) {
      console.error('❌ ApprovalStatusService: Erro ao carregar notificações', error);
    }
  }
  
  /**
   * Obtém todas as notificações
   */
  static getNotifications(): ApprovalNotification[] {
    // Carregar do storage se não houver notificações em memória
    if (this.notifications.length === 0) {
      this.loadNotificationsFromStorage();
    }
    
    return [...this.notifications];
  }
  
  /**
   * Obtém notificações não lidas
   */
  static getUnreadNotifications(): ApprovalNotification[] {
    return this.getNotifications().filter(n => !n.read);
  }
  
  /**
   * Marca uma notificação como lida
   */
  static markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      this.saveNotificationsToStorage();
    }
  }
  
  /**
   * Marca todas as notificações como lidas
   */
  static markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotificationsToStorage();
  }
  
  /**
   * Remove uma notificação
   */
  static removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotificationsToStorage();
  }
  
  /**
   * Limpa todas as notificações
   */
  static clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotificationsToStorage();
  }
  
  /**
   * Verifica se é necessário fazer uma nova verificação
   * @param minInterval Intervalo mínimo em minutos
   */
  static shouldCheck(minInterval: number = 5): boolean {
    if (!this.lastCheck) return true;
    
    const now = new Date();
    const diffMs = now.getTime() - this.lastCheck.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    return diffMinutes >= minInterval;
  }
}
