'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VistoriaCompletionFlow } from '@/components/vistoria/VistoriaCompletionFlow';
import { VistoriaLocal, LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { 
  CheckCircle, 
  RefreshCw, 
  AlertCircle, 
  Key,
  Loader2,
  FileText,
  ArrowLeft,
  Save
} from 'lucide-react';

// Criar um contexto de autenticação simplificado para a página de teste
const TestAuthContext = createContext<{ token: string | null }>({ token: null });

// Hook para usar o contexto de autenticação de teste
const useTestAuth = () => useContext(TestAuthContext);

// Componente principal da página
export default function TestCompletionPage() {
  const [vistoria, setVistoria] = useState<VistoriaLocal | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
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
  
  // Carregar vistoria de exemplo
  const carregarVistoriaExemplo = async () => {
    setLoading(true);
    addLog('🔄 Carregando vistoria de exemplo...');
    
    try {
      // Criar vistoria de exemplo
      const vistoriaExemplo: VistoriaLocal = {
        id: '123456',
        titulo: 'Vistoria de Teste',
        local: 'Av. Paulista, 1000 - São Paulo, SP',
        status: 'em_andamento',
        dataCriacao: new Date(),
        ultimaAtualizacao: new Date(),
        progresso: 80,
        itens: [
          {
            id: '1',
            tipo: 'Rastreador',
            categoria: 'GPS',
            acao: 'INSTALAR',
            concluido: true,
            observacoes: 'Instalado no painel frontal',
            evidencias: [
              {
                id: 'ev1',
                itemId: '1',
                tipo: 'foto',
                url: 'https://via.placeholder.com/300',
                localUrl: 'https://via.placeholder.com/300',
                tamanho: 1024,
                timestamp: new Date(),
                tipoEvidencia: 'numero_serie'
              },
              {
                id: 'ev2',
                itemId: '1',
                tipo: 'foto',
                url: 'https://via.placeholder.com/300',
                localUrl: 'https://via.placeholder.com/300',
                tamanho: 1024,
                timestamp: new Date(),
                tipoEvidencia: 'local_instalacao'
              }
            ],
            despesas: [
              {
                id: 'desp1',
                itemId: '1',
                vistoriaId: '123456',
                tipo: 'MATERIAL',
                valor: 150.00,
                descricao: 'Cabo de instalação',
                timestamp: new Date(),
                aprovada: false
              }
            ]
          },
          {
            id: '2',
            tipo: 'Bloqueador',
            categoria: 'Corte de Combustível',
            acao: 'INSTALAR',
            concluido: true,
            observacoes: 'Instalado próximo à bomba de combustível',
            evidencias: [
              {
                id: 'ev3',
                itemId: '2',
                tipo: 'foto',
                url: 'https://via.placeholder.com/300',
                localUrl: 'https://via.placeholder.com/300',
                tamanho: 1024,
                timestamp: new Date(),
                tipoEvidencia: 'numero_serie'
              },
              {
                id: 'ev4',
                itemId: '2',
                tipo: 'foto',
                url: 'https://via.placeholder.com/300',
                localUrl: 'https://via.placeholder.com/300',
                tamanho: 1024,
                timestamp: new Date(),
                tipoEvidencia: 'local_instalacao'
              }
            ],
            despesas: []
          }
        ]
      };
      
      setVistoria(vistoriaExemplo);
      addLog('✅ Vistoria de exemplo carregada com sucesso');
      
    } catch (error) {
      addLog(`❌ Erro ao carregar vistoria de exemplo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error('Erro detalhado:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Adicionar item pendente para teste
  const adicionarItemPendente = () => {
    if (!vistoria) return;
    
    setVistoria(prev => {
      if (!prev) return prev;
      
      const itemPendente = {
        id: `${Date.now()}`,
        tipo: 'Sensor',
        categoria: 'Presença',
        acao: 'INSTALAR',
        concluido: false,
        observacoes: '',
        evidencias: [],
        despesas: []
      };
      
      return {
        ...prev,
        itens: [...prev.itens || [], itemPendente],
        progresso: 60 // Reduzir progresso
      };
    });
    
    addLog('⚠️ Item pendente adicionado para testar validação');
  };
  
  // Concluir todos os itens para teste
  const concluirTodosItens = () => {
    if (!vistoria) return;
    
    setVistoria(prev => {
      if (!prev) return prev;
      
      const itensAtualizados = (prev.itens || []).map(item => ({
        ...item,
        concluido: true,
        observacoes: item.observacoes || 'Concluído automaticamente para teste',
        evidencias: item.evidencias.length > 0 ? item.evidencias : [
          {
            id: `ev_auto_${item.id}_1`,
            itemId: item.id,
            tipo: 'foto',
            url: 'https://via.placeholder.com/300',
            localUrl: 'https://via.placeholder.com/300',
            tamanho: 1024,
            timestamp: new Date(),
            tipoEvidencia: 'numero_serie'
          },
          {
            id: `ev_auto_${item.id}_2`,
            itemId: item.id,
            tipo: 'foto',
            url: 'https://via.placeholder.com/300',
            localUrl: 'https://via.placeholder.com/300',
            tamanho: 1024,
            timestamp: new Date(),
            tipoEvidencia: 'local_instalacao'
          }
        ]
      }));
      
      return {
        ...prev,
        itens: itensAtualizados,
        progresso: 95 // Aumentar progresso
      };
    });
    
    addLog('✅ Todos os itens foram concluídos para teste');
  };
  
  // Atualizar vistoria após conclusão
  const handleVistoriaUpdated = (vistoriaAtualizada: VistoriaLocal) => {
    setVistoria(vistoriaAtualizada);
    addLog(`✅ Vistoria atualizada: status = ${vistoriaAtualizada.status}, progresso = ${vistoriaAtualizada.progresso}%`);
    
    if (vistoriaAtualizada.status === 'concluida') {
      addLog('🎉 Vistoria concluída com sucesso!');
      
      if (vistoriaAtualizada.sincronizado) {
        addLog('🔄 Vistoria sincronizada com o backend');
      } else {
        addLog('⚠️ Vistoria concluída localmente (pendente de sincronização)');
      }
    }
  };
  
  // Carregar vistoria ao iniciar
  useEffect(() => {
    carregarVistoriaExemplo();
  }, []);
  
  // Renderizar a página dentro do contexto de autenticação de teste
  return (
    <TestAuthContext.Provider value={{ token: testToken }}>
      <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <span>Teste da Task 19 - Conclusão de Vistoria</span>
              </div>
              <Badge className={testToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {testToken ? 'Autenticado' : 'Não Autenticado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                Esta página testa o fluxo de conclusão de vistoria com integração ao backend.
              </p>
              
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
            <CardTitle>Ações de Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={carregarVistoriaExemplo}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Vistoria
              </Button>
              
              <Button
                onClick={adicionarItemPendente}
                disabled={loading || !vistoria}
                variant="outline"
                className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100"
              >
                <AlertCircle className="w-4 h-4" />
                Adicionar Item Pendente
              </Button>
              
              <Button
                onClick={concluirTodosItens}
                disabled={loading || !vistoria}
                variant="outline"
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100"
              >
                <CheckCircle className="w-4 h-4" />
                Concluir Todos Itens
              </Button>
            </div>
            
            {!testToken && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Defina um token de autenticação para testar a integração com o backend.
                  Sem token, a vistoria será concluída apenas localmente.
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
        
        {/* Componente de Conclusão */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
            <span className="text-lg text-blue-600">Carregando vistoria...</span>
          </div>
        ) : vistoria ? (
          <div className="border border-gray-200 rounded-lg p-1">
            <VistoriaCompletionFlow 
              vistoria={vistoria} 
              onVistoriaUpdated={handleVistoriaUpdated}
              token={testToken}
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-16 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg">Nenhuma vistoria carregada</p>
              <p className="text-sm mt-1">
                Clique em "Recarregar Vistoria" para carregar uma vistoria de exemplo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TestAuthContext.Provider>
  );
} 