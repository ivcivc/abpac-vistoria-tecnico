'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  MapPin,
  FileText,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VistoriaHeaderProps {
  vistoria: VistoriaLocal;
  progresso: number;
}

export function VistoriaHeader({ vistoria, progresso }: VistoriaHeaderProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const formatarData = (dataString?: string) => {
    if (!dataString) return 'Data não informada';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'concluida':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pausada':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluída';
      case 'pausada':
        return 'Pausada';
      default:
        return 'Status Desconhecido';
    }
  };

  return (
    <div className="space-y-4">
      {/* Navegação */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={handleGoBack}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalhes da Vistoria
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ID: {vistoria.id}
          </p>
        </div>
      </div>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Informações da Vistoria</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                vistoria.status
              )}`}
            >
              {getStatusText(vistoria.status)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Informações do Local */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Local da Vistoria</span>
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{vistoria.local}</p>
                {vistoria.tipoVistoria && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Tipo: {vistoria.tipoVistoria}
                  </p>
                )}
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>Agendada: {formatarData(vistoria.dataAgendada)}</span>
                </div>
                {vistoria.dataAcesso && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>Último acesso: {formatarData(vistoria.dataAcesso)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informações do Veículo */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Car className="h-4 w-4" />
                <span>Dados do Veículo</span>
              </h3>
              <div className="space-y-2 text-sm">
                {vistoria.veiculo ? (
                  <>
                    <p className="font-medium">{vistoria.veiculo.modelo}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Placa: {vistoria.veiculo.placa}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Cor: {vistoria.veiculo.cor}
                    </p>
                    {vistoria.veiculo.ano && (
                      <p className="text-gray-600 dark:text-gray-400">
                        Ano: {vistoria.veiculo.ano}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">
                    Informações do veículo não disponíveis
                  </p>
                )}
                {vistoria.nomeEquipamento && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Equipamento: {vistoria.nomeEquipamento}
                  </p>
                )}
              </div>
            </div>

            {/* Informações do Técnico */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Técnico Responsável</span>
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">
                  {vistoria.tecnicoNome || 'Técnico não identificado'}
                </p>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Progresso: {progresso}%
                  </span>
                </div>
                                 {Array.isArray(vistoria.itens) && vistoria.itens.length > 0 && (
                   <p className="text-gray-600 dark:text-gray-400">
                     Itens: {vistoria.itens.length} total
                   </p>
                 )}
              </div>
            </div>
          </div>

          {/* Observações */}
          {vistoria.observacoes && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Observações
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {vistoria.observacoes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 