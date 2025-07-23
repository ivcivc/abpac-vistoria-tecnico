'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { LocalVistoriaService, VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';

interface LocalVistoriaContextProps {
  vistorias: VistoriaLocal[];
  estatisticas: {
    total: number;
    emAndamento: number;
    concluidas: number;
    pausadas: number;
  };
  loading: boolean;
  error: string | null;
  recarregarVistorias: () => Promise<void>;
  atualizarStatusVistoria: (
    vistoriaId: string,
    novoStatus: VistoriaLocal['status']
  ) => Promise<boolean>;
  removerVistoria: (vistoriaId: string) => Promise<boolean>;
  limparHistorico: () => Promise<boolean>;
}

const LocalVistoriaContext = createContext<LocalVistoriaContextProps | null>(null);

interface LocalVistoriaProviderProps {
  children: ReactNode;
}

/**
 * Provider para gerenciar vistorias locais
 *
 * Funcionalidade:
 * - Carrega histórico de vistorias acessadas neste navegador
 * - Fornece estatísticas em tempo real
 * - Permite operações de CRUD no histórico local
 */
export function LocalVistoriaProvider({ children }: LocalVistoriaProviderProps) {
  const [vistorias, setVistorias] = useState<VistoriaLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVistoriaService = useMemo(() => new LocalVistoriaService(), []);

  // Calcular estatísticas com base nas vistorias carregadas
  const estatisticas = useMemo(() => {
    return {
      total: vistorias.length,
      emAndamento: vistorias.filter(v => v.status === 'em_andamento').length,
      concluidas: vistorias.filter(v => v.status === 'concluida').length,
      pausadas: vistorias.filter(v => v.status === 'pausada').length,
    };
  }, [vistorias]);

  /**
   * Carrega vistorias do histórico local
   */
  const carregarVistorias = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await localVistoriaService.obterVistoriasLocais();

      if (result.success) {
        setVistorias(result.data || []);
        console.log(`📊 ${result.data?.length || 0} vistorias carregadas do histórico local`);
      } else {
        setError(result.error || 'Erro ao carregar histórico');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vistorias:', error);
      setError('Erro interno ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recarrega vistorias (função pública)
   */
  const recarregarVistorias = async (): Promise<void> => {
    await carregarVistorias();
  };

  /**
   * Atualiza status de uma vistoria
   */
  const atualizarStatusVistoria = async (
    vistoriaId: string,
    novoStatus: VistoriaLocal['status']
  ): Promise<boolean> => {
    try {
      const result = await localVistoriaService.atualizarStatusVistoria(vistoriaId, novoStatus);

      if (result.success) {
        // Atualizar estado local
        setVistorias(prev =>
          prev.map(v => (v.id === vistoriaId ? { ...v, status: novoStatus } : v))
        );
        return true;
      } else {
        setError(result.error || 'Erro ao atualizar status');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      setError('Erro interno ao atualizar status');
      return false;
    }
  };

  /**
   * Remove vistoria do histórico
   */
  const removerVistoria = async (vistoriaId: string): Promise<boolean> => {
    try {
      const result = await localVistoriaService.removerVistoriaLocal(vistoriaId);

      if (result.success) {
        // Atualizar estado local
        setVistorias(prev => prev.filter(v => v.id !== vistoriaId));
        return true;
      } else {
        setError(result.error || 'Erro ao remover vistoria');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao remover vistoria:', error);
      setError('Erro interno ao remover vistoria');
      return false;
    }
  };

  /**
   * Limpa todo o histórico
   */
  const limparHistorico = async (): Promise<boolean> => {
    try {
      const result = await localVistoriaService.limparHistoricoLocal();

      if (result.success) {
        setVistorias([]);
        return true;
      } else {
        setError(result.error || 'Erro ao limpar histórico');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao limpar histórico:', error);
      setError('Erro interno ao limpar histórico');
      return false;
    }
  };

  // Carregar vistorias na inicialização
  useEffect(() => {
    carregarVistorias();
  }, []);

  const contextValue: LocalVistoriaContextProps = {
    vistorias,
    estatisticas,
    loading,
    error,
    recarregarVistorias,
    atualizarStatusVistoria,
    removerVistoria,
    limparHistorico,
  };

  return (
    <LocalVistoriaContext.Provider value={contextValue}>{children}</LocalVistoriaContext.Provider>
  );
}

/**
 * Hook para usar o contexto de vistorias locais
 */
export function useLocalVistorias(): LocalVistoriaContextProps {
  const context = useContext(LocalVistoriaContext);

  if (!context) {
    throw new Error('useLocalVistorias deve ser usado dentro de um LocalVistoriaProvider');
  }

  return context;
}

/**
 * Hook para estatísticas de vistorias locais
 */
export function useEstatisticasLocais() {
  const { estatisticas } = useLocalVistorias();
  return estatisticas;
}

/**
 * Hook para verificar se há vistorias em andamento
 */
export function useTemVistoriasEmAndamento(): boolean {
  const { estatisticas } = useLocalVistorias();
  return estatisticas.emAndamento > 0;
}
