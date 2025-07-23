'use client';

import { useAuth } from '@/contexts/SimpleAuthContext';
import { useState, useEffect } from 'react';

export default function TestHydrationSimplePage() {
  const { authState, setTechnicianName } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [displayName, setDisplayName] = useState<string>('TÉCNICO ABPAC');

  // Marcar hidratação
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Atualizar nome APENAS após hidratação
  useEffect(() => {
    if (isHydrated) {
      const realName = authState.technicianName || 'TÉCNICO ABPAC';
      setDisplayName(realName);
      console.log('✅ Nome atualizado após hidratação:', realName);
    }
  }, [isHydrated, authState.technicianName]);

  const testSetName = () => {
    const testName = 'Teste Hidratação Simples';
    setTechnicianName(testName);
    console.log('🧪 Nome definido:', testName);
  };

  const reloadPage = () => {
    console.log('🔄 Recarregando página...');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          🧪 Teste Hidratação Ultra Simples
        </h1>
        
        <div className="text-3xl font-bold text-blue-600 p-4 bg-blue-50 rounded-lg">
          Bem-vindo, {displayName}!
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>isHydrated:</strong> {isHydrated ? '✅ Sim' : '❌ Não'}</p>
            <p><strong>authState.technicianName:</strong> {authState.technicianName || 'null'}</p>
            <p><strong>displayName:</strong> {displayName}</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={testSetName}
              className="w-full bg-green-500 text-white py-3 px-6 rounded text-lg hover:bg-green-600"
            >
              🧪 Definir Nome: "Teste Hidratação Simples"
            </button>
            
            <button
              onClick={reloadPage}
              className="w-full bg-red-500 text-white py-3 px-6 rounded text-lg hover:bg-red-600"
            >
              🔄 RECARREGAR PÁGINA (Teste Critical)
            </button>
          </div>

          <div className="text-sm text-gray-500 bg-yellow-50 p-4 rounded">
            <p><strong>⚠️ TESTE CRÍTICO:</strong></p>
            <p>1. Abra Console (F12)</p>
            <p>2. Clique "Definir Nome"</p>
            <p>3. Clique "RECARREGAR PÁGINA"</p>
            <p>4. <strong>NÃO deve aparecer "Hydration failed" no console!</strong></p>
          </div>

          <div className="space-y-1">
            <a href="/dashboard" className="block bg-blue-500 text-white py-2 px-4 rounded">📊 Dashboard</a>
            <a href="/test-hydration" className="block bg-purple-500 text-white py-2 px-4 rounded">🧪 Teste Completo</a>
          </div>
        </div>
      </div>
    </div>
  );
} 