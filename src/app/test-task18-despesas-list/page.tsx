'use client';

import React, { useState, useEffect } from 'react';
import { DespesasList } from '@/components/despesas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Receipt, 
  RefreshCw, 
  Key, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function TestDespesasListPage() {
  const [vistoriaId, setVistoriaId] = useState<string>('1'); // ID padrão para teste
  const [useRealData, setUseRealData] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { token: authToken, validateToken } = useAuth();
  const [localToken, setLocalToken] = useState<string | null>(null);

  // Adicionar log
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  // Definir token para teste
  const handleSetToken = async () => {
    if (!tokenInput.trim()) {
      addLog('❌ Token não fornecido');
      setLocalToken(null);
      return;
    }

    setIsLoading(true);
    addLog('🔄 Validando token...');

    try {
      const isValid = await validateToken(tokenInput);
      
      if (isValid) {
        setLocalToken(tokenInput);
        addLog(`✅ Token válido: ${tokenInput.substring(0, 10)}...`);
      } else {
        setLocalToken(null);
        addLog('❌ Token inválido');
      }
    } catch (error) {
      addLog(`❌ Erro ao validar token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setLocalToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar entre dados reais e simulados
  const toggleDataSource = () => {
    const newValue = !useRealData;
    setUseRealData(newValue);
    addLog(`🔄 Usando ${newValue ? 'dados REAIS do backend' : 'dados SIMULADOS'}`);
  };

  // Verificar token inicial
  useEffect(() => {
    if (authToken) {
      setLocalToken(authToken);
      addLog(`✅ Token de autenticação encontrado: ${authToken.substring(0, 10)}...`);
    } else {
      addLog('⚠️ Nenhum token de autenticação disponível. Use o campo abaixo para definir um token.');
    }
  }, [authToken]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header da Página */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Link>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-6 h-6" />
                    Teste da Task 18 - Listagem e Totalização de Despesas
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Integração com o backend para listagem e totalização de despesas
                  </p>
                </div>
              </div>
              <Badge className={useRealData ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {useRealData ? 'Dados Reais' : 'Dados Simulados'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Controles de Autenticação */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Autenticação
                </h3>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Cole aqui um token de autenticação para teste"
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handleSetToken}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Definir Token
                  </Button>
                </div>
                
                <div className="mt-2">
                  <Badge className={localToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {localToken ? 'Autenticado' : 'Não Autenticado'}
                  </Badge>
                </div>
              </div>
              
              {/* Controles da Vistoria */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Configurações</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vistoria-id">ID da Vistoria</Label>
                    <Input
                      id="vistoria-id"
                      type="text"
                      value={vistoriaId}
                      onChange={(e) => setVistoriaId(e.target.value)}
                      placeholder="ID da vistoria"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      onClick={toggleDataSource}
                      variant={useRealData ? "default" : "outline"}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {useRealData ? 'Usar Dados Simulados' : 'Usar Dados Reais'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Logs</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {logs.length}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLogs([])}
                className="h-8"
              >
                Limpar Logs
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-40 overflow-y-auto bg-gray-50 p-0">
            {logs.length > 0 ? (
              <div className="divide-y">
                {logs.map((log, index) => (
                  <div key={index} className="px-4 py-2 text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Nenhum log disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Componente DespesasList */}
        <DespesasList
          despesas={[]} // Dados vazios, serão carregados do backend se useRealData=true
          showItemGrouping={true}
          showFilters={true}
          readOnly={true}
          vistoriaId={vistoriaId}
          useRealData={useRealData}
        />

        {/* Informações sobre a demonstração */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 text-sm">
              💡 Sobre esta demonstração
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <div className="space-y-2">
              <p>
                <strong>Funcionalidades implementadas:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>✅ Integração com endpoint real <code>/api/estoque-remessa/:id/despesas</code></li>
                <li>✅ Autenticação via token para acesso aos dados</li>
                <li>✅ Filtragem de dados no backend</li>
                <li>✅ Cálculos automáticos de totais e estatísticas</li>
                <li>✅ Agrupamento por item de vistoria</li>
                <li>✅ Alternância entre dados reais e simulados</li>
                <li>✅ Tratamento de erros e feedback visual</li>
              </ul>
              <p className="mt-3">
                <strong>Como usar:</strong> Defina um token de autenticação válido, informe o ID da vistoria desejada e clique em "Usar Dados Reais".
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 