'use client';

import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext';
import { useState, useEffect } from 'react';

export default function TestHydrationPage() {
  const { authState, setTechnicianName } = useAuth();
  const { name, isAuthenticated } = useTechnician();
  const [isHydrated, setIsHydrated] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState<string>('TÉCNICO ABPAC');

  useEffect(() => {
    addTestResult('✅ Componente montado no cliente');
    setIsHydrated(true);
  }, []);

  // Efeito para atualizar nome APENAS após hidratação (igual dashboard)
  useEffect(() => {
    if (isHydrated) {
      const realName = authState.technicianName || name || 'TÉCNICO ABPAC';
      setDisplayName(realName);
      addTestResult(`🔄 Nome atualizado para: ${realName}`);
    }
  }, [isHydrated, authState.technicianName, name]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testHydrationSafe = () => {
    const testName = 'Carlos Santos - Teste Hidratação';
    addTestResult('🧪 Definindo nome do técnico...');
    
    setTechnicianName(testName);
    
    setTimeout(() => {
      addTestResult(`✅ Nome definido: ${testName}`);
      addTestResult('🔄 Aguarde 2s e recarregue a página para testar hidratação');
    }, 100);
  };

  const reloadPageTest = () => {
    addTestResult('🔄 Recarregando página para testar hidratação...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Simular comportamento do dashboard
  // const displayName = isHydrated 
  //   ? (authState.technicianName || name || 'TÉCNICO ABPAC')
  //   : 'TÉCNICO ABPAC';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            🧪 Teste de Correção do Hydration Error
          </h1>
          
          <div className="space-y-6">
            {/* Simulação do Dashboard */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                🎯 Simulação Dashboard (com suppressHydrationWarning):
              </h2>
              <div className="text-2xl font-bold text-green-900">
                Bem-vindo, {displayName}!
              </div>
              <p className="text-sm text-green-700 mt-2">
                ☝️ Este texto deve aparecer SEM erro de hidratação no console
              </p>
            </div>

            {/* Estado de Hidratação */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Estado de Hidratação:
              </h2>
              <div className="text-sm text-blue-700 space-y-1 font-mono">
                <p><strong>isHydrated:</strong> 
                  <span className={isHydrated ? 'text-green-600' : 'text-red-600'}>
                    {isHydrated ? 'Sim (Cliente)' : 'Não (Servidor)'}
                  </span>
                </p>
                <p><strong>authState.technicianName:</strong> 
                  <span className={authState.technicianName ? 'text-green-600 font-bold' : 'text-gray-500'}>
                    {authState.technicianName || 'null'}
                  </span>
                </p>
                <p><strong>displayName:</strong> 
                  <span className="text-purple-600 font-bold">
                    {displayName}
                  </span>
                </p>
              </div>
            </div>

            {/* Controles de Teste */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                Testes de Hidratação:
              </h2>
              <div className="space-y-2">
                <button
                  onClick={testHydrationSafe}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700"
                >
                  🧪 Definir Nome (Carlos Santos)
                </button>
                <button
                  onClick={reloadPageTest}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
                >
                  🔄 Recarregar e Testar Hidratação
                </button>
              </div>
            </div>

            {/* Log de Resultados */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                📋 Log de Testes:
              </h2>
              <div className="text-sm text-gray-700 font-mono space-y-1 max-h-40 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="border-b border-gray-200 pb-1">
                    {result}
                  </div>
                ))}
                {testResults.length === 0 && (
                  <p className="text-gray-500">Nenhum teste executado ainda...</p>
                )}
              </div>
            </div>

            {/* Como Testar */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                🔍 Como Verificar se o Erro Foi Corrigido:
              </h2>
              <ol className="text-red-700 text-sm space-y-1">
                <li>1. Abra o Console do Navegador (F12)</li>
                <li>2. Clique em "🧪 Definir Nome (Carlos Santos)"</li>
                <li>3. Clique em "🔄 Recarregar e Testar Hidratação"</li>
                <li>4. <strong>Verifique no console:</strong> NÃO deve aparecer "Hydration failed"</li>
                <li>5. O nome deve mudar corretamente SEM erro vermelho</li>
              </ol>
            </div>

            {/* Navegação */}
            <div className="space-y-2">
              <a 
                href="/dashboard" 
                className="block text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                📊 Dashboard Real (Testado)
              </a>
              <a 
                href="/test-localstorage" 
                className="block text-center bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
              >
                🗄️ Teste LocalStorage
              </a>
              <a 
                href="/test-dashboard" 
                className="block text-center bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
              >
                🧪 Teste Dashboard Original
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 