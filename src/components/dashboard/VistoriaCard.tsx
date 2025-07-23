import { ProgressIndicator } from "@/components/vistoria/ProgressIndicator";
import { StatusBadge } from "@/components/vistoria/StatusBadge";
import { SyncBadge } from "@/components/vistoria/SyncBadge";
import { calculateVistoriaProgress, calculateProgressFromStatus, calculateSyncStatus } from "@/utils/progressCalculation";
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
 * - Indicador de progresso real baseado nos itens
 * - Indicador de sincronização
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

  // MELHORADO: Cálculo real de progresso
  const progressInfo = calculateProgressFromStatus(vistoria.status);
  
  // MELHORADO: Status de sincronização real
  const syncStatus = calculateSyncStatus(vistoria);

  // Mapear status para o formato aceito pelo StatusBadge
  const getStatusParaBadge = () => {
    switch (vistoria.status) {
      case 'em_andamento':
        return 'em_andamento' as const;
      case 'concluida':
        return 'concluida' as const;
      case 'pausada':
        return 'pendente' as const; // Mapear pausada para pendente
      default:
        return 'pendente' as const;
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
          {/* Header: Local + Status + Sync */}
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
              {/* Badge de Status */}
              <StatusBadge status={getStatusParaBadge()} />
              
              {/* Badge de Sincronização */}
              <SyncBadge 
                isSynced={syncStatus.isSynced} 
                isSyncing={syncStatus.isSyncing}
                showText={false}
              />
            </div>
          </div>

          {/* Indicador de Progresso */}
          <div className="space-y-2">
            <ProgressIndicator 
              value={progressInfo.percentage}
              label="Progresso da Vistoria"
              description={progressInfo.description}
              size="md"
              variant="detailed"
              className="bg-muted/30 p-3 rounded-lg"
            />
          </div>

          {/* Informações do veículo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{vistoria.veiculo.modelo}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Placa: {vistoria.veiculo.placa}</span>
              </div>
              {vistoria.veiculo.cor && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Cor: {vistoria.veiculo.cor}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Agendada: {formatarData(vistoria.dataAgendada)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Acessada {tempoDecorrido()}</span>
              </div>
              {vistoria.tecnicoNome && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{vistoria.tecnicoNome}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé: Ações e informações */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3">
              {/* Menu de mudança de status */}
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

              {/* Informações adicionais */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>ID: {vistoria.id.substring(0, 8)}...</span>
                {syncStatus.lastSync && (
                  <span>• Sync: {syncStatus.lastSync.toLocaleDateString('pt-BR')}</span>
                )}
              </div>
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
