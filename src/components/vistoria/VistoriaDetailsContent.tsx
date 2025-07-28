'use client';

import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import { VistoriaHeader } from './VistoriaHeader';
import { ProgressIndicator } from './ProgressIndicator';
import { ItemsList } from './ItemsList';
import { ItemDetails } from './ItemDetails';
import { ItemEditModal } from './ItemEditModal';
import { EvidenceModal } from './EvidenceModal';
import { SyncQueueStatus } from '@/components/sync/SyncQueueStatus';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { VistoriaProgressService } from '@/services/vistoria/VistoriaProgressService';
import { ApiVistoriaService } from '@/services/vistoria/ApiVistoriaService';
import { SyncQueueService } from '@/services/sync/SyncQueueService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVistoria } from '@/hooks/useVistoria';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Package,
} from 'lucide-react';

// Importar toast do arquivo correto
import { useToast } from '@/components/ui/use-toast';
import { VistoriaCompletionModal } from './VistoriaCompletionModal';
import { VistoriaCompletionService } from '@/services/vistoria/VistoriaCompletionService';

interface VistoriaDetailsContentProps {
  vistoriaId: string;
}

export function VistoriaDetailsContent({ vistoriaId }: VistoriaDetailsContentProps) {
  const { vistoria, loading, error, progresso, recarregarVistoria, limparErro } = useVistoria(vistoriaId);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
  
  // Estados dos modais
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  // Log de diagnóstico para verificar itens recebidos
  console.log('📊 [VistoriaDetailsContent] Estado da vistoria:', {
    vistoriaId,
    totalItens: vistoria?.itens?.length || 0,
    itensIds: vistoria?.itens?.map((item: any) => item.id || item.estoque_remessa_id) || [],
    loading,
    error,
    progresso
  });

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    const itens = Array.isArray(vistoria?.itens) ? vistoria.itens : [];
    const index = itens.findIndex(
      i => i.id === item.id || i.estoque_remessa_id === item.estoque_remessa_id
    );
    setSelectedItemIndex(index >= 0 ? index : -1);
  };

  const handlePreviousItem = () => {
    const itens = Array.isArray(vistoria?.itens) ? vistoria.itens : [];
    if (itens.length > 0 && selectedItemIndex > 0) {
      const newIndex = selectedItemIndex - 1;
      setSelectedItemIndex(newIndex);
      setSelectedItem(itens[newIndex]);
    }
  };

  const handleNextItem = () => {
    const itens = Array.isArray(vistoria?.itens) ? vistoria.itens : [];
    if (itens.length > 0 && selectedItemIndex < itens.length - 1) {
      const newIndex = selectedItemIndex + 1;
      setSelectedItemIndex(newIndex);
      setSelectedItem(itens[newIndex]);
    }
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
        
        // 4. Atualizar interface
        if (selectedItem && (selectedItem.id === updatedItem.id || selectedItem.estoque_remessa_id === updatedItem.estoque_remessa_id)) {
          setSelectedItem({ ...selectedItem, ...updatedItem });
        }
        
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
    
    if (selectedItem && (selectedItem.id === item.id || selectedItem.estoque_remessa_id === item.estoque_remessa_id)) {
      setSelectedItem(updatedItem);
    }
    
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
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="space-y-6">
          {vistoria && (
            <>
              <VistoriaHeader vistoria={vistoria} progresso={progresso} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ProgressIndicator progresso={progresso} itens={vistoria.itens || []} />
                </div>
                <div>
                  <SyncQueueStatus />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Card className="shadow-md">
                    <CardContent className="p-4">
                      {/* Adicionar verificação de itens e aviso se não houver itens */}
                      {(!vistoria.itens || vistoria.itens.length === 0) && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md mb-4">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                            <p className="text-yellow-700 dark:text-yellow-400">
                              Nenhum item encontrado. Tente recarregar a página.
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => {
                              console.log('🔄 [VistoriaDetailsContent] Forçando recarga após detecção de 0 itens');
                              recarregarVistoria();
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Recarregar
                          </Button>
                        </div>
                      )}
                      
                      <ItemsList 
                        itens={vistoria.itens || []} 
                        onItemSelect={handleItemSelect}
                        selectedItemId={selectedItem?.id || selectedItem?.estoque_remessa_id}
                      />
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card className="shadow-md">
                    <CardContent className="p-4">
                      {selectedItem ? (
                        <>
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePreviousItem}
                                disabled={selectedItemIndex <= 0}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextItem}
                                disabled={!vistoria.itens || selectedItemIndex >= vistoria.itens.length - 1}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Item {selectedItemIndex + 1} de {vistoria.itens?.length || 0}
                            </div>
                          </div>
                          
                          <ItemDetails 
                            item={selectedItem}
                            onEdit={() => handleEdit(selectedItem)}
                            onAddEvidence={() => handleAddEvidence(selectedItem)}
                            canEdit={canEditVistoria()}
                          />
                        </>
                      ) : (
                        <div className="p-8 text-center">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">Selecione um item</h3>
                          <p className="text-muted-foreground">
                            Escolha um item da lista para visualizar seus detalhes
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Botão de conclusão */}
              {progresso === 100 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Finalizar Vistoria</h3>
                    <p className="text-blue-600 dark:text-blue-400">
                      Todos os itens foram verificados. Você pode concluir a vistoria.
                    </p>
                  </div>
                  <Button onClick={handleConcludeVistoria}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir Vistoria
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
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

      {/* Modal de Conclusão da Vistoria */}
      {vistoria && (
        <VistoriaCompletionModal
          open={completionModalOpen}
          onOpenChange={setCompletionModalOpen}
          vistoria={vistoria}
          onConfirm={handleCompleteVistoria}
          loading={isCompleting}
        />
      )}
    </AuthenticatedLayout>
  );
} 