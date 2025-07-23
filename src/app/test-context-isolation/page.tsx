'use client';

import { useAuth } from '@/contexts/SimpleAuthContext';
import { useState, useEffect } from 'react';

export default function TestContextIsolationPage() {
  const { authState, setTechnicianName } = useAuth();
  const [clientInfo, setClientInfo] = useState<any>({
    isClient: false,
    timestamp: null,
    userAgent: null,
  });

  useEffect(() => {
    setClientInfo({
      isClient: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50) + '...',
    });
  }, []);

  const testSetName = () => {
    const testName = 'Context Test ' + new Date().getTime();
    setTechnicianName(testName);
  };

  const reloadTest = () => {
    console.log('🔄 TESTE CRÍTICO - Recarregando para verificar hydration...');
    console.log('📊 Estado antes do reload:', authState);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            🔬 Isolamento do Contexto
          </h1>
          <p className="text-gray-600 mt-2">
            Identificando fonte exata do hydration error
          </p>
        </div>

        {/* Info do Ambiente */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            🌍 Informações do Ambiente:
          </h2>
          <div className="text-sm text-blue-700 space-y-1 font-mono">
            <p><strong>clientInfo.isClient:</strong> {clientInfo.isClient ? '✅ Cliente' : '❌ Servidor'}</p>
            <p><strong>typeof window:</strong> {typeof window}</p>
            <p><strong>clientInfo.timestamp:</strong> {clientInfo.timestamp || 'null'}</p>
            <p><strong>userAgent:</strong> {clientInfo.userAgent || 'Não disponível'}</p>
          </div>
        </div>

        {/* Estado do Contexto */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            📋 Estado do SimpleAuthContext:
          </h2>
          <div className="text-sm text-green-700 space-y-1 font-mono">
            <p><strong>authState.initialized:</strong> 
              <span className={authState.initialized ? 'text-green-600' : 'text-red-600'}>
                {authState.initialized ? '✅ Inicializado' : '❌ Não inicializado'}
              </span>
            </p>
            <p><strong>authState.loading:</strong> 
              <span className={authState.loading ? 'text-orange-600' : 'text-green-600'}>
                {authState.loading ? '🔄 Carregando' : '✅ Pronto'}
              </span>
            </p>
            <p><strong>authState.isAuthenticated:</strong> 
              <span className={authState.isAuthenticated ? 'text-green-600' : 'text-gray-600'}>
                {authState.isAuthenticated ? '✅ Autenticado' : '❌ Não autenticado'}
              </span>
            </p>
            <p><strong>authState.technicianName:</strong> 
              <span className={authState.technicianName ? 'text-blue-600 font-bold' : 'text-gray-500'}>
                {authState.technicianName || 'null'}
              </span>
            </p>
            <p><strong>authState.token:</strong> 
              <span className={authState.token ? 'text-purple-600' : 'text-gray-500'}>
                {authState.token ? authState.token.substring(0, 20) + '...' : 'null'}
              </span>
            </p>
            <p><strong>authState.error:</strong> 
              <span className={authState.error ? 'text-red-600' : 'text-gray-500'}>
                {authState.error || 'null'}
              </span>
            </p>
          </div>
        </div>

        {/* Área de Teste Crítico */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            ⚠️ Área de Teste Crítico:
          </h2>
          
          <div className="space-y-3">
            <div className="text-2xl font-bold text-red-900 p-3 bg-white rounded border">
              {/* Esta linha deve ser idêntica no servidor e cliente */}
              Bem-vindo, {authState.technicianName || 'TÉCNICO ABPAC'}!
            </div>
            
            <button
              onClick={testSetName}
              className="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
            >
              🧪 Definir Nome Técnico
            </button>
            
            <button
              onClick={reloadTest}
              className="w-full bg-red-600 text-white py-3 px-4 rounded text-lg font-bold hover:bg-red-700"
            >
              🔄 TESTE CRÍTICO: RELOAD
            </button>
          </div>
        </div>

        {/* Instruções de Debug */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            🔍 Como Debugar:
          </h2>
          <ol className="text-yellow-700 text-sm space-y-1">
            <li>1. <strong>Abra Console (F12)</strong> e observe os logs do contexto</li>
            <li>2. <strong>Defina um nome técnico</strong> para alterar o estado</li>
            <li>3. <strong>Clique em RELOAD</strong> - observe se há "Hydration failed"</li>
            <li>4. <strong>Verifique logs</strong>: "Servidor - retornando estado padrão" vs "Cliente - retornando estado padrão"</li>
            <li>5. <strong>Se ainda houver erro</strong>, o problema está na diferença de estados entre servidor/cliente</li>
          </ol>
        </div>

        {/* Navegação */}
        <div className="grid grid-cols-3 gap-4">
          <a href="/test-hydration-client-only" className="block bg-green-500 text-white py-2 px-4 rounded text-center hover:bg-green-600">
            🚀 Client Only
          </a>
          <a href="/dashboard" className="block bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600">
            📊 Dashboard
          </a>
          <a href="/test-hydration-simple" className="block bg-purple-500 text-white py-2 px-4 rounded text-center hover:bg-purple-600">
            🧪 Teste Simples
          </a>
        </div>
      </div>
    </div>
  );
} 