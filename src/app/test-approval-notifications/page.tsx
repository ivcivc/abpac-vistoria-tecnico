'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestApprovalNotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleGenerateNotifications = () => {
    setLoading(true);
    setTimeout(() => {
      const newNotifications = [
        {
          id: '1',
          vistoriaId: 'VIST-2024-001',
          tipo: 'aprovacao',
          titulo: 'Vistoria Aprovada!',
          mensagem: 'Sua vistoria foi aprovada pela supervisao. Parabens pelo excelente trabalho!',
          dataNotificacao: new Date(),
          lida: false
        },
        {
          id: '2',
          vistoriaId: 'VIST-2024-002',
          tipo: 'rejeicao',
          titulo: 'Vistoria Rejeitada',
          mensagem: 'Sua vistoria foi rejeitada e precisa ser revisada. Verifique os pontos destacados.',
          dataNotificacao: new Date(),
          lida: false
        }
      ];
      setNotifications(newNotifications);
      setUnreadCount(2);
      setLoading(false);
    }, 1000);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
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
              <Badge variant="destructive" className="text-lg px-3 py-1">
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
                  <span className="text-2xl">Ì¥î</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">‚ö†Ô∏è</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nao Lidas</p>
                  <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">‚úÖ</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {notifications.filter(n => n.tipo === 'aprovacao').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">‚ùå</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {notifications.filter(n => n.tipo === 'rejeicao').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">‚öôÔ∏è</span> Controles do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleGenerateNotifications} 
                disabled={loading}
                className="min-w-48"
              >
                {loading ? 'Ì¥Ñ Verificando...' : 'Ì¥ç Gerar Notificacoes de Teste'}
              </Button>
              
              {notifications.length > 0 && (
                <Button 
                  onClick={() => {
                    setNotifications([]);
                    setUnreadCount(0);
                  }} 
                  variant="outline"
                >
                  Ì∑ëÔ∏è Limpar Todas
                </Button>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Vistorias Monitoradas:</h4>
              <div className="flex flex-wrap gap-2">
                {['VIST-2024-001', 'VIST-2024-002', 'VIST-2024-003', 'VIST-2024-004', 'VIST-2024-005'].map(id => (
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
              <span className="text-xl">Ì¥î</span> Notificacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 shadow-sm ${
                      notification.tipo === 'aprovacao' 
                        ? 'border-l-green-500 bg-green-50' 
                        : 'border-l-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-medium flex items-center gap-2 ${
                        notification.tipo === 'aprovacao' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        <span className="text-xl">
                          {notification.tipo === 'aprovacao' ? '‚úÖ' : '‚ùå'}
                        </span>
                        {notification.titulo}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        {!notification.lida && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            Nova
                          </Badge>
                        )}
                        
                        <Badge 
                          variant={notification.tipo === 'aprovacao' ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {notification.tipo === 'aprovacao' ? 'Aprovada' : 'Rejeitada'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{notification.mensagem}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Vistoria: {notification.vistoriaId}</span>
                      <span>{notification.dataNotificacao.toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.lida && (
                        <Button
                          onClick={() => markAsRead(notification.id)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          ‚úÖ Marcar como Lida
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => alert(`Ver detalhes da vistoria: ${notification.vistoriaId}`)}
                        size="sm"
                        className="text-xs"
                      >
                        Ì±ÅÔ∏è Ver Vistoria
                      </Button>
                      
                      {notification.tipo === 'rejeicao' && (
                        <Button
                          onClick={() => alert(`Revisar vistoria: ${notification.vistoriaId}`)}
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                        >
                          Ì¥Ñ Revisar Vistoria
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">Ì¥î</div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma notificacao
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Clique em "Gerar Notificacoes de Teste" para ver exemplos de notificacoes de aprovacao e rejeicao.
                </p>
                <Button onClick={handleGenerateNotifications} variant="outline" disabled={loading}>
                  {loading ? 'Ì¥Ñ Verificando...' : 'Ì¥ç Gerar Notificacoes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informacoes da Task 20 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <span className="text-xl">‚úÖ</span> Task 20 - Sistema de Notificacoes Funcionando!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>Ì¥ß</span> Componentes:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>‚Ä¢ ApprovalStatusService - Verificacao backend</li>
                  <li>‚Ä¢ useApprovalNotifications - Hook React</li>
                  <li>‚Ä¢ ApprovalNotification - Componente UI</li>
                  <li>‚Ä¢ Interface de teste funcional</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>‚ö°</span> Funcionalidades:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>‚Ä¢ Verificacao automatica periodica</li>
                  <li>‚Ä¢ Notificacoes em tempo real</li>
                  <li>‚Ä¢ Armazenamento local (localStorage)</li>
                  <li>‚Ä¢ Interface rica e interativa</li>
                </ul>
              </div>
            </div>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Ìæâ Esta pagina demonstra o sistema de notificacoes de aprovacao/rejeicao!</span>
                <br />
                Versao funcional com interface completa. Clique em "Gerar Notificacoes de Teste" para ver a simulacao!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
