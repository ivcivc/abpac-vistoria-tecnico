// Tipos para autenticação do Sistema de Vistoria ABPAC

export interface AuthState {
  token: string | null;
  technicianName: string | null;
  isAuthenticated: boolean;
  error: string | null;
  loading: boolean;
  initialized: boolean; // Flag para indicar se a inicialização foi concluída
}

export interface AuthContextProps {
  authState: AuthState;
  validateToken: (token: string) => Promise<boolean>;
  setTechnicianName: (name: string) => void;
  logout: () => void;
  clearError: () => void;
}

export interface TokenValidationResponse {
  valid: boolean;
  vistoria?: {
    id: string;
    local: string;
    dataAgendada: string;
    tipoVistoria?: string; // Tipo da vistoria do campo tipo_vistoria
    tecnicoId?: string; // ID do técnico se já definido
    nomeEstoque?: string; // Nome do técnico (vem de tecnico.nome ou estoque.nome)
    veiculo: {
      placa: string;
      modelo: string;
      cor: string;
      ano: number;
    };
  };
  error?: string;
}

export interface TechnicianFormData {
  name: string;
}

// Tipos para persistência da sessão
export interface AuthSession {
  token: string;
  technicianName: string;
  expiresAt: Date;
  createdAt: Date;
}

// Constantes para configuração
export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: 'vistoria-abpac-auth',
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 horas em ms
  TOKEN_PARAM: 'token', // Parâmetro da URL para token
} as const;
