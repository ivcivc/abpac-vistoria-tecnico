'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Camera,
  FileText,
  Info,
  Settings,
} from 'lucide-react';

interface ItemDetailsProps {
  item: any | null;
  onEdit?: (item: any) => void;
  onAddEvidence?: (item: any) => void;
}

export function ItemDetails({ item, onEdit, onAddEvidence }: ItemDetailsProps) {
  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Selecione um item
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Clique em um item da lista para ver os detalhes
          </p>
        </CardContent>
      </Card>
    );
  }

  const getItemStatus = (item: any) => {
    if (item.concluido === true || item.status === 'concluido') {
      return 'concluido';
    }
    if (item.status === 'problema') {
      return 'problema';
    }
    return 'pendente';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'problema':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'problema':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'problema':
        return 'Problema';
      default:
        return 'Pendente';
    }
  };

  const formatItemInfo = (item: any) => {
    const parts = [];
    if (item.categoria) parts.push(item.categoria);
    if (item.fabricante) parts.push(item.fabricante);
    if (item.modelo) parts.push(item.modelo);
    return parts.join(' - ') || 'Item sem descrição';
  };

  const status = getItemStatus(item);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Detalhes do Item</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(status)}>
              {getStatusIcon(status)}
              <span className="ml-1">{getStatusText(status)}</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">
                    Descrição:
                  </label>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {formatItemInfo(item)}
                  </p>
                </div>
                
                {item.numeroSerie && (
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">
                      Número de Série:
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 font-mono">
                      {item.numeroSerie}
                    </p>
                  </div>
                )}
                
                {item.acao && (
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">
                      Ação:
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 capitalize">
                      {item.acao}
                    </p>
                  </div>
                )}
                
                {item.localInstalacao && (
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">
                      Local de Instalação:
                    </label>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {item.localInstalacao}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Especificações Técnicas */}
        {(item.categoria || item.fabricante || item.modelo) && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Especificações Técnicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {item.categoria && (
                    <div>
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Categoria:
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {item.categoria}
                      </p>
                    </div>
                  )}
                  
                  {item.fabricante && (
                    <div>
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Fabricante:
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {item.fabricante}
                      </p>
                    </div>
                  )}
                  
                  {item.modelo && (
                    <div>
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Modelo:
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {item.modelo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        {item.observacoes && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Observações
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.observacoes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Evidências */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Camera className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Evidências
              </h3>
              {item.evidencias && item.evidencias.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {item.evidencias.map((evidencia: any, index: number) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        {evidencia.tipo === 'foto' ? (
                          <img
                            src={evidencia.url || evidencia.localUrl}
                            alt={evidencia.descricao || `Evidência ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {evidencia.descricao && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {evidencia.descricao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nenhuma evidência adicionada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => onEdit?.(item)}
            className="flex items-center space-x-2"
            disabled={status === 'concluido'}
          >
            <Edit className="h-4 w-4" />
            <span>Editar Item</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => onAddEvidence?.(item)}
            className="flex items-center space-x-2"
            disabled={status === 'concluido'}
          >
            <Camera className="h-4 w-4" />
            <span>Adicionar Evidência</span>
          </Button>
        </div>

        {/* Status de Sincronização */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span>
              ID: {item.id || item.estoque_remessa_id}
            </span>
            <span>
              {item.sincronizado ? '✅ Sincronizado' : '⏳ Pendente de sincronização'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 