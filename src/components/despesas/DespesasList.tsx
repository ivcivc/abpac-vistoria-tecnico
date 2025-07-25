'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Despesa } from '@/types/storage';
import { 
  Receipt, 
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Calculator
} from 'lucide-react';

interface DespesasListProps {
  despesas: Despesa[];
  showItemGrouping?: boolean;
  showFilters?: boolean;
  onEditDespesa?: (despesa: Despesa) => void;
  readOnly?: boolean;
}

interface DespesaAgrupada {
  itemId: string;
  itemNome?: string;
  despesas: Despesa[];
  total: number;
}

interface TotaisPorTipo {
  SERVICO: number;
  MATERIAL: number;
  DESLOCAMENTO: number;
  OUTROS: number;
}

interface EstatisticasDespesas {
  totalGeral: number;
  totalPorTipo: TotaisPorTipo;
  quantidadePorTipo: TotaisPorTipo;
  mediaValor: number;
  despesaMaiorValor: Despesa | null;
  itensComDespesas: number;
  despesasAprovadas: number;
  despesasPendentes: number;
}

const TIPOS_CONFIG = {
  SERVICO: { label: 'Serviço', icon: '🔧', color: 'bg-blue-100 text-blue-800' },
  MATERIAL: { label: 'Material', icon: '📦', color: 'bg-green-100 text-green-800' },
  DESLOCAMENTO: { label: 'Deslocamento', icon: '🚗', color: 'bg-orange-100 text-orange-800' },
  OUTROS: { label: 'Outros', icon: '📄', color: 'bg-gray-100 text-gray-800' }
};

