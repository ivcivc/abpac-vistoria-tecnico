'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/SimpleAuthContext';

export default function Home() {
  const { authState } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Aguardar hidratação para evitar SSR/client mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Não executar antes da hidratação

    console.log('🔄 [HOME] Verificando estado de autenticação...');
    console.log('🔄 [HOME] authState.isAuthenticated:', authState.isAuthenticated);
    console.log('🔄 [HOME] authState.token:', authState.token ? 'presente' : 'ausente');
    console.log('🔄 [HOME] authState.initialized:', authState.initialized);

    // CORRIGIDO: Verificar se já está autenticado primeiro
    if (authState.isAuthenticated && authState.token) {
      console.log('✅ [HOME] Usuário já autenticado, redirecionando para dashboard');
      router.push('/dashboard');
    } else {
      console.log('❌ [HOME] Usuário não autenticado, redirecionando para login');
      router.push('/login');
    }
    
  }, [router, mounted, authState.isAuthenticated, authState.token, authState.initialized]); // ADICIONADO: dependências do authState

  // Mostrar carregamento enquanto redireciona
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
        </div>
        <h2 className="text-xl font-semibold">Sistema de Vistoria ABPAC</h2>
        <p className="text-muted-foreground">Redirecionando para login...</p>
      </div>
    </div>
  );
}
