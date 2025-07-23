'use client';

import { useAuth } from '@/contexts/SimpleAuthContext';

export default function TestSimplePage() {
  const { authState, clearError } = useAuth();

  const handleTest = () => {
    try {
      clearError();
      alert('✅ Função clearError() funcionando!');
    } catch (error) {
      alert('❌ Erro: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">🧪 Teste Simples</h1>

          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded">
              <h2 className="font-semibold mb-2">Estado do Context:</h2>
              <p>Autenticado: {authState.isAuthenticated ? 'Sim' : 'Não'}</p>
              <p>Carregando: {authState.loading ? 'Sim' : 'Não'}</p>
              <p>Erro: {authState.error || 'Nenhum'}</p>
            </div>

            <button
              onClick={handleTest}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Testar clearError()
            </button>

            <div className="space-y-2">
              <a
                href="/login"
                className="block text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Ir para Login
              </a>
              <a
                href="/debug-token"
                className="block text-center bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
              >
                Debug Token
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
