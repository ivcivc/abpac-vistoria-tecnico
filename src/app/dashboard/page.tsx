'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthenticatedLayout } from '@/components/layout';
import { ConnectivityIndicator } from '@/components/offline/ConnectivityIndicator';
import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Plus,
  Eye,
  RefreshCw,
  Settings,
  AlertTriangle,
  EyeOff,
  FileText,
  Activity,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  Package,
} from 'lucide-react';

function DashboardContent() {
  const { authState } = useAuth();
  const { name, isAuthenticated, initialized } = useTechnician();

  // ADICIONADO: Estado de hidratação para evitar hydration error
  const [isHydrated, setIsHydrated] = useState(false);

  // CORRIGIDO: Abordagem simples que funciona (baseada no teste bem-sucedido)
  const [displayName, setDisplayName] = useState<string>('TÉCNICO ABPAC');

  // Efeito para marcar hidratação completa apenas no cliente
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ADICIONADO: Obter dados da vistoria atual
  const currentVistoria = authState.currentVistoria;
  
  // DEBUG: Verificar dados de debug do localStorage
  const debugTechnicianName = typeof window !== 'undefined' ? localStorage.getItem('debug_technician_name') : null;
  const debugSetAt = typeof window !== 'undefined' ? localStorage.getItem('debug_set_at') : null;

  // Efeito para atualizar nome APENAS após hidratação (igual aos testes que funcionaram)
  useEffect(() => {
    if (isHydrated) {
      const realName = authState.technicianName || name || currentVistoria?.tecnicoNome || debugTechnicianName || 'TÉCNICO ABPAC';
      setDisplayName(realName);
      
      console.log('📊 [DASHBOARD] ✅ Nome atualizado após hidratação:', realName);
      console.log('📊 [DASHBOARD] Origem do nome:', {
        'isHydrated': isHydrated,
        'authState.technicianName': authState.technicianName,
        'useTechnician().name': name,
        'currentVistoria?.tecnicoNome': currentVistoria?.tecnicoNome,
        'debugTechnicianName (localStorage)': debugTechnicianName,
        'fallback': 'TÉCNICO ABPAC',
        'escolhido': realName
      });
    }
  }, [isHydrated, authState.technicianName, name, currentVistoria, debugTechnicianName]);

  console.log('📊 [DASHBOARD] === CARREGAMENTO DO DASHBOARD ===');
  console.log('📊 [DASHBOARD] Vistoria atual:', currentVistoria);
  console.log('📊 [DASHBOARD] Nome do técnico do contexto (useTechnician):', name);
  console.log('📊 [DASHBOARD] authState.technicianName:', authState.technicianName);
  console.log('📊 [DASHBOARD] authState.isAuthenticated:', authState.isAuthenticated);
  console.log('📊 [DASHBOARD] authState completo:', authState);
  console.log('📊 [DASHBOARD] DEBUG localStorage debug_technician_name:', debugTechnicianName);
  console.log('📊 [DASHBOARD] DEBUG localStorage debug_set_at:', debugSetAt);
  console.log('📊 [DASHBOARD] isHydrated:', isHydrated);
  console.log('📊 [DASHBOARD] displayName (estado):', displayName);
  console.log('📊 [DASHBOARD] =================================');

  // Estatísticas baseadas na vistoria atual (se existir)
  const estatisticas = {
    total: currentVistoria ? 1 : 0,
    emAndamento: currentVistoria && currentVistoria.status === 'EM_VISTORIA' ? 1 : 0,
    concluidas: currentVistoria && ['AGUARDANDO_APROVACAO', 'FINALIZADA'].includes(currentVistoria.status) ? 1 : 0,
    pausadas: 0,
  };

  // Fallback para nome se o contexto não tiver carregado ainda
  // const displayName = name || 'TÉCNICO ABPAC';

  console.log('📊 [DASHBOARD] Dashboard carregado para:', displayName);
  console.log('📊 [DASHBOARD] Estatísticas calculadas:', estatisticas);

  // IMPORTANTE: SEM useEffect, SEM redirecionamento automático
  // Apenas mostrar o dashboard original

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        {/* Header de boas-vindas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Bem-vindo, {displayName}!
            </h1>
            <div className="flex items-center space-x-2">
              <ConnectivityIndicator />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="hidden sm:flex"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Sistema de Vistoria ABPAC - Técnicos de Campo
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.total}</div>
              <p className="text-xs text-muted-foreground">vistorias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estatisticas.emAndamento}</div>
              <p className="text-xs text-muted-foreground">ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estatisticas.concluidas}</div>
              <p className="text-xs text-muted-foreground">finalizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pausadas</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estatisticas.pausadas}</div>
              <p className="text-xs text-muted-foreground">pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Vistorias */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Vistoria Atual</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentVistoria ? (
              // Exibir dados reais da vistoria atual
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      📍 Informações da Vistoria
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Local:</strong> {currentVistoria.local}
                      </p>
                      <p>
                        <strong>Cidade:</strong> {currentVistoria.cidade}
                      </p>
                      <p>
                        <strong>Tipo:</strong>{' '}
                        <span className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">
                          {currentVistoria.tipoVistoria}
                        </span>
                      </p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            currentVistoria.status === 'EM_VISTORIA'
                              ? 'bg-yellow-100 text-yellow-800'
                              : currentVistoria.status === 'AGUARDANDO_APROVACAO'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {currentVistoria.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      🚗 Dados do Veículo
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Modelo:</strong> {currentVistoria.veiculo.modelo}
                      </p>
                      <p>
                        <strong>Placa:</strong> {currentVistoria.veiculo.placa}
                      </p>
                      <p>
                        <strong>Cor:</strong> {currentVistoria.veiculo.cor}
                      </p>
                      {currentVistoria.tecnicoNome && (
                        <p>
                          <strong>Técnico Sugerido:</strong> {currentVistoria.tecnicoNome}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Vistoria Ativa
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => (window.location.href = `/vistoria/${currentVistoria.id}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Continuar Vistoria
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Estado vazio (mantém o layout original)
              <>
                <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg mb-4">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <span className="text-sm text-orange-800 dark:text-orange-200">
                    Nenhuma vistoria ativa encontrada
                  </span>
                </div>

                <div className="text-center py-12">
                  <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhuma vistoria encontrada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Use um token de vistoria para começar.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Nova Vistoria / Continuar Vistoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {currentVistoria ? <Eye className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                <span>{currentVistoria ? 'Vistoria Atual' : 'Nova Vistoria'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {currentVistoria
                  ? `Continuar vistoria em ${currentVistoria.local}`
                  : 'Acessar com novo token'}
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  if (currentVistoria) {
                    // Ir para página da vistoria atual (quando implementada)
                    alert(
                      `Vistoria: ${currentVistoria.local}\nStatus: ${currentVistoria.status}\nTipo: ${currentVistoria.tipoVistoria}`
                    );
                  } else {
                    window.location.href = '/login';
                  }
                }}
              >
                {currentVistoria ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Continuar Vistoria
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Iniciar Nova Vistoria
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sincronização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5" />
                <span>Sincronização</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Status e controle</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert('Funcionalidade de sincronização em desenvolvimento')}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerenciar Sync
              </Button>
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Preferências do sistema
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert('Página de configurações em desenvolvimento')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Abrir Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireToken={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
