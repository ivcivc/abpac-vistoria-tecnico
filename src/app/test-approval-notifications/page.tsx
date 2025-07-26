'use client';

import { useState } from 'react';
import { useApprovalNotifications } from '@/hooks/useApprovalNotifications';
import { ApprovalNotification } from '@/components/vistoria/ApprovalNotification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestApprovalNotificationsPage() {
  // Simular vistorias do tecnico logado
  const [vistoriaIds] = useState([
    'VIST-2024-001',
    'VIST-2024-002', 
    'VIST-2024-003',
    'VIST-2024-004',
    'VIST-2024-005'
  ]);

  // Hook principal da Task 20
  const {
    notifications,
    unreadCount,
    loading,
    error,
    checkNow,
    markAsRead,
    dismissNotification,
    clearAll
  } = useApprovalNotifications({
    vistoriaIds,
    autoCheck: false, // Desabilitado para demonstracao
    checkInterval: 60000 // 1 minuto
  });

  // Estados para controle da interface
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Filtrar notificacoes baseado na configuracao
  const filteredNotifications = showOnlyUnread 
    ? notifications.filter(n => !n.lida)
    : notifications;

  // Estatisticas
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    approved: notifications.filter(n => n.tipo === 'aprovacao').length,
    rejected: notifications.filter(n => n.tipo === 'rejeicao').length
  };

  const handleViewVistoria = (vistoriaId: string) => {
    console.log('Ver vistoria:', vistoriaId);
    alert(`Navegar para vistoria: ${vistoriaId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Notificacoes de Aprovacao/Rejeicao
              </h1>
              <p className="text-sm text-gray-600">
                Task 20 - Demonstracao Completa para Tecnicos
              </p>
            </div>
            
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-lg px-3 py-1 animate-pulse">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Cards de Estatisticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">🔴</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nao Lidas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">❌</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">⚙️</span> Controles do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={checkNow} 
                disabled={loading}
                className="min-w-32"
              >
                {loading ? '🔄 Verificando...' : '🔍 Gerar Notificacoes de Teste'}
              </Button>

              <Button 
                onClick={() => setShowOnlyUnread(!showOnlyUnread)} 
                variant="outline"
              >
                👁️ {showOnlyUnread ? 'Mostrar Todas' : 'So Nao Lidas'}
              </Button>

              {unreadCount > 0 && (
                <Button onClick={clearAll} variant="destructive">
                  ✅ Marcar Todas como Lidas
                </Button>
              )}

              {notifications.length > 0 && (
                <Button 
                  onClick={() => notifications.forEach(n => dismissNotification(n.id))} 
                  variant="outline"
                >
                  🗑️ Limpar Todas
                </Button>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Vistorias Monitoradas:</h4>
              <div className="flex flex-wrap gap-2">
                {vistoriaIds.map(id => (
                  <Badge key={id} variant="outline" className="text-xs">
                    {id}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                O sistema verifica automaticamente o status dessas vistorias.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Secao de Notificacoes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📱</span> Notificacoes
              {showOnlyUnread && <Badge variant="secondary">Apenas nao lidas</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Estado de erro */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  ⚠️ <span className="font-medium">Erro na verificacao:</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            )}

            {/* Lista de notificacoes */}
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <ApprovalNotification
                    key={notification.id}
                    notification={notification}
                    onDismiss={dismissNotification}
                    onMarkAsRead={markAsRead}
                    onViewDetails={handleViewVistoria}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {showOnlyUnread ? 'Nenhuma notificacao nao lida' : 'Nenhuma notificacao'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {showOnlyUnread 
                    ? 'Todas as notificacoes foram lidas!'
                    : 'Clique em "Gerar Notificacoes de Teste" para ver exemplos.'
                  }
                </p>
                <Button onClick={checkNow} variant="outline" disabled={loading}>
                  {loading ? '🔄 Verificando...' : '🔍 Gerar Notificacoes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informacoes da Task 20 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <span className="text-xl">✅</span> Task 20 - Sistema de Notificacoes Implementado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>🔧</span> Componentes:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• ApprovalStatusService - Verificacao backend</li>
                  <li>• useApprovalNotifications - Hook React</li>
                  <li>• ApprovalNotification - Componente UI</li>
                  <li>• Interface de teste funcional</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>⚡</span> Funcionalidades:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Verificacao automatica periodica</li>
                  <li>• Notificacoes em tempo real</li>
                  <li>• Armazenamento local (localStorage)</li>
                  <li>• Interface rica e interativa</li>
                </ul>
              </div>
            </div>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Esta pagina demonstra o sistema de notificacoes de aprovacao/rejeicao!</span>
                <br />
                Todos os componentes da Task 20 foram implementados com sucesso dentro de vistoria-tecnico.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
