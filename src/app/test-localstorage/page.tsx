'use client';

import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext';
import { useEffect, useState } from 'react';

export default function TestLocalStoragePage() {
  const { authState, setTechnicianName, logout } = useAuth();
  const { name, isAuthenticated } = useTechnician();
  const [localStorageData, setLocalStorageData] = useState<any>(null);

  useEffect(() => {
    const updateLocalStorageData = () => {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('vistoria_auth_state');
        setLocalStorageData(data ? JSON.parse(data) : null);
      }
    };

    updateLocalStorageData();
    const interval = setInterval(updateLocalStorageData, 1000);
    return () => clearInterval(interval);
  }, []);

  const testSetName = () => {
    const testName = 'Maria Santos - LocalStorage Test';
    setTechnicianName(testName);
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            🗄️ Teste de Persistência LocalStorage
          </h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Estado do Contexto (Tempo Real):
              </h2>
              <div className="text-sm text-blue-700 space-y-1 font-mono">
                <p><strong>authState.technicianName:</strong> 
                  <span className={authState.technicianName ? 'text-green-600 font-bold' : 'text-red-600'}>
                    {authState.technicianName || 'null'}
                  </span>
                </p>
                <p><strong>authState.isAuthenticated:</strong> 
                  <span className={authState.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {authState.isAuthenticated ? 'Sim' : 'Não'}
                  </span>
                </p>
                <p><strong>authState.initialized:</strong> 
                  <span className={authState.initialized ? 'text-green-600' : 'text-red-600'}>
                    {authState.initialized ? 'Sim' : 'Não'}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-800 mb-2">
                LocalStorage (Tempo Real):
              </h2>
              <div className="text-sm text-purple-700 font-mono">
                {localStorageData ? (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(localStorageData, null, 2)}
                  </pre>
                ) : (
                  <p className="text-red-600">Nenhum dado no localStorage</p>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Testes de Persistência:
              </h2>
              <div className="space-y-2">
                <button
                  onClick={testSetName}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  🧪 Definir Nome: "Maria Santos - LocalStorage Test"
                </button>
                <button
                  onClick={reloadPage}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  🔄 Recarregar Página (Teste Persistência)
                </button>
                <button
                  onClick={logout}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  🚪 Logout (Limpar Dados)
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                Como Testar:
              </h2>
              <ol className="text-yellow-700 text-sm space-y-1">
                <li>1. Clique em "🧪 Definir Nome" - deve aparecer nos dois blocos acima</li>
                <li>2. Clique em "🔄 Recarregar Página" - nome deve persistir após reload</li>
                <li>3. Vá para <a href="/dashboard" className="text-blue-600 underline">/dashboard</a> - deve mostrar nome correto</li>
                <li>4. Clique em "🚪 Logout" para limpar e testar estado inicial</li>
              </ol>
            </div>

            <div className="space-y-2">
              <a 
                href="/dashboard" 
                className="block text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                📊 Ir para Dashboard
              </a>
              <a 
                href="/test-dashboard" 
                className="block text-center bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
              >
                🧪 Teste Dashboard Original
              </a>
              <a 
                href="/login" 
                className="block text-center bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Voltar ao Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 