'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

// REMOVIDO: const inter = Inter({ subsets: ['latin'] });
// Fontes são gerenciadas no layout.tsx principal

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  className?: string;
}

/**
 * Layout principal da aplicação com tema ABPAC
 * - Header com logo e conectividade
 * - Navigation responsiva (quando autenticado)
 * - Área de conteúdo principal
 * - Footer com informações de versão
 */
export function AppLayout({ children, showNavigation = true, className = '' }: AppLayoutProps) {
  const { authState } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Verificar se deve mostrar navegação
  const shouldShowNavigation = showNavigation && authState.isAuthenticated && pathname !== '/login';

  return (
    <div
      className={cn(
        'min-h-screen bg-background flex flex-col',
        'text-foreground antialiased',
        // inter.className, // REMOVIDO: Inter font
        className
      )}
    >
      {/* Header sempre visível */}
      <Header />

      {/* Navigation apenas quando autenticado */}
      {shouldShowNavigation && <Navigation />}

      {/* Área de conteúdo principal */}
      <main
        className={cn(
          'flex-1 w-full',
          // Responsive padding
          'px-4 py-6',
          'sm:px-6 sm:py-8',
          'lg:px-8',
          // Container constraints
          'max-w-7xl mx-auto',
          // Mobile optimizations
          'relative overflow-x-hidden'
        )}
      >
        {children}
      </main>

      {/* Footer sempre visível */}
      <Footer />
    </div>
  );
}

/**
 * Layout simples para páginas sem navegação (ex: login)
 */
export function SimpleLayout({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AppLayout
      showNavigation={false}
      className={cn('bg-gradient-to-br from-background to-muted/50', className)}
    >
      {children}
    </AppLayout>
  );
}

/**
 * Layout para páginas autenticadas com navegação completa
 */
export function AuthenticatedLayout({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AppLayout showNavigation={true} className={className}>
      {children}
    </AppLayout>
  );
}
