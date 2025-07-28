'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Package,
  Hash,
  Wrench,
  Eye
} from 'lucide-react';

interface ItemMobileCardProps {
  item: {
    id: string;
    categoria?: {
      descricao: string;
    };
    fabricante?: {
      nome: string;
    };
    acao?: string;
    numeroSerie?: string;
    observacoes?: string;
    status?: string;
    concluido?: boolean;
    estoque_remessa_id?: number;
  };
  itemIndex: number;
  totalItems: number;
  onEditItem: (item: any) => void;
  onViewDetails?: (item: any) => void;
  syncStatus?: 'pendente' | 'sincronizado' | 'erro' | 'processando';
}

type ItemStatus = 'pendente' | 'concluido' | 'problema';

export function ItemMobileCard({ 
  item, 
  itemIndex, 
  totalItems, 
  onEditItem, 
  onViewDetails,
  syncStatus = 'sincronizado'
}: ItemMobileCardProps) {
  
  const getItemStatus = (): ItemStatus => {
    if (item.concluido === true || item.status === 'concluido') {
      return 'concluido';
    }
    if (item.status === 'problema') {
      return 'problema';
    }
    return 'pendente';
  };

  const status = getItemStatus();

  const getStatusConfig = (status: ItemStatus) => {
    switch (status) {
      case 'concluido':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          text: 'Concluído',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-l-green-500',
          badgeColor: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-600'
        };
      case 'problema':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          text: 'Problema',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-l-red-500',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          text: 'Pendente',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-l-orange-500',
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
          iconColor: 'text-orange-600'
        };
    }
  };

  const getSyncStatusConfig = (syncStatus: string) => {
    switch (syncStatus) {
      case 'pendente':
        return { color: 'bg-yellow-400', text: 'Pendente' };
      case 'erro':
        return { color: 'bg-red-400', text: 'Erro' };
      case 'processando':
        return { color: 'bg-blue-400', text: 'Processando' };
      default:
        return { color: 'bg-green-400', text: 'Sincronizado' };
    }
  };

  const statusConfig = getStatusConfig(status);
  const syncConfig = getSyncStatusConfig(syncStatus);

  const formatItemInfo = () => {
    const parts = [];
    
    if (item?.categoria?.descricao) {
      parts.push(item.categoria.descricao);
    }
    
    if (item?.fabricante?.nome) {
      parts.push(item.fabricante.nome);
    }
    
    return parts.join(' - ') || 'Item sem descrição';
  };

  return (
    <Card className={`w-full shadow-md hover:shadow-lg transition-all duration-200 border-l-4 ${statusConfig.borderColor} ${statusConfig.bgColor}`}>
      <CardContent className="p-5">
        {/* Header com Status e Contador */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <div className={statusConfig.iconColor}>
                {statusConfig.icon}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Item {itemIndex + 1}/{totalItems}
                </span>
                {/* Indicador de Sincronização */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${syncConfig.color}`}></div>
                  <span className="text-xs text-gray-500">
                    {syncConfig.text}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Badge className={`px-3 py-1 text-sm font-medium border ${statusConfig.badgeColor}`}>
            <div className="flex items-center space-x-1">
              {statusConfig.icon}
              <span>{statusConfig.text}</span>
            </div>
          </Badge>
        </div>

        {/* Informações do Item */}
        <div className="space-y-3 mb-4">
          {/* Descrição Principal */}
          <div className="flex items-start space-x-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                {formatItemInfo()}
              </h3>
            </div>
          </div>

          {/* Ação */}
          {item.acao && (
            <div className="flex items-center space-x-3">
              <Wrench className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                {item.acao}
              </p>
            </div>
          )}

          {/* Número de Série */}
          {item.numeroSerie && (
            <div className="flex items-center space-x-3">
              <Hash className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                NS: {item.numeroSerie}
              </p>
            </div>
          )}

          {/* Observações */}
          {item.observacoes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Obs:</span> {item.observacoes}
              </p>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex space-x-3">
          {/* Botão Principal - Editar Item */}
          <Button
            onClick={() => onEditItem(item)}
            className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Edit className="h-5 w-5 mr-2" />
            Editar Item
          </Button>

          {/* Botão Secundário - Ver Detalhes (opcional) */}
          {onViewDetails && (
            <Button
              onClick={() => onViewDetails(item)}
              variant="outline"
              className="h-12 px-4 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Eye className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 