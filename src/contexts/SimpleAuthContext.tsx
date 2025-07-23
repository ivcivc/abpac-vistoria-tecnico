'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';

// Contexto simples de emergência
interface SimpleAuthState {
  token: string | null;
  technicianName: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  // ADICIONADO: dados da vistoria atual
  currentVistoria: any | null;
}

interface SimpleAuthContextProps {
  authState: SimpleAuthState;
  validateToken: (
    token: string
  ) => Promise<{ success: boolean; vistoriaData?: any; error?: string }>;
  setTechnicianName: (name: string) => void;
  setCurrentVistoria: (vistoria: any) => void; // ADICIONADO
  logout: () => void;
  clearError: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextProps | null>(null);

// Função para carregar estado inicial do localStorage
const loadInitialState = (): SimpleAuthState => {
  // SEMPRE retorna estado padrão consistente (servidor e cliente)
  const defaultState = {
    isAuthenticated: false,
    loading: false,
    initialized: false, // IMPORTANTE: inicia como false para ser atualizado após hidratação
    technicianName: null,
    token: null,
    currentVistoria: null,
    error: null,
  };

  // No servidor, sempre retorna estado padrão
  if (typeof window === 'undefined') {
    console.log('🔄 [SIMPLE-AUTH] Servidor - retornando estado padrão');
    return defaultState;
  }

  // No cliente, retorna estado padrão primeiro, depois carrega do localStorage
  console.log('🔄 [SIMPLE-AUTH] Cliente - retornando estado padrão para hidratação segura');
  return defaultState;
};

// Função para carregar do localStorage APENAS após hidratação
const loadFromLocalStorage = (): Partial<SimpleAuthState> | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const savedState = localStorage.getItem('vistoria_auth_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      console.log('🔄 [SIMPLE-AUTH] Dados carregados do localStorage:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('❌ [SIMPLE-AUTH] Erro ao carregar localStorage:', error);
  }
  
  return null;
};

