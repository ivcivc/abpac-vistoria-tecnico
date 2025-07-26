/**
 * Utilitário para debug de autenticação
 * Sistema de Vistoria ABPAC
 */

import { API_CONFIG } from '@/config/api';

export class AuthDebugUtil {
  /**
   * Limpa todo o estado de autenticação
   */
  static clearAuthState(): void {
    console.log('🧹 Limpando estado de autenticação...');

    // Limpar localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes('auth') ||
          key.includes('token') ||
          key.includes('technician') ||
          key.includes('vistoria'))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    });

    // Limpar sessionStorage também
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (
        key &&
        (key.includes('auth') ||
          key.includes('token') ||
          key.includes('technician') ||
          key.includes('vistoria'))
      ) {
        sessionKeysToRemove.push(key);
      }
    }

    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`🗑️ Session removido: ${key}`);
    });

    console.log('✅ Estado de autenticação limpo! Recarregue a página.');
  }

  /**
   * Mostra informações de debug do estado atual
   */
  static debugAuthState(): void {
    console.log('🔍 Estado atual de autenticação:');
    console.log('═════════════════════════════════════');

    // localStorage
    console.log('📦 localStorage:');
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.includes('auth') ||
          key.includes('token') ||
          key.includes('technician') ||
          key.includes('vistoria'))
      ) {
        authKeys.push({ key, value: localStorage.getItem(key) });
      }
    }

    if (authKeys.length === 0) {
      console.log('  (vazio)');
    } else {
      authKeys.forEach(item => {
        console.log(`  ${item.key}: ${item.value}`);
      });
    }

    // sessionStorage
    console.log('📦 sessionStorage:');
    const sessionAuthKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (
        key &&
        (key.includes('auth') ||
          key.includes('token') ||
          key.includes('technician') ||
          key.includes('vistoria'))
      ) {
        sessionAuthKeys.push({ key, value: sessionStorage.getItem(key) });
      }
    }

    if (sessionAuthKeys.length === 0) {
      console.log('  (vazio)');
    } else {
      sessionAuthKeys.forEach(item => {
        console.log(`  ${item.key}: ${item.value}`);
      });
    }

    // URL atual
    console.log('🌐 URL atual:', window.location.href);
    console.log('🌐 Search params:', window.location.search);

    console.log('═════════════════════════════════════');
  }

  /**
   * Simula um login de desenvolvimento
   */
  static mockLogin(): void {
    console.log('🎭 Simulando login de desenvolvimento...');

    // Simular token válido
    const mockToken = 'VIS1234567890ABCDEF';
    const mockTechnician = 'João Silva (Desenvolvimento)';

    // Definir no localStorage (se o AuthContext usar)
    localStorage.setItem('vistoria-auth-token', mockToken);
    localStorage.setItem('vistoria-technician-name', mockTechnician);
    localStorage.setItem('vistoria-auth-state', 'authenticated');

    console.log('✅ Login simulado! Recarregue a página.');
    console.log(`Token: ${mockToken}`);
    console.log(`Técnico: ${mockTechnician}`);
  }

  /**
   * Testa conectividade com o backend
   */
  static async testBackend(): Promise<void> {
    console.log('🔗 Testando conectividade com backend...');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vistoria/test123`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log(`📊 Status: ${response.status}`);
      console.log(`📊 OK: ${response.ok}`);

      const text = await response.text();
      console.log(`📊 Response:`, text);
    } catch (error) {
      console.error('❌ Erro de conectividade:', error);
    }
  }
}

// Disponibilizar no window para uso no console
if (typeof window !== 'undefined') {
  (window as any).authDebug = AuthDebugUtil;
  console.log('🔧 Utilitários de debug disponíveis:');
  console.log('  authDebug.clearAuthState() - Limpa estado de auth');
  console.log('  authDebug.debugAuthState() - Mostra estado atual');
  console.log('  authDebug.mockLogin() - Simula login');
  console.log('  authDebug.testBackend() - Testa backend');
}
