'use client';

import { VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  User,
  Eye,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
} from 'lucide-react';

interface VistoriaCardProps {
  vistoria: VistoriaLocal;
  onOpenVistoria: (vistoriaId: string) => void;
  onUpdateStatus?: (vistoriaId: string, novoStatus: VistoriaLocal['status']) => void;
  className?: string;
}

/**
 * Card melhorado para exibição de vistorias no dashboard
 *
 * Funcionalidades:
 * - Layout visual rico com ícones e cores
 * - Badge de status com cores apropriadas
 * - Informações organizadas em seções
 * - Ações rápidas (abrir, alterar status)
 * - Responsivo para diferentes tamanhos
 * - Hover effects para melhor UX
 */
export function VistoriaCard({
  vistoria,
  onOpenVistoria,
  onUpdateStatus,
  className = '',
}: VistoriaCardProps) {
  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatarDataHora = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: VistoriaLocal['status']) => {
    const configs = {
      em_andamento: {
        label: 'Em Andamento',
        color:
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
        icon: Play,
        bgAccent: 'bg-blue-50 dark:bg-blue-950/20',
      },
      concluida: {
        label: 'Concluída',
        color:
          'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
        icon: CheckCircle,
        bgAccent: 'bg-green-50 dark:bg-green-950/20',
      },
      pausada: {
        label: 'Pausada',
        color:
          'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
        icon: Pause,
        bgAccent: 'bg-yellow-50 dark:bg-yellow-950/20',
      },
    };

    return configs[status] || configs['em_andamento'];
  };

  const statusConfig = getStatusConfig(vistoria.status);
  const StatusIcon = statusConfig.icon;

  // Calcular tempo decorrido desde o acesso
  const tempoDecorrido = () => {
    const agora = new Date();
    const dataAcesso = new Date(vistoria.dataAcesso);
    const diferenca = agora.getTime() - dataAcesso.getTime();
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) {
      return `há ${dias} dia${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `há ${horas} hora${horas > 1 ? 's' : ''}`;
    } else {
      return 'há poucos minutos';
    }
  };

  // Opções de status para mudança rápida
  const statusOptions = [
    { value: 'em_andamento', label: 'Em Andamento', icon: Play },
    { value: 'pausada', label: 'Pausar', icon: Pause },
    { value: 'concluida', label: 'Concluir', icon: CheckCircle },
  ] as const;

  const handleStatusChange = (novoStatus: VistoriaLocal['status']) => {
    if (onUpdateStatus && novoStatus !== vistoria.status) {
      onUpdateStatus(vistoria.id, novoStatus);
    }
  };

  return (
    <Card
      className={`
      group hover:shadow-lg transition-all duration-200 border-l-4
      ${statusConfig.color.includes('blue') ? 'border-l-blue-400' : ''}
      ${statusConfig.color.includes('green') ? 'border-l-green-400' : ''}
      ${statusConfig.color.includes('yellow') ? 'border-l-yellow-400' : ''}
      ${className}
    `}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header: Local + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <h3 className="font-semibold text-lg leading-tight break-words">
                  {vistoria.local}
                </h3>
              </div>

              {vistoria.tipoVistoria && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border">
                    {vistoria.tipoVistoria}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}
              >
                <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Informações do veículo */}
          <div className={`p-3 rounded-lg ${statusConfig.bgAccent}`}>
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Veículo</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Modelo:</span>
                <p className="font-medium">{vistoria.veiculo.modelo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Placa:</span>
                <p className="font-mono font-medium">{vistoria.veiculo.placa}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cor:</span>
                <p className="font-medium">{vistoria.veiculo.cor}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ano:</span>
                <p className="font-medium">{vistoria.veiculo.ano}</p>
              </div>
            </div>
          </div>

          {/* Datas e técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Agendada para</p>
                  <p className="font-medium">{formatarData(vistoria.dataAgendada)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Acessada</p>
                  <p className="font-medium">{formatarDataHora(vistoria.dataAcesso)}</p>
                  <p className="text-xs text-muted-foreground">{tempoDecorrido()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Técnico</p>
                  <p className="font-medium">{vistoria.tecnicoNome}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {onUpdateStatus && (
                <div className="relative group/status">
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>

                  {/* Menu de status (simulado com hover) */}
                  <div className="absolute left-0 bottom-full mb-2 bg-background border rounded-lg shadow-lg p-1 hidden group-hover/status:block z-10 min-w-[140px]">
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        disabled={option.value === vistoria.status}
                        className={`
                          flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors text-left
                          ${
                            option.value === vistoria.status
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'hover:bg-muted'
                          }
                        `}
                      >
                        <option.icon className="h-3.5 w-3.5" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <span className="text-xs text-muted-foreground">
                ID: {vistoria.id.substring(0, 8)}...
              </span>
            </div>

            <Button onClick={() => onOpenVistoria(vistoria.id)} size="sm" className="h-8 px-3">
              <Eye className="h-3.5 w-3.5 mr-1" />
              Abrir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
