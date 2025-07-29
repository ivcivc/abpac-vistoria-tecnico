'use client';

/**
 * Componente de Debug do IndexedDB
 * Usado para diagnosticar e corrigir problemas de stores
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clearIndexedDB, checkIndexedDBHealth, clearAndReload } from '@/utils/clearIndexedDB';
import { AlertTriangle, Database, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

export function IndexedDBDebug() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [availableStores, setAvailableStores] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  const requiredStores = [
    'vistorias',
    'vistorias-locais', 
    'itens',
    'evidencias',
    'evidence-metadata',
    'despesas',
    'sync-queue',
    'config'
  ];

  const checkHealth = async () => {
    if (!isClient) return; // Não executar no servidor
    
    setIsLoading(true);
    try {
      const healthy = await checkIndexedDBHealth();
      setIsHealthy(healthy);
      
      // Verificar stores disponíveis
      const dbName = 'VistoriaABPAC';
      const request = indexedDB.open(dbName);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        setAvailableStores(Array.from(db.objectStoreNames));
        db.close();
      };
      
      setLastCheck(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Erro no health check:', error);
      setIsHealthy(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDB = async () => {
    if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os dados locais e recarregar a página. Continuar?')) {
      setIsLoading(true);
      try {
        await clearAndReload();
      } catch (error) {
        console.error('Erro ao limpar DB:', error);
        setIsLoading(false);
      }
    }
  };

  const handleClearOnly = async () => {
    setIsLoading(true);
    try {
      await clearIndexedDB();
      alert('✅ IndexedDB limpo! Recarregue a página manualmente.');
      await checkHealth();
    } catch (error) {
      console.error('Erro ao limpar DB:', error);
      alert('❌ Erro ao limpar IndexedDB');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      checkHealth();
    }
  }, [isClient]);

  const missingStores = requiredStores.filter(store => !availableStores.includes(store));

  // Mostrar loading enquanto não está no cliente
  if (!isClient) {
    return (
      <Card className="max-w-2xl mx-auto m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            IndexedDB Debug & Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p>Carregando diagnóstico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          IndexedDB Debug & Diagnóstico
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            {isHealthy === null ? (
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            ) : isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              Status: {isHealthy === null ? 'Verificando...' : isHealthy ? 'Saudável' : 'Problemático'}
            </span>
          </div>
          <Button 
            onClick={checkHealth} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Verificar Novamente
          </Button>
        </div>

        {lastCheck && (
          <p className="text-sm text-gray-600">
            Última verificação: {lastCheck}
          </p>
        )}

        {/* Stores Disponíveis */}
        <div>
          <h3 className="font-medium mb-2">Stores Disponíveis ({availableStores.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {requiredStores.map(store => (
              <div 
                key={store}
                className={`p-2 rounded text-sm border ${
                  availableStores.includes(store) 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {availableStores.includes(store) ? '✅' : '❌'} {store}
              </div>
            ))}
          </div>
        </div>

        {/* Stores Faltando */}
        {missingStores.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-1">
              ⚠️ Stores Faltando ({missingStores.length})
            </h4>
            <p className="text-sm text-red-700">
              {missingStores.join(', ')}
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="space-y-2 pt-4 border-t">
          <h3 className="font-medium">Ações de Correção</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button 
              onClick={handleClearOnly}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar IndexedDB
            </Button>
            
            <Button 
              onClick={handleClearDB}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar & Recarregar
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            💡 Se há stores faltando, use "Limpar & Recarregar" para corrigir completamente.
          </p>
        </div>

        {/* Informações Técnicas */}
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Informações Técnicas</summary>
          <div className="mt-2 space-y-1 text-gray-600">
            <p>• Banco: VistoriaABPAC (versão 4)</p>
            <p>• Stores Necessárias: {requiredStores.length}</p>
            <p>• Stores Encontradas: {availableStores.length}</p>
            <p>• IndexedDB Suportado: {isClient && window.indexedDB ? 'Sim' : 'Não'}</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}