'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function TestTokenContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">🧪 Teste de Token</h1>

        <div className="space-y-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h2 className="font-bold text-blue-800 mb-2">URL Atual:</h2>
            <p className="text-blue-700 break-all">
              {typeof window !== 'undefined' ? window.location.href : 'Carregando...'}
            </p>
          </div>

          <div className="bg-green-100 p-4 rounded-lg">
            <h2 className="font-bold text-green-800 mb-2">Token Detectado:</h2>
            <p className="text-green-700">{token ? `✅ ${token}` : '❌ Nenhum token encontrado'}</p>
          </div>

          <div className="bg-yellow-100 p-4 rounded-lg">
            <h2 className="font-bold text-yellow-800 mb-2">Teste de URLs:</h2>
            <div className="space-y-2 text-yellow-700">
              <p>
                ✅ <code>/test-token</code> - Página básica
              </p>
              <p>
                ✅ <code>/test-token?token=123</code> - Com query param
              </p>
              <p>📝 Teste de link direto abaixo:</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <a
            href="/test-token?token=VIS1234567890ABCDEF"
            className="block bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600"
          >
            Testar com Token via Link
          </a>

          <a
            href="/login?token=VIS1234567890ABCDEF"
            className="block bg-green-500 text-white py-2 px-4 rounded text-center hover:bg-green-600"
          >
            Ir para Login com Token
          </a>

          <a
            href="/login"
            className="block bg-gray-500 text-white py-2 px-4 rounded text-center hover:bg-gray-600"
          >
            Login Normal
          </a>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}

export default function TestTokenPage() {
  return (
    <Suspense fallback={<div>Carregando teste...</div>}>
      <TestTokenContent />
    </Suspense>
  );
}
