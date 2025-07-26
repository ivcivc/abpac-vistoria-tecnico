'use client';

import React, { useState, useEffect } from 'react';
import { ApprovalNotification } from '@/components/vistoria/ApprovalNotification';
import { ApprovalStatusService, ApprovalNotification as NotificationType } from '@/services/vistoria/ApprovalStatusService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function TestApprovalNotificationsPage() {
  // Estados
  const [vistoriaId, setVistoriaId] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Função para adicionar log
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Função para verificar status de aprovação
  const handleCheckApprovalStatus = async () => {
    if (!vistoriaId || !token) {
      setError('Informe o ID da vistoria e o token de autenticação');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      addLog(`Verificando status de aprovação para vistoria ${vistoriaId}`);

      const result = await ApprovalStatusService.checkApprovalStatus(vistoriaId, token);

      if (result.success) {
        const notificationsCount = result.notifications?.length || 0;
        setSuccess(`Verificação concluída com sucesso. ${notificationsCount} notificações encontradas.`);
        addLog(`✅ Verificação concluída: ${notificationsCount} notificações encontradas`);
      } else {
        setError(result.error || 'Erro desconhecido');
        addLog(`❌ Erro na verificação: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      addLog(`❌ Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar todas as notificações
  const handleClearAllNotifications = () => {
    ApprovalStatusService.clearAllNotifications();
    addLog('🧹 Todas as notificações foram removidas');
    setSuccess('Todas as notificações foram removidas com sucesso');
  };

  // Função para carregar notificações do localStorage
  const handleLoadNotifications = () => {
    ApprovalStatusService.loadNotificationsFromStorage();
    const notifications = ApprovalStatusService.getNotifications();
    addLog(`📋 ${notifications.length} notificações carregadas do armazenamento local`);
  };

  // Carregar notificações ao iniciar
  useEffect(() => {
    handleLoadNotifications();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Teste de Notificações de Aprovação/Rejeição (Task 20)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <ApprovalNotification 
                  autoCheck={false} 
                  maxHeight="400px" 
                />
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Verificar Status de Aprovação</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vistoriaId">ID da Vistoria</Label>
                      <Input
                        id="vistoriaId"
                        value={vistoriaId}
                        onChange={(e) => setVistoriaId(e.target.value)}
                        placeholder="Ex: 1234"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="token">Token de Autenticação</Label>
                      <Input
                        id="token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Token Bearer"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCheckApprovalStatus}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          'Verificar Status'
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={handleClearAllNotifications}
                      >
                        Limpar Notificações
                      </Button>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="mt-4 bg-green-50 border-green-200 text-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle>Sucesso</AlertTitle>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Logs</h3>
                  <div className="bg-gray-100 border rounded-md p-2 h-[300px] overflow-y-auto text-sm font-mono">
                    {logs.length === 0 ? (
                      <p className="text-gray-500 italic">Nenhum log disponível</p>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="py-1 border-b border-gray-200 last:border-0">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-2">
                Esta página demonstra a integração com os endpoints reais de verificação de status de aprovação/rejeição de vistorias.
              </p>
              <p className="mb-2">
                <strong>Endpoints utilizados:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>/api/estoque-remessa/:id/timeline-status</code> - Obtém a timeline de status da vistoria</li>
                <li><code>/api/estoque-remessa/:id/aprovar</code> - Endpoint para aprovação (apenas conferentes)</li>
                <li><code>/api/estoque-remessa/:id/solicitar-correcao</code> - Endpoint para solicitar correções (apenas conferentes)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthProvider>
  );
} 