'use client';

import { useState } from 'react';

export default function TestLoginPage() {
  const [testResult, setTestResult] = useState<string>('');

  const testLoginWithToken = () => {
    const token = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';
    const loginUrl = `/login?token=${token}`;
    
    setTestResult(`🔄 Redirecionando para login com token...`);
    
    setTimeout(() => {
      window.location.href = loginUrl;
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">🧪 Teste Login com Token</h1>
        
        <div className="space-y-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h2 className="font-semibold text-green-800 mb-2">✅ Correção Aplicada:</h2>
            <p className="text-sm text-green-600">
              setCurrentVistoria adicionado ao LoginPageContent
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <h2 className="font-semibold text-blue-800 mb-2">🎯 Token de Teste:</h2>
            <p className="text-xs text-blue-600 font-mono break-all">
              1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf
            </p>
          </div>

          {testResult && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">{testResult}</p>
            </div>
          )}

          <button
            onClick={testLoginWithToken}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded hover:bg-blue-600"
          >
            🚀 Testar Login com Token
          </button>

          <div className="space-y-2">
            <a 
              href="/login" 
              className="block text-center bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Login Manual
            </a>
            <a 
              href="/status" 
              className="block text-center bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Status do Sistema
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 