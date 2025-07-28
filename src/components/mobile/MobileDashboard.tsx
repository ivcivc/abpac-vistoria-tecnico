'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VistoriaMobileCard } from './VistoriaMobileCard';
import { ConnectivityIndicator } from '@/components/offline/ConnectivityIndicator';
import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext';
import {
  Plus,
  RefreshCw,
  Settings,
  AlertTriangle,
  Home,
  Activity,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

interface MobileDashboardProps {
  onNavigateToVistoria: (vistoriaId: string) => void;
}

export function MobileDashboard({ onNavigateToVistoria }: MobileDashboardProps) {
  const { authState } = useAuth();
  const { name } = useTechnician();
  const [isHydrated, setIsHydrated] = useState(false);
  const [displayName, setDisplayName] = useState<string>('TÉCNICO ABPAC');

  // Efeito para marcar hidratação completa
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Obter dados da vistoria atual
  const currentVistoria = authState.currentVistoria;

  // Atualizar nome após hidratação
  useEffect(() => {
    if (isHydrated) {
      const realName = authState.technicianName || name || currentVistoria?.tecnicoNome || 'TÉCNICO ABPAC';
      setDisplayName(realName);
    }
  }, [isHydrated, authState.technicianName, name, currentVistoria]);

  // Estatísticas simplificadas
  const estatisticas = {
    total: currentVistoria ? 1 : 0,
    emAndamento: currentVistoria && currentVistoria.status === 'EM_VISTORIA' ? 1 : 0,
    concluidas: currentVistoria && ['AGUARDANDO_APROVACAO', 'FINALIZADA'].includes(currentVistoria.status) ? 1 : 0,
  };

  const handleIniciarVistoria = (vistoriaId: string) => {
    onNavigateToVistoria(vistoriaId);
  };

  const handleNovaVistoria = () => {
    window.location.href = '/login';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Mobile */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Home className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Minhas Vistorias
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {displayName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ConnectivityIndicator />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="p-2"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas - Mobile */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {estatisticas.total}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Total
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-blue-600">
                {estatisticas.emAndamento}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Ativas
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-green-600">
                {estatisticas.concluidas}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Concluídas
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lista de Vistorias */}
      <div className="px-4 pb-4">
        {currentVistoria ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vistoria Atual
              </h2>
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <Activity className="h-4 w-4" />
                <span>Ativa</span>
              </div>
            </div>
            
            <VistoriaMobileCard
              vistoria={{
                id: currentVistoria.id,
                local: currentVistoria.local,
                cidade: currentVistoria.cidade,
                veiculo: currentVistoria.veiculo,
                status: currentVistoria.status,
                tipoVistoria: currentVistoria.tipoVistoria,
                tecnicoNome: currentVistoria.tecnicoNome,
                agendadoPara: 'Hoje, 14:30',
                progresso: {
                  concluidos: 0,
                  total: 4
                }
              }}
              onIniciarVistoria={handleIniciarVistoria}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estado Vazio */}
            <Card className="text-center py-8">
              <CardContent>
                <div className="p-4">
                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma Vistoria Ativa
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Use um token de vistoria para começar uma nova inspeção.
                  </p>
                  <Button
                    onClick={handleNovaVistoria}
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Iniciar Nova Vistoria
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Ações Rápidas - Mobile */}
      <div className="px-4 pb-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ações Rápidas
          </h3>
          
          <div className="grid gap-3">
            {/* Nova Vistoria */}
            <Button
              onClick={handleNovaVistoria}
              variant="outline"
              className="w-full h-14 text-left justify-start text-base"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium">Nova Vistoria</div>
                  <div className="text-sm text-gray-500">Acessar com token</div>
                </div>
              </div>
            </Button>

            {/* Sincronização */}
            <Button
              onClick={() => alert('Funcionalidade em desenvolvimento')}
              variant="outline"
              className="w-full h-14 text-left justify-start text-base"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-medium">Sincronização</div>
                  <div className="text-sm text-gray-500">Status e controle</div>
                </div>
              </div>
            </Button>

            {/* Configurações */}
            <Button
              onClick={() => alert('Configurações em desenvolvimento')}
              variant="outline"
              className="w-full h-14 text-left justify-start text-base"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="font-medium">Configurações</div>
                  <div className="text-sm text-gray-500">Preferências</div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 