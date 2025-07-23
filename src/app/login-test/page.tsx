'use client';

import { useSearchParams } from 'next/navigation';

export default function LoginTestPage() {
  // Tentar capturar o token sem Suspense para testar
  let token = null;
  let error = null;

  try {
    const searchParams = useSearchParams();
    token = searchParams.get('token');
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-6">🧪 Login - Teste Simplificado</h1>

        <div className="space-y-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h2 className="font-bold text-blue-800 mb-2">Status da Página:</h2>
            <p className="text-blue-700">✅ Página login-test carregada com sucesso!</p>
          </div>

          <div className="bg-green-100 p-4 rounded-lg">
            <h2 className="font-bold text-green-800 mb-2">Token da URL:</h2>
            {error ? (
              <p className="text-red-700">❌ Erro ao capturar token: {error}</p>
            ) : (
              <p className="text-green-700">
                {token ? `✅ Token encontrado: ${token}` : '❌ Nenhum token na URL'}
              </p>
            )}
          </div>

          <div className="bg-yellow-100 p-4 rounded-lg">
            <h2 className="font-bold text-yellow-800 mb-2">URL Atual:</h2>
            <p className="text-yellow-700 break-all text-sm">
              {typeof window !== 'undefined' ? window.location.href : 'Carregando...'}
            </p>
          </div>

          <div className="bg-purple-100 p-4 rounded-lg">
            <h2 className="font-bold text-purple-800 mb-2">Diagnóstico:</h2>
            <div className="text-purple-700 text-sm space-y-1">
              <p>🔍 Esta página testa se useSearchParams funciona</p>
              <p>🔍 Sem Suspense wrapper complexo</p>
              <p>🔍 Sem componentes pesados de autenticação</p>
              <p>🔍 Captura de erro incluída</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <a
            href="/login-test?token=VIS1234567890ABCDEF"
            className="block bg-blue-600 text-white py-3 px-6 rounded-lg text-center hover:bg-blue-700"
          >
            🔄 Testar com Token
          </a>

          <a
            href="/login"
            className="block bg-green-600 text-white py-3 px-6 rounded-lg text-center hover:bg-green-700"
          >
            Ir para Login Original
          </a>

          <a
            href="/test-simple"
            className="block bg-gray-600 text-white py-3 px-6 rounded-lg text-center hover:bg-gray-700"
          >
            Página de Teste Simples
          </a>
        </div>
      </div>
    </div>
  );
}
