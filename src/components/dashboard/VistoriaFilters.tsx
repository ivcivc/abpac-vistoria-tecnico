'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { Search, Filter, X, Calendar, MapPin, User, RotateCcw } from 'lucide-react';

export interface VistoriaFilters {
  busca: string;
  status: VistoriaLocal['status'][];
  dataInicio?: string;
  dataFim?: string;
  local?: string;
  tecnico?: string;
}

interface VistoriaFiltersProps {
  vistorias: VistoriaLocal[];
  onFiltersChange: (filteredVistorias: VistoriaLocal[]) => void;
  className?: string;
}

/**
 * Componente de filtros avançados para o dashboard de vistorias
 *
 * Funcionalidades:
 * - Busca por texto (local, placa, modelo)
 * - Filtro por status (múltipla seleção)
 * - Filtro por data (período)
 * - Filtro por técnico
 * - Reset de filtros
 * - Contador de resultados
 */
export function VistoriaFiltersComponent({
  vistorias,
  onFiltersChange,
  className = '',
}: VistoriaFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<VistoriaFilters>({
    busca: '',
    status: [],
    dataInicio: '',
    dataFim: '',
    local: '',
    tecnico: '',
  });

  const [vistoriasFiltradas, setVistoriasFiltradas] = useState<VistoriaLocal[]>(vistorias);

  // Opções de status disponíveis
  const statusOptions = [
    { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
    { value: 'concluida', label: 'Concluída', color: 'bg-green-100 text-green-800' },
    { value: 'pausada', label: 'Pausada', color: 'bg-yellow-100 text-yellow-800' },
  ] as const;

  // Lista de técnicos únicos
  const tecnicosDisponiveis = [...new Set(vistorias.map(v => v.tecnicoNome))].filter(Boolean);

  // Lista de locais únicos
  const locaisDisponiveis = [...new Set(vistorias.map(v => v.local))].filter(Boolean);

  /**
   * Aplica todos os filtros às vistorias
   */
  const aplicarFiltros = (filtrosAtivos: VistoriaFilters): VistoriaLocal[] => {
    let resultado = [...vistorias];

    // Filtro de busca (local, placa, modelo)
    if (filtrosAtivos.busca.trim()) {
      const termoBusca = filtrosAtivos.busca.toLowerCase().trim();
      resultado = resultado.filter(
        vistoria =>
          vistoria.local.toLowerCase().includes(termoBusca) ||
          vistoria.veiculo.placa.toLowerCase().includes(termoBusca) ||
          vistoria.veiculo.modelo.toLowerCase().includes(termoBusca) ||
          vistoria.tecnicoNome?.toLowerCase().includes(termoBusca)
      );
    }

    // Filtro de status
    if (filtrosAtivos.status.length > 0) {
      resultado = resultado.filter(vistoria => filtrosAtivos.status.includes(vistoria.status));
    }

    // Filtro de data início
    if (filtrosAtivos.dataInicio) {
      const dataInicio = new Date(filtrosAtivos.dataInicio);
      resultado = resultado.filter(vistoria => new Date(vistoria.dataAgendada) >= dataInicio);
    }

    // Filtro de data fim
    if (filtrosAtivos.dataFim) {
      const dataFim = new Date(filtrosAtivos.dataFim);
      dataFim.setHours(23, 59, 59, 999); // Final do dia
      resultado = resultado.filter(vistoria => new Date(vistoria.dataAgendada) <= dataFim);
    }

    // Filtro de local
    if (filtrosAtivos.local) {
      resultado = resultado.filter(vistoria => vistoria.local === filtrosAtivos.local);
    }

    // Filtro de técnico
    if (filtrosAtivos.tecnico) {
      resultado = resultado.filter(vistoria => vistoria.tecnicoNome === filtrosAtivos.tecnico);
    }

    return resultado;
  };

  /**
   * Atualiza os filtros e aplica
   */
  const atualizarFiltros = (novosFiltros: Partial<VistoriaFilters>) => {
    const filtrosAtualizados = { ...filters, ...novosFiltros };
    setFilters(filtrosAtualizados);

    const resultados = aplicarFiltros(filtrosAtualizados);
    setVistoriasFiltradas(resultados);
    onFiltersChange(resultados);
  };

  /**
   * Reset todos os filtros
   */
  const resetarFiltros = () => {
    const filtrosVazios: VistoriaFilters = {
      busca: '',
      status: [],
      dataInicio: '',
      dataFim: '',
      local: '',
      tecnico: '',
    };
    setFilters(filtrosVazios);
    setVistoriasFiltradas(vistorias);
    onFiltersChange(vistorias);
  };

  /**
   * Toggle status no filtro múltiplo
   */
  const toggleStatus = (status: VistoriaLocal['status']) => {
    const novosStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];

    atualizarFiltros({ status: novosStatus });
  };

  /**
   * Verifica se há filtros ativos
   */
  const hasActiveFilters = () => {
    return (
      filters.busca.trim() !== '' ||
      filters.status.length > 0 ||
      filters.dataInicio !== '' ||
      filters.dataFim !== '' ||
      filters.local !== '' ||
      filters.tecnico !== ''
    );
  };

  // Atualizar quando as vistorias mudarem
  useEffect(() => {
    if (!hasActiveFilters()) {
      setVistoriasFiltradas(vistorias);
      onFiltersChange(vistorias);
    } else {
      const resultados = aplicarFiltros(filters);
      setVistoriasFiltradas(resultados);
      onFiltersChange(resultados);
    }
  }, [vistorias]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de busca principal e toggle de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por local, placa, modelo ou técnico..."
            value={filters.busca}
            onChange={e => atualizarFiltros({ busca: e.target.value })}
            className="pl-10 h-12"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-12 px-4"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters() && (
              <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 text-xs flex items-center justify-center">
                !
              </span>
            )}
          </Button>

          {hasActiveFilters() && (
            <Button variant="ghost" onClick={resetarFiltros} className="h-12 px-4">
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Resultado da busca */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {vistoriasFiltradas.length === vistorias.length
            ? `${vistorias.length} vistorias`
            : `${vistoriasFiltradas.length} de ${vistorias.length} vistorias`}
        </span>

        {hasActiveFilters() && (
          <span className="flex items-center">
            <Filter className="h-3 w-3 mr-1" />
            Filtros ativos
          </span>
        )}
      </div>

      {/* Painel de filtros avançados */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros Avançados
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filtro de Status */}
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center">
                <div className="w-2 h-2 bg-current rounded-full mr-2" />
                Status da Vistoria
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleStatus(option.value)}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium border-2 transition-all
                      ${
                        filters.status.includes(option.value)
                          ? `${option.color} border-current`
                          : 'bg-background hover:bg-muted border-border'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros de Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filters.dataInicio}
                  onChange={e => atualizarFiltros({ dataInicio: e.target.value })}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filters.dataFim}
                  onChange={e => atualizarFiltros({ dataFim: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            {/* Filtros de Local e Técnico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Local
                </label>
                <select
                  value={filters.local}
                  onChange={e => atualizarFiltros({ local: e.target.value })}
                  className="h-10 w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Todos os locais</option>
                  {locaisDisponiveis.map(local => (
                    <option key={local} value={local}>
                      {local}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Técnico
                </label>
                <select
                  value={filters.tecnico}
                  onChange={e => atualizarFiltros({ tecnico: e.target.value })}
                  className="h-10 w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Todos os técnicos</option>
                  {tecnicosDisponiveis.map(tecnico => (
                    <option key={tecnico} value={tecnico}>
                      {tecnico}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
