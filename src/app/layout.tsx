import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext';
import { LocalVistoriaProvider } from '@/contexts/LocalVistoriaContext';
// import { OfflineProvider } from "@/contexts/OfflineContext"; // DESABILITADO - CAUSANDO ERRO WEBPACK

// Configurar a fonte Inter corretamente
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistema de Vistoria ABPAC - Técnicos',
  description: 'Sistema de vistoria para técnicos de campo da ABPAC - Funciona offline',
  generator: 'Next.js',
  keywords: ['vistoria', 'abpac', 'técnico', 'offline', 'pwa'],
  authors: [
    {
      name: 'ABPAC',
      url: 'https://abpac.com.br',
    },
  ],
  icons: {
    icon: '/favicon.svg',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SimpleAuthProvider>
          {/* <LocalVistoriaProvider> TEMPORARIAMENTE DESABILITADO PARA DEBUG */}
          {children}
          {/* </LocalVistoriaProvider> */}
        </SimpleAuthProvider>
      </body>
    </html>
  );
}
