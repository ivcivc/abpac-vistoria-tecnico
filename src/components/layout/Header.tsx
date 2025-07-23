'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { ConnectivityIndicator } from '@/components/offline/ConnectivityIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

/**
 * Cabeçalho da aplicação com tema ABPAC
 * - Logo da ABPAC (responsiva)
 * - Indicador de conectividade
 * - Menu mobile
 * - Informações do usuário autenticado
 */
export function Header({ className = '' }: HeaderProps) {
  const { authState, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="h-8 w-32 bg-muted/50 rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
        </div>
      </header>
    );
  }

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'shadow-sm',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo da ABPAC - Responsivo */}
        <div className="flex items-center space-x-3">
          <Link
            href={authState.isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <Image
                src="/images/logo-colorida.jpg"
                alt="ABPAC"
                width={120}
                height={48}
                className="h-8 w-auto object-contain sm:h-10 md:h-12"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop: Conectividade e Usuário */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Indicador de Conectividade */}
          <ConnectivityIndicator showDetails={false} />

          {/* Informações do Usuário */}
          {authState.isAuthenticated && (
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted/50">
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {authState.technicianName || 'Técnico'}
                </p>
                <p className="text-xs text-muted-foreground">Autenticado</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile: Menu Hamburger */}
        <div className="flex md:hidden items-center space-x-2">
          {/* Conectividade compacta no mobile */}
          <ConnectivityIndicator showDetails={false} className="scale-90" />

          {/* Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-10 w-10"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="container py-4 px-4 space-y-3">
            {/* Conectividade detalhada no mobile */}
            <div className="p-3 rounded-lg bg-muted/30">
              <ConnectivityIndicator showDetails={true} />
            </div>

            {/* Informações do usuário */}
            {authState.isAuthenticated && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {authState.technicianName || 'Técnico'}
                    </p>
                    <p className="text-xs text-muted-foreground">Sessão ativa</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
