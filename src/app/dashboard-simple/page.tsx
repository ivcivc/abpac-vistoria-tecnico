'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthenticatedLayout } from '@/components/layout';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  Package,
  RefreshCw
} from 'lucide-react';

function SimpleDashboardContent() {
  const { authState } = useAuth();
  const { name } = useTechnician();
  const [isHydrated, setIsHydrated] = useState(false);
  const [displayName, setDisplayName] = useState<string>('TÉCNICO ABPAC');

  // Aguardar hidratação
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Atualizar nome após hidratação
  useEffect(() => {
    if (isHydrated) {
      const realName = authState.technicianName || name || 'TÉCNICO ABPAC';
      setDisplayName(realName);
    }
  }, [isHydrated, authState.technicianName, name]);

  const currentVistoria = authState.currentVistoria;

  // Estatísticas simples
  const stats = {
    total: currentVistoria ? 1 : 0,
    emAndamento: currentVistoria && currentVistoria.status === 'EM_VISTORIA' ? 1 : 0,
    concluidas: currentVistoria && ['AGUARDANDO_APROVACAO', 'FINALIZADA'].includes(currentVistoria.status) ? 1 : 0,
    pausadas: 0,
  };

  console.log('📊 [SIMPLE-DASHBOARD] Renderizando dashboard para:', displayName);
  console.log('📊 [SIMPLE-DASHBOARD] Vistoria atual:', currentVistoria);
  console.log('📊 [SIMPLE-DASHBOARD] Estatísticas:', stats);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {displayName}!
          </h1>
          <p className="text-gray-600">
            Sistema de Vistoria ABPAC - Dashboard Simplificado
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">vistorias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
              <p className="text-xs text-muted-foreground">ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.concluidas}</div>
              <p className="text-xs text-muted-foreground">finalizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pausadas</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pausadas}</div>
              <p className="text-xs text-muted-foreground">pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Vistoria Atual */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vistoria Atual</CardTitle>
          </CardHeader>
          <CardContent>
            {currentVistoria ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">
                      📍 Informações da Vistoria
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Local:</strong> {currentVistoria.local}</p>
                      <p><strong>Cidade:</strong> {currentVistoria.cidade}</p>
                      <p><strong>Tipo:</strong> {currentVistoria.tipoVistoria}</p>
                      <p><strong>Status:</strong> {currentVistoria.status}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-3">
                      🚗 Dados do Veículo
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Modelo:</strong> {currentVistoria.veiculo.modelo}</p>
                      <p><strong>Placa:</strong> {currentVistoria.veiculo.placa}</p>
                      <p><strong>Cor:</strong> {currentVistoria.veiculo.cor}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <Button
                    onClick={() => window.location.href = `/vistoria/${currentVistoria.id}`}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continuar Vistoria
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nenhuma vistoria ativa</p>
                <Button onClick={() => window.location.href = '/login'}>
                  Iniciar Nova Vistoria
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Nova Vistoria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Acessar com novo token de vistoria
              </p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/login'}
              >
                Iniciar Nova Vistoria
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sincronização</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Status e controle de sincronização
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => alert('Funcionalidade em desenvolvimento')}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerenciar Sync
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Preferências do sistema
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => alert('Configurações em desenvolvimento')}
              >
                Abrir Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function SimpleDashboardPage() {
  return (
    <ProtectedRoute requireToken={true}>
      <SimpleDashboardContent />
    </ProtectedRoute>
  );
}
