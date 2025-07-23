'use client';

export default function EmergencyTestPage() {
  const testRedirect = () => {
    console.log('🚨 TESTE DE EMERGÊNCIA: Testando redirecionamento...');

    // Método 1: window.location.href
    setTimeout(() => {
      console.log('🔄 Teste 1: window.location.href');
      window.location.href = '/success';
    }, 100);
  };

  const testDirectSuccess = () => {
    console.log('🚨 TESTE DIRETO: Redirecionando para success...');
    window.location.href = '/success';
  };

  const testMultipleMethods = () => {
    console.log('🚨 TESTE MÚLTIPLOS: Testando vários métodos...');

    // Método 1
    setTimeout(() => {
      console.log('🔄 Multi-teste 1: location.href');
      try {
        window.location.href = '/success';
      } catch (e) {
        console.error('Erro método 1:', e);
      }
    }, 100);

    // Método 2
    setTimeout(() => {
      console.log('🔄 Multi-teste 2: location.replace');
      try {
        window.location.replace('/success');
      } catch (e) {
        console.error('Erro método 2:', e);
      }
    }, 500);

    // Método 3
    setTimeout(() => {
      console.log('🔄 Multi-teste 3: location.assign');
      try {
        window.location.assign('/success');
      } catch (e) {
        console.error('Erro método 3:', e);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">🚨 TESTE DE EMERGÊNCIA</h1>
          <p className="text-gray-600">Testando redirecionamento</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-yellow-100 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ ERRO DETECTADO</h2>
            <div className="text-left space-y-1 text-yellow-700">
              <p>🔍 Você está rodando na pasta errada!</p>
              <p>
                ❌ Atual: <code>/c/alav/abpac_api_frontend</code>
              </p>
              <p>
                ✅ Correto: <code>/c/alav/abpac_api_frontend/vistoria-tecnico</code>
              </p>
            </div>
          </div>

          <div className="bg-blue-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 SOLUÇÃO</h3>
            <div className="text-left space-y-1 text-blue-700">
              <p>
                1. <code>cd vistoria-tecnico</code>
              </p>
              <p>
                2. <code>npm run dev</code>
              </p>
              <p>
                3. Acesse: <code>http://localhost:3000</code>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={testDirectSuccess}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
          >
            🚀 Teste Direto para Success
          </button>

          <button
            onClick={testRedirect}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Teste com Delay
          </button>

          <button
            onClick={testMultipleMethods}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
          >
            🎯 Teste Múltiplos Métodos
          </button>

          <a
            href="/success"
            className="block w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors"
          >
            📎 Link Direto para Success
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            🚨 Teste de Emergência • Sistema de Vistoria ABPAC
          </p>
        </div>
      </div>
    </div>
  );
}
