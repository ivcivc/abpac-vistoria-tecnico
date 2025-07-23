import type { NextConfig } from 'next';

// PWA COMPLETAMENTE REMOVIDO - CAUSANDO PROBLEMAS DE CACHE
// const withPWA = require('next-pwa')({ ... });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: process.env.NODE_ENV === 'development' // Desabilitar otimização em dev
  },
  // Headers de PWA removidos junto com a funcionalidade
};

export default nextConfig; // PWA REMOVIDO COMPLETAMENTE
