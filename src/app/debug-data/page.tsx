'use client';

import { TechnicianIdentification } from '@/components/auth/TechnicianIdentification';
import { useState } from 'react';

export default function DebugDataPage() {
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Estrutura CORRETA esperada pelo TechnicianIdentification
  const vistoriaInfoCorreta = {
    id: 'VIS_DEBUG_' + Date.now(),
    local: 'Rua das Flores, 123 - Centro - São Paulo, SP',
    dataAgendada: new Date().toISOString(),
    equipamento: 'Sistema de Proteção ABPAC Premium',
    cliente: 'Empresa Demo Comercial LTDA',
    veiculo: {
      modelo: 'Honda Civic Touring',
      cor: 'Prata Metálico',
      placa: 'ABC-1234',
    },
    tipoVistoria: 'Instalação Completa',
    tecnicoId: null,
    nomeEstoque: 'Equipamento ABPAC - Modelo Premium XYZ',
  };

  const handleSubmit = (data: any) => {
    console.log('📋 [DEBUG] Dados submetidos:', data);
    setSubmittedData(data);
    alert('Dados submetidos com sucesso! Veja o console.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">🐛 Debug - Estrutura de Dados</h1>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Estrutura de Dados */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-blue-600">
                📊 Estrutura de Dados Esperada
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">VistoriaInfo Structure:</h3>
                <pre className="text-xs text-blue-700 bg-white p-3 rounded overflow-auto">
                  {JSON.stringify(vistoriaInfoCorreta, null, 2)}
                </pre>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">✅ Campos Obrigatórios:</h3>
                <div className="text-green-700 text-sm space-y-1">
                  <p>
                    <strong>local:</strong> string (endereço da vistoria)
                  </p>
                  <p>
                    <strong>dataAgendada:</strong> string (ISO date)
                  </p>
                  <p>
                    <strong>veiculo.modelo:</strong> string
                  </p>
                  <p>
                    <strong>veiculo.cor:</strong> string
                  </p>
                  <p>
                    <strong>veiculo.placa:</strong> string
                  </p>
                </div>
              </div>

              {submittedData && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-2">📤 Último Submit:</h3>
                  <pre className="text-xs text-purple-700 bg-white p-3 rounded overflow-auto">
                    {JSON.stringify(submittedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Componente Testando */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-600">🧪 Teste do Componente</h2>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <TechnicianIdentification
                  vistoriaInfo={vistoriaInfoCorreta}
                  onSubmit={handleSubmit}
                  loading={false}
                  error={null}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold text-red-600 mb-4">🚨 Problemas Comuns</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-bold text-red-800 mb-2">❌ Estrutura Incorreta:</h3>
                <pre className="text-xs text-red-700 bg-white p-3 rounded">
                  {JSON.stringify(
                    {
                      // ERRADO - campos ausentes
                      id: 'VIS123',
                      equipamento: 'Sistema',
                      cliente: 'Cliente',
                      // faltam: local, dataAgendada, veiculo
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2">⚠️ Veículo Incompleto:</h3>
                <pre className="text-xs text-yellow-700 bg-white p-3 rounded">
                  {JSON.stringify(
                    {
                      local: 'Endereço',
                      dataAgendada: '2025-01-23',
                      veiculo: {
                        modelo: 'Civic',
                        // faltam: cor, placa
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 mr-4"
            >
              Ir para Login
            </a>
            <a
              href="/dashboard"
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
            >
              Ir para Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
