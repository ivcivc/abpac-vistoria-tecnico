import { useState, useEffect } from 'react';
import { LocalVistoriaService, VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';

interface UseVistoriaState {
  vistoria: VistoriaLocal | null;
  loading: boolean;
  error: string | null;
  progresso: number;
}

interface UseVistoriaActions {
  recarregarVistoria: () => Promise<void>;
  atualizarProgresso: () => void;
  limparErro: () => void;
}

interface UseVistoriaReturn extends UseVistoriaState, UseVistoriaActions {}

/**
 * Hook para gerenciar dados de uma vistoria específica
 * 
 * @param vistoriaId - ID da vistoria a ser carregada
 * @returns Estado e ações para gerenciar a vistoria
 */
export function useVistoria(vistoriaId: string): UseVistoriaReturn {
  const [state, setState] = useState<UseVistoriaState>({
    vistoria: null,
    loading: true,
    error: null,
    progresso: 0,
  });

  const localVistoriaService = new LocalVistoriaService();

  /**
   * Calcula o progresso da vistoria baseado nos itens concluídos
   */
     const calcularProgresso = (vistoria: VistoriaLocal): number => {
     const itens = Array.isArray(vistoria.itens) ? vistoria.itens : [];
     
     if (itens.length === 0) {
       return 0;
     }

     const itensConcluidos = itens.filter(
       item => item.status === 'concluido' || item.concluido === true
     ).length;

     return Math.round((itensConcluidos / itens.length) * 100);
   };

  /**
   * Carrega os dados da vistoria do armazenamento local
   */
  const carregarVistoria = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔍 [useVistoria] Carregando vistoria ID:', vistoriaId);

      const resultado = await localVistoriaService.obterVistoriaPorId(vistoriaId);

      if (resultado.success && resultado.data) {
        const progresso = calcularProgresso(resultado.data);
        
        setState({
          vistoria: resultado.data,
          loading: false,
          error: null,
          progresso,
        });

        console.log('✅ [useVistoria] Vistoria carregada com sucesso:', {
          id: resultado.data.id,
          local: resultado.data.local,
          progresso: `${progresso}%`,
          itensTotal: resultado.data.itens?.length || 0,
        });
      } else {
        const errorMessage = resultado.error || 'Vistoria não encontrada no armazenamento local';
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        console.error('❌ [useVistoria] Erro ao carregar vistoria:', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar vistoria';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      console.error('❌ [useVistoria] Erro inesperado:', error);
    }
  };

  /**
   * Recarrega os dados da vistoria
   * Forçando uma limpeza do cache para garantir que todos os itens sejam carregados
   */
  const recarregarVistoria = async () => {
    console.log('🔄 [useVistoria] Forçando recarga completa da vistoria:', vistoriaId);
    
    // Limpar o estado atual antes de recarregar
    setState(prev => ({ 
      ...prev, 
      vistoria: null, // Forçar limpeza completa do estado
      loading: true 
    }));
    
    // Pequeno delay para garantir que o estado seja atualizado
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Agora recarregar os dados
    await carregarVistoria();
    
    console.log('🔄 [useVistoria] Recarga completa finalizada');
  };

  /**
   * Atualiza o progresso da vistoria
   */
  const atualizarProgresso = () => {
    setState(prev => {
      if (!prev.vistoria) return prev;
      
      const novoProgresso = calcularProgresso(prev.vistoria);
      return {
        ...prev,
        progresso: novoProgresso,
      };
    });
  };

  /**
   * Limpa o erro atual
   */
  const limparErro = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Carregar vistoria quando o ID mudar
  useEffect(() => {
    if (vistoriaId) {
      carregarVistoria();
    }
  }, [vistoriaId]);

  return {
    vistoria: state.vistoria,
    loading: state.loading,
    error: state.error,
    progresso: state.progresso,
    recarregarVistoria,
    atualizarProgresso,
    limparErro,
  };
} 