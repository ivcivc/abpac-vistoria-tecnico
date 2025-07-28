'use client';

import { useState } from 'react';
import { MobileVistoriaOverview } from '@/components/mobile/MobileVistoriaOverview';
import { MobileItemsList } from '@/components/mobile/MobileItemsList';
import { MobileItemEdit } from '@/components/mobile/MobileItemEdit';
import { ItemEditModal } from './ItemEditModal';
import { EvidenceModal } from './EvidenceModal';
import { VistoriaCompletionModal } from './VistoriaCompletionModal';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { VistoriaProgressService } from '@/services/vistoria/VistoriaProgressService';
import { ApiVistoriaService } from '@/services/vistoria/ApiVistoriaService';
import { SyncQueueService } from '@/services/sync/SyncQueueService';
import { VistoriaCompletionService } from '@/services/vistoria/VistoriaCompletionService';
import { useVistoria } from '@/hooks/useVistoria';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface VistoriaDetailsContentProps {
  vistoriaId: string;
}

export function VistoriaDetailsContent({ vistoriaId }: VistoriaDetailsContentProps) {
  const { vistoria, loading, error, progresso, recarregarVistoria, limparErro } = useVistoria(vistoriaId);
  const router = useRouter();
  const { toast } = useToast();
  
  // Estados de navegação mobile
  const [currentView, setCurrentView] = useState<'overview' | 'items' | 'edit'>('overview');
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);
  
  // Estados dos modais
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Log de diagnóstico para verificar itens recebidos
  console.log('📊 [VistoriaDetailsContent] Estado da vistoria:', {
    vistoriaId,
    totalItens: vistoria?.itens?.length || 0,
    itensIds: vistoria?.itens?.map((item: any) => item.id || item.estoque_remessa_id) || [],
    loading,
    error,
    progresso
  });

  // Handlers de navegação mobile
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleViewItems = () => {
    setCurrentView('items');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
  };

  const handleEditItem = (item: any) => {
    console.log('🔧 [VistoriaDetailsContent] Abrindo edição mobile para item:', item);
    const itemIndex = (vistoria?.itens || []).findIndex(
      i => i.id === item.id || i.estoque_remessa_id === item.estoque_remessa_id
    );
    setEditingItemIndex(itemIndex >= 0 ? itemIndex : 0);
    setEditingItem(item);
    setCurrentView('edit');
  };

  const handleBackFromEdit = () => {
    setCurrentView('items');
    setEditingItem(null);
    setEditingItemIndex(-1);
  };

  const handleNextItem = () => {
    const itens = vistoria?.itens || [];
    if (editingItemIndex < itens.length - 1) {
      const nextIndex = editingItemIndex + 1;
      const nextItem = itens[nextIndex];
      setEditingItemIndex(nextIndex);
      setEditingItem(nextItem);
    }
  };

  const handlePreviousItem = () => {
    const itens = vistoria?.itens || [];
    if (editingItemIndex > 0) {
      const prevIndex = editingItemIndex - 1;
      const prevItem = itens[prevIndex];
      setEditingItemIndex(prevIndex);
      setEditingItem(prevItem);
    }
  };

  const handleViewItemDetails = (item: any) => {
    console.log('👁️ [VistoriaDetailsContent] Visualizando detalhes do item:', item);
    // TODO: Implementar visualização de detalhes se necessário
  };

  const handleAddExpense = () => {
    console.log('💰 [VistoriaDetailsContent] Abrindo modal de despesas');
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: "A funcionalidade de adicionar despesas será implementada em breve.",
      variant: "default",
    });
  };

  /**
   * Verifica se a vistoria permite edição com base no seu status
   * 
   * Regras de validação:
   * 1. Apenas vistorias com status AGUARDANDO_VISTORIA ou EM_VISTORIA permitem edição
   * 2. Qualquer outro status (CONCLUIDA, APROVADA, etc.) bloqueia edição
   * 
   * @see /docs/REGRAS-VALIDACAO.md para documentação completa
   * @returns {boolean} true se a vistoria permite edição, false caso contrário
   */
  const canEditVistoria = () => {
    // Obter dados do contexto de autenticação (dados do backend)
    const authState = typeof window !== 'undefined' ? 
      JSON.parse(localStorage.getItem('vistoria_auth_state') || '{}') : {};
    const currentVistoria = authState?.currentVistoria || {};
    
    // O status vem do backend como "AGUARDANDO_VISTORIA", "EM_VISTORIA", "AGUARDANDO_APROVACAO" etc
    const vistoriaStatus = currentVistoria?.status;
    
    const statusPermiteEdicao = ['AGUARDANDO_VISTORIA', 'EM_VISTORIA'].includes(vistoriaStatus);
    
    console.log('🔒 [VistoriaDetailsContent] Verificando permissão de edição:', {
      vistoriaStatus,
      statusPermiteEdicao,
      currentVistoria,
      authState
    });
    
    return statusPermiteEdicao;
  };

  const handleEdit = (item: any) => {
    // Verificar se a vistoria permite edição ANTES de abrir o modal
    if (!canEditVistoria()) {
      // Obter status do backend para mostrar na mensagem
      const authState = typeof window !== 'undefined' ? 
        JSON.parse(localStorage.getItem('vistoria_auth_state') || '{}') : {};
      const currentVistoria = authState?.currentVistoria || {};
      const vistoriaStatus = currentVistoria?.status || 'DESCONHECIDO';
      
      alert(`❌ Não é possível editar itens!\n\nStatus atual da vistoria: "${vistoriaStatus}"\n\nApenas vistorias com status "AGUARDANDO_VISTORIA" ou "EM_VISTORIA" podem ser editadas.\n\nEsta vistoria está em modo somente leitura.`);
      return;
    }
    
    // Verificar se o item não está cancelado - aceitar múltiplos formatos
    const itemCancelado = item.status_item === 'CANCELADO' || item.status_item === 'cancelado';
    if (itemCancelado) {
      alert(`❌ Este item está CANCELADO e não pode ser editado.\n\nApenas itens com status PENDENTE, CONCLUÍDO ou PROBLEMA podem ser editados.`);
      return;
    }
    
    console.log('✏️ [VistoriaDetailsContent] Abrindo modal de edição para item:', item.id);
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleAddEvidence = (item: any) => {
    console.log('📸 [VistoriaDetailsContent] Abrindo modal de evidência para item:', item.id);
    setEditingItem(item);
    setEvidenceModalOpen(true);
  };

  const handleSaveEdit = async (updatedItem: any) => {
    try {
      console.log('💾 [VistoriaDetailsContent] Salvando item editado:', updatedItem);
      console.log('📊 [VistoriaDetailsContent] Estado ANTES da edição - Total de itens:', vistoria?.itens?.length);
      
      // 1. Salvar no armazenamento local primeiro
      const localService = new LocalVistoriaService();
      const apiService = new ApiVistoriaService();
      const syncQueueService = SyncQueueService.getInstance();
      
      const localResult = await localService.atualizarItem(vistoriaId, updatedItem);
      
      if (localResult.success) {
        console.log('✅ [VistoriaDetailsContent] Item salvo com sucesso no armazenamento local');
        
        // Verificar integridade da vistoria após atualização
        const integridade = await localService.verificarIntegridade(vistoriaId);
        if (integridade.success && integridade.data) {
          console.log(`📊 [VistoriaDetailsContent] Verificação de integridade após atualização:`, {
            totalItens: integridade.data.totalItens,
            itensPorStatus: integridade.data.itensPorStatus,
            duplicados: integridade.data.duplicados,
            integridadeOk: integridade.data.integridadeOk
          });
          
          if (!integridade.data.integridadeOk) {
            console.warn('⚠️ [VistoriaDetailsContent] Problemas de integridade detectados na vistoria');
          }
        }
        
        // Notificar usuário sobre salvamento local bem-sucedido
        toast({
          title: "Item salvo localmente",
          description: "As alterações foram salvas no dispositivo.",
          variant: "default",
        });
        
        // 2. Tentar sincronizar com o backend se o token estiver disponível
        if (vistoria?.token) {
          console.log('🔄 [VistoriaDetailsContent] Iniciando sincronização com backend...');
          
          // Notificar usuário sobre tentativa de sincronização
          toast({
            title: "Sincronizando...",
            description: "Enviando dados para o servidor.",
            variant: "default",
          });
          
          // Usar o ID correto para o backend
          const itemId = updatedItem.estoque_remessa_id || updatedItem.id;
          
          const apiResult = await apiService.atualizarItem(itemId, updatedItem, vistoria.token);
          
          if (apiResult.success) {
            console.log('✅ [VistoriaDetailsContent] Item sincronizado com sucesso no backend');
            
            // NÃO fazer segunda atualização local - apenas marcar como sincronizado no item atual
            updatedItem.sincronizado = true;
            updatedItem.ultimaSincronizacao = new Date();
            
            // Notificar usuário sobre sincronização bem-sucedida
            toast({
              title: "Sincronização concluída",
              description: "Item atualizado no servidor com sucesso.",
              variant: "success",
            });
          } else {
            console.warn('⚠️ [VistoriaDetailsContent] Falha na sincronização com backend:', apiResult.error);
            
            // Marcar item como não sincronizado para posterior retry
            updatedItem.sincronizado = false;
            updatedItem.erroSincronizacao = apiResult.error;
            
            // Adicionar item à fila de sincronização para retry automático
            try {
              await syncQueueService.adicionarOperacao(
                'UPDATE_ITEM',
                itemId.toString(),
                updatedItem,
                vistoriaId,
                vistoria.token,
                1 // Alta prioridade para itens de vistoria
              );
              console.log('✅ [VistoriaDetailsContent] Item adicionado à fila de sincronização para retry automático');
              
              // Notificar usuário sobre falha na sincronização mas retry automático
              toast({
                title: "Sincronização agendada",
                description: `Erro: ${apiResult.error || 'Problema de conexão'}. O sistema tentará sincronizar automaticamente.`,
                variant: "warning",
                duration: 5000,
              });
            } catch (queueError) {
              console.error('❌ [VistoriaDetailsContent] Erro ao adicionar item na fila:', queueError);
              
              // Notificar usuário sobre falha na sincronização sem retry
              toast({
                title: "Falha na sincronização",
                description: `Erro: ${apiResult.error || 'Problema de conexão com o servidor'}. Tente novamente mais tarde.`,
                variant: "destructive",
                duration: 5000,
              });
            }
          }
        } else {
          console.warn('⚠️ [VistoriaDetailsContent] Token não disponível, item salvo apenas localmente');
          
          // Notificar usuário sobre salvamento apenas local
          toast({
            title: "Modo offline",
            description: "Item salvo apenas no dispositivo. Será sincronizado quando houver conexão.",
            variant: "warning",
            duration: 4000,
          });
        }
        
        // 3. Atualizar progresso da vistoria
        const progressService = new VistoriaProgressService();
        const progressResult = await progressService.atualizarProgressoVistoria(vistoriaId);
        
        if (progressResult.success && progressResult.progresso) {
          console.log(`📊 Progresso atualizado: ${progressResult.progresso.percentualConclusao}% (${progressResult.progresso.itensConcluidos}/${progressResult.progresso.totalItens} itens)`);
        }
        
        // 4. Interface será atualizada automaticamente pelo recarregamento
        
        // Recarregar a vistoria para atualizar a lista e progresso
        console.log('🔄 [VistoriaDetailsContent] Recarregando vistoria após salvamento...');
        await recarregarVistoria();
        console.log('📊 [VistoriaDetailsContent] Estado APÓS recarga - Total de itens:', vistoria?.itens?.length);
        
      } else {
        console.error('❌ [VistoriaDetailsContent] Erro ao salvar item:', localResult.error);
        
        // Notificar usuário sobre erro no salvamento local
        toast({
          title: "Erro ao salvar",
          description: `Não foi possível salvar o item: ${localResult.error}`,
          variant: "destructive",
        });
        
        alert(`Erro ao salvar item: ${localResult.error}`);
      }
      
    } catch (error) {
      console.error('💥 [VistoriaDetailsContent] Erro inesperado ao salvar item:', error);
      
      // Notificar usuário sobre erro inesperado
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um problema ao salvar. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
      
      alert('Erro inesperado ao salvar. Tente novamente.');
    }
  };

  const handleSaveEvidence = (item: any, fotos: any[]) => {
    console.log('📸 [VistoriaDetailsContent] Evidências salvas:', {
      itemId: item.id,
      totalFotos: fotos.length
    });
    
    // Aqui seria integrado com o serviço real para salvar as evidências
    // Por enquanto, apenas log
    
    // Atualizar o item com as novas evidências
    const updatedItem = {
      ...item,
      fotos_videos: [...(item.fotos_videos || []), ...fotos]
    };
    
    // Interface será atualizada automaticamente
    
    // Recarregar a vistoria para atualizar tudo
    recarregarVistoria();
  };

  const handleConcludeVistoria = () => {
    console.log('🏁 [VistoriaDetailsContent] Abrindo modal de conclusão:', vistoriaId);
    setCompletionModalOpen(true);
  };

  // Função para lidar com conclusão da vistoria
  const handleCompleteVistoria = async (observacoes: string) => {
    if (!vistoria) return;

    setIsCompleting(true);
    
    try {
      console.log('🎯 [VistoriaDetailsContent] Iniciando conclusão da vistoria:', vistoriaId);

      const completionService = new VistoriaCompletionService();
      
      // Determinar se deve forçar conclusão (se há itens pendentes)
      const itens = vistoria.itens || [];
      const itensPendentes = itens.filter((item: any) => item.status === 'pendente').length;
      const forceComplete = itensPendentes > 0;

      const result = await completionService.concluirVistoria(
        vistoriaId,
        observacoes,
        vistoria.token,
        forceComplete
      );

      if (result.success) {
        console.log('✅ [VistoriaDetailsContent] Vistoria concluída com sucesso:', result);

        // Notificar usuário
        toast({
          title: "Vistoria Concluída",
          description: result.error 
            ? `Concluída localmente. ${result.error}`
            : "Vistoria concluída e sincronizada com sucesso!",
          variant: result.error ? "warning" : "success",
          duration: 5000,
        });

        // Recarregar dados da vistoria
        await recarregarVistoria();

        // Fechar modal
        setCompletionModalOpen(false);

        // Redirecionar para dashboard após conclusão
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000); // Aguardar 2 segundos para o usuário ver a mensagem

      } else {
        console.error('❌ [VistoriaDetailsContent] Erro na conclusão:', result.error);

        toast({
          title: "Erro na Conclusão",
          description: result.error || "Não foi possível concluir a vistoria. Tente novamente.",
          variant: "destructive",
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('❌ [VistoriaDetailsContent] Erro inesperado na conclusão:', error);

      toast({
        title: "Erro Inesperado",
        description: "Ocorreu um erro inesperado ao concluir a vistoria.",
        variant: "destructive",
        duration: 5000,
      });

    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando vistoria...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Erro ao carregar vistoria
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={recarregarVistoria}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!vistoria) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-gray-400 mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Vistoria não encontrada
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            A vistoria com ID {vistoriaId} não foi encontrada.
          </p>
          <button 
            onClick={recarregarVistoria}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  // Renderização mobile-first
  if (currentView === 'edit' && editingItem) {
    return (
      <MobileItemEdit
        item={editingItem}
        itemIndex={editingItemIndex}
        totalItems={vistoria?.itens?.length || 0}
        vistoriaInfo={{
          local: vistoria.local,
          id: vistoria.id
        }}
        onSave={handleSaveEdit}
        onBack={handleBackFromEdit}
        onPrevious={editingItemIndex > 0 ? handlePreviousItem : undefined}
        onNext={editingItemIndex < (vistoria?.itens?.length || 0) - 1 ? handleNextItem : undefined}
        onCaptureEvidence={(item) => {
          setEditingItem(item);
          setEvidenceModalOpen(true);
        }}
      />
    );
  }

  if (currentView === 'items') {
    return (
      <>
        <MobileItemsList
          itens={vistoria.itens || []}
                     vistoriaInfo={{
             id: vistoria.id,
             local: vistoria.local,
             progresso: {
               concluidos: 0, // TODO: Calcular itens concluídos
               total: vistoria.itens?.length || 0
             }
           }}
          onEditItem={handleEditItem}
          onViewDetails={handleViewItemDetails}
          onBack={handleBackToOverview}
        />
        
        {/* Modais */}
        {editingItem && (
          <ItemEditModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            item={editingItem}
            onSave={handleSaveEdit}
          />
        )}
        
        {editingItem && (
          <EvidenceModal
            open={evidenceModalOpen}
            onClose={() => setEvidenceModalOpen(false)}
            item={editingItem}
            onSave={handleSaveEvidence}
          />
        )}
      </>
    );
  }

  // Vista overview da vistoria
  return (
    <>
      <MobileVistoriaOverview
        vistoria={{
          id: vistoria.id,
          local: vistoria.local,
          cidade: 'Cidade não informada',
          veiculo: vistoria.veiculo || { modelo: 'N/A', placa: 'N/A', cor: 'N/A' },
          status: vistoria.status,
          tipoVistoria: vistoria.tipoVistoria || 'INSTALACAO',
          tecnicoNome: vistoria.tecnicoNome,
          agendadoPara: 'Hoje, 14:30',
          progresso: {
            concluidos: 0, // TODO: Calcular itens concluídos
            total: vistoria.itens?.length || 0
          }
        }}
        onViewItems={handleViewItems}
        onAddExpense={handleAddExpense}
        onCompleteVistoria={handleConcludeVistoria}
        onBack={handleBackToDashboard}
      />

      {/* Modal de Conclusão da Vistoria */}
      <VistoriaCompletionModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        vistoria={vistoria}
        onConfirm={handleCompleteVistoria}
        loading={isCompleting}
      />
    </>
  );
} 