// Função para salvar estado no localStorage
const saveStateToStorage = (state: SimpleAuthState) => {
  if (typeof window === 'undefined') return;
  
  try {
    // Salvar apenas os dados importantes (não salvar loading/error)
    const stateToSave = {
      isAuthenticated: state.isAuthenticated,
      technicianName: state.technicianName,
      token: state.token,
      currentVistoria: state.currentVistoria,
      initialized: state.initialized,
    };
    
    localStorage.setItem('vistoria_auth_state', JSON.stringify(stateToSave));
    console.log('💾 [SIMPLE-AUTH] Estado salvo no localStorage:', stateToSave);
  } catch (error) {
    console.error('❌ [SIMPLE-AUTH] Erro ao salvar localStorage:', error);
  }
};

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  // SEMPRE inicia com estado padrão idêntico (servidor e cliente)
  const [authState, setAuthState] = useState<SimpleAuthState>(loadInitialState);

  // Efeito para carregar do localStorage APENAS após hidratação no cliente
  useEffect(() => {
    console.log('🔄 [SIMPLE-AUTH] Efeito de hidratação executado');
    
    // Carregar dados do localStorage se existirem
    const savedData = loadFromLocalStorage();
    
    if (savedData) {
      console.log('🔄 [SIMPLE-AUTH] Aplicando dados do localStorage:', savedData);
      setAuthState(prev => ({
        ...prev,
        ...savedData,
        initialized: true,
        loading: false,
        error: null, // Sempre limpar erros
      }));
    } else {
      console.log('🔄 [SIMPLE-AUTH] Nenhum dado salvo, mantendo estado padrão');
      setAuthState(prev => ({
        ...prev,
        initialized: true,
        loading: false,
      }));
    }
  }, []); // Executar apenas uma vez após montagem

  // Efeito para salvar mudanças no localStorage (apenas quando necessário)
  useEffect(() => {
    if (authState.initialized) {
      saveStateToStorage(authState);
    }
  }, [authState.isAuthenticated, authState.technicianName, authState.token, authState.currentVistoria, authState.initialized]);

  console.log('🚀 [SIMPLE-AUTH] Contexto renderizado com estado:', authState);

  const validateToken = async (
    token: string
  ): Promise<{ success: boolean; vistoriaData?: any; error?: string }> => {
    console.log(
      '🔍 [SIMPLE-AUTH] Validando token no backend REAL:',
      token.substring(0, 10) + '...'
    );
    console.log('🔍 [SIMPLE-AUTH] Token completo:', token);
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // ENDPOINT CORRETO que já existe no backend
      const API_BASE = 'http://localhost:3333/api';
      const apiUrl = `${API_BASE}/vistoria/${token}`;

      console.log('📡 [API] Fazendo requisição GET para:', apiUrl);

      // GET request (não POST) para o endpoint que já existe
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      console.log('📡 [API] Status da resposta:', response.status);
      console.log('📡 [API] Status text:', response.statusText);
      console.log('📡 [API] Headers da resposta:', Object.fromEntries(response.headers.entries()));

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      console.log('📡 [API] Content-Type:', contentType);

      if (!response.ok) {
        let errorData;
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const textResponse = await response.text();
            console.log('📡 [API] Resposta de erro (texto):', textResponse);
            errorData = {
              message: `Erro ${response.status}: ${response.statusText}`,
              type: false,
              code: 'HTTP_ERROR',
              details: textResponse,
            };
          }
        } catch (parseError) {
          console.error('❌ [API] Erro ao fazer parse da resposta de erro:', parseError);
          errorData = {
            message: `Erro ${response.status}: ${response.statusText}`,
            type: false,
            code: 'HTTP_ERROR',
          };
        }

        console.error('❌ [API] Erro na validação:', errorData);

        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorData.message || `Erro ${response.status}: ${response.statusText}`,
        }));

        return {
          success: false,
          error: errorData.message || 'Token inválido',
        };
      }

      let data;
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const textResponse = await response.text();
          console.log('⚠️ [API] Resposta não é JSON:', textResponse);
          throw new Error('Resposta do servidor não é JSON válido');
        }
      } catch (parseError) {
        console.error('❌ [API] Erro ao fazer parse da resposta:', parseError);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Erro ao processar resposta do servidor',
        }));
        return {
          success: false,
          error: 'Resposta do servidor inválida',
        };
      }

      console.log('📡 [API] Resposta completa do backend:', data);
      console.log('📡 [API] Tipo da resposta:', typeof data);
      console.log('📡 [API] Keys da resposta:', data ? Object.keys(data) : 'null');

      // Estrutura de resposta do backend existente: { type: true, vistoria: {...} }
      if (data && data.type === true && data.vistoria) {
        const vistoriaData = data.vistoria;
        console.log('✅ [API] Vistoria encontrada:', vistoriaData);
        console.log('📋 [API] ID da vistoria:', vistoriaData.id);
        console.log('📋 [API] Status da vistoria:', vistoriaData.status);
        console.log('📋 [API] Local/Endereço:', {
          local_vistoria: vistoriaData.local_vistoria,
          endereco: vistoriaData.endereco,
          cidade: vistoriaData.cidade,
        });

        // Log específico dos dados importantes
        if (vistoriaData.equipamento) {
          console.log('🚗 [API] Dados do equipamento ENCONTRADOS:', {
            id: vistoriaData.equipamento.id,
            nome: vistoriaData.equipamento.nome,
            placa: vistoriaData.equipamento.placa,
            modelo: vistoriaData.equipamento.modelo,
            marca: vistoriaData.equipamento.marca,
            cor: vistoriaData.equipamento.cor,
          });
        } else {
          console.warn('⚠️ [API] Dados do equipamento AUSENTES');
          console.log('📋 [API] Campo equipamento_id:', vistoriaData.equipamento_id);
        }

        if (vistoriaData.tecnico) {
          console.log('👤 [API] Dados do técnico ENCONTRADOS:', {
            id: vistoriaData.tecnico.id,
            nome: vistoriaData.tecnico.nome,
            email: vistoriaData.tecnico.email,
          });
        } else {
          console.warn('⚠️ [API] Dados do técnico AUSENTES (pode ser normal)');
          console.log('📋 [API] Campo tecnico_id:', vistoriaData.tecnico_id);
        }

        // Verificar outros campos importantes
        console.log('📋 [API] Outros campos importantes:', {
          tipo_vistoria: vistoriaData.tipo_vistoria,
          data_prevista: vistoriaData.data_prevista,
          observacoes_vistoria: vistoriaData.observacoes_vistoria,
          itens_count: vistoriaData.itens ? vistoriaData.itens.length : 0,
        });

        // Atualizar estado de autenticação
        setAuthState(prev => ({
          ...prev,
          token: token,
          loading: false,
          error: null,
          currentVistoria: vistoriaData,
        }));

        return {
          success: true,
          vistoriaData: vistoriaData,
        };
      } else {
        console.error('❌ [API] Estrutura de resposta inválida ou incompleta:', {
          hasData: !!data,
          hasType: data ? 'type' in data : false,
          typeValue: data ? data.type : 'undefined',
          hasVistoria: data ? 'vistoria' in data : false,
          dataKeys: data ? Object.keys(data) : [],
        });

        const errorMessage = data?.message || 'Dados da vistoria não encontrados na resposta';

        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      console.error('❌ [API] Erro na requisição:', error);
      console.error('❌ [API] Stack trace:', error.stack);

      let errorMessage = 'Erro de conexão com o servidor';

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage =
          'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3333.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Timeout na conexão com o servidor';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const setTechnicianName = (name: string) => {
    console.log('👤 [SIMPLE-AUTH] Definindo nome do técnico:', name);
    console.log('👤 [SIMPLE-AUTH] Estado ANTES da mudança:', authState);

    setAuthState(prev => {
      const newState = {
        ...prev,
        technicianName: name,
        isAuthenticated: true,
        loading: false,
      };

      console.log('👤 [SIMPLE-AUTH] Estado APÓS a mudança:', newState);
      
      // O localStorage será salvo automaticamente pelo useEffect
      return newState;
    });

    console.log('✅ [SIMPLE-AUTH] Autenticação completada para:', name);
  };

  const setCurrentVistoria = (vistoria: any) => {
    console.log('📋 [SIMPLE-AUTH] Definindo vistoria atual:', vistoria);
    
    setAuthState(prev => {
      const newState = {
        ...prev,
        currentVistoria: vistoria,
      };
      
      // O localStorage será salvo automaticamente pelo useEffect
      return newState;
    });
    
    console.log('✅ [SIMPLE-AUTH] Vistoria atual definida');
  };

  const clearError = () => {
    console.log('🧹 [SIMPLE-AUTH] Limpando erro');
    
    setAuthState(prev => ({
      ...prev,
      error: null,
    }));
  };

  const logout = () => {
    console.log('🚪 [SIMPLE-AUTH] Fazendo logout');
    
    // Limpar localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vistoria_auth_state');
      localStorage.removeItem('debug_technician_name');
      localStorage.removeItem('debug_set_at');
      localStorage.removeItem('debug_navigation_method');
    }
    
    setAuthState({
      isAuthenticated: false,
      loading: false,
      initialized: true,
      technicianName: null,
      token: null,
      currentVistoria: null,
      error: null,
    });
    
    console.log('✅ [SIMPLE-AUTH] Logout concluído');
  };

  return (
    <SimpleAuthContext.Provider
      value={{
        authState,
        validateToken,
        setTechnicianName,
        setCurrentVistoria, // ADICIONADO
        logout,
        clearError, // ADICIONADO: função estava implementada mas não exportada
      }}
    >
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useAuth(): SimpleAuthContextProps {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um SimpleAuthProvider');
  }
  return context;
}

export function useIsAuthenticated(): boolean {
  const { authState } = useAuth();
  return authState.isAuthenticated;
}

export function useTechnician(): {
  name: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
} {
  const { authState } = useAuth();
  return {
    name: authState.technicianName,
    isAuthenticated: authState.isAuthenticated,
    initialized: authState.initialized,
  };
}
