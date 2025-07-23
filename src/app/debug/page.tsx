'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_CONFIG } from '@/config/api';

export default function DebugPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const addResult = (
    test: string,
    status: 'success' | 'error' | 'info',
    message: string,
    data?: any
  ) => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      test,
      status,
      message,
      data,
    };
    setResults(prev => [...prev, result]);
    console.log(`[${test}] ${status.toUpperCase()}: ${message}`, data || '');
  };

  const testBackendConnection = async () => {
    setLoading(true);
    addResult('Backend', 'info', 'Testando conectividade...');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/vistoria/test123`, {
        method: 'GET',
        headers: API_CONFIG.DEFAULT_HEADERS,
      });

      addResult(
        'Backend',
        response.ok ? 'success' : 'error',
        `Status: ${response.status} - ${response.statusText}`
      );

      if (response.ok) {
        const data = await response.text();
        addResult('Backend', 'info', 'Response body', data.substring(0, 100) + '...');
      }
    } catch (error: any) {
      addResult('Backend', 'error', `Erro de conexão: ${error.message}`);
    }

    setLoading(false);
  };

  const testIndexedDB = async () => {
    if (!isClient) {
      addResult('IndexedDB', 'error', 'Teste só disponível no client');
      return;
    }

    addResult('IndexedDB', 'info', 'Testando IndexedDB...');

    try {
      if (!window.indexedDB) {
        addResult('IndexedDB', 'error', 'IndexedDB não suportado');
        return;
      }

      const dbName = 'VistoriaABPAC';
      const request = window.indexedDB.open(dbName);

      request.onsuccess = () => {
        const db = request.result;
        addResult('IndexedDB', 'success', `Banco conectado: v${db.version}`);

        const storeNames = Array.from(db.objectStoreNames);
        addResult('IndexedDB', 'info', `Stores: ${storeNames.join(', ')}`);

        db.close();
      };

      request.onerror = () => {
        addResult('IndexedDB', 'error', 'Erro ao conectar com IndexedDB');
      };
    } catch (error: any) {
      addResult('IndexedDB', 'error', `Erro IndexedDB: ${error.message}`);
    }
  };

  const testLocalStorage = () => {
    if (!isClient) {
      addResult('LocalStorage', 'error', 'Teste só disponível no client');
      return;
    }

    addResult('LocalStorage', 'info', 'Testando LocalStorage...');

    try {
      const testKey = 'debug-test';
      const testValue = 'test-value';

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        addResult('LocalStorage', 'success', 'LocalStorage funcionando');
      } else {
        addResult('LocalStorage', 'error', 'LocalStorage não funcionando corretamente');
      }
    } catch (error: any) {
      addResult('LocalStorage', 'error', `Erro LocalStorage: ${error.message}`);
    }
  };

  const clearResults = () => setResults([]);

  const runAllTests = async () => {
    clearResults();
    await testBackendConnection();
    testIndexedDB();
    testLocalStorage();
  };

  if (!isClient) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>🔧 Sistema de Debug - ABPAC Vistoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
              </div>
              <p className="text-muted-foreground">Carregando ferramentas de debug...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Sistema de Debug - ABPAC Vistoria</CardTitle>
          <p className="text-muted-foreground">
            Ferramentas para diagnosticar problemas de conectividade e armazenamento
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllTests} disabled={loading}>
              🏃‍♂️ Executar Todos
            </Button>
            <Button onClick={testBackendConnection} disabled={loading} variant="outline">
              🌐 Backend
            </Button>
            <Button onClick={testIndexedDB} disabled={loading} variant="outline">
              💾 IndexedDB
            </Button>
            <Button onClick={testLocalStorage} disabled={loading} variant="outline">
              📦 LocalStorage
            </Button>
            <Button onClick={clearResults} variant="outline">
              🗑️ Limpar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <strong>Backend:</strong>
              <br />
              {API_CONFIG.BASE_URL}
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <strong>Environment:</strong>
              <br />
              {process.env.NODE_ENV}
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <strong>User Agent:</strong>
              <br />
              {typeof window !== 'undefined'
                ? window.navigator.userAgent.substring(0, 30) + '...'
                : 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm font-mono ${
                    result.status === 'success'
                      ? 'bg-green-50 text-green-800'
                      : result.status === 'error'
                        ? 'bg-red-50 text-red-800'
                        : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold">[{result.test}]</span>
                    <span className="text-xs opacity-75">{result.timestamp}</span>
                  </div>
                  <div>{result.message}</div>
                  {result.data && (
                    <div className="mt-2 p-2 bg-black/5 rounded text-xs">
                      {typeof result.data === 'string'
                        ? result.data
                        : JSON.stringify(result.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>🎮 Console Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">authDebug.clearAuthState()</code> -
              Limpar estado de autenticação
            </p>
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">authDebug.debugAuthState()</code> -
              Ver estado atual
            </p>
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">authDebug.mockLogin()</code> - Simular
              login
            </p>
            <p>
              <code className="bg-gray-100 px-2 py-1 rounded">authDebug.testBackend()</code> -
              Testar backend
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
