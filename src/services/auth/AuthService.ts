import { AuthSession, TokenValidationResponse, AUTH_CONFIG } from '@/types/auth';
import { CRUDService } from '@/services/storage/CRUDService';
import { STORES } from '@/types/storage';
import { buildApiUrl, API_CONFIG } from '@/config/api';

export class AuthService {
  private crudService: CRUDService;

  constructor() {
    this.crudService = new CRUDService();
  }

  /**
   * Extrai token da URL atual
   */
  extractTokenFromURL(): string | null {
    if (typeof window === 'undefined') {
      return null; // SSR safety
    }

    const url = new URL(window.location.href);
    const token = url.searchParams.get(AUTH_CONFIG.TOKEN_PARAM);

    if (token) {
      console.log('🔑 Token extraído da URL');
      // Limpar token da URL para segurança
      this.clearTokenFromURL();
    }

    return token;
  }

  /**
   * Remove o token da URL por questões de segurança
   */
  private clearTokenFromURL(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);

    if (url.searchParams.has(AUTH_CONFIG.TOKEN_PARAM)) {
      url.searchParams.delete(AUTH_CONFIG.TOKEN_PARAM);

      // Atualizar URL sem recarregar a página
      window.history.replaceState({}, document.title, url.toString());
      console.log('🧹 Token removido da URL');
    }
  }

  /**
   * Valida token com o backend
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      console.log('🔍 Validando token com backend:', token.substring(0, 10) + '...');

      const response = await fetch(buildApiUrl(`/vistoria/${token}`), {
        method: 'GET',
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dados recebidos do servidor:', data);

        if (data.type && data.vistoria) {
          const vistoria = data.vistoria;

          return {
            valid: true,
            vistoria: {
              id: vistoria.id.toString(),
              local: vistoria.local_vistoria || 'Local não informado',
              dataAgendada: vistoria.data_prevista || vistoria.created_at,
              tipoVistoria: vistoria.tipo_vistoria || null,
              tecnicoId: vistoria.tecnico_id || null,
              nomeEstoque: vistoria.tecnico?.nome || vistoria.estoque?.nome || null,
              veiculo: {
                placa: vistoria.equipamento?.placa1 || vistoria.equipamento?.placa || 'N/A',
                modelo:
                  `${vistoria.equipamento?.marca1 || ''} ${vistoria.equipamento?.modelo1 || ''}`.trim() ||
                  'Modelo não informado',
                cor: vistoria.equipamento?.cor || 'N/A',
                ano: vistoria.equipamento?.anoF1 || new Date().getFullYear(),
              },
            },
          };
        } else {
          return {
            valid: false,
            error: data.message || 'Token inválido',
          };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          error: errorData.message || `Erro na validação do token (${response.status})`,
        };
      }
    } catch (error) {
      console.error('❌ Erro na validação do token:', error);
      return {
        valid: false,
        error: 'Erro de conexão',
      };
    }
  }

  /**
   * Salva sessão de autenticação no armazenamento local
   */
  async saveAuthSession(token: string, technicianName: string): Promise<void> {
    const session: AuthSession = {
      token,
      technicianName,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.SESSION_DURATION),
      createdAt: new Date(),
    };

    try {
      await this.crudService.upsert(STORES.CONFIG, {
        id: AUTH_CONFIG.TOKEN_STORAGE_KEY,
        chave: AUTH_CONFIG.TOKEN_STORAGE_KEY,
        valor: session,
        timestamp: new Date(),
      });

      console.log('💾 Sessão de autenticação salva');
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
      throw new Error('Não foi possível salvar a sessão de autenticação');
    }
  }

  /**
   * Recupera sessão de autenticação do armazenamento local
   */
  async getStoredAuthSession(): Promise<AuthSession | null> {
    try {
      const result = await this.crudService.getById(STORES.CONFIG, AUTH_CONFIG.TOKEN_STORAGE_KEY);

      if (!result.success || !result.data) {
        return null;
      }

      const session = (result.data as any).valor as AuthSession;

      // Verificar se a sessão não expirou
      if (new Date() > new Date(session.expiresAt)) {
        console.log('⏰ Sessão expirada, removendo...');
        await this.clearAuthSession();
        return null;
      }

      console.log('📱 Sessão recuperada do armazenamento local');
      return session;
    } catch (error) {
      console.error('❌ Erro ao recuperar sessão:', error);
      return null;
    }
  }

  /**
   * Remove sessão de autenticação do armazenamento local
   */
  async clearAuthSession(): Promise<void> {
    try {
      await this.crudService.delete(STORES.CONFIG, AUTH_CONFIG.TOKEN_STORAGE_KEY);
      console.log('🗑️ Sessão de autenticação removida');
    } catch (error) {
      console.error('❌ Erro ao remover sessão:', error);
    }
  }

  /**
   * Verifica se há um token disponível (URL ou armazenamento)
   */
  async getAvailableToken(): Promise<{
    token: string | null;
    source: 'url' | 'storage' | null;
    technicianName?: string;
  }> {
    // Primeiro tentar extrair da URL
    const urlToken = this.extractTokenFromURL();
    if (urlToken) {
      return { token: urlToken, source: 'url' };
    }

    // Se não houver na URL, tentar recuperar do armazenamento
    const session = await this.getStoredAuthSession();
    if (session) {
      return {
        token: session.token,
        source: 'storage',
        technicianName: session.technicianName,
      };
    }

    return { token: null, source: null };
  }

  /**
   * Verifica se o formato do token está válido
   */
  isValidTokenFormat(token: string): boolean {
    return !!(token && token.length >= 20); // Tokens devem ter pelo menos 20 caracteres
  }

  /**
   * Gera um token mock para desenvolvimento (DESCONTINUADO - usar backend real)
   * @deprecated Use tokens reais do backend
   */
  generateMockToken(): string {
    console.warn('⚠️ generateMockToken está descontinuado. Use tokens reais do backend.');
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `mock-token-${timestamp}-${random}`;
  }
}
