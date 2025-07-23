'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  Tablet,
  Github,
  ExternalLink,
  Heart,
} from 'lucide-react';

interface FooterProps {
  className?: string;
}

/**
 * Rodapé da aplicação com informações de versão e sistema
 * - Informações da ABPAC
 * - Versão do sistema
 * - Status do ambiente
 * - Links úteis
 * - Responsivo
 */
export function Footer({ className = '' }: FooterProps) {
  const [mounted, setMounted] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);

    // Detectar tipo de dispositivo
    const detectDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDeviceType();
    window.addEventListener('resize', detectDeviceType);

    return () => window.removeEventListener('resize', detectDeviceType);
  }, []);

  if (!mounted) {
    return (
      <footer className={cn('border-t bg-muted/30 mt-auto', className)}>
        <div className="container px-4 py-4">
          <div className="h-16 bg-muted/50 rounded animate-pulse" />
        </div>
      </footer>
    );
  }

  // Informações do sistema
  const systemInfo = {
    version: '1.0.0',
    buildDate: new Date().toLocaleDateString('pt-BR'),
    environment: process.env.NODE_ENV,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };

  const DeviceIcon =
    deviceType === 'mobile' ? Smartphone : deviceType === 'tablet' ? Tablet : Monitor;

  return (
    <footer
      className={cn(
        'border-t bg-muted/30 mt-auto',
        'print:hidden', // Ocultar na impressão
        className
      )}
    >
      <div className="container px-4 sm:px-6 lg:px-8">
        {/* Desktop: Layout horizontal */}
        <div className="hidden md:flex items-center justify-between py-4">
          {/* Informações da ABPAC */}
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-sm font-medium text-foreground">Sistema de Vistoria ABPAC</p>
              <p className="text-xs text-muted-foreground">
                Associação Brasileira de Proteção Automotiva e Cidadania
              </p>
            </div>
          </div>

          {/* Informações do sistema */}
          <div className="flex items-center space-x-6 text-xs text-muted-foreground">
            {/* Versão */}
            <div className="flex items-center space-x-1">
              <span>v{systemInfo.version}</span>
              {systemInfo.environment === 'development' && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                  DEV
                </span>
              )}
            </div>

            {/* Dispositivo */}
            <div className="flex items-center space-x-1">
              <DeviceIcon className="h-3 w-3" />
              <span className="capitalize">{deviceType}</span>
            </div>

            {/* Status Online */}
            <div className="flex items-center space-x-1">
              {systemInfo.isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
            </div>

            {/* Build */}
            <span>Build: {systemInfo.buildDate}</span>
          </div>
        </div>

        {/* Mobile: Layout vertical compacto */}
        <div className="md:hidden py-3 space-y-3">
          {/* ABPAC Info */}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Sistema de Vistoria ABPAC</p>
            <p className="text-xs text-muted-foreground">Proteção Automotiva e Cidadania</p>
          </div>

          {/* System Status */}
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <span>v{systemInfo.version}</span>
              {systemInfo.environment === 'development' && (
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                  DEV
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <DeviceIcon className="h-3 w-3" />
              <span className="capitalize">{deviceType}</span>
            </div>

            <div className="flex items-center space-x-1">
              {systemInfo.isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Links e informações adicionais */}
        <div className="border-t border-border/50 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>© 2025 ABPAC. Todos os direitos reservados.</span>
              <Heart className="h-3 w-3 text-red-500" />
            </div>

            {/* Links úteis */}
            <div className="flex items-center space-x-4 text-xs">
              <Link
                href="/privacidade"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacidade
              </Link>
              <Link
                href="/termos"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Termos
              </Link>
              <Link
                href="/ajuda"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Ajuda
              </Link>
              {systemInfo.environment === 'development' && (
                <Link
                  href="/debug"
                  className="text-orange-600 hover:text-orange-700 transition-colors flex items-center space-x-1"
                >
                  <span>Debug</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
