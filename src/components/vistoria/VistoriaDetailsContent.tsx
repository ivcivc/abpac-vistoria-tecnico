'use client';

import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { VistoriaHeader } from './VistoriaHeader';
import { ProgressIndicator } from './ProgressIndicator';
import { ItemsList } from './ItemsList';
import { ItemDetails } from './ItemDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVistoria } from '@/hooks/useVistoria';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface VistoriaDetailsContentProps {
  vistoriaId: string;
}

export function VistoriaDetailsContent({ vistoriaId }: VistoriaDetailsContentProps) {
  const { vistoria, loading, error, progresso, recarregarVistoria, limparErro } = useVistoria(vistoriaId);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    const index = vistoria?.itens?.findIndex(
      i => i.id === item.id || i.estoque_remessa_id === item.estoque_remessa_id
    ) || -1;
    setSelectedItemIndex(index);
  };

  const handlePreviousItem = () => {
    if (vistoria?.itens && selectedItemIndex > 0) {
      const newIndex = selectedItemIndex - 1;
      setSelectedItemIndex(newIndex);
      setSelectedItem(vistoria.itens[newIndex]);
    }
  };

  const handleNextItem = () => {
    if (vistoria?.itens && selectedItemIndex < vistoria.itens.length - 1) {
      const newIndex = selectedItemIndex + 1;
      setSelectedItemIndex(newIndex);
      setSelectedItem(vistoria.itens[newIndex]);
    }
  };

  const handleEdit = (item: any) => {
    // TODO: Implementar modal de edição (Task 2)
    console.log('Editar item:', item);
  };

  const handleAddEvidence = (item: any) => {
    // TODO: Implementar captura de evidência (Task 4)
    console.log('Adicionar evidência:', item);
  };

  const handleConcludeVistoria = () => {
    // TODO: Implementar conclusão de vistoria (Task 3)
    console.log('Concluir vistoria:', vistoriaId);
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>

            {/* Progress Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>

            {/* Items List Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Erro ao carregar vistoria
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <div className="space-x-2">
                <Button onClick={recarregarVistoria} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button onClick={limparErro}>
                  Limpar Erro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!vistoria) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Vistoria não encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A vistoria com ID {vistoriaId} não foi encontrada no armazenamento local.
              </p>
              <Button onClick={recarregarVistoria}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        <div className="space-y-6">
          {/* Cabeçalho da Vistoria */}
          <VistoriaHeader vistoria={vistoria} progresso={progresso} />

          {/* Indicador de Progresso */}
          <ProgressIndicator progresso={progresso} itens={vistoria.itens} />

          {/* Layout de duas colunas para itens e detalhes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Itens (2/3 da largura) */}
            <div className="lg:col-span-2">
              <ItemsList
                itens={vistoria.itens || []}
                onItemSelect={handleItemSelect}
                selectedItemId={selectedItem?.id || selectedItem?.estoque_remessa_id?.toString()}
              />
            </div>

            {/* Detalhes do Item Selecionado (1/3 da largura) */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Navegação entre itens */}
                {selectedItem && vistoria.itens && vistoria.itens.length > 1 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousItem}
                          disabled={selectedItemIndex <= 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedItemIndex + 1} de {vistoria.itens.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextItem}
                          disabled={selectedItemIndex >= vistoria.itens.length - 1}
                        >
                          Próximo
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detalhes do Item */}
                <ItemDetails
                  item={selectedItem}
                  onEdit={handleEdit}
                  onAddEvidence={handleAddEvidence}
                />
              </div>
            </div>
          </div>

          {/* Botão de Conclusão */}
          {vistoria.status !== 'concluida' && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Finalizar Vistoria
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {progresso === 100 
                        ? 'Todos os itens foram verificados. Você pode concluir a vistoria.' 
                        : `${Math.round(progresso)}% concluído. Verifique os itens pendentes antes de finalizar.`}
                    </p>
                  </div>
                  <Button
                    onClick={handleConcludeVistoria}
                    disabled={progresso < 100}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {progresso === 100 ? 'Concluir Vistoria' : 'Itens Pendentes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
} 