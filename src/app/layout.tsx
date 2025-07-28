import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SimpleAuthProvider } from '@/contexts/SimpleAuthContext';
// import { LocalVistoriaProvider } from '@/contexts/LocalVistoriaContext';
// import { OfflineProvider } from "@/contexts/OfflineContext"; // DESABILITADO - CAUSANDO ERRO WEBPACK
import { Toaster } from '@/components/ui/toaster';
import { ServiceInitializer } from '@/components/providers/ServiceInitializer';

// Configurar a fonte Inter corretamente
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistema de Vistorias ABPAC',
  description: 'Sistema para técnicos realizarem vistorias de equipamentos de segurança',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#ffffff',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SimpleAuthProvider>
          <ServiceInitializer />
          {/* <LocalVistoriaProvider> TEMPORARIAMENTE DESABILITADO PARA DEBUG */}
          {children}
          {/* </LocalVistoriaProvider> */}
          <Toaster />
        </SimpleAuthProvider>
      </body>
    </html>
  );
}
