'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Truck, 
  Clock, 
  User, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Play
} from 'lucide-react';

interface VistoriaMobileCardProps {
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
  onIniciarVistoria: (vistoriaId: string) => void;
}

export function VistoriaMobileCard({ vistoria, onIniciarVistoria }: VistoriaMobileCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_VISTORIA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AGUARDANDO_APROVACAO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FINALIZADA':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EM_VISTORIA':
        return <Activity className="h-4 w-4" />;
      case 'AGUARDANDO_APROVACAO':
        return <CheckCircle className="h-4 w-4" />;
      case 'FINALIZADA':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EM_VISTORIA':
        return 'Em Vistoria';
      case 'AGUARDANDO_APROVACAO':
        return 'Aguardando';
      case 'FINALIZADA':
        return 'Finalizada';
      default:
        return status;
    }
  };

  const progressoPercentual = vistoria.progresso 
    ? Math.round((vistoria.progresso.concluidos / vistoria.progresso.total) * 100)
    : 0;

  return (
    <Card className="w-full shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        {/* Header com Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Vistoria #{vistoria.id}
            </h3>
          </div>
          <Badge className={`px-3 py-1 text-sm font-medium border ${getStatusColor(vistoria.status)}`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(vistoria.status)}
              <span>{getStatusText(vistoria.status)}</span>
            </div>
          </Badge>
        </div>

        {/* Informações Principais */}
        <div className="space-y-3 mb-4">
          {/* Local */}
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {vistoria.local}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {vistoria.cidade}
              </p>
            </div>
          </div>

          {/* Veículo */}
          <div className="flex items-start space-x-3">
            <Truck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {vistoria.veiculo.modelo}
              </p>
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
                {vistoria.tecnicoNome}
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

        {/* Progresso */}
        {vistoria.progresso && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progresso
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {vistoria.progresso.concluidos}/{vistoria.progresso.total} itens
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressoPercentual}%` }}
              ></div>
            </div>
            <div className="text-right mt-1">
              <span className="text-xs font-medium text-blue-600">
                {progressoPercentual}%
              </span>
            </div>
          </div>
        )}

        {/* Botão de Ação Principal */}
        <Button
          onClick={() => onIniciarVistoria(vistoria.id)}
          className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Play className="h-5 w-5 mr-2" />
          {vistoria.status === 'EM_VISTORIA' ? 'Continuar Vistoria' : 'Iniciar Vistoria'}
        </Button>
      </CardContent>
    </Card>
  );
} 