'use client';

import { useAuth } from '@/contexts/SimpleAuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireToken?: boolean; // Se true, exige que tenha token válido
}

export function ProtectedRoute({ children, requireToken = true }: ProtectedRouteProps) {
  const { authState } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Aguardar inicialização do contexto
    if (!authState.initialized) {
      return;
    }

    console.log('🛡️ [PROTECTED-ROUTE] Verificando acesso...');
    console.log('🛡️ [PROTECTED-ROUTE] isAuthenticated:', authState.isAuthenticated);
    console.log('🛡️ [PROTECTED-ROUTE] token:', authState.token ? 'presente' : 'ausente');
    console.log('🛡️ [PROTECTED-ROUTE] technicianName:', authState.technicianName);
    console.log('🛡️ [PROTECTED-ROUTE] requireToken:', requireToken);

    // Verificar se está autenticado
    if (!authState.isAuthenticated) {
      console.log('❌ [PROTECTED-ROUTE] Usuário não autenticado, redirecionando para login');
      router.push('/login');
      return;
    }

    // Se requireToken é true, verificar se tem token válido
    if (requireToken && !authState.token) {
      console.log('❌ [PROTECTED-ROUTE] Token requerido mas ausente, redirecionando para login');
      router.push('/login');
      return;
    }

    // MODIFICADO: Permitir acesso mesmo sem nome do técnico
    // O nome pode ser definido durante o fluxo, não é requisito absoluto
    // if (requireToken && !authState.technicianName) {
    //   console.log('⚠️ [PROTECTED-ROUTE] Token presente mas sem nome técnico, redirecionando para login');
    //   router.push('/login');
    //   return;
    // }

    // Log se não tem nome mas vai permitir acesso
    if (requireToken && !authState.technicianName) {
      console.log('⚠️ [PROTECTED-ROUTE] Sem nome técnico, mas permitindo acesso (será "TÉCNICO ABPAC")');
    }

    console.log('✅ [PROTECTED-ROUTE] Acesso autorizado');
    setIsChecking(false);

  }, [authState.initialized, authState.isAuthenticated, authState.token, authState.technicianName, requireToken, router]);

  // Mostrar loading enquanto verifica
  if (isChecking || !authState.initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold">Verificando Acesso...</h2>
          <p className="text-muted-foreground">Validando autenticação</p>
        </div>
      </div>
    );
  }

  // Se chegou até aqui, pode renderizar o conteúdo protegido
  return <>{children}</>;
} 