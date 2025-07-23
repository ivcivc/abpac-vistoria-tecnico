'use client';

export default function SimpleDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">🎯 Dashboard Simplificado</h1>
          <p className="text-indigo-600">Sistema de Vistoria ABPAC - Teste Direto</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card de Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-green-600 mb-4">✅ Status do Sistema</h2>
            <div className="space-y-2">
              <p>🚀 Frontend: Funcionando</p>
              <p>👤 Usuário: ivan (teste)</p>
              <p>🔐 Autenticação: Simulada</p>
              <p>📱 Dashboard: Carregado</p>
            </div>
          </div>

          {/* Card de Ações */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-blue-600 mb-4">🔧 Ações Disponíveis</h2>
            <div className="space-y-3">
              <button
                onClick={() => alert('Dashboard funcionando!')}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Testar Interação
              </button>

              <a
                href="/login"
                className="block w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 text-center"
              >
                Voltar ao Login
              </a>
            </div>
          </div>

          {/* Card de Debug */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:col-span-2">
            <h2 className="text-xl font-bold text-orange-600 mb-4">🔍 Informações de Debug</h2>
            <div className="bg-gray-100 p-4 rounded-lg text-sm">
              <p>
                <strong>Objetivo:</strong> Testar se o dashboard carrega sem problemas de
                autenticação
              </p>
              <p>
                <strong>Status:</strong> Esta página deve carregar instantaneamente
              </p>
              <p>
                <strong>Próximo passo:</strong> Se esta página funciona, o problema está na
                verificação de autenticação
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
