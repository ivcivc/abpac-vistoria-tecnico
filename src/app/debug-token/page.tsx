'use client';

import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';


export default function DebugTokenPage() {
  const [userToken] = useState('1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf');
  const [loading, setLoading] = useState(false);
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);


  const testSpecificToken = async () => {
    setLoading(true);
    setError('');
    setBackendResponse(null);

    try {
      const API_BASE = API_CONFIG.BASE_URL;
      const endpoint = `${API_BASE}/vistoria/${userToken}`;

      console.log('🔍 [DEBUG] Testando token específico do usuário:', userToken);
      console.log('🔍 [DEBUG] Endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      console.log('📡 [DEBUG] Status:', response.status);
      console.log('📡 [DEBUG] Headers:', Object.fromEntries(response.headers.entries()));

      let responseData;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const textResponse = await response.text();
        console.log('📡 [DEBUG] Resposta não é JSON:', textResponse);
        responseData = {
          error: 'Resposta não é JSON',
          content: textResponse,
          contentType: contentType,
        };
      }

      console.log('📡 [DEBUG] Dados completos:', responseData);

      setBackendResponse({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        endpoint: endpoint,
      });
    } catch (err: any) {
      console.error('❌ [DEBUG] Erro:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };



  // Teste automático ao carregar
  useEffect(() => {
    testSpecificToken();
  }, []);

  const analyzeResponse = (response: any) => {
    if (!response) return null;

    const analysis = {
      isValid: false,
      hasVistoriaData: false,
      hasEquipamento: false,
      hasTecnico: false,
      dataStructure: {},
      issues: [],
    };

    if (response.ok && response.data) {
      if (response.data.type === true) {
        analysis.isValid = true;

        if (response.data.vistoria) {
          analysis.hasVistoriaData = true;
          analysis.dataStructure = {
            id: response.data.vistoria.id,
            status: response.data.vistoria.status,
            local_vistoria: response.data.vistoria.local_vistoria,
            endereco: response.data.vistoria.endereco,
            cidade: response.data.vistoria.cidade,
            equipamento: response.data.vistoria.equipamento ? 'Presente' : 'Ausente',
            tecnico: response.data.vistoria.tecnico ? 'Presente' : 'Ausente',
          };

          if (response.data.vistoria.equipamento) {
            analysis.hasEquipamento = true;
          } else {
            analysis.issues.push('❌ Dados do equipamento ausentes');
          }

          if (response.data.vistoria.tecnico) {
            analysis.hasTecnico = true;
          } else {
            analysis.issues.push('⚠️ Dados do técnico ausentes (normal se não definido)');
          }

          // Verificar campos essenciais
          if (!response.data.vistoria.local_vistoria && !response.data.vistoria.endereco) {
            analysis.issues.push('❌ Local da vistoria não informado');
          }
        } else {
          analysis.issues.push('❌ Objeto vistoria ausente na resposta');
        }
      } else {
        analysis.issues.push('❌ Resposta não indica sucesso (type !== true)');
      }
    } else {
      analysis.issues.push(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      if (response.data && response.data.message) {
        analysis.issues.push(`❌ Mensagem: ${response.data.message}`);
      }
    }

    return analysis;
  };

  const analysis = backendResponse ? analyzeResponse(backendResponse) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">🔍 Debug Token Específico</h1>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Token Info */}
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-600 mb-4">🎯 Token do Usuário</h2>

                <div className="space-y-3">
                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-blue-800 text-sm font-mono break-all">
                      <strong>Token:</strong>
                      <br />
                      {userToken}
                    </p>
                  </div>

                  <div className="bg-blue-100 p-3 rounded">
                    <p className="text-blue-800 text-sm">
                      <strong>Tabela Fonte:</strong> estoque_remessa
                      <br />
                      <strong>Campo:</strong> token_vistoria
                      <br />
                      <strong>Endpoint:</strong> GET /api/vistoria/:token
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={testSpecificToken}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? '⏳ Testando...' : '🔄 Testar Novamente'}
              </button>

              

              {analysis && (
                <div
                  className={`p-4 rounded-lg ${analysis.isValid ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}
                >
                  <h3
                    className={`font-bold mb-2 ${analysis.isValid ? 'text-green-800' : 'text-red-800'}`}
                  >
                    📊 Análise da Resposta
                  </h3>

                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>✅ Token Válido:</strong> {analysis.isValid ? 'Sim' : 'Não'}
                    </p>
                    <p>
                      <strong>📋 Dados Vistoria:</strong>{' '}
                      {analysis.hasVistoriaData ? 'Presentes' : 'Ausentes'}
                    </p>
                    <p>
                      <strong>🚗 Equipamento:</strong>{' '}
                      {analysis.hasEquipamento ? 'Presente' : 'Ausente'}
                    </p>
                    <p>
                      <strong>👤 Técnico:</strong> {analysis.hasTecnico ? 'Presente' : 'Ausente'}
                    </p>
                  </div>

                  {analysis.issues.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="font-bold text-red-800 mb-1">🚨 Problemas Identificados:</p>
                      <ul className="space-y-1">
                        {analysis.issues.map((issue, index) => (
                          <li key={index} className="text-red-700 text-sm">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resposta Detalhada */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-600 mb-4">📡 Resposta do Backend</h2>

                {error && (
                  <div className="bg-red-100 border border-red-300 p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-red-800 mb-2">❌ Erro de Conexão:</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {backendResponse && (
                  <div className="space-y-4">
                    <div
                      className={`border p-4 rounded-lg ${backendResponse.ok ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}
                    >
                      <h3
                        className={`font-bold mb-2 ${backendResponse.ok ? 'text-green-800' : 'text-red-800'}`}
                      >
                        🌐 Status HTTP
                      </h3>
                      <p className="text-sm">
                        <strong>Status:</strong> {backendResponse.status}{' '}
                        {backendResponse.statusText}
                        <br />
                        <strong>Sucesso:</strong> {backendResponse.ok ? 'Sim' : 'Não'}
                      </p>
                    </div>

                    {analysis &&
                      analysis.dataStructure &&
                      Object.keys(analysis.dataStructure).length > 0 && (
                        <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg">
                          <h3 className="font-bold text-blue-800 mb-2">📋 Estrutura dos Dados:</h3>
                          <div className="text-blue-700 text-sm space-y-1">
                            {Object.entries(analysis.dataStructure).map(([key, value]) => (
                              <p key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="bg-white border p-4 rounded-lg">
                      <h3 className="font-bold text-gray-800 mb-2">🔍 JSON Completo:</h3>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
                        {JSON.stringify(backendResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {!error && !backendResponse && !loading && (
                  <div className="text-center text-gray-500 py-8">
                    <p>Aguardando teste...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instruções de Debug */}
          <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">🔧 Diagnóstico</h2>
            <div className="text-yellow-700 space-y-2">
              <p>
                <strong>1.</strong> Verifique se o backend está rodando na porta 3333
              </p>
              <p>
                <strong>2.</strong> Confirme que o token existe na tabela{' '}
                <code>estoque_remessa</code>
              </p>
              <p>
                <strong>3.</strong> Verifique se há um equipamento relacionado (equipamento_id)
              </p>
              <p>
                <strong>4.</strong> Confirme se o status permite acesso (AGUARDANDO_VISTORIA,
                EM_VISTORIA, etc.)
              </p>
              <p>
                <strong>5.</strong> Analise os logs do backend para erros
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
              href="/test-backend"
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 inline-block"
            >
              Teste Geral
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
