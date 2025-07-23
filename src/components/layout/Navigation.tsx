'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  BarChart3,
  FileText,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
}

interface NavigationProps {
  className?: string;
}

/**
 * Navegação principal da aplicação
 * - Responsiva (horizontal no desktop, vertical no mobile)
 * - Destaque para item ativo
 * - Badges para notificações
 * - Tema ABPAC
 */
export function Navigation({ className = '' }: NavigationProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Items da navegação
  const navigationItems: NavigationItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral do sistema',
    },
    {
      href: '/vistorias',
      label: 'Vistorias',
      icon: ClipboardList,
      description: 'Gerenciar vistorias pendentes',
    },
    {
      href: '/relatorios',
      label: 'Relatórios',
      icon: BarChart3,
      description: 'Estatísticas e dados',
    },
    {
      href: '/documentos',
      label: 'Documentos',
      icon: FileText,
      description: 'Arquivos e evidências',
    },
    {
      href: '/sincronizacao',
      label: 'Sincronização',
      icon: RefreshCw,
      description: 'Status e controle de sync',
    },
    {
      href: '/configuracoes',
      label: 'Configurações',
      icon: Settings,
      description: 'Preferências do sistema',
    },
  ];

  if (!mounted) {
    return (
      <nav className={cn('border-b bg-background/95 backdrop-blur', className)}>
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center space-x-4 overflow-x-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-muted/50 rounded animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'border-b bg-background/95 backdrop-blur',
        'sticky top-16 z-40', // Fica abaixo do header
        className
      )}
    >
      <div className="container px-4 sm:px-6 lg:px-8">
        {/* Desktop: Navegação horizontal */}
        <div className="hidden md:flex h-12 items-center space-x-1 overflow-x-auto">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                  'hover:bg-muted/50 hover:text-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'relative group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                />
                <span className="flex-shrink-0">{item.label}</span>

                {/* Badge se houver */}
                {item.badge && (
                  <span
                    className={cn(
                      'ml-2 px-2 py-0.5 text-xs rounded-full font-medium',
                      isActive
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip no hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                  {item.description}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile: Navegação em grid compacto */}
        <div className="md:hidden py-3">
          <div className="grid grid-cols-3 gap-2">
            {navigationItems.slice(0, 6).map(item => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center space-y-1 p-3 rounded-lg text-xs font-medium transition-all',
                    'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    'relative',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}
                    />

                    {/* Badge se houver */}
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                        {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      'text-center leading-tight',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {item.label}
                  </span>

                  {/* Indicador visual para item ativo */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg border-2 border-primary-foreground/20" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breadcrumb para contexto adicional */}
      {pathname !== '/dashboard' && (
        <div className="border-t bg-muted/20">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-2 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">
                {navigationItems.find(item => isActiveRoute(item.href))?.label || 'Página'}
              </span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
