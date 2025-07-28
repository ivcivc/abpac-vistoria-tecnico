'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft,
  MapPin,
  Truck,
  User,
  Clock,
  Package,
  Plus,
  CheckCircle,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';

interface MobileVistoriaOverviewProps {
  vistoria: {
    id: string;
    local: string;
    cidade: string;
    veiculo: {
      modelo: string;
      placa: string;
      cor: string;
    };
    status: string;
    tipoVistoria: string;
    tecnicoNome?: string;
    agendadoPara?: string;
    progresso?: {
      concluidos: number;
      total: number;
    };
  };
  onViewItems: () => void;
  onAddExpense: () => void;
  onCompleteVistoria: () => void;
  onBack: () => void;
}

export function MobileVistoriaOverview({ 
  vistoria, 
  onViewItems, 
  onAddExpense, 
  onCompleteVistoria, 
  onBack 
}: MobileVistoriaOverviewProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_VISTORIA':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600'
        };
      case 'AGUARDANDO_APROVACAO':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-800 dark:text-green-200',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600'
        };
      case 'FINALIZADA':
        return {
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          text: 'text-gray-800 dark:text-gray-200',
          border: 'border-gray-200 dark:border-gray-800',
          icon: 'text-gray-600'
        };
      default:
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'text-yellow-800 dark:text-yellow-200',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600'
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EM_VISTORIA':
        return 'Em Vistoria';
      case 'AGUARDANDO_APROVACAO':
        return 'Aguardando Aprovação';
      case 'FINALIZADA':
        return 'Finalizada';
      default:
        return status;
    }
  };

  const statusColors = getStatusColor(vistoria.status);
  const progressoPercentual = vistoria.progresso 
    ? Math.round((vistoria.progresso.concluidos / vistoria.progresso.total) * 100)
    : 0;

  const canComplete = vistoria.status === 'EM_VISTORIA' && progressoPercentual >= 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Mobile */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Vistoria #{vistoria.id}
                </h1>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                  {vistoria.status === 'EM_VISTORIA' && <PlayCircle className="h-3 w-3 mr-1" />}
                  {vistoria.status === 'AGUARDANDO_APROVACAO' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {vistoria.status === 'FINALIZADA' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {getStatusText(vistoria.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Vistoria */}
      <div className="px-4 py-4">
        <Card className="mb-4">
          <CardContent className="p-5">
            <div className="space-y-4">
              {/* Local */}
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {vistoria.local}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {vistoria.cidade}
                  </p>
                </div>
              </div>

              {/* Veículo */}
              <div className="flex items-start space-x-3">
                <Truck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    {vistoria.veiculo.modelo}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Placa: {vistoria.veiculo.placa} • Cor: {vistoria.veiculo.cor}
                  </p>
                </div>
              </div>

              {/* Técnico */}
              {vistoria.tecnicoNome && (
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Técnico: {vistoria.tecnicoNome}
                  </p>
                </div>
              )}

              {/* Agendamento */}
              {vistoria.agendadoPara && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {vistoria.agendadoPara}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progresso */}
        {vistoria.progresso && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Progresso da Vistoria
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Itens Concluídos
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {vistoria.progresso.concluidos}/{vistoria.progresso.total} itens
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      progressoPercentual === 100 ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${progressoPercentual}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    progressoPercentual === 100 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {progressoPercentual}% Concluído
                  </span>
                  {progressoPercentual === 100 && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Pronto para Finalizar</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações Principais */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ações da Vistoria
          </h3>

          {/* Ver Itens da Vistoria */}
          <Button
            onClick={onViewItems}
            className="w-full h-14 text-left justify-start text-base bg-blue-600 hover:bg-blue-700 text-white"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Ver Itens da Vistoria</div>
                <div className="text-sm text-blue-100">
                  {vistoria.progresso 
                    ? `${vistoria.progresso.total} itens para verificar`
                    : 'Verificar itens da inspeção'
                  }
                </div>
              </div>
              <div className="text-blue-100">
                →
              </div>
            </div>
          </Button>

          {/* Adicionar Despesa */}
          <Button
            onClick={onAddExpense}
            variant="outline"
            className="w-full h-14 text-left justify-start text-base border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">Adicionar Despesa</div>
                <div className="text-sm text-gray-500">Registrar gastos da vistoria</div>
              </div>
            </div>
          </Button>

          {/* Concluir Vistoria */}
          <Button
            onClick={onCompleteVistoria}
            variant={canComplete ? "default" : "outline"}
            disabled={!canComplete}
            className={`w-full h-14 text-left justify-start text-base ${
              canComplete 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                canComplete 
                  ? 'bg-white/20' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <CheckCircle className={`h-6 w-6 ${
                  canComplete 
                    ? 'text-white' 
                    : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Concluir Vistoria</div>
                <div className={`text-sm ${
                  canComplete 
                    ? 'text-green-100' 
                    : 'text-gray-400'
                }`}>
                  {canComplete 
                    ? 'Todos os itens foram verificados'
                    : `${vistoria.progresso?.total || 0 - (vistoria.progresso?.concluidos || 0)} itens pendentes`
                  }
                </div>
              </div>
              {canComplete && (
                <div className="text-green-100">
                  →
                </div>
              )}
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
} 