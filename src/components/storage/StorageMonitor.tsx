'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { StorageManagerService, StorageSettings } from '@/services/storage/StorageManagerService';
import { StorageStats } from '@/types/offline';
import { HardDrive, Trash2, RefreshCw, Settings, AlertCircle, CheckCircle } from 'lucide-react';

interface StorageMonitorProps {
  className?: string;
  showSettings?: boolean;
  showActions?: boolean;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
}

export function StorageMonitor({
  className = '',
  showSettings = true,
  showActions = true,
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 60
}: StorageMonitorProps) {
  // Estados
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [settings, setSettings] = useState<StorageSettings>({
    maxStorageMB: 100,
    cleanupThresholdPercentage: 85,
    dataRetentionDays: 30,
    autoCleanupEnabled: true
  });
  
  // Instância do serviço
  const storageManager = StorageManagerService.getInstance();
  
  // Carregar estatísticas e configurações
  useEffect(() => {
    loadStats();
    loadSettings();
    
    // Configurar atualização automática
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadStats();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);
  
  // Carregar estatísticas de armazenamento
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const storageStats = await storageManager.getStorageStats();
      setStats(storageStats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError('Não foi possível carregar estatísticas de armazenamento');
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar configurações
  const loadSettings = async () => {
    try {
      await storageManager.loadSettings();
      // Não temos um método para obter as configurações atuais, então não podemos atualizar o estado aqui
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  };
  
  // Salvar configurações
  const saveSettings = () => {
    try {
      storageManager.updateSettings(settings);
      setSuccess('Configurações salvas com sucesso');
      setTimeout(() => setSuccess(null), 3000);
      setShowSettingsPanel(false);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError('Não foi possível salvar as configurações');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Limpar dados antigos
  const cleanupOldData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await storageManager.cleanupOldData();
      
      if (result.success) {
        setSuccess(`Limpeza concluída: ${result.itemsRemoved} itens removidos, ${(result.bytesFreed / 1024).toFixed(2)} KB liberados`);
        loadStats(); // Recarregar estatísticas
      } else {
        setError(`Erro na limpeza: ${result.errors.join(', ')}`);
      }
    } catch (err) {
      console.error('Erro ao limpar dados:', err);
      setError('Não foi possível limpar os dados antigos');
    } finally {
      setLoading(false);
    }
  };
  
  // Formatar tamanho em bytes para exibição
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  // Formatar data para exibição
  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Determinar cor do progresso com base no percentual
  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-slate-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-lg">Gerenciamento de Armazenamento</CardTitle>
          </div>
          
          {showActions && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadStats}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              {showSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configurações
                </Button>
              )}
            </div>
          )}
        </div>
        <CardDescription>
          Monitoramento e gerenciamento do armazenamento local
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
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
        
        {/* Resumo de uso */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Uso de Armazenamento</h3>
          
          {stats ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-500">
                  {formatSize(stats.totalUsage)} de {formatSize(stats.availableSpace + stats.totalUsage)}
                </span>
                <span className="text-sm font-medium">
                  {stats.percentageUsed}%
                </span>
              </div>
              
              <Progress 
                value={stats.percentageUsed} 
                className="h-2"
                indicatorClassName={getProgressColor(stats.percentageUsed)}
              />
              
              {stats.percentageUsed > settings.cleanupThresholdPercentage && (
                <p className="text-xs text-amber-600 mt-1">
                  Uso acima do limite recomendado ({settings.cleanupThresholdPercentage}%)
                </p>
              )}
            </>
          ) : (
            <div className="h-6 bg-slate-100 animate-pulse rounded"></div>
          )}
        </div>
        
        {/* Painel de configurações */}
        {showSettingsPanel && (
          <div className="mb-6 p-4 border rounded-md bg-slate-50">
            <h3 className="text-sm font-medium mb-3">Configurações de Armazenamento</h3>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="maxStorage">Limite máximo (MB)</Label>
                <Input
                  id="maxStorage"
                  type="number"
                  value={settings.maxStorageMB}
                  onChange={(e) => setSettings({...settings, maxStorageMB: Number(e.target.value)})}
                  min="10"
                  max="500"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="threshold">Limite para limpeza automática (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={settings.cleanupThresholdPercentage}
                  onChange={(e) => setSettings({...settings, cleanupThresholdPercentage: Number(e.target.value)})}
                  min="50"
                  max="95"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="retention">Dias de retenção de dados</Label>
                <Input
                  id="retention"
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => setSettings({...settings, dataRetentionDays: Number(e.target.value)})}
                  min="1"
                  max="365"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoCleanup">Limpeza automática</Label>
                <Switch
                  id="autoCleanup"
                  checked={settings.autoCleanupEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, autoCleanupEnabled: checked})}
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setShowSettingsPanel(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveSettings}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Detalhes */}
        {showDetails && stats && (
          <div className="space-y-4">
            <Separator />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Contagem de Itens</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex justify-between">
                    <span className="text-slate-500">Vistorias:</span>
                    <span>{stats.itemCounts.vistorias}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Itens:</span>
                    <span>{stats.itemCounts.itens}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Evidências:</span>
                    <span>{stats.itemCounts.evidencias}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Despesas:</span>
                    <span>{stats.itemCounts.despesas}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Fila de Sincronização:</span>
                    <span>{stats.itemCounts.syncQueue}</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Informações Temporais</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex justify-between">
                    <span className="text-slate-500">Item mais antigo:</span>
                    <span>{formatDate(stats.oldestItem)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Item mais recente:</span>
                    <span>{formatDate(stats.newestItem)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className="bg-slate-50 flex justify-between">
          <div className="text-xs text-slate-500">
            Última atualização: {new Date().toLocaleTimeString()}
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={cleanupOldData}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar Dados Antigos
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 