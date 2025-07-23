'use client';

export default function DirectSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-purple-600 mb-2">⚡ Acesso Direto Funcionou!</h1>
          <p className="text-gray-600">Teste de Redirecionamento</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-purple-100 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-purple-800 mb-2">🎯 Diagnóstico</h2>
            <div className="text-left space-y-1 text-purple-700">
              <p>✅ Roteamento do Next.js funcionando</p>
              <p>✅ Páginas carregando corretamente</p>
              <p>✅ Redirecionamento via URL funciona</p>
              <p>⚠️ Problema pode estar na lógica de redirecionamento automático</p>
            </div>
          </div>

          <div className="bg-yellow-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Teste Manual</h3>
            <p className="text-yellow-700">
              Acesse diretamente:
              <br />
              <code className="bg-yellow-200 px-2 py-1 rounded">http://localhost:3000/success</code>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <a
            href="/success"
            className="block w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ir para Página de Sucesso
          </a>

          <a
            href="/dashboard-simple"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard Simples
          </a>

          <a
            href="/login"
            className="block w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Voltar ao Login
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            🔧 Teste de Redirecionamento • Sistema de Vistoria ABPAC
          </p>
        </div>
      </div>
    </div>
  );
}
