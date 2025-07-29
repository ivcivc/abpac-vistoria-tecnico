'use client';

/**
 * Manager de Despesas Mobile - Integração Task 5
 * Componente que integra todo o sistema de despesas na interface mobile
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt } from 'lucide-react';
import { MobileDespesaForm, DespesaFormData } from '@/components/despesas/MobileDespesaForm';
import { MobileDespesasList } from '@/components/despesas/MobileDespesasList';
import { DespesaLocal } from '@/services/despesas/DespesaStorageService';
import { DespesaService } from '@/services/despesas/DespesaService';
import { useToast } from '@/components/ui/use-toast';

interface MobileDespesasManagerProps {
  vistoriaId: string;
  token: string;
  onBack: () => void;
}

type View = 'list' | 'add' | 'edit';

export function MobileDespesasManager({
  vistoriaId,
  token,
  onBack
}: MobileDespesasManagerProps) {
  const [currentView, setCurrentView] = useState<View>('list');
  const [editingDespesa, setEditingDespesa] = useState<DespesaLocal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Voltar para lista
  const handleBackToList = () => {
    setCurrentView('list');
    setEditingDespesa(null);
  };

  // Adicionar nova despesa
  const handleAddDespesa = () => {
    setEditingDespesa(null);
    setCurrentView('add');
  };

  // Editar despesa existente
  const handleEditDespesa = (despesa: DespesaLocal) => {
    setEditingDespesa(despesa);
    setCurrentView('edit');
  };

  // Salvar despesa (nova ou editada)
  const handleSaveDespesa = async (despesaData: DespesaFormData) => {
    setIsLoading(true);

    try {
      let result;

      if (editingDespesa) {
        // Editando despesa existente
        result = await DespesaService.atualizarDespesa(
          editingDespesa.id,
          {
            tipo: despesaData.tipo,
            valor: despesaData.valor,
            descricao: despesaData.descricao,
            data: despesaData.data,
            comprovantes: despesaData.comprovantes
          },
          token,
          {
            onProgress: (progress) => {
              console.log('📱 Progresso da atualização:', progress);
            }
          }
        );

        if (result.success) {
          toast({
            title: "Sucesso",
            description: "Despesa atualizada com sucesso!",
            variant: "default"
          });
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao atualizar despesa",
            variant: "destructive"
          });
        }
      } else {
        // Criando nova despesa
        result = await DespesaService.criarDespesa(
          despesaData,
          token,
          {
            onProgress: (progress) => {
              console.log('📱 Progresso da criação:', progress);
            }
          }
        );

        if (result.success) {
          toast({
            title: "Sucesso",
            description: "Despesa criada com sucesso!",
            variant: "default"
          });
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao criar despesa",
            variant: "destructive"
          });
        }
      }

      if (result.success) {
        // Voltar para lista
        handleBackToList();
      }

    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar despesa",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar header baseado na view
  const renderHeader = () => {
    let title = '';
    let subtitle = '';

    switch (currentView) {
      case 'list':
        title = 'Despesas da Vistoria';
        subtitle = 'Gerencie os gastos desta vistoria';
        break;
      case 'add':
        title = 'Nova Despesa';
        subtitle = 'Registre um novo gasto';
        break;
      case 'edit':
        title = 'Editar Despesa';
        subtitle = 'Modifique os dados da despesa';
        break;
    }

    const showBackButton = currentView !== 'list';
    const onBackClick = showBackButton ? handleBackToList : onBack;

    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackClick}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            </div>
            {currentView === 'list' && (
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      {renderHeader()}

      {/* Content */}
      <div className="p-4">
        {currentView === 'list' && (
          <MobileDespesasList
            vistoriaId={vistoriaId}
            token={token}
            onAddDespesa={handleAddDespesa}
            onEditDespesa={handleEditDespesa}
          />
        )}

        {(currentView === 'add' || currentView === 'edit') && (
          <MobileDespesaForm
            vistoriaId={vistoriaId}
            onSave={handleSaveDespesa}
            onCancel={handleBackToList}
            isLoading={isLoading}
            initialData={editingDespesa ? {
              tipo: editingDespesa.tipo,
              valor: editingDespesa.valor,
              descricao: editingDespesa.descricao,
              data: editingDespesa.data,
              comprovantes: editingDespesa.comprovantes
            } : undefined}
          />
        )}
      </div>
    </div>
  );
}