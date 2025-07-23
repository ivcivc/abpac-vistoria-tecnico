'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Componente que só roda no cliente (SEM SSR)
const ClientOnlyTechnicianWelcome = dynamic(
  () => import('@/components/ClientOnlyTechnicianWelcome'),
  { 
    ssr: false,
    loading: () => <div className="text-3xl font-bold text-gray-400">Carregando...</div>
  }
);

export default function TestHydrationClientOnlyPage() {
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const reloadPage = () => {
    addLog('🔄 Recarregando página para teste final...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Teste Client-Only (SEM SSR)
          </h1>
          <p className="text-gray-600">
            Este componente é renderizado APENAS no cliente para eliminar hydration error
          </p>
        </div>

        {/* Componente Client-Only */}
        <div className="border-4 border-green-200 bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            🎯 Área Client-Only (SEM SSR):
          </h2>
          <ClientOnlyTechnicianWelcome onLog={addLog} />
        </div>

        {/* Controles */}
        <div className="space-y-4">
          <button
            onClick={reloadPage}
            className="w-full bg-red-500 text-white py-4 px-6 rounded-lg text-xl font-bold hover:bg-red-600"
          >
            🔄 TESTE CRÍTICO: RECARREGAR PÁGINA
          </button>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ TESTE DEFINITIVO:</h3>
            <ol className="text-yellow-700 space-y-1">
              <li>1. Abra Console (F12)</li>
              <li>2. Defina um nome técnico</li>
              <li>3. Clique "TESTE CRÍTICO: RECARREGAR PÁGINA"</li>
              <li>4. <strong className="text-red-600">SE ainda aparecer "Hydration failed", o problema está no contexto raiz</strong></li>
            </ol>
          </div>
        </div>

        {/* Log */}
        <div className="bg-gray-50 border p-4 rounded-lg">
          <h3 className="font-bold text-gray-800 mb-2">📋 Log de Eventos:</h3>
          <div className="text-sm text-gray-700 space-y-1 max-h-32 overflow-y-auto">
            {testLog.map((log, index) => (
              <div key={index} className="border-b border-gray-200 pb-1">
                {log}
              </div>
            ))}
            {testLog.length === 0 && (
              <p className="text-gray-500">Aguardando eventos...</p>
            )}
          </div>
        </div>

        {/* Navegação */}
        <div className="grid grid-cols-2 gap-4">
          <a href="/dashboard" className="block bg-blue-500 text-white py-3 px-4 rounded text-center hover:bg-blue-600">
            📊 Dashboard
          </a>
          <a href="/test-hydration-simple" className="block bg-purple-500 text-white py-3 px-4 rounded text-center hover:bg-purple-600">
            🧪 Teste Simples
          </a>
        </div>
      </div>
    </div>
  );
} 