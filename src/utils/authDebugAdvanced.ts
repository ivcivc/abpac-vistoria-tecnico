/**
 * Utilitário avançado para debug de autenticação
 * Sistema de Vistoria ABPAC
 */

import { AuthService } from '@/services/auth/AuthService';

export class AuthDebugAdvanced {
  /**
   * Testa o fluxo completo de autenticação
   */
  static async testCompleteAuthFlow(token: string = 'VIS1234567890ABCDEF'): Promise<void> {
    console.log('🧪 === TESTE COMPLETO DE AUTENTICAÇÃO ===');
    console.log(`Token de teste: ${token}`);

    try {
      // 1. Testar AuthService
      console.log('\n1. 📡 Testando AuthService...');
      const authService = new AuthService();

      // 2. Testar validação de token
      console.log('\n2. 🔍 Testando validação de token...');
      const startTime = Date.now();

      const validationResult = await authService.validateToken(token);
      const endTime = Date.now();

      console.log(`⏱️ Tempo de resposta: ${endTime - startTime}ms`);
      console.log('📊 Resultado da validação:', validationResult);

      if (validationResult.valid) {
        console.log('✅ Token válido!');
        console.log('📋 Dados da vistoria:', validationResult.vistoria);

        // 3. Testar salvamento de sessão
        console.log('\n3. 💾 Testando salvamento de sessão...');
        await authService.saveAuthSession(token, 'João Silva (Teste)');
        console.log('✅ Sessão salva com sucesso');

        // 4. Testar recuperação de sessão
        console.log('\n4. 📱 Testando recuperação de sessão...');
        const session = await authService.getStoredAuthSession();
        console.log('📋 Sessão recuperada:', session);

        // 5. Testar getAvailableToken
        console.log('\n5. 🔎 Testando getAvailableToken...');
        const availableToken = await authService.getAvailableToken();
        console.log('📋 Token disponível:', availableToken);
      } else {
        console.error('❌ Token inválido:', validationResult.error);
      }
    } catch (error) {
      console.error('💥 Erro no teste de autenticação:', error);
    }

    console.log('\n🧪 === FIM DO TESTE ===');
  }

  /**
   * Monitora o estado de autenticação em tempo real
   */
  static startAuthMonitoring(): void {
    console.log('👁️ Iniciando monitoramento de autenticação...');

    // Interceptar todas as chamadas fetch para debug
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const [url, options] = args;

      if (typeof url === 'string' && url.includes('/vistoria/')) {
        console.log('🌐 [FETCH INTERCEPTED] URL:', url);
        console.log('🌐 [FETCH INTERCEPTED] Options:', options);

        const startTime = Date.now();

        try {
          const response = await originalFetch.apply(this, args);
          const endTime = Date.now();

          console.log(`🌐 [FETCH RESPONSE] Status: ${response.status} (${endTime - startTime}ms)`);

          // Clone response para poder ler o body sem afetar o original
          const clonedResponse = response.clone();
          try {
            const data = await clonedResponse.json();
            console.log('🌐 [FETCH RESPONSE] Data:', data);
          } catch (e) {
            console.log('🌐 [FETCH RESPONSE] Não é JSON válido');
          }

          return response;
        } catch (error) {
          const endTime = Date.now();
          console.error(`🌐 [FETCH ERROR] (${endTime - startTime}ms):`, error);
          throw error;
        }
      }

      return originalFetch.apply(this, args);
    };

    console.log('✅ Monitoramento ativo - todas as chamadas fetch para /vistoria/ serão logadas');
  }

  /**
   * Para o monitoramento de autenticação
   */
  static stopAuthMonitoring(): void {
    // Restaurar fetch original (isso é simplificado, em produção seria mais complexo)
    location.reload();
  }

  /**
   * Força um reset completo do estado de autenticação
   */
  static async forceAuthReset(): Promise<void> {
    console.log('🔄 Forçando reset completo de autenticação...');

    try {
      // Limpar AuthService
      const authService = new AuthService();
      await authService.clearAuthSession();

      // Limpar localStorage completo
      const authKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes('auth') ||
            key.includes('token') ||
            key.includes('technician') ||
            key.includes('vistoria') ||
            key.includes('VistoriaABPAC'))
        ) {
          authKeys.push(key);
        }
      }

      authKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removido localStorage: ${key}`);
      });

      // Limpar IndexedDB (se possível)
      try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name === 'VistoriaABPAC') {
            console.log(`🗑️ Deletando IndexedDB: ${db.name}`);
            const deleteRequest = indexedDB.deleteDatabase(db.name);
            await new Promise((resolve, reject) => {
              deleteRequest.onsuccess = () => resolve(true);
              deleteRequest.onerror = () => reject(deleteRequest.error);
            });
          }
        }
      } catch (e) {
        console.log('⚠️ Não foi possível limpar IndexedDB:', e);
      }

      console.log('✅ Reset completo realizado! Recarregue a página.');
    } catch (error) {
      console.error('❌ Erro no reset:', error);
    }
  }

  /**
   * Testa conectividade específica com backend
   */
  static async testBackendAuth(): Promise<void> {
    console.log('🔗 Testando conectividade específica para autenticação...');

    const testUrls = [
      'http://192.168.15.4:3333/api/vistoria/test123',
      'http://localhost:3333/api/vistoria/test123',
      'http://192.168.15.4:3333/api/vistoria/VIS1234567890ABCDEF',
      'http://localhost:3333/api/vistoria/VIS1234567890ABCDEF',
    ];

    for (const url of testUrls) {
      try {
        console.log(`\n🌐 Testando: ${url}`);
        const startTime = Date.now();

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        const endTime = Date.now();

        console.log(`📊 Status: ${response.status} (${endTime - startTime}ms)`);

        try {
          const data = await response.json();
          console.log('📊 Response:', data);
        } catch (e) {
          const text = await response.text();
          console.log('📊 Response (text):', text.substring(0, 200));
        }
      } catch (error) {
        console.error(`❌ Erro em ${url}:`, error);
      }
    }
  }
}

// Disponibilizar no window para uso no console
if (typeof window !== 'undefined') {
  (window as any).authDebugAdvanced = AuthDebugAdvanced;
  console.log('🔧 Utilitários avançados de debug disponíveis:');
  console.log('  authDebugAdvanced.testCompleteAuthFlow() - Testa fluxo completo');
  console.log('  authDebugAdvanced.startAuthMonitoring() - Monitora chamadas fetch');
  console.log('  authDebugAdvanced.forceAuthReset() - Reset completo');
  console.log('  authDebugAdvanced.testBackendAuth() - Testa backend');
}
