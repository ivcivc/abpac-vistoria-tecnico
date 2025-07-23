'use client';

import { useAuth } from '@/contexts/SimpleAuthContext';

export default function TestClearErrorPage() {
  const { authState, clearError } = useAuth();

  const testClearError = () => {
    try {
      clearError();
      console.log('✅ clearError funcionou corretamente!');
      alert('✅ clearError funcionou corretamente!');
    } catch (error) {
      console.error('❌ Erro ao chamar clearError:', error);
      alert('❌ Erro ao chamar clearError: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">🧪 Teste da Função clearError</h1>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Estado Atual do Auth:</h2>
              <pre className="text-sm text-blue-700 overflow-auto">
                {JSON.stringify(
                  {
                    isAuthenticated: authState.isAuthenticated,
                    loading: authState.loading,
                    error: authState.error,
                    initialized: authState.initialized,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">Teste da Função:</h2>
              <p className="text-green-700 text-sm mb-4">
                Este teste verifica se a função clearError() está disponível e funcionando.
              </p>
              <button
                onClick={testClearError}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                🧪 Testar clearError()
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Status da Correção:</h2>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>✅ Função clearError() implementada no SimpleAuthContext</li>
                <li>✅ Função adicionada ao Provider value</li>
                <li>✅ Interface atualizada com clearError</li>
                <li>✅ Erro deve estar resolvido</li>
              </ul>
            </div>

            <div className="text-center space-x-4">
              <a
                href="/login"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 inline-block"
              >
                🔗 Ir para Login
              </a>
              <a
                href="/debug-token"
                className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 inline-block"
              >
                🔍 Debug Token
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
