'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { StorageMonitor } from '@/components/storage/StorageMonitor';
import { StorageManagerService } from '@/services/storage/StorageManagerService';
import { IndexedDBMigration } from '@/utils/indexedDBMigration';
import { AlertCircle, CheckCircle, Database, HardDrive, Trash2 } from 'lucide-react';

export default function TestStorageManagementPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Adicionar log
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };
  
  // Limpar todos os dados
  const handleClearAllData = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta ação irá remover TODOS os dados armazenados localmente. Tem certeza?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      addLog('🧹 Iniciando limpeza completa de dados...');
      
      const storageManager = StorageManagerService.getInstance();
      await storageManager.clearAllData();
      
      setSuccess('Todos os dados foram limpos com sucesso!');
      addLog('✅ Limpeza completa concluída');
    } catch (err) {
      console.error('Erro ao limpar dados:', err);
      setError(`Erro ao limpar dados: ${err}`);
      addLog(`❌ Erro: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Diagnosticar banco de dados
  const handleDiagnoseBD = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      addLog('🔍 Iniciando diagnóstico do banco de dados...');
      
      const migration = new IndexedDBMigration();
      const result = await migration.diagnose();
      
      addLog(`📊 Bancos encontrados: ${result.databases.length}`);
      result.databases.forEach(db => {
        addLog(`  - ${db.name} v${db.version}`);
      });
      
      addLog(`📊 Stores encontradas: ${result.stores.length}`);
      result.stores.forEach(store => {
        addLog(`  - ${store}`);
      });
      
      addLog(`📊 Uso de armazenamento: ${(result.storageUsed / 1024 / 1024).toFixed(2)} MB`);
      
      if (result.issues.length > 0) {
        addLog('⚠️ Problemas encontrados:');
        result.issues.forEach(issue => {
          addLog(`  - ${issue}`);
        });
        setError(`Problemas encontrados: ${result.issues.join(', ')}`);
      } else {
        setSuccess('Diagnóstico concluído sem problemas');
      }
    } catch (err) {
      console.error('Erro ao diagnosticar banco:', err);
      setError(`Erro ao diagnosticar banco: ${err}`);
      addLog(`❌ Erro: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Forçar migração do banco
  const handleForceMigration = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      addLog('🔄 Iniciando migração forçada do banco de dados...');
      
      const migration = new IndexedDBMigration();
      const result = await migration.forceMigration();
      
      if (result.success) {
        setSuccess(result.message);
        addLog(`✅ ${result.message}`);
      } else {
        setError(result.message);
        addLog(`❌ ${result.message}`);
      }
    } catch (err) {
      console.error('Erro na migração:', err);
      setError(`Erro na migração: ${err}`);
      addLog(`❌ Erro: ${err}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="bg-slate-800 text-white">
            <div className="flex items-center gap-2">
              <HardDrive className="h-6 w-6" />
              <CardTitle>Gerenciamento de Armazenamento (Task 21)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-6">
              Esta página demonstra as funcionalidades de gerenciamento de armazenamento local implementadas na Task 21.
              O sistema monitora o uso de armazenamento, permite configurar limites e realiza limpeza automática de dados antigos.
            </p>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Sucesso</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Ações Avançadas</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleDiagnoseBD}
                  disabled={loading}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Diagnosticar Banco
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleForceMigration}
                  disabled={loading}
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Forçar Migração
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleClearAllData}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Todos os Dados
                </Button>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Monitor de Armazenamento</h3>
              <StorageMonitor />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Logs</h3>
              <div className="bg-slate-100 border rounded-md p-3 h-[200px] overflow-y-auto text-sm font-mono">
                {logs.length === 0 ? (
                  <p className="text-slate-500 italic">Nenhum log disponível</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="py-1 border-b border-slate-200 last:border-0">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentação</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <h3 className="font-medium mb-2">Funcionalidades Implementadas</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Monitoramento de uso de armazenamento local</li>
              <li>Configurações de limites de armazenamento personalizáveis</li>
              <li>Limpeza automática de dados antigos quando o limite é atingido</li>
              <li>Limpeza manual de dados antigos</li>
              <li>Diagnóstico e reparo do banco de dados</li>
            </ul>
            
            <h3 className="font-medium mb-2">Componentes Criados</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><code>StorageManagerService</code> - Serviço central para gerenciamento de armazenamento</li>
              <li><code>StorageMonitor</code> - Componente visual para monitoramento e gerenciamento</li>
            </ul>
            
            <h3 className="font-medium mb-2">Requisitos Atendidos</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>8.4</strong> - Monitoramento de uso de armazenamento</li>
              <li><strong>8.5</strong> - Limpeza automática de dados antigos</li>
              <li><strong>11.4</strong> - Configurações de limite de armazenamento</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 