export function DespesasList({
  despesas,
  showItemGrouping = true,
  showFilters = true,
  onEditDespesa,
  readOnly = false
}: DespesasListProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [mostrarApenas, setMostrarApenas] = useState<'todas' | 'aprovadas' | 'pendentes'>('todas');
  const [mostrarDetalhes, setMostrarDetalhes] = useState<boolean>(true);
  
  // Função para formatar valor monetário
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filtrar despesas
  const despesasFiltradas = useMemo(() => {
    return despesas.filter(despesa => {
      const matchTipo = !filtroTipo || despesa.tipo === filtroTipo;
      const matchTexto = !filtroTexto || 
        despesa.descricao.toLowerCase().includes(filtroTexto.toLowerCase());
      const matchStatus = mostrarApenas === 'todas' || 
        (mostrarApenas === 'aprovadas' && despesa.aprovada) ||
        (mostrarApenas === 'pendentes' && !despesa.aprovada);
      
      return matchTipo && matchTexto && matchStatus;
    });
  }, [despesas, filtroTipo, filtroTexto, mostrarApenas]);

  // Agrupar despesas por item
  const despesasAgrupadas = useMemo((): DespesaAgrupada[] => {
    const grupos = despesasFiltradas.reduce((acc, despesa) => {
      if (!acc[despesa.itemId]) {
        acc[despesa.itemId] = {
          itemId: despesa.itemId,
          itemNome: `Item ${despesa.itemId.slice(-8)}`, // Usar últimos 8 chars como nome
          despesas: [],
          total: 0
        };
      }
      acc[despesa.itemId].despesas.push(despesa);
      acc[despesa.itemId].total += despesa.valor;
      return acc;
    }, {} as Record<string, DespesaAgrupada>);

    return Object.values(grupos).sort((a, b) => b.total - a.total);
  }, [despesasFiltradas]);

  // Calcular estatísticas
  const estatisticas = useMemo((): EstatisticasDespesas => {
    const totalPorTipo: TotaisPorTipo = {
      SERVICO: 0,
      MATERIAL: 0,
      DESLOCAMENTO: 0,
      OUTROS: 0
    };
    
    const quantidadePorTipo: TotaisPorTipo = {
      SERVICO: 0,
      MATERIAL: 0,
      DESLOCAMENTO: 0,
      OUTROS: 0
    };

    let totalGeral = 0;
    let despesaMaiorValor: Despesa | null = null;
    let despesasAprovadas = 0;

    despesasFiltradas.forEach(despesa => {
      totalGeral += despesa.valor;
      totalPorTipo[despesa.tipo] += despesa.valor;
      quantidadePorTipo[despesa.tipo]++;
      
      if (!despesaMaiorValor || despesa.valor > despesaMaiorValor.valor) {
        despesaMaiorValor = despesa;
      }
      
      if (despesa.aprovada) {
        despesasAprovadas++;
      }
    });

    return {
      totalGeral,
      totalPorTipo,
      quantidadePorTipo,
      mediaValor: despesasFiltradas.length > 0 ? totalGeral / despesasFiltradas.length : 0,
      despesaMaiorValor,
      itensComDespesas: despesasAgrupadas.length,
      despesasAprovadas,
      despesasPendentes: despesasFiltradas.length - despesasAprovadas
    };
  }, [despesasFiltradas, despesasAgrupadas.length]);

  // Limpar filtros
  const limparFiltros = () => {
    setFiltroTipo('');
    setFiltroTexto('');
    setMostrarApenas('todas');
  };

  return (
    <div className="space-y-6">
      {/* Card de Estatísticas Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Resumo Financeiro
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              {despesasFiltradas.length} despesa{despesasFiltradas.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Geral */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Total Geral</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(estatisticas.totalGeral)}
              </p>
            </div>

            {/* Média por Despesa */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Média</span>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(estatisticas.mediaValor)}
              </p>
            </div>

            {/* Itens com Despesas */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Itens</span>
              </div>
              <p className="text-lg font-bold text-purple-900">
                {estatisticas.itensComDespesas}
              </p>
            </div>

            {/* Status Aprovação */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Aprovadas</span>
              </div>
              <p className="text-lg font-bold text-yellow-900">
                {estatisticas.despesasAprovadas}/{despesasFiltradas.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totais por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Despesas por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(TIPOS_CONFIG).map(([tipo, config]) => (
              <div key={tipo} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">{config.icon}</span>
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <Badge className={config.color}>
                    {estatisticas.quantidadePorTipo[tipo as keyof TotaisPorTipo]}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(estatisticas.totalPorTipo[tipo as keyof TotaisPorTipo])}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                className="flex items-center gap-1"
              >
                {mostrarDetalhes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {mostrarDetalhes ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
          </CardHeader>
          {mostrarDetalhes && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por Tipo */}
                <div>
                  <Label>Tipo de Despesa</Label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os tipos</option>
                    {Object.entries(TIPOS_CONFIG).map(([tipo, config]) => (
                      <option key={tipo} value={tipo}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Texto */}
                <div>
                  <Label>Buscar na Descrição</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                      placeholder="Digite para buscar..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtro por Status */}
                <div>
                  <Label>Status de Aprovação</Label>
                  <select
                    value={mostrarApenas}
                    onChange={(e) => setMostrarApenas(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todas">Todas as despesas</option>
                    <option value="aprovadas">Apenas aprovadas</option>
                    <option value="pendentes">Apenas pendentes</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limparFiltros}
                  className="flex items-center gap-1"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Listagem das Despesas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {showItemGrouping ? 'Despesas por Item' : 'Lista de Despesas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {despesasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Nenhuma despesa encontrada com os filtros aplicados</p>
              {(filtroTipo || filtroTexto || mostrarApenas !== 'todas') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={limparFiltros}
                  className="mt-2"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : showItemGrouping ? (
            // Visualização agrupada por item
            <div className="space-y-6">
              {despesasAgrupadas.map((grupo) => (
                <div key={grupo.itemId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      {grupo.itemNome}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-100 text-gray-800 text-xs">
                        {grupo.despesas.length} despesa{grupo.despesas.length !== 1 ? 's' : ''}
                      </Badge>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(grupo.total)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {grupo.despesas.map((despesa) => (
                      <div
                        key={despesa.id}
                        className="p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="outline" 
                                className={TIPOS_CONFIG[despesa.tipo].color}
                              >
                                {TIPOS_CONFIG[despesa.tipo].icon} {TIPOS_CONFIG[despesa.tipo].label}
                              </Badge>
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(despesa.valor)}
                              </span>
                              {despesa.aprovada && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Aprovada
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              {despesa.descricao}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(despesa.timestamp).toLocaleString('pt-BR')}
                            </p>
                            {despesa.comprovante && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">
                                📎 Comprovante anexado
                              </Badge>
                            )}
                          </div>
                          {onEditDespesa && !readOnly && !despesa.aprovada && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditDespesa(despesa)}
                              className="ml-2"
                            >
                              Editar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Visualização em lista simples
            <div className="space-y-3">
              {despesasFiltradas.map((despesa) => (
                <div
                  key={despesa.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={TIPOS_CONFIG[despesa.tipo].color}
                        >
                          {TIPOS_CONFIG[despesa.tipo].icon} {TIPOS_CONFIG[despesa.tipo].label}
                        </Badge>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(despesa.valor)}
                        </span>
                        {despesa.aprovada && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Aprovada
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {despesa.descricao}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Item: {despesa.itemId.slice(-8)}</span>
                        <span>{new Date(despesa.timestamp).toLocaleString('pt-BR')}</span>
                        {despesa.comprovante && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            📎 Comprovante
                          </Badge>
                        )}
                      </div>
                    </div>
                    {onEditDespesa && !readOnly && !despesa.aprovada && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditDespesa(despesa)}
                        className="ml-2"
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 