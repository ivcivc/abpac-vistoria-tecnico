'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { VistoriaItemsList } from '@/components/vistoria/VistoriaItemsList';

import { StatusBadge } from '@/components/vistoria/StatusBadge';
import { SyncBadge } from '@/components/vistoria/SyncBadge';
import { ConnectivityIndicator } from '@/components/offline/ConnectivityIndicator';
import { VistoriaCompletionFlow } from '@/components/vistoria/VistoriaCompletionFlow';
import { CompletionNotification } from '@/components/vistoria/CompletionNotification';
import { useVistoriaEditLock } from '@/hooks/useEditLock';
import { LocalVistoriaService, VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { calculateVistoriaProgress } from '@/utils/progressCalculation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  User, 
  FileText, 
  AlertTriangle,
  RefreshCw,
  Save,
  CheckCircle,
  Pause,
  Play,
  Settings,
  Bell,
  X
} from 'lucide-react';

interface VistoriaDetailsProps {
  vistoriaId: string;
}

/**
 * Componente principal para exibir detalhes completos de uma vistoria
 * 
 * Funcionalidades:
 * - Carregamento de dados da vistoria
 * - Exibição de informações gerais
 * - Lista de itens da vistoria
 * - Indicadores de progresso e status
 * - Ações de controle (salvar, pausar, concluir)
 * - Sincronização offline
 */
