/**
 * Serviço para listagem e totalização de despesas
 * Task 18 - Integração com endpoints reais de despesas
 */

import { Despesa } from '@/types/storage';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { DespesaService, DespesaBackend } from './DespesaService';

export interface DespesasListOptions {
  vistoriaId?: string | number;
  itemId?: string | number;
  tipoFiltro?: 'SERVICO' | 'MATERIAL' | 'DESLOCAMENTO' | 'OUTROS' | '';
  textoFiltro?: string;
  statusFiltro?: 'todas' | 'aprovadas' | 'pendentes';
}

export interface DespesasTotais {
  totalGeral: number;
  totalPorTipo: {
    SERVICO: number;
    MATERIAL: number;
    DESLOCAMENTO: number;
    OUTROS: number;
  };
  quantidadePorTipo: {
    SERVICO: number;
    MATERIAL: number;
    DESLOCAMENTO: number;
    OUTROS: number;
  };
  mediaValor: number;
  despesaMaiorValor: Despesa | null;
  itensComDespesas: number;
  despesasAprovadas: number;
  despesasPendentes: number;
}

export interface DespesasAgrupadas {
  itemId: string;
  itemNome?: string;
  despesas: Despesa[];
  total: number;
}

export interface DespesasListResponse {
  success: boolean;
  despesas?: Despesa[];
  despesasAgrupadas?: DespesasAgrupadas[];
  totais?: DespesasTotais;
  error?: string;
}

export class DespesasListService {
  /**
   * Obtém despesas de uma vistoria com opções de filtragem
   */
  static async obterDespesas(
    options: DespesasListOptions,
    token?: string
  ): Promise<DespesasListResponse> {
    try {
      console.log('🔄 DespesasListService: Obtendo despesas com opções', options);

      if (!options.vistoriaId) {
        console.warn('⚠️ DespesasListService: ID da vistoria não informado');
        return {
          success: false,
          error: 'ID da vistoria não informado'
        };
      }

      if (!token) {
        console.warn('⚠️ DespesasListService: Token de autenticação não fornecido');
        return {
          success: false,
          error: 'Token de autenticação não fornecido'
        };
      }

      // Obter despesas do backend usando o DespesaService existente
      const result = await DespesaService.obterDespesas(options.vistoriaId, token);

      if (!result.success || !result.despesas) {
        console.error('❌ DespesasListService: Erro ao obter despesas', result.error);
        return {
          success: false,
          error: result.error || 'Erro ao obter despesas da vistoria'
        };
      }

      // Converter despesas do formato backend para frontend
      const despesas = result.despesas.map(d => DespesaService.convertFromBackend(d));

      // Aplicar filtros
      const despesasFiltradas = this.filtrarDespesas(despesas, options);

      // Calcular totais
      const totais = this.calcularTotais(despesasFiltradas);

      // Agrupar por item
      const despesasAgrupadas = this.agruparPorItem(despesasFiltradas);

      console.log('✅ DespesasListService: Despesas processadas com sucesso', {
        total: despesasFiltradas.length,
        grupos: despesasAgrupadas.length
      });

      return {
        success: true,
        despesas: despesasFiltradas,
        despesasAgrupadas,
        totais
      };
    } catch (error) {
      console.error('❌ DespesasListService: Erro ao processar despesas', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar despesas'
      };
    }
  }

  /**
   * Filtra despesas com base nas opções fornecidas
   */
  static filtrarDespesas(despesas: Despesa[], options: DespesasListOptions): Despesa[] {
    return despesas.filter(despesa => {
      // Filtrar por item específico
      if (options.itemId && despesa.itemId !== options.itemId.toString()) {
        return false;
      }

      // Filtrar por tipo
      if (options.tipoFiltro && despesa.tipo !== options.tipoFiltro) {
        return false;
      }

      // Filtrar por texto na descrição
      if (options.textoFiltro && !despesa.descricao.toLowerCase().includes(options.textoFiltro.toLowerCase())) {
        return false;
      }

      // Filtrar por status de aprovação
      if (options.statusFiltro === 'aprovadas' && !despesa.aprovada) {
        return false;
      }
      if (options.statusFiltro === 'pendentes' && despesa.aprovada) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calcula totais e estatísticas das despesas
   */
  static calcularTotais(despesas: Despesa[]): DespesasTotais {
    const totalPorTipo = {
      SERVICO: 0,
      MATERIAL: 0,
      DESLOCAMENTO: 0,
      OUTROS: 0
    };

    const quantidadePorTipo = {
      SERVICO: 0,
      MATERIAL: 0,
      DESLOCAMENTO: 0,
      OUTROS: 0
    };

    let totalGeral = 0;
    let despesaMaiorValor: Despesa | null = null;
    let despesasAprovadas = 0;

    // Calcular totais
    despesas.forEach(despesa => {
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

    // Calcular itens únicos com despesas
    const itensUnicos = new Set(despesas.map(d => d.itemId)).size;

    return {
      totalGeral,
      totalPorTipo,
      quantidadePorTipo,
      mediaValor: despesas.length > 0 ? totalGeral / despesas.length : 0,
      despesaMaiorValor,
      itensComDespesas: itensUnicos,
      despesasAprovadas,
      despesasPendentes: despesas.length - despesasAprovadas
    };
  }

  /**
   * Agrupa despesas por item
   */
  static agruparPorItem(despesas: Despesa[]): DespesasAgrupadas[] {
    const grupos: Record<string, DespesasAgrupadas> = {};

    // Agrupar por itemId
    despesas.forEach(despesa => {
      if (!grupos[despesa.itemId]) {
        grupos[despesa.itemId] = {
          itemId: despesa.itemId,
          itemNome: `Item ${despesa.itemId.slice(-8)}`, // Usar últimos 8 chars como nome
          despesas: [],
          total: 0
        };
      }

      grupos[despesa.itemId].despesas.push(despesa);
      grupos[despesa.itemId].total += despesa.valor;
    });

    // Converter para array e ordenar por total (maior para menor)
    return Object.values(grupos).sort((a, b) => b.total - a.total);
  }

  /**
   * Formata um valor monetário para exibição
   */
  static formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
} 