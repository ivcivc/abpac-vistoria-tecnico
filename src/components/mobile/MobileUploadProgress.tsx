'use client';

/**
 * Componente de Progresso de Upload Mobile-First
 * Task 4.6 - Indicadores de progresso otimizados para técnicos em campo
 */

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Upload, Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { EvidenceStorageService, EvidenceStorageStats } from '@/services/media/EvidenceStorageService';

interface UploadProgressItem {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  status: 'waiting' | 'uploading' | 'completed' | 'error';
  progress: number;
  velocidade?: number; // KB/s
  tempoRestante?: number; // segundos
  erro?: string;
}

interface MobileUploadProgressProps {
  vistoriaId?: string;
  autoRefresh?: boolean;
  onRetry?: (evidenceId: string) => void;
  onCancel?: (evidenceId: string) => void;
  className?: string;
}

export function MobileUploadProgress({
  vistoriaId,
  autoRefresh = true,
  onRetry,
  onCancel,
  className = ''
}: MobileUploadProgressProps) {
  const [stats, setStats] = useState<EvidenceStorageStats | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);

  // Atualizar estatísticas
  const updateStats = async () => {
    try {
      const newStats = await EvidenceStorageService.getStorageStats();
      setStats(newStats);
    } catch (error) {
      console.error('❌ MobileUploadProgress: Erro ao carregar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Detectar mudanças de conectividade
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh das estatísticas
  useEffect(() => {
    updateStats();

    if (autoRefresh) {
      const interval = setInterval(updateStats, 3000); // A cada 3 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'uploading':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando evidências...</span>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Erro ao carregar informações de upload</p>
          <Button 
            onClick={updateStats} 
            variant="outline" 
            size="sm" 
            className="mt-3"
          >
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  const totalPendentes = stats.porStatus.local + stats.porStatus.error || 0;
  const totalSincronizadas = stats.porStatus.synced || 0;
  const totalUploading = stats.porStatus.uploading || 0;

  return (
    <Card className={`${className}`}>
      {/* Header com status de conectividade */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium text-gray-700">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            {stats.totalEvidencias} evidências • {formatFileSize(stats.totalTamanho)}
          </div>
        </div>
      </div>

      {/* Resumo visual */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Sincronizadas */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">{totalSincronizadas}</div>
            <div className="text-xs text-gray-500">Sincronizadas</div>
          </div>

          {/* Uploading */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Upload className={`h-6 w-6 text-blue-600 ${totalUploading > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <div className="text-lg font-bold text-blue-600">{totalUploading}</div>
            <div className="text-xs text-gray-500">Enviando</div>
          </div>

          {/* Pendentes */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-lg font-bold text-orange-600">{totalPendentes}</div>
            <div className="text-xs text-gray-500">Pendentes</div>
          </div>
        </div>

        {/* Barra de progresso geral */}
        {stats.totalEvidencias > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progresso Geral</span>
              <span>{Math.round((totalSincronizadas / stats.totalEvidencias) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(totalSincronizadas / stats.totalEvidencias) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Lista de evidências não sincronizadas */}
        {stats.naoSincronizadas.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 text-sm mb-3">
              Evidências Pendentes ({stats.naoSincronizadas.length})
            </h4>
            
            {stats.naoSincronizadas.slice(0, 5).map((evidence) => (
              <div
                key={evidence.id}
                className={`p-3 rounded-lg border-2 ${getStatusColor(evidence.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(evidence.status)}
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {evidence.nomeOriginal}
                      </div>
                      <div className="text-xs text-gray-500">
                        {evidence.tipoEvidencia.replace('_', ' ')} • {formatFileSize(evidence.tamanho)}
                      </div>
                      {evidence.ultimoErroUpload && (
                        <div className="text-xs text-red-600 mt-1">
                          {evidence.ultimoErroUpload}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  {evidence.status === 'error' && onRetry && (
                    <Button
                      onClick={() => onRetry(evidence.id)}
                      size="sm"
                      variant="outline"
                      className="ml-2 text-xs h-8 px-3"
                    >
                      Tentar
                    </Button>
                  )}
                </div>

                {/* Barra de progresso individual para uploads em andamento */}
                {evidence.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full animate-pulse"
                        style={{ width: '45%' }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Mostrar mais evidências se houver */}
            {stats.naoSincronizadas.length > 5 && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">
                  +{stats.naoSincronizadas.length - 5} evidências pendentes
                </span>
              </div>
            )}
          </div>
        )}

        {/* Estado vazio ou tudo sincronizado */}
        {stats.totalEvidencias === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Upload className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma evidência encontrada</p>
            <p className="text-xs mt-1">Capture fotos durante a vistoria</p>
          </div>
        )}

        {stats.totalEvidencias > 0 && stats.naoSincronizadas.length === 0 && (
          <div className="text-center py-6 text-green-600">
            <CheckCircle className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium">Todas as evidências sincronizadas!</p>
            <p className="text-sm text-gray-500 mt-1">Upload completo</p>
          </div>
        )}

        {/* Aviso de conectividade */}
        {!isOnline && totalPendentes > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700">
                Upload pausado - sem conexão
              </span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              As evidências serão enviadas automaticamente quando a conexão for restaurada
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}