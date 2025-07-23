'use client';

import { useState } from 'react';

export default function TestBackendPage() {
  const [testToken, setTestToken] = useState('VIS1234567890ABCDEF');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testVistoriaEndpoint = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const API_BASE = 'http://localhost:3333/api';
      const endpoint = `${API_BASE}/vistoria/${testToken}`;

      console.log('🧪 [TESTE] Testando endpoint REAL do backend:', endpoint);

      // GET request para o endpoint que JÁ EXISTE
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      console.log('🧪 [TESTE] Status da resposta:', response.status);
      console.log('🧪 [TESTE] Headers da resposta:', response.headers);

      const data = await response.json();
      console.log('🧪 [TESTE] Dados recebidos:', data);

      setResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
        endpoint: endpoint,
        method: 'GET',
      });
    } catch (err: any) {
      console.error('🧪 [TESTE] Erro:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const API_BASE = 'http://localhost:3333';

      console.log('🏥 [HEALTH] Testando conectividade básica:', API_BASE);

      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      setResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: data,
        endpoint: `${API_BASE}/health`,
        method: 'GET',
      });
    } catch (err: any) {
      console.error('🏥 [HEALTH] Erro:', err);
      setError(err.message || 'Erro na conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">🧪 Teste de Backend REAL</h1>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Controles de Teste */}
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-600 mb-4">🔧 Configuração</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Token de Teste:
                    </label>
                    <input
                      type="text"
                      value={testToken}
                      onChange={e => setTestToken(e.target.value)}
                      className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Digite o token para teste"
                    />
                  </div>

                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-blue-800 text-sm">
                      <strong>Backend URL:</strong> http://localhost:3333/api
                      <br />
                      <strong>Endpoint REAL:</strong> GET /vistoria/:token
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={testHealthCheck}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? '⏳ Testando...' : '🏥 Testar Conectividade'}
                </button>

                <button
                  onClick={testVistoriaEndpoint}
                  disabled={loading || !testToken.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? '⏳ Validando...' : '🔍 Testar Endpoint Real de Vistoria'}
                </button>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2">📋 Informações do Backend</h3>
                <div className="text-yellow-700 space-y-1 text-sm">
                  <p>
                    <strong>Middleware:</strong> ValidarTokenVistoria
                  </p>
                  <p>
                    <strong>Controller:</strong> EstoqueRemessaController.obterVistoriaPorToken
                  </p>
                  <p>
                    <strong>Service:</strong> EstoqueRemessaVistoria.obterVistoriaPorToken
                  </p>
                  <p>
                    <strong>Tables:</strong> estoque_remessa, equipamentos, pessoas
                  </p>
                </div>
              </div>
            </div>

            {/* Resultados */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-600 mb-4">📋 Resultados</h2>

                {error && (
                  <div className="bg-red-100 border border-red-300 p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-red-800 mb-2">❌ Erro:</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    <div
                      className={`border p-4 rounded-lg ${result.ok ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}
                    >
                      <h3
                        className={`font-bold mb-2 ${result.ok ? 'text-green-800' : 'text-red-800'}`}
                      >
                        {result.ok ? '✅ Sucesso' : '❌ Erro'}
                      </h3>
                      <p className={result.ok ? 'text-green-700' : 'text-red-700'}>
                        <strong>Status:</strong> {result.status} {result.statusText}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        <strong>Endpoint:</strong> {result.method} {result.endpoint}
                      </p>
                    </div>

                    {result.data && result.data.type === true && result.data.vistoria && (
                      <div className="bg-green-100 border border-green-300 p-4 rounded-lg">
                        <h3 className="font-bold text-green-800 mb-2">
                          🎯 Dados da Vistoria Encontrados:
                        </h3>
                        <div className="text-green-700 space-y-1 text-sm">
                          <p>
                            <strong>ID:</strong> {result.data.vistoria.id}
                          </p>
                          <p>
                            <strong>Status:</strong> {result.data.vistoria.status}
                          </p>
                          <p>
                            <strong>Endereço:</strong> {result.data.vistoria.endereco}
                          </p>
                          {result.data.vistoria.equipamento && (
                            <>
                              <p>
                                <strong>Placa:</strong> {result.data.vistoria.equipamento.placa}
                              </p>
                              <p>
                                <strong>Modelo:</strong> {result.data.vistoria.equipamento.modelo}
                              </p>
                            </>
                          )}
                          {result.data.vistoria.tecnico && (
                            <p>
                              <strong>Técnico:</strong> {result.data.vistoria.tecnico.nome}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-white border p-4 rounded-lg">
                      <h3 className="font-bold text-gray-800 mb-2">📊 Resposta Completa:</h3>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {!error && !result && !loading && (
                  <div className="text-center text-gray-500 py-8">
                    <p>Execute um teste para ver os resultados</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instruções */}
          <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">📖 Instruções</h2>
            <div className="text-yellow-700 space-y-2">
              <p>
                <strong>1.</strong> Certifique-se de que o backend AdonisJS está rodando na porta
                3333
              </p>
              <p>
                <strong>2.</strong> Execute o teste de conectividade primeiro
              </p>
              <p>
                <strong>3.</strong> Use um token real de vistoria existente no banco de dados
              </p>
              <p>
                <strong>4.</strong> Verifique os logs no console (F12) para detalhes
              </p>
              <p>
                <strong>5.</strong> A resposta deve ter: {`{ "type": true, "vistoria": {...} }`}
              </p>
            </div>
          </div>

          <div className="mt-6 text-center space-x-4">
            <a
              href="/login"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 inline-block"
            >
              Ir para Login
            </a>
            <a
              href="/debug-data"
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 inline-block"
            >
              Ver Estrutura de Dados
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
