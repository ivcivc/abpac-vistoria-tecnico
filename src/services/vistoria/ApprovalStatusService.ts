export class ApprovalStatusService {
  static async checkApprovalStatus(vistoriaIds: string[]) {
    return { success: true, notifications: [] };
  }
  static async getPendingNotifications() { return []; }
  static async markAsRead(id: string) { return true; }
  static async cleanOldNotifications() { return; }
}
export interface ApprovalNotification {
  id: string;
  vistoriaId: string;
  tipo: "aprovacao" | "rejeicao";
  titulo: string;
  mensagem: string;
  dataNotificacao: Date;
  lida: boolean;
}
