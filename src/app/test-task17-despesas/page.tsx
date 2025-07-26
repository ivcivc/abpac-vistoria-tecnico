'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DespesaForm } from '@/components/despesas/DespesaForm';
import { DespesasList } from '@/components/despesas/DespesasList';
import { DespesaService } from '@/services/despesas/DespesaService';
import { useAuth } from '@/contexts/AuthContext';
import { Despesa } from '@/types/storage';
import { 
  Receipt, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function TestDespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vistoriaId, setVistoriaId] = useState('1'); // ID de teste
  const [itemId, setItemId] = useState('1'); // ID de teste
  
  const { token } = useAuth();
  
  // Função para adicionar logs
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };
  
  // Carregar despesas do backend
  const carregarDespesas = async () => {
    if (!token) {
      addLog('❌ Sem token de autenticação. Não é possível carregar despesas.');
      return;
    }
    
    setIsLoading(true);
    addLog('🔄 Carregando despesas do backend...');
    
    try {
      const result = await DespesaService.obterDespesas(vistoriaId, token);
      
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Salvar despesa
  const handleSaveDespesa = async (novaDespesa: Omit<Despesa, 'id'>) => {
    addLog('🔄 Salvando despesa...');
    setIsLoading(true);
    
    try {
      if (token) {
        // Salvar no backend
        const result = await DespesaService.adicionarDespesa(
          vistoriaId,
          novaDespesa,
          token
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
    if (token) {
      carregarDespesas();
    } else {
      addLog('⚠️ Sem token de autenticação disponível. Operando em modo offline.');
    }
  }, [token]);
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              <span>Teste da Task 17 - Integração de Despesas</span>
            </div>
            <Badge className={token ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {token ? 'Autenticado' : 'Não Autenticado'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              Esta página testa a integração com os endpoints reais de despesas do backend.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Vistoria ID: {vistoriaId}</Badge>
              <Badge variant="outline">Item ID: {itemId}</Badge>
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
              disabled={!token || isLoading}
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
          </div>
          
          {!token && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Sem token de autenticação. Algumas funcionalidades estarão limitadas.
              </p>
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
            <DespesaForm
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
  );
} 