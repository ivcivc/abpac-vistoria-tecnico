'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import { AuthState, AuthContextProps, TokenValidationResponse } from '@/types/auth';
import { AuthService } from '@/services/auth/AuthService';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';

// Definir ações do reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'SET_TECHNICIAN_NAME'; payload: string }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialAuthState: AuthState = {
  token: null,
  technicianName: null,
  isAuthenticated: false,
  error: null,
  loading: true, // Inicia como carregando até verificar estado
  initialized: false, // Adicionar flag para indicar se a inicialização foi concluída
};

// Reducer para gerenciar estado de autenticação
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_TOKEN':
      return { ...state, token: action.payload, error: null };

    case 'SET_TECHNICIAN_NAME':
      return {
        ...state,
        technicianName: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
      };

    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };

    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload, loading: false };

    case 'LOGOUT':
      return { ...initialAuthState, initialized: true, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// Criar o contexto
const AuthContext = createContext<AuthContextProps | null>(null);

// Provider do contexto
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, dispatch] = useReducer(authReducer, initialAuthState);
  const [mounted, setMounted] = useState(false);
  const [vistoriaData, setVistoriaData] = useState<any>(null); // Dados da vistoria validada temporariamente
  const authService = useMemo(() => new AuthService(), []);
  const localVistoriaService = useMemo(() => new LocalVistoriaService(), []);

  // Aguardar hidratação antes de inicializar autenticação
  useEffect(() => {
    console.log('🔄 [MOUNT-EFFECT] Definindo mounted como true...');
    setMounted(true);
  }, []);

  // VERSÃO DE EMERGÊNCIA - FORÇA INICIALIZAÇÃO IMEDIATA
  useEffect(() => {
    console.log('🔄 [EMERGENCY] Executando inicialização de emergência...');
    console.log(
      '🔄 [EMERGENCY] Estado atual - mounted:',
      mounted,
      'initialized:',
      authState.initialized
    );

    if (mounted && !authState.initialized) {
      console.log('✅ [EMERGENCY] Forçando inicialização IMEDIATA...');

      setTimeout(() => {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('✅ [EMERGENCY] Inicialização forçada concluída!');
      }, 100); // Delay mínimo para evitar problemas de renderização
    }
  }, [mounted, authState.initialized]);

  /**
   * Inicializa a autenticação verificando token da URL ou sessão armazenada
   */
  const initializeAuth = useCallback(async () => {
    try {
      console.log('🔄 [INIT] Iniciando inicialização da autenticação...');
      dispatch({ type: 'SET_LOADING', payload: true });

      console.log('🔄 [INIT] Criando AuthService...');
      // Verificar se o authService está funcionando
      if (!authService) {
        console.error('❌ [INIT] AuthService não foi criado!');
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        return;
      }

      console.log('🔄 [INIT] Chamando getAvailableToken...');
      const tokenResult = await authService.getAvailableToken();
      console.log('🔄 [INIT] Resultado getAvailableToken:', tokenResult);

      const { token, source, technicianName } = tokenResult;

      if (!token) {
        console.log('❌ [INIT] Nenhum token encontrado - finalizando inicialização');
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        return;
      }

      console.log(`🔑 [INIT] Token encontrado (fonte: ${source})`);

      // Se veio do armazenamento e já tem nome do técnico, autenticar diretamente
      if (source === 'storage' && technicianName) {
        console.log('✅ [INIT] Sessão válida encontrada, restaurando autenticação...');
        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_TECHNICIAN_NAME', payload: technicianName });
        console.log('✅ [INIT] Autenticação restaurada com sucesso');
        return;
      }

      // Se veio da URL, apenas definir o token (ainda precisa validar e pedir nome)
      console.log('🔍 [INIT] Token da URL encontrado, aguardando validação manual...');
      dispatch({ type: 'SET_TOKEN', payload: token });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      console.log('✅ [INIT] Inicialização concluída - aguardando validação');
    } catch (error) {
      console.error('❌ [INIT] Erro ao inicializar autenticação:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao inicializar autenticação' });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  }, [authService]);

  /**
   * Valida token com o backend
   */
  const validateToken = useCallback(
    async (token: string): Promise<boolean> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });

        console.log('🔍 Validando token com backend...');
        const result: TokenValidationResponse = await authService.validateToken(token);

        if (result.valid && result.vistoria) {
          console.log('✅ Token válido, vistoria encontrada:', result.vistoria.id);
          dispatch({ type: 'SET_TOKEN', payload: token });
          setVistoriaData(result.vistoria);
          return true;
        } else {
          console.log('❌ Token inválido:', result.error);
          dispatch({ type: 'SET_ERROR', payload: result.error || 'Token inválido' });
          return false;
        }
      } catch (error: any) {
        console.error('❌ Erro na validação do token:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao validar token' });
        return false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [authService]
  );

  /**
   * Define o nome do técnico e completa a autenticação
   */
  const setTechnicianName = useCallback(
    async (name: string): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        if (!authState.token) {
          throw new Error('Token não encontrado');
        }

        console.log('💾 Salvando sessão de autenticação...');

        // Salvar sessão no armazenamento local
        await authService.saveAuthSession(authState.token, name);

        // Salvar vistoria no histórico local deste navegador
        if (vistoriaData) {
          try {
            await localVistoriaService.adicionarVistoriaAcessada(
              authState.token,
              vistoriaData,
              name
            );
            console.log('📝 Vistoria salva no histórico local do navegador');
          } catch (error: any) {
            console.warn('⚠️ Erro ao salvar no histórico local:', error);
          }
        }

        dispatch({ type: 'SET_TECHNICIAN_NAME', payload: name });
        console.log('✅ Autenticação concluída com sucesso');
      } catch (error: any) {
        console.error('❌ Erro ao definir nome do técnico:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao autenticar técnico' });
      }
    },
    [authState.token, vistoriaData, authService, localVistoriaService]
  );

  /**
   * Faz logout removendo sessão
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.clearAuthSession();
      dispatch({ type: 'LOGOUT' });
      console.log('👋 Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      dispatch({ type: 'LOGOUT' });
    }
  }, [authService]);

  /**
   * Limpa mensagens de erro
   */
  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Valor do contexto
  const contextValue: AuthContextProps = useMemo(
    () => ({
      authState,
      validateToken,
      setTechnicianName,
      logout,
      clearError,
    }),
    [authState, validateToken, setTechnicianName, logout, clearError]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Hook para usar o contexto
export function useAuth(): AuthContextProps {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}

// Hook para verificar se está autenticado
export function useIsAuthenticated(): boolean {
  const { authState } = useAuth();
  return authState.isAuthenticated;
}

// Hook para obter dados do técnico
export function useTechnician(): {
  name: string | null;
  isAuthenticated: boolean;
  initialized: boolean;
} {
  const { authState } = useAuth();
  return {
    name: authState.technicianName,
    isAuthenticated: authState.isAuthenticated,
    initialized: authState.initialized || false,
  };
}
