'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DespesaForm } from '@/components/despesas/DespesaForm';
import { DespesasList } from '@/components/despesas/DespesasList';
import { DespesaService, DespesaBackend } from '@/services/despesas/DespesaService';
import { Despesa } from '@/types/storage';
import { 
  Receipt, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Key
} from 'lucide-react';

// Criar um contexto de autenticação simplificado para a página de teste
const TestAuthContext = createContext<{ token: string | null }>({ token: null });

// Hook para usar o contexto de autenticação de teste
const useTestAuth = () => useContext(TestAuthContext);

// Componente principal da página
export default function TestDespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vistoriaId, setVistoriaId] = useState('1'); // ID de teste
  const [itemId, setItemId] = useState('1'); // ID de teste
  const [testToken, setTestToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  
  // Função para adicionar logs
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };
  
  // Função para definir o token de teste
  const handleSetToken = () => {
    if (tokenInput.trim()) {
      setTestToken(tokenInput.trim());
      addLog(`✅ Token de teste definido: ${tokenInput.substring(0, 10)}...`);
    } else {
      setTestToken(null);
      addLog('❌ Token de teste removido');
    }
  };
  
  // Carregar despesas do backend
  const carregarDespesas = async () => {
    if (!testToken) {
      addLog('❌ Sem token de autenticação. Não é possível carregar despesas.');
      return;
    }
    
    setIsLoading(true);
    addLog('🔄 Carregando despesas do backend...');
    addLog(`🔄 Vistoria ID: ${vistoriaId}, Token: ${testToken.substring(0, 10)}...`);
    
    try {
      // Verificar se o backend está acessível
      try {
        const healthCheck = await fetch('http://localhost:3333/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (healthCheck.ok) {
          addLog('✅ Conexão com o backend estabelecida');
        } else {
          addLog(`⚠️ Backend respondeu com status: ${healthCheck.status}`);
        }
      } catch (healthError) {
        addLog(`⚠️ Não foi possível conectar ao backend: ${healthError instanceof Error ? healthError.message : 'Erro desconhecido'}`);
      }
      
      // Tentar obter as despesas
      addLog('🔄 Chamando DespesaService.obterDespesas...');
      const result = await DespesaService.obterDespesas(vistoriaId, testToken);
      
      if (result.success && result.despesas) {
        const despesasConvertidas = result.despesas.map(d => 
          DespesaService.convertFromBackend(d)
        );
        
        setDespesas(despesasConvertidas);
        addLog(`✅ ${despesasConvertidas.length} despesas carregadas com sucesso!`);
      } else {
        addLog(`❌ Erro ao carregar despesas: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      addLog(`❌ Exceção ao carregar despesas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error('Erro detalhado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Testar autenticação sem prefixo Bearer
  const testarAutenticacaoSimples = async () => {
    if (!testToken) {
      addLog('❌ Sem token de autenticação. Não é possível testar.');
      return;
    }
    
    setIsLoading(true);
    addLog('🔄 Testando autenticação sem prefixo Bearer...');
    
    try {
      // Construir URL
      const url = `http://localhost:3333/api/estoque-remessa/${vistoriaId}/despesas`;
      addLog(`🔄 URL: ${url}`);
      
      // Fazer requisição direta sem o prefixo Bearer
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': testToken // Sem prefixo Bearer
        }
      });
      
      addLog(`🔄 Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog('✅ Autenticação sem Bearer funcionou!');
        addLog(`✅ Dados recebidos: ${JSON.stringify(data).substring(0, 100)}...`);
        
        if (data.data && Array.isArray(data.data)) {
          const despesasConvertidas = data.data.map((d: DespesaBackend) => 
            DespesaService.convertFromBackend(d)
          );
          
          setDespesas(despesasConvertidas);
          addLog(`✅ ${despesasConvertidas.length} despesas carregadas com sucesso!`);
        }
      } else {
        let errorMsg = `Erro ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg += `: ${errorData.message || errorData.error || JSON.stringify(errorData)}`;
        } catch (e) {
          errorMsg += `: ${response.statusText}`;
        }
        addLog(`❌ Falha na autenticação sem Bearer: ${errorMsg}`);
      }
    } catch (error) {
      addLog(`❌ Exceção ao testar autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error('Erro detalhado:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Salvar despesa
  const handleSaveDespesa = async (novaDespesa: Omit<Despesa, 'id'>) => {
    addLog('🔄 Salvando despesa...');
    setIsLoading(true);
    
    try {
      if (testToken) {
        // Salvar no backend
        const result = await DespesaService.adicionarDespesa(
          vistoriaId,
          novaDespesa,
          testToken
        );
        
        if (result.success && result.despesa) {
          // Converter do formato do backend para o frontend
          const despesaSalva = DespesaService.convertFromBackend(result.despesa);
          
          if (editingDespesa) {
            // Atualizar despesa existente
            setDespesas(prev => prev.map(d => 
              d.id === editingDespesa.id ? despesaSalva : d
            ));
            addLog(`✅ Despesa ID ${despesaSalva.id} atualizada no backend!`);
          } else {
            // Adicionar nova despesa
            setDespesas(prev => [...prev, despesaSalva]);
            addLog(`✅ Nova despesa ID ${despesaSalva.id} criada no backend!`);
          }
        } else {
          addLog(`❌ Erro ao salvar despesa no backend: ${result.error || 'Erro desconhecido'}`);
        }
      } else {
        // Salvar localmente apenas (modo offline/demo)
        const despesaLocal: Despesa = {
          ...novaDespesa,
          id: editingDespesa?.id || `local_${Date.now()}`,
          vistoriaId,
        };
        
        if (editingDespesa) {
          setDespesas(prev => prev.map(d => 
            d.id === editingDespesa.id ? despesaLocal : d
          ));
          addLog(`✅ Despesa ID ${despesaLocal.id} atualizada localmente!`);
        } else {
          setDespesas(prev => [...prev, despesaLocal]);
          addLog(`✅ Nova despesa ID ${despesaLocal.id} criada localmente!`);
        }
      }
      
      setShowForm(false);
      setEditingDespesa(null);
    } catch (error) {
      addLog(`❌ Exceção ao salvar despesa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Editar despesa
  const handleEditDespesa = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setShowForm(true);
    addLog(`🔄 Editando despesa ID ${despesa.id}`);
  };
  
  // Efeito para carregar despesas inicialmente
  useEffect(() => {
    if (testToken) {
      carregarDespesas();
    } else {
      addLog('⚠️ Sem token de autenticação disponível. Operando em modo offline.');
    }
  }, [testToken]);
  
  // Renderizar a página dentro do contexto de autenticação de teste
  return (
    <TestAuthContext.Provider value={{ token: testToken }}>
      <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6" />
                <span>Teste da Task 17 - Integração de Despesas</span>
              </div>
              <Badge className={testToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {testToken ? 'Autenticado' : 'Não Autenticado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                Esta página testa a integração com os endpoints reais de despesas do backend.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Vistoria ID: {vistoriaId}</Badge>
                <Badge variant="outline">Item ID: {itemId}</Badge>
              </div>
              
              {/* Input para token de teste */}
              <div className="flex gap-2 mt-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Cole aqui um token de autenticação para teste"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <Button
                  onClick={handleSetToken}
                  className="flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  {testToken ? 'Atualizar Token' : 'Definir Token'}
                </Button>
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
        
        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setShowForm(true);
                  setEditingDespesa(null);
                }}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Despesa
              </Button>
              
              <Button
                onClick={carregarDespesas}
                disabled={!testToken || isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Recarregar Despesas
              </Button>
              
              <Button
                onClick={testarAutenticacaoSimples}
                disabled={!testToken || isLoading}
                variant="outline"
                className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100"
              >
                <Key className="w-4 h-4" />
                Testar Auth Sem Bearer
              </Button>
            </div>
            
            {!testToken && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Defina um token de autenticação para testar a integração com o backend.
                </p>
              </div>
            )}
            
            {testToken && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Informações do Token:</p>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• Comprimento: {testToken.length} caracteres</p>
                  <p>• Formato: {testToken.includes('.') ? 'Possível JWT' : 'String simples'}</p>
                  <p>• Início: {testToken.substring(0, 15)}...</p>
                  <p>• Final: ...{testToken.substring(testToken.length - 15)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Formulário */}
        {showForm && (
          <Card className="border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">
                {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TestDespesaForm
                despesa={editingDespesa || undefined}
                vistoriaId={vistoriaId}
                itemId={itemId}
                onSave={handleSaveDespesa}
                onCancel={() => {
                  setShowForm(false);
                  setEditingDespesa(null);
                }}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Lista de Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Despesas
              <Badge className="bg-blue-100 text-blue-800">
                {despesas.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : despesas.length > 0 ? (
              <DespesasList
                despesas={despesas}
                onEditDespesa={handleEditDespesa}
                showFilters={true}
                showItemGrouping={true}
                readOnly={false}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhuma despesa encontrada</p>
                <p className="text-xs mt-1">
                  Adicione uma despesa usando o botão "Nova Despesa"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TestAuthContext.Provider>
  );
}

// Versão modificada do DespesaForm que usa o contexto de autenticação de teste
function TestDespesaForm(props: any) {
  const { token } = useTestAuth();
  
  // Componente com mesmo comportamento do DespesaForm, mas usando o contexto de teste
  return <DespesaForm {...props} token={token} />;
} 