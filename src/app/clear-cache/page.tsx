'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const [status, setStatus] = useState<string>('🧹 Limpando cache...');
  const [countdown, setCountdown] = useState<number>(3);
  const router = useRouter();

  useEffect(() => {
    const clearEverything = async () => {
      try {
        console.log('🚨 LIMPEZA AGRESSIVA DE CACHE INICIADA');

        // 1. Desregistrar todos os Service Workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log(`📱 Encontrados ${registrations.length} service workers`);
          for (const registration of registrations) {
            await registration.unregister();
            console.log('🗑️ Service worker removido:', registration.scope);
          }
        }

        // 2. Limpar todas as caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log(`🗄️ Encontradas ${cacheNames.length} caches`);
          for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log('🗑️ Cache removida:', cacheName);
          }
        }

        // 3. Limpar localStorage e sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        console.log('🗑️ Storage local limpo');

        // 4. Limpar IndexedDB
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            for (const db of databases) {
              if (db.name) {
                indexedDB.deleteDatabase(db.name);
                console.log('🗑️ IndexedDB removido:', db.name);
              }
            }
          } catch (e) {
            console.log('⚠️ Erro ao limpar IndexedDB (normal):', e);
          }
        }

        console.log('✅ LIMPEZA COMPLETA!');
        setStatus('✅ Cache limpo! Redirecionando...');

        // Contador regressivo
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              // Forçar reload completo com timestamp para evitar cache
              const timestamp = Date.now();
              window.location.replace(`/login?v=${timestamp}`);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        console.error('❌ Erro na limpeza:', error);
        setStatus('❌ Erro na limpeza. Redirecionando mesmo assim...');
        setTimeout(() => {
          window.location.replace('/login?v=' + Date.now());
        }, 2000);
      }
    };

    clearEverything();
  }, []);

  const handleManualRedirect = () => {
    window.location.replace('/login?v=' + Date.now());
  };

  const handleForceRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Limpeza de Cache</h1>
          <p className="text-lg font-medium text-gray-700 mb-4">{status}</p>

          {countdown > 0 && (
            <p className="text-gray-600">Redirecionando em {countdown} segundos...</p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleManualRedirect}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Ir para Login Agora
          </button>

          <button
            onClick={handleForceRefresh}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            🔃 Executar Limpeza Novamente
          </button>
        </div>

        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3 text-sm">
              <p className="font-medium text-yellow-800">Chrome - Limpeza Manual</p>
              <p className="text-yellow-700 mt-1">
                Se ainda aparecer versão antiga: <br />
                <strong>Ctrl+Shift+R</strong> ou F12 → Application → Storage → Clear storage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
