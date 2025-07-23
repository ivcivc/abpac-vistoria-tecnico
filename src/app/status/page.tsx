'use client';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">📊 Status do Sistema</h1>
        
        <div className="space-y-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h2 className="font-semibold text-green-800">✅ Sistema Funcionando</h2>
            <p className="text-sm text-green-600">Next.js está carregando corretamente</p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <h2 className="font-semibold text-blue-800">🔧 Correções Aplicadas:</h2>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Imports corrigidos no login</li>
              <li>• clearError exportado no Context</li>
              <li>• Erro de sintaxe corrigido</li>
              <li>• Link do Next.js implementado</li>
            </ul>
          </div>

          <div className="space-y-2">
            <a 
              href="/test-simple" 
              className="block text-center bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Teste Simples
            </a>
            <a 
              href="/login" 
              className="block text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Ir para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 