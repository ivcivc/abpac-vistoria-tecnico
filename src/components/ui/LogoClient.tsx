'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LogoClientProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  fallbackText?: boolean;
}

/**
 * Componente Logo ABPAC - APENAS CLIENT-SIDE
 * - Nunca renderiza no servidor (SSR = false)
 * - Elimina hydration errors completamente
 * - Fallback para texto se imagem falhar
 */
export function LogoClient({
  size = 'medium',
  className = '',
  fallbackText = true,
}: LogoClientProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Definir tamanhos
  const sizes = {
    small: { width: 40, height: 25, containerClass: 'w-10 h-6' },
    medium: { width: 120, height: 75, containerClass: 'w-32 h-20' },
    large: { width: 160, height: 100, containerClass: 'w-40 h-24' },
  };

  const sizeConfig = sizes[size];

  useEffect(() => {
    // Simular pequeno delay para evitar flash
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Se ainda está carregando, mostrar skeleton
  if (loading) {
    return (
      <div
        className={`${sizeConfig.containerClass} bg-gray-100 rounded-lg p-2 flex items-center justify-center ${className}`}
      >
        <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
      </div>
    );
  }

  // Se houve erro na imagem e fallback está habilitado, mostrar texto
  if (imageError && fallbackText) {
    return (
      <div
        className={`${sizeConfig.containerClass} bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold ${className}`}
      >
        <span className={size === 'small' ? 'text-xs' : size === 'large' ? 'text-xl' : 'text-sm'}>
          ABPAC
        </span>
      </div>
    );
  }

  // Tentar carregar a imagem
  return (
    <div
      className={`${sizeConfig.containerClass} bg-white rounded-lg p-2 flex items-center justify-center relative ${className}`}
    >
      <Image
        src="/images/logo-colorida.jpg"
        alt="ABPAC - Associação Brasileira de Proteção Automotiva e Cidadania"
        width={sizeConfig.width}
        height={sizeConfig.height}
        className={`object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        priority={size === 'medium' || size === 'large'}
        unoptimized={process.env.NODE_ENV === 'development'}
        onLoad={() => {
          setImageLoaded(true);
        }}
        onError={() => {
          console.warn('⚠️ Falha ao carregar logo ABPAC, usando fallback');
          setImageError(true);
        }}
      />

      {/* Placeholder durante carregamento da imagem */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
        </div>
      )}
    </div>
  );
}
