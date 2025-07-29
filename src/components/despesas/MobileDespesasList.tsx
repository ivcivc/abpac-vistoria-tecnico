'use client';

/**
 * Lista Mobile de Despesas - Task 5.5
 * Interface mobile-first para visualizar, filtrar, editar e excluir despesas
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Fuel, 
  Utensils, 
  Car, 
  MapPin, 
  Receipt, 
  FileText,
  Plus,
  Filter,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { DespesaService } from '@/services/despesas/DespesaService';
import { DespesaLocal } from '@/services/despesas/DespesaStorageService';
import { useToast } from '@/components/ui/use-toast';

interface MobileDespesasListProps {
  vistoriaId: string;
  token: string;
  onAddDespesa: () => void;
  onEditDespesa: (despesa: DespesaLocal) => void;
  className?: string;
}

// Configuração de tipos de despesa conforme banco de dados
const TIPOS_CONFIG = {
  SERVICO: { 
    label: 'Serviço', 
    icon: Receipt, 
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  MATERIAL: { 
    label: 'Material', 
    icon: FileText, 
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  DESLOCAMENTO: { 
    label: 'Deslocamento', 
    icon: Car, 
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50'
  },
  OUTROS: { 
    label: 'Outros', 
    icon: DollarSign, 
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50'
  }
};

// Configuração de status
const STATUS_CONFIG = {
  local: {
    label: 'Não sincronizada',
    icon: Clock,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  },
  uploading: {
    label: 'Sincronizando',
    icon: Upload,
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  synced: {
    label: 'Sincronizada',
    icon: CheckCircle,
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  error: {
    label: 'Erro na sincronização',
    icon: AlertCircle,
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50'
  }
};

export function MobileDespesasList({
  vistoriaId,
  token,
  onAddDespesa,
  onEditDespesa,
  className = ''
}: MobileDespesasListProps) {
  const [despesas, setDespesas] = useState<DespesaLocal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [despesaDetalhes, setDespesaDetalhes] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { toast } = useToast();

  // Carregar despesas
  const carregarDespesas = async () => {
    try {
      const result = await DespesaService.getDespesasByVistoria(vistoriaId);
      
      if (result.success && result.data) {
        setDespesas(result.data);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao carregar despesas",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar despesas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Carregar despesas na montagem
  useEffect(() => {
    carregarDespesas();
  }, [vistoriaId]);

  // Atualizar lista quando necessário
  const handleRefresh = () => {
    setIsRefreshing(true);
    carregarDespesas();
  };

  // Remover despesa
  const handleRemoverDespesa = async (despesa: DespesaLocal) => {
    if (!confirm(`Deseja realmente remover a despesa "${despesa.descricao}"?`)) {
      return;
    }

    try {
      const result = await DespesaService.removerDespesa(despesa.id, token);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Despesa removida com sucesso",
          variant: "default"
        });
        
        // Atualizar lista
        carregarDespesas();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao remover despesa",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao remover despesa:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover despesa",
        variant: "destructive"
      });
    }
  };

  // Retry sincronização
  const handleRetrySinc = async (despesa: DespesaLocal) => {
    try {
      const result = await DespesaService.retrySyncDespesa(despesa.id, token);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Despesa sincronizada com sucesso",
          variant: "default"
        });
        
        carregarDespesas();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro na sincronização",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro no retry:', error);
      toast({
        title: "Erro",
        description: "Erro no retry de sincronização",
        variant: "destructive"
      });
    }
  };

  // Filtrar despesas
  const despesasFiltradas = despesas.filter(despesa => {
    const passaTipo = filtroTipo === 'todos' || despesa.tipo === filtroTipo;
    const passaStatus = filtroStatus === 'todos' || despesa.status === filtroStatus;
    return passaTipo && passaStatus;
  });

  // Calcular totais
  const totalGeral = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalFiltrado = despesasFiltradas.reduce((sum, d) => sum + d.valor, 0);

  // Formatar valor monetário
  const formatMoney = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-3" />
          <span className="text-gray-600">Carregando despesas...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com resumo */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Despesas da Vistoria
          </h3>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {formatMoney(totalGeral)}
            </div>
            <div className="text-sm text-gray-600">Total Geral</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">
              {despesas.length}
            </div>
            <div className="text-sm text-gray-600">Despesas</div>
          </div>
        </div>
      </Card>

      {/* Controles */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={onAddDespesa}
          className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
        
        <Button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          variant="outline"
          className="h-12 px-3"
        >
          <Filter className="h-4 w-4 mr-1" />
          {mostrarFiltros ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filtros expansíveis */}
      {mostrarFiltros && (
        <Card className="p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filtrar por tipo:
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="todos">Todos os tipos</option>
              {Object.entries(TIPOS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Filtrar por status:
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="todos">Todos os status</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {(filtroTipo !== 'todos' || filtroStatus !== 'todos') && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {despesasFiltradas.length} de {despesas.length} despesas
                </span>
                <span className="font-medium text-gray-800">
                  {formatMoney(totalFiltrado)}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Lista de despesas */}
      {despesasFiltradas.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {despesas.length === 0 ? 'Nenhuma despesa cadastrada' : 'Nenhuma despesa encontrada'}
          </h3>
          <p className="text-gray-500 mb-4">
            {despesas.length === 0 
              ? 'Adicione suas despesas de combustível, alimentação e outras.'
              : 'Ajuste os filtros para encontrar as despesas desejadas.'
            }
          </p>
          {despesas.length === 0 && (
            <Button onClick={onAddDespesa} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Despesa
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {despesasFiltradas.map((despesa) => {
            const tipoConfig = TIPOS_CONFIG[despesa.tipo as keyof typeof TIPOS_CONFIG] || TIPOS_CONFIG.outros;
            const statusConfig = STATUS_CONFIG[despesa.status];
            const TipoIcon = tipoConfig.icon;
            const StatusIcon = statusConfig.icon;
            const isExpanded = despesaDetalhes === despesa.id;

            return (
              <Card key={despesa.id} className="overflow-hidden">
                {/* Header do card */}
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${tipoConfig.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <TipoIcon className="h-5 w-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-800">
                          {tipoConfig.label}
                        </span>
                        <Badge 
                          className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 text-xs`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="text-2xl font-bold text-gray-800">
                        {formatMoney(despesa.valor)}
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {despesa.descricao}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <Button
                        onClick={() => setDespesaDetalhes(isExpanded ? null : despesa.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <div className="text-xs text-gray-500">
                        {formatDate(despesa.data)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes expansíveis */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="space-y-3">
                      {/* Informações da despesa */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Data:</span>
                          <div className="font-medium">{formatDate(despesa.data)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Criado em:</span>
                          <div className="font-medium">
                            {new Date(despesa.timestamp).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      {/* Descrição completa */}
                      <div>
                        <span className="text-gray-500 text-sm">Descrição:</span>
                        <p className="text-gray-800 mt-1">{despesa.descricao}</p>
                      </div>

                      {/* Comprovantes */}
                      {despesa.comprovantes.length > 0 && (
                        <div>
                          <span className="text-gray-500 text-sm">Comprovantes:</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {despesa.comprovantes.length} arquivo(s)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Erro de sincronização */}
                      {despesa.status === 'error' && despesa.ultimoErroUpload && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-700">
                            <strong>Erro:</strong> {despesa.ultimoErroUpload}
                          </p>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          onClick={() => onEditDespesa(despesa)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        
                        {despesa.status === 'error' && (
                          <Button
                            onClick={() => handleRetrySinc(despesa)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Tentar Novamente
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => handleRemoverDespesa(despesa)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}