'use client';

import { useState } from 'react';

export default function TestFinalPage() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const tests = [
    {
      id: 'token_validation',
      title: '🔍 1. Validação de Token',
      description: 'Token deve ser validado e dados reais carregados',
      action: () =>
        window.open(
          '/login?token=1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf',
          '_blank'
        ),
      expected: ['Local: "Rua de castro, 217"', 'Cidade: "Cidade Verde"', 'Tipo: "INSTALACAO"'],
    },
    {
      id: 'technician_suggestion',
      title: '👤 2. Sugestão de Técnico',
      description: 'Nome do técnico deve ser pré-preenchido mas editável',
      action: () => window.open('/debug-token', '_blank'),
      expected: [
        'Campo pré-preenchido com nome real',
        'Possível editar o nome',
        'Mensagem de sugestão aparece',
      ],
    },
    {
      id: 'dashboard_data',
      title: '📊 3. Dashboard com Dados Reais',
      description: 'Dashboard deve mostrar informações da vistoria atual',
      action: () => window.open('/dashboard', '_blank'),
      expected: ['Vistoria atual exibida', 'Dados do veículo corretos', 'Estatísticas atualizadas'],
    },
    {
      id: 'vehicle_data',
      title: '🚗 4. Dados do Veículo',
      description: 'Informações do equipamento/veículo vindas do backend',
      action: () =>
        alert('Verifique nos logs do console se os dados do equipamento estão corretos'),
      expected: ['Modelo real', 'Placa real', 'Cor real (se disponível)'],
    },
  ];

  const markTestResult = (testId: string, passed: boolean) => {
    setTestResults(prev => ({ ...prev, [testId]: passed }));
  };

  const allTestsPassed = tests.every(test => testResults[test.id] === true);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            🧪 Teste Final - Dados Reais Integrados
          </h1>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-8">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Correções Implementadas:
            </h2>
            <ul className="text-green-700 space-y-1 text-sm">
              <li>
                ✅ <strong>Processamento de dados:</strong> Corrigido mapeamento local_vistoria,
                equipamento, técnico
              </li>
              <li>
                ✅ <strong>Identificação do técnico:</strong> Nome real pré-preenchido mas editável
              </li>
              <li>
                ✅ <strong>Dashboard:</strong> Mostra dados reais da vistoria atual
              </li>
              <li>
                ✅ <strong>Tipo de vistoria:</strong> Exibido como tag (INSTALACAO)
              </li>
              <li>
                ✅ <strong>Dados do veículo:</strong> Informações reais do equipamento
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            {tests.map((test, index) => (
              <div key={test.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{test.title}</h3>
                    <p className="text-gray-600 text-sm">{test.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => markTestResult(test.id, true)}
                      className={`px-3 py-1 rounded text-sm ${testResults[test.id] === true ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-green-100'}`}
                    >
                      ✅ Passou
                    </button>
                    <button
                      onClick={() => markTestResult(test.id, false)}
                      className={`px-3 py-1 rounded text-sm ${testResults[test.id] === false ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-red-100'}`}
                    >
                      ❌ Falhou
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded mb-3">
                  <p className="text-blue-800 text-sm font-medium mb-2">📋 O que verificar:</p>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {test.expected.map((expectation, i) => (
                      <li key={i}>• {expectation}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={test.action}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  🚀 Executar Teste
                </button>
              </div>
            ))}
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="mt-8 p-6 rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="text-lg font-semibold mb-4">📊 Resultados dos Testes:</h3>
              <div className="grid gap-2">
                {tests.map(test => (
                  <div key={test.id} className="flex items-center justify-between">
                    <span className="text-sm">{test.title}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        testResults[test.id] === true
                          ? 'bg-green-100 text-green-800'
                          : testResults[test.id] === false
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {testResults[test.id] === true
                        ? '✅ Passou'
                        : testResults[test.id] === false
                          ? '❌ Falhou'
                          : '⏳ Aguardando'}
                    </span>
                  </div>
                ))}
              </div>

              {allTestsPassed && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-green-800 font-semibold text-center">
                    🎉 Todos os testes passaram! Sistema integrado com sucesso!
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔧 Token de Teste:</h3>
            <div className="bg-yellow-100 p-3 rounded font-mono text-sm break-all">
              1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf
            </div>
            <p className="text-yellow-700 text-sm mt-2">
              Use este token para testar. Ele deve carregar: Rua de castro, 217 - Cidade Verde -
              INSTALACAO
            </p>
          </div>

          <div className="mt-6 text-center space-x-4">
            <a
              href="/login"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 inline-block"
            >
              Ir para Login
            </a>
            <a
              href="/debug-token"
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 inline-block"
            >
              Debug Token
            </a>
            <a
              href="/dashboard"
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 inline-block"
            >
              Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
