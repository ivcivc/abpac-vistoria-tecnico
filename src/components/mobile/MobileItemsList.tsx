'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ItemMobileCard } from './ItemMobileCard';
import { 
  ArrowLeft,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  Search
} from 'lucide-react';

interface MobileItemsListProps {
  itens: any[];
  vistoriaInfo: {
    id: string;
    local: string;
    progresso?: {
      concluidos: number;
      total: number;
    };
  };
  onEditItem: (item: any) => void;
  onViewDetails?: (item: any) => void;
  onBack: () => void;
}

type FilterStatus = 'todos' | 'pendente' | 'concluido' | 'problema';

export function MobileItemsList({ 
  itens, 
  vistoriaInfo, 
  onEditItem, 
  onViewDetails, 
  onBack 
}: MobileItemsListProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [showFilters, setShowFilters] = useState(false);

  const getItemStatus = (item: any): FilterStatus => {
    if (item.concluido === true || item.status === 'concluido') {
      return 'concluido';
    }
    if (item.status === 'problema') {
      return 'problema';
    }
    return 'pendente';
  };

  // Filtrar itens
  const filteredItems = useMemo(() => {
    let filtered = itens || [];

    // Filtro por status
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(item => {
        const status = getItemStatus(item);
        return status === filterStatus;
      });
    }

    // Ordenar por status (pendentes primeiro, depois concluídos)
    filtered.sort((a, b) => {
      const statusA = getItemStatus(a);
      const statusB = getItemStatus(b);
      
      if (statusA === statusB) return 0;
      if (statusA === 'pendente') return -1;
      if (statusB === 'pendente') return 1;
      if (statusA === 'problema') return -1;
      if (statusB === 'problema') return 1;
      return 0;
    });

    return filtered;
  }, [itens, filterStatus]);

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'todos') return itens?.length || 0;
    return itens?.filter(item => getItemStatus(item) === status).length || 0;
  };

  const getStatusConfig = (status: FilterStatus) => {
    switch (status) {
      case 'concluido':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Concluídos',
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900',
          activeColor: 'bg-green-600 text-white'
        };
      case 'problema':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Problemas',
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900',
          activeColor: 'bg-red-600 text-white'
        };
      case 'pendente':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Pendentes',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900',
          activeColor: 'bg-orange-600 text-white'
        };
      default:
        return {
          icon: <Package className="h-4 w-4" />,
          text: 'Todos',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          activeColor: 'bg-blue-600 text-white'
        };
    }
  };

  const progressoPercentual = vistoriaInfo.progresso 
    ? Math.round((vistoriaInfo.progresso.concluidos / vistoriaInfo.progresso.total) * 100)
    : 0;

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
                  Itens da Vistoria
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {vistoriaInfo.local}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>

          {/* Progresso */}
          {vistoriaInfo.progresso && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progresso Geral
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {vistoriaInfo.progresso.concluidos}/{vistoriaInfo.progresso.total} itens
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
        </div>

        {/* Filtros Expansíveis */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-2">
              {(['todos', 'pendente', 'concluido', 'problema'] as FilterStatus[]).map((status) => {
                const config = getStatusConfig(status);
                const isActive = filterStatus === status;
                const count = getStatusCount(status);
                
                return (
                  <Button
                    key={status}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className={`h-12 justify-start ${isActive ? config.activeColor : ''}`}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <div className={isActive ? 'text-white' : config.color}>
                        {config.icon}
                      </div>
                      <span className="flex-1 text-left">{config.text}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lista de Itens */}
      <div className="px-4 py-4">
        {filteredItems.length === 0 ? (
          /* Estado Vazio */
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum Item Encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {filterStatus !== 'todos' 
                  ? `Não há itens com status "${getStatusConfig(filterStatus).text.toLowerCase()}"`
                  : 'Esta vistoria não possui itens cadastrados'
                }
              </p>
              {filterStatus !== 'todos' && (
                <Button
                  onClick={() => setFilterStatus('todos')}
                  variant="outline"
                  className="mt-2"
                >
                  Ver Todos os Itens
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Lista de Itens */
          <div className="space-y-4">
            {/* Contador de Resultados */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredItems.length} de {itens?.length || 0} itens
              </span>
              {filterStatus !== 'todos' && (
                <Button
                  onClick={() => setFilterStatus('todos')}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Ver Todos
                </Button>
              )}
            </div>

            {/* Cards dos Itens */}
            {filteredItems.map((item, index) => (
              <ItemMobileCard
                key={item.id || item.estoque_remessa_id || index}
                item={item}
                itemIndex={index}
                totalItems={filteredItems.length}
                onEditItem={onEditItem}
                onViewDetails={onViewDetails}
                syncStatus="sincronizado" // TODO: Implementar status real de sync
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 