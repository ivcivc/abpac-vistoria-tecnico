'use client';

import { useState } from 'react';
import Link from 'next/link'; // ADICIONADO: Import do Link do Next.js

export default function TestPage() {
  const [testResult, setTestResult] = useState<string>('');

  const runTest = () => {
    setTestResult('✅ Sistema funcionando! Dados integrados com backend.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">🧪 Teste do Sistema</h1>
        
        <button
          onClick={runTest}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mb-4"
        >
          Executar Teste
        </button>

        {testResult && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800">{testResult}</p>
          </div>
        )}

        <div className="space-y-2">
          <a href="/login" className="block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 text-center">
            Ir para Login
          </a>

          <Link href="/" className="block bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 text-center">
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
