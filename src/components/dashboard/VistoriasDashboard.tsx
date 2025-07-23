'use client';

import { useState, useEffect } from 'react';
import { VistoriaCard } from '@/components/dashboard/VistoriaCard';
import { VistoriaFiltersComponent } from '@/components/dashboard/VistoriaFilters';
import { ProgressIndicator } from '@/components/vistoria/ProgressIndicator';
import { StatusBadge } from '@/components/vistoria/StatusBadge';
import { SyncBadge } from '@/components/vistoria/SyncBadge';
import { ConnectivityIndicator } from '@/components/offline/ConnectivityIndicator';
import { LocalVistoriaService, VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { calculateProgressFromStatus } from '@/utils/progressCalculation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Filter, 
  BarChart3, 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface VistoriasDashboardProps {
  className?: string;
}

/**
 * Dashboard principal de vistorias com indicadores de progresso e status
 *
 * Funcionalidades:
 * - Carregamento e exibição de vistorias locais
 * - Indicadores de progresso em tempo real
 * - Estatísticas visuais com badges
 * - Filtros avançados
 * - Ações de sincronização
 * - Responsivo e acessível
 */
export function VistoriasDashboard({ className = '' }: VistoriasDashboardProps) {
  const [vistorias, setVistorias] = useState<VistoriaLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const localVistoriaService = new LocalVistoriaService();

  // Carregar vistorias
  const carregarVistorias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await localVistoriaService.obterVistoriasLocais();
      
      if (result.success) {
        setVistorias(result.data || []);
        setLastUpdate(new Date());
        console.log(`📊 ${result.data?.length || 0} vistorias carregadas`);
      } else {
        setError(result.error || 'Erro ao carregar vistorias');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar vistorias:', err);
      setError('Erro interno ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    carregarVistorias();
  }, []);

  // Calcular estatísticas
  const estatisticas = {
    total: vistorias.length,
    emAndamento: vistorias.filter(v => v.status === 'em_andamento').length,
    concluidas: vistorias.filter(v => v.status === 'concluida').length,
    pausadas: vistorias.filter(v => v.status === 'pausada').length,
  };

  // Calcular progresso geral
  const progressoGeral = estatisticas.total > 0 
    ? Math.round((estatisticas.concluidas / estatisticas.total) * 100)
    : 0;

  // Atualizar status de vistoria
  const handleUpdateStatus = async (vistoriaId: string, novoStatus: VistoriaLocal['status']) => {
    try {
      const result = await localVistoriaService.atualizarStatusVistoria(vistoriaId, novoStatus);
      
      if (result.success) {
        // Recarregar vistorias para refletir mudanças
        await carregarVistorias();
        console.log(`✅ Status da vistoria ${vistoriaId} atualizado para: ${novoStatus}`);
      } else {
        console.error('❌ Erro ao atualizar status:', result.error);
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar status:', err);
    }
  };

  // Abrir vistoria - navegar para página de detalhes
  const handleOpenVistoria = (vistoriaId: string) => {
    console.log('🔍 Navegando para detalhes da vistoria:', vistoriaId);
    // Navegar para a página de detalhes
    window.location.href = `/vistoria/${vistoriaId}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton para estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted/50 rounded animate-pulse" />
                  <div className="h-8 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 bg-muted/50 rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton para vistorias */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted/50 rounded animate-pulse" />
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                  <div className="h-16 bg-muted/50 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Erro ao carregar dados</span>
          </div>
          <p className="text-red-600 mt-2">{error}</p>
          <Button 
            onClick={carregarVistorias}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com conectividade e ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Vistorias</h2>
          <p className="text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <ConnectivityIndicator showDetails={false} />
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            onClick={carregarVistorias}
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas com Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vistorias</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <div className="mt-2">
              <ProgressIndicator 
                value={progressoGeral}
                variant="minimal"
                size="sm"
                showLabel={false}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progressoGeral}% concluídas
            </p>
          </CardContent>
        </Card>

        {/* Em Andamento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estatisticas.emAndamento}</div>
            <div className="flex items-center mt-2">
              <StatusBadge status="em_andamento" showText={false} />
              <span className="text-xs text-muted-foreground ml-2">ativas</span>
            </div>
          </CardContent>
        </Card>

        {/* Concluídas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.concluidas}</div>
            <div className="flex items-center mt-2">
              <StatusBadge status="concluida" showText={false} />
              <span className="text-xs text-muted-foreground ml-2">finalizadas</span>
            </div>
          </CardContent>
        </Card>

        {/* Pausadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pausadas</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.pausadas}</div>
            <div className="flex items-center mt-2">
              <StatusBadge status="pendente" showText={false} />
              <span className="text-xs text-muted-foreground ml-2">aguardando</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicador de Progresso Geral */}
      {estatisticas.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Progresso Geral</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressIndicator 
              value={progressoGeral}
              label="Conclusão das Vistorias"
              description={`${estatisticas.concluidas} de ${estatisticas.total} vistorias concluídas`}
              variant="detailed"
              size="lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Filtros (se ativo) */}
      {showFilters && (
        <VistoriaFiltersComponent
          vistorias={vistorias}
          onFiltersChange={(filtradas) => {
            // TODO: Implementar filtragem
            console.log('Vistorias filtradas:', filtradas.length);
          }}
        />
      )}

      {/* Lista de Vistorias */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Vistorias Recentes ({vistorias.length})
          </h3>
          {vistorias.length > 0 && (
            <div className="flex items-center space-x-2">
              <SyncBadge isSynced={true} isSyncing={false} />
              <span className="text-sm text-muted-foreground">Sincronizado</span>
            </div>
          )}
        </div>

        {vistorias.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma vistoria encontrada</h3>
              <p className="text-muted-foreground mb-4">
                As vistorias acessadas neste dispositivo aparecerão aqui.
              </p>
              <Button onClick={carregarVistorias} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {vistorias.map((vistoria) => (
              <VistoriaCard
                key={vistoria.id}
                vistoria={vistoria}
                onOpenVistoria={handleOpenVistoria}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 