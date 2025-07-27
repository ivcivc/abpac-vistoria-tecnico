'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VistoriaItem } from '@/types/storage';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { SyncStatusIndicator, useSyncStatus } from './SyncStatusIndicator';

interface ItemsListProps {
  itens: any[];
  onItemSelect: (item: any) => void;
  selectedItemId?: string;
}

type FilterStatus = 'todos' | 'pendente' | 'concluido' | 'problema';
type ViewMode = 'list' | 'grid';

export function ItemsList({ itens, onItemSelect, selectedItemId }: ItemsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const getItemStatus = (item: any): FilterStatus => {
    if (item.concluido === true || item.status === 'concluido') {
      return 'concluido';
    }
    if (item.status === 'problema') {
      return 'problema';
    }
    return 'pendente';
  };

  // Filtrar e ordenar itens
  const filteredItems = useMemo(() => {
    let filtered = itens || [];

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        
        // Buscar na descrição da categoria (objeto)
        const categoriaMatch = item.categoria?.descricao?.toLowerCase().includes(searchLower);
        
        // Buscar no nome do fabricante (objeto)
        const fabricanteMatch = item.fabricante?.nome?.toLowerCase().includes(searchLower);
        
        // Buscar nas observações
        const observacoesMatch = item.observacoes?.toLowerCase().includes(searchLower);
        
        return categoriaMatch || fabricanteMatch || observacoesMatch;
      });
    }

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
  }, [itens, searchTerm, filterStatus, getItemStatus]);

  const getStatusIcon = (status: FilterStatus) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'problema':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusText = (status: FilterStatus) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'problema':
        return 'Problema';
      default:
        return 'Pendente';
    }
  };

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'todos') return itens?.length || 0;
    return itens?.filter(item => getItemStatus(item) === status).length || 0;
  };

  const formatItemInfo = (item: any) => {
    const parts = [];
    
    // Categoria é um objeto com campo 'descricao'
    if (item?.categoria && typeof item.categoria === 'object' && item.categoria.descricao) {
      parts.push(item.categoria.descricao);
    }
    
    // Fabricante é um objeto com campo 'nome'  
    if (item?.fabricante && typeof item.fabricante === 'object' && item.fabricante.nome) {
      parts.push(item.fabricante.nome);
    }
    
    // Não existe campo 'modelo' diretamente no backend real
    
    return parts.join(' - ') || 'Item sem descrição';
  };

  const renderListView = () => (
    <div className="space-y-2">
      {filteredItems.map((item, index) => {
        const status = getItemStatus(item);
        const isSelected = selectedItemId === item.id || selectedItemId === item.estoque_remessa_id?.toString();
        
        return (
          <Card
            key={item.id || index}
            className={`cursor-pointer transition-all ${
              isSelected 
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => onItemSelect(item)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {formatItemInfo(item)}
                    </h3>
                  </div>
                  {item.numeroSerie && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Número de Série: {item.numeroSerie}
                    </p>
                  )}
                  {item.observacoes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {item.observacoes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'concluido'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : status === 'problema'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}
                    >
                      {getStatusText(status)}
                    </span>
                    <SyncStatusIndicator status={useSyncStatus(item)} size="sm" />
                  </div>
                  {item.acao && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.acao}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredItems.map((item, index) => {
        const status = getItemStatus(item);
        const isSelected = selectedItemId === item.id || selectedItemId === item.estoque_remessa_id?.toString();
        
        return (
          <Card
            key={item.id || index}
            className={`cursor-pointer transition-all ${
              isSelected 
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => onItemSelect(item)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span className="truncate">{formatItemInfo(item)}</span>
                </div>
                {getStatusIcon(status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {item.numeroSerie && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    NS: {item.numeroSerie}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'concluido'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : status === 'problema'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}
                    >
                      {getStatusText(status)}
                    </span>
                    <SyncStatusIndicator status={useSyncStatus(item)} size="sm" />
                  </div>
                  {item.acao && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.acao}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Itens da Vistoria</span>
            <span className="text-sm font-normal text-gray-500">
              ({filteredItems.length} de {itens?.length || 0})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros e Busca */}
        <div className="space-y-4 mb-6">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros por Status */}
          <div className="flex flex-wrap gap-2">
            {(['todos', 'pendente', 'concluido', 'problema'] as FilterStatus[]).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="flex items-center space-x-2"
              >
                {status !== 'todos' && getStatusIcon(status)}
                <span className="capitalize">
                  {status === 'todos' ? 'Todos' : getStatusText(status)}
                </span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                  {getStatusCount(status)}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Lista/Grid de Itens */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterStatus !== 'todos'
                ? 'Tente ajustar os filtros de busca'
                : 'Esta vistoria não possui itens cadastrados'}
            </p>
          </div>
        ) : (
          viewMode === 'list' ? renderListView() : renderGridView()
        )}
      </CardContent>
    </Card>
  );
} 