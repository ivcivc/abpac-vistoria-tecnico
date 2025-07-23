'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressIndicator } from '@/components/vistoria/ProgressIndicator';
import { StatusBadge } from '@/components/vistoria/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Settings,
  Camera,
  FileText,
  Plus,
  ChevronRight
} from 'lucide-react';

interface VistoriaItem {
  id: string;
  tipo: string;
  categoria: string;
  fabricante: string;
  numeroSerie: string;
  status: 'pendente' | 'concluido' | 'problema';
  acao: 'verificar' | 'instalar' | 'substituir' | 'remover';
  observacoes?: string;
  progresso: number; // 0-100
}

interface VistoriaItemsListProps {
  vistoriaId: string;
  onItemUpdate?: () => void;
}

/**
 * Componente para listar e gerenciar itens de uma vistoria
 * 
 * Funcionalidades:
 * - Lista todos os itens da vistoria
 * - Exibe status e progresso de cada item
 * - Permite ações nos itens (verificar, instalar, etc.)
 * - Indicadores visuais de progresso
 * - Filtros por status
 */
export function VistoriaItemsList({ vistoriaId, onItemUpdate }: VistoriaItemsListProps) {
  const router = useRouter();
  const [itens, setItens] = useState<VistoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Carregar dados reais da vistoria
  useEffect(() => {
    const carregarItens = async () => {
      try {
        setLoading(true);
        console.log('📋 [ITENS-LIST] Carregando itens para vistoria ID:', vistoriaId);
        
        const localService = new LocalVistoriaService();
        const result = await localService.obterVistoriaPorId(vistoriaId);
        
        if (result.success && result.data) {
          console.log('✅ [ITENS-LIST] Vistoria carregada:', result.data);
          console.log('📦 [ITENS-LIST] Itens encontrados:', result.data.itens);
          
          // Mapear itens do backend para o formato esperado
          const itensFormatados = (result.data.itens || []).map((item: any, index: number) => ({
            id: item.id || String(index + 1),
            tipo: item.tipo || item.categoria?.descricao || item.categoria?.nome || 'Item de Vistoria',
            categoria: item.categoria?.descricao || item.categoria?.nome || 'Categoria não informada',
            fabricante: item.fabricante?.nome || 'ABPAC',
            numeroSerie: item.numero_serie || item.numeroSerie || 'N/A',
            status: item.status || 'pendente',
            acao: item.acao || 'INSTALAR',
            observacoes: item.observacoes || '',
            progresso: item.status === 'concluido' ? 100 : item.status === 'problema' ? 25 : 0
          }));
          
          console.log('🔄 [ITENS-LIST] Itens formatados:', itensFormatados);
          setItens(itensFormatados);
        } else {
          console.error('❌ [ITENS-LIST] Erro ao carregar vistoria:', result.error);
          setItens([]);
        }
      } catch (error) {
        console.error('❌ [ITENS-LIST] Erro ao carregar itens:', error);
        setItens([]);
      } finally {
        setLoading(false);
      }
    };

    if (vistoriaId) {
      carregarItens();
    }
  }, [vistoriaId]);

  const itensFiltrados = itens.filter(item => {
    if (filtroStatus === 'todos') return true;
    return item.status === filtroStatus;
  });

  const estatisticas = {
    total: itens.length,
    concluidos: itens.filter(i => i.status === 'concluido').length,
    pendentes: itens.filter(i => i.status === 'pendente').length,
    problemas: itens.filter(i => i.status === 'problema').length,
    progressoGeral: itens.length > 0 
      ? Math.round(itens.reduce((acc, item) => acc + item.progresso, 0) / itens.length)
      : 0
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'problema':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getAcaoLabel = (acao: string) => {
    switch (acao) {
      case 'instalar':
        return 'Instalar';
      case 'verificar':
        return 'Verificar';
      case 'substituir':
        return 'Substituir';
      case 'remover':
        return 'Remover';
      default:
        return acao;
    }
  };

  const handleItemAction = (itemId: string, acao: string) => {
    console.log(`Ação ${acao} no item ${itemId}`);
    // TODO: Implementar ações reais
    if (onItemUpdate) {
      onItemUpdate();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Itens da Vistoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-muted/50 rounded w-1/2" />
                  <div className="h-4 bg-muted/50 rounded w-3/4" />
                  <div className="h-3 bg-muted/50 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Itens da Vistoria ({itens.length})</span>
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progresso Geral dos Itens */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <ProgressIndicator 
            value={estatisticas.progressoGeral}
            label="Progresso dos Itens"
            description={`${estatisticas.concluidos} de ${estatisticas.total} itens concluídos`}
            variant="detailed"
            size="md"
          />
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{estatisticas.concluidos}</div>
            <div className="text-sm text-muted-foreground">Concluídos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{estatisticas.problemas}</div>
            <div className="text-sm text-muted-foreground">Problemas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Filtrar por:</span>
          {['todos', 'pendente', 'concluido', 'problema'].map((status) => (
            <Button
              key={status}
              variant={filtroStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroStatus(status)}
            >
              {status === 'todos' ? 'Todos' : 
               status === 'pendente' ? 'Pendentes' :
               status === 'concluido' ? 'Concluídos' : 'Problemas'}
            </Button>
          ))}
        </div>

        {/* Lista de Itens */}
        <div className="space-y-4">
          {itensFiltrados.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
              <div className="space-y-4">
                {/* Header do item */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <h4 className="font-semibold">{item.tipo}</h4>
                      <Badge variant="outline">{getAcaoLabel(item.acao)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fabricante: {item.fabricante}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nº Série: {item.numeroSerie}
                    </p>
                  </div>
                  <StatusBadge 
                    status={
                      item.status === 'concluido' ? 'concluida' :
                      item.status === 'problema' ? 'rejeitada' : 'pendente'
                    }
                  />
                </div>

                {/* Progresso do item */}
                <ProgressIndicator 
                  value={item.progresso}
                  variant="minimal"
                  size="sm"
                  showLabel={false}
                />

                {/* Observações */}
                {item.observacoes && (
                  <div className="flex items-start space-x-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{item.observacoes}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/vistoria/${vistoriaId}/item/${item.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleItemAction(item.id, 'evidencia')}
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Evidência
                    </Button>
                  </div>
                  
                  {item.status === 'pendente' && (
                    <Button
                      size="sm"
                      onClick={() => handleItemAction(item.id, 'concluir')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {itensFiltrados.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
            <p className="text-muted-foreground">
              {filtroStatus === 'todos' 
                ? 'Esta vistoria não possui itens cadastrados.'
                : `Não há itens com status "${filtroStatus}".`
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 