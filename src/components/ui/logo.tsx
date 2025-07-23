import dynamic from 'next/dynamic';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  fallbackText?: boolean;
}

// Import dinâmico com SSR desabilitado para evitar hydration error COMPLETAMENTE
const LogoClient = dynamic(
  () => import('./LogoClient').then(mod => ({ default: mod.LogoClient })),
  {
    ssr: false,
    loading: () => (
      <div className="w-32 h-20 bg-gray-100 rounded-lg p-2 flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
      </div>
    ),
  }
);

/**
 * Componente Logo ABPAC - 100% Client-Side
 * - ZERO hydration errors (SSR = false)
 * - Fallback automático se imagem falhar
 * - Carregamento suave com skeleton
 */
export function Logo(props: LogoProps) {
  return <LogoClient {...props} />;
}