export function VistoriaDetails({ vistoriaId }: VistoriaDetailsProps) {
  const [vistoria, setVistoria] = useState<VistoriaLocal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showCompletionFlow, setShowCompletionFlow] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // TODO: Integrar com hook de conectividade

  // Hook para bloqueio de edição
  const editLock = useVistoriaEditLock(vistoria);

  // Carregar dados da vistoria
  const carregarVistoria = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [VISTORIA-DETAILS] Tentando carregar vistoria com ID:', vistoriaId);
      
      const localVistoriaService = new LocalVistoriaService();
      
      // DEBUG: Listar todas as vistorias no armazenamento local
      const todasVistorias = await localVistoriaService.obterVistoriasLocais();
      console.log('📊 [DEBUG] Todas as vistorias no armazenamento local:', todasVistorias);
      
      if (todasVistorias.success && todasVistorias.data) {
        console.log('📋 [DEBUG] IDs das vistorias encontradas:', 
          todasVistorias.data.map(v => ({ id: v.id, token: v.token, local: v.local }))
        );
      }

      const result = await localVistoriaService.obterVistoriaPorId(vistoriaId);
      console.log('🔍 [DEBUG] Resultado da busca por ID:', result);

      if (result.success && result.data) {
        setVistoria(result.data);
        setLastUpdate(new Date());
        console.log('✅ [VISTORIA-DETAILS] Vistoria carregada com sucesso:', result.data);
      } else {
        console.error('❌ [VISTORIA-DETAILS] Vistoria não encontrada:', result.error);
        setError(result.error || 'Vistoria não encontrada no histórico local');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar vistoria:', err);
      setError('Erro interno ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [vistoriaId]);

  // Carregar na inicialização
  useEffect(() => {
    if (vistoriaId) {
      carregarVistoria();
    }
  }, [vistoriaId, carregarVistoria]);

  // Atualizar status da vistoria
  const handleUpdateStatus = async (novoStatus: VistoriaLocal['status']) => {
    if (!vistoria) return;

    try {
      setSaving(true);
      
      const localVistoriaService = new LocalVistoriaService();
      const result = await localVistoriaService.atualizarStatusVistoria(vistoria.id, novoStatus);
      
      if (result.success) {
        setVistoria({ ...vistoria, status: novoStatus });
        console.log(`✅ Status atualizado para: ${novoStatus}`);
      } else {
        console.error('❌ Erro ao atualizar status:', result.error);
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar status:', err);
    } finally {
      setSaving(false);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!vistoria) return;

    try {
      setSaving(true);
      
      // TODO: Implementar salvamento real dos dados
      console.log('💾 Salvando alterações da vistoria:', vistoria.id);
      
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastUpdate(new Date());
      console.log('✅ Alterações salvas com sucesso');
    } catch (err) {
      console.error('❌ Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  // Concluir vistoria - agora abre o fluxo de conclusão
  const handleConcluir = () => {
    if (!vistoria) return;
    
    console.log('🎯 [VISTORIA-DETAILS] Iniciando fluxo de conclusão');
    setShowCompletionFlow(true);
  };

  // Callback quando vistoria é atualizada no fluxo de conclusão
  const handleVistoriaUpdated = (vistoriaAtualizada: VistoriaLocal) => {
    console.log('✅ [VISTORIA-DETAILS] Vistoria atualizada:', vistoriaAtualizada);
    setVistoria(vistoriaAtualizada);
    setShowCompletionFlow(false);
    setShowNotification(true);
    setLastUpdate(new Date());
  };

  // Callback para sincronização
  const handleSync = async () => {
    console.log('📤 [VISTORIA-DETAILS] Iniciando sincronização...');
    // TODO: Implementar sincronização real
    alert('Funcionalidade de sincronização será implementada na próxima versão');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted/50 rounded w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted/50 rounded" />
                  <div className="h-4 bg-muted/50 rounded w-3/4" />
                  <div className="h-4 bg-muted/50 rounded w-1/2" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted/50 rounded" />
                  <div className="h-4 bg-muted/50 rounded w-2/3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !vistoria) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            {error || 'Vistoria não encontrada'}
          </h3>
          <Button onClick={carregarVistoria} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se está no fluxo de conclusão, mostrar apenas o fluxo
  if (showCompletionFlow && vistoria) {
    return (
      <VistoriaCompletionFlow
        vistoria={vistoria}
        onVistoriaUpdated={handleVistoriaUpdated}
        onCancel={() => setShowCompletionFlow(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificação de conclusão */}
      {showNotification && vistoria && (
        <CompletionNotification
          vistoria={vistoria}
          onDismiss={() => setShowNotification(false)}
          onSync={handleSync}
          isConnected={isConnected}
        />
      )}

      {/* Header com informações principais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>{vistoria.local}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <StatusBadge status={
                vistoria.status === 'em_andamento' ? 'em_andamento' :
                vistoria.status === 'concluida' ? 'concluida' : 'pendente'
              } />
              <SyncBadge isSynced={vistoria.sincronizada || false} isSyncing={false} showText={false} />
              <ConnectivityIndicator showDetails={false} />
              
              {/* Indicador de bloqueio de edição */}
              {editLock.isLocked && (
                <Badge 
                  variant={editLock.canEdit ? 'secondary' : 'destructive'}
                  className="text-xs"
                  title={editLock.reason || 'Edição bloqueada'}
                >
                  {editLock.canEdit ? '⚠️ Aviso' : '🔒 Bloqueado'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1: Informações básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Informações Gerais</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Agendada:</strong> {new Date(vistoria.dataAgendada).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Acessada:</strong> {new Date(vistoria.dataAcesso).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                {vistoria.tipoVistoria && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      <strong>Tipo:</strong> {vistoria.tipoVistoria}
                    </span>
                  </div>
                )}
                
                {vistoria.tecnicoNome && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Técnico:</strong> {vistoria.tecnicoNome}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Informações do veículo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Veículo</span>
              </h3>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <strong>Modelo:</strong> {vistoria.veiculo.modelo}
                </div>
                <div className="text-sm">
                  <strong>Placa:</strong> {vistoria.veiculo.placa}
                </div>
                {vistoria.veiculo.cor && (
                  <div className="text-sm">
                    <strong>Cor:</strong> {vistoria.veiculo.cor}
                  </div>
                )}
                {vistoria.veiculo.ano && (
                  <div className="text-sm">
                    <strong>Ano:</strong> {vistoria.veiculo.ano}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Ações principais */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Botão Concluir - só aparece quando todos os itens estão concluídos */}
              {vistoria.status !== 'concluida' && (() => {
                const progressInfo = calculateVistoriaProgress(vistoria.itens || []);
                const todosItensConcluidos = progressInfo.percentage === 100;
                
                return todosItensConcluidos ? (
                  <Button
                    onClick={handleConcluir}
                    disabled={saving}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir Vistoria
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Complete todos os itens para finalizar a vistoria
                  </div>
                );
              })()}
              
              {vistoria.status === 'concluida' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Vistoria Concluída</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de itens da vistoria */}
      <VistoriaItemsList 
        vistoriaId={vistoria.id}
        onItemUpdate={() => {
          // NÃO recarregar dados para evitar loop infinito
          // Os dados são gerenciados internamente pelo VistoriaItemsList
          console.log('📝 Item atualizado - sem recarregamento para evitar loop');
        }}
      />
    </div>
  );
} 