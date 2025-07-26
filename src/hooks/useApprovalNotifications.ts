export function useApprovalNotifications({ vistoriaIds }: any) {
  return {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    checkNow: async () => {},
    markAsRead: async (id: string) => {},
    dismissNotification: (id: string) => {},
    clearAll: async () => {}
  };
}
