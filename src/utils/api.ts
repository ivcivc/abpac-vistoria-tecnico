/**
 * Utilitários para construção de URLs da API
 * Sistema de Vistorias ABPAC
 */

// Configuração base da API
const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333',
  timeout: 10000,
  retries: 3
};

/**
 * Constrói URL completa para a API
 * @param endpoint - Endpoint da API (ex: '/api/vistoria/123')
 * @param params - Parâmetros opcionais para substituir na URL
 * @returns URL completa
 */
export function buildApiUrl(endpoint: string, params?: Record<string, string | number>): string {
  let url = endpoint;
  
  // Substituir parâmetros na URL se fornecidos
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  
  // Garantir que a URL comece com /
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // Construir URL completa
  const fullUrl = `${API_CONFIG.baseUrl}${url}`;
  
  console.log(`🔗 [API] URL construída: ${fullUrl}`);
  return fullUrl;
}

/**
 * Configuração padrão para requisições fetch
 */
export const defaultFetchConfig = {
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  }
};

/**
 * Wrapper para fetch com timeout
 * @param url - URL da requisição
 * @param options - Opções do fetch
 * @param timeout - Timeout em milissegundos
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout: number = API_CONFIG.timeout
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Verifica se a resposta HTTP é bem-sucedida
 * @param response - Resposta do fetch
 */
export function isResponseOk(response: Response): boolean {
  return response.ok && response.status >= 200 && response.status < 300;
}

/**
 * Extrai mensagem de erro de uma resposta HTTP
 * @param response - Resposta do fetch
 */
export async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      return errorData.message || errorData.error || `Erro HTTP ${response.status}`;
    } else {
      const errorText = await response.text();
      return errorText || `Erro HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (parseError) {
    return `Erro HTTP ${response.status}: ${response.statusText}`;
  }
}

export { API_CONFIG }; 