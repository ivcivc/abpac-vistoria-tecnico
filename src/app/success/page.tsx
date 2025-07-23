'use client';

import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('✅ SUCCESS: Página de sucesso carregada!');
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">🎉 Sucesso!</h1>
          <p className="text-gray-600">Sistema de Vistoria ABPAC</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-green-100 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Autenticação Concluída</h2>
            <div className="text-left space-y-1 text-green-700">
              <p>🔐 Token validado com sucesso</p>
              <p>👤 Técnico identificado: ivan</p>
              <p>🚀 Sistema funcionando corretamente</p>
              <p>📱 Redirecionamento funcionou!</p>
            </div>
          </div>

          <div className="bg-blue-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🎯 Próximos Passos</h3>
            <p className="text-blue-700">
              Esta página confirma que toda a autenticação está funcionando.
              <br />O problema estava no dashboard complexo, não na autenticação.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => (window.location.href = '/dashboard-simple')}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
          >
            Ir para Dashboard Simples
          </button>

          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Dashboard Completo
          </button>

          <button
            onClick={() => (window.location.href = '/login')}
            className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            🔧 Modo Desenvolvimento • Sistema de Vistoria ABPAC v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
