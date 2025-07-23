'use client';

import React, { useState, useEffect } from 'react';
import { MediaCapture, MediaFile } from '@/components/media/MediaCapture';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Video, 
  FileText,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';

export default function TestVideoCaptureePage() {
  const [medias, setMedias] = useState<MediaFile[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [browserInfo, setBrowserInfo] = useState<{
    userAgent: string;
    protocol: string;
    hostname: string;
    mediaDevicesSupported: boolean;
    getUserMediaSupported: boolean;
    httpsEnabled: boolean;
    deviceType: string;
  } | null>(null);

  // Inicializar informações do navegador apenas no cliente
  useEffect(() => {
    const detectBrowserInfo = () => {
      const userAgent = navigator.userAgent;
      const deviceType = /iPad|iPhone|iPod/.test(userAgent) ? 'iOS' : 
                        /Android/i.test(userAgent) ? 'Android' : 'Desktop';
      
      setBrowserInfo({
        userAgent,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        mediaDevicesSupported: !!navigator.mediaDevices,
        getUserMediaSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        httpsEnabled: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        deviceType
      });
    };

    detectBrowserInfo();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 19)]); // Manter últimas 20 entradas
  };

  const handleMediaCapture = (capturedMedia: MediaFile[]) => {
    setMedias(capturedMedia);
    addLog(`Mídia capturada: ${capturedMedia.length} arquivos (${capturedMedia.filter(m => m.tipo === 'foto').length} fotos, ${capturedMedia.filter(m => m.tipo === 'video').length} vídeos)`);
    
    // Log detalhes de cada mídia
    capturedMedia.forEach(media => {
      const size = Math.round(media.tamanho / 1024 / 1024 * 100) / 100;
      const duracao = media.duracao ? ` (${media.duracao}s)` : '';
      addLog(`- ${media.tipo.toUpperCase()}: ${media.nomeArquivo} - ${size}MB${duracao}`);
    });
  };

  const clearMedia = () => {
    setMedias([]);
    addLog('Mídia limpa');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportMediaInfo = () => {
    const info = {
      totalMedias: medias.length,
      fotos: medias.filter(m => m.tipo === 'foto').length,
      videos: medias.filter(m => m.tipo === 'video').length,
      tamanhoTotal: Math.round(medias.reduce((sum, m) => sum + m.tamanho, 0) / 1024 / 1024 * 100) / 100,
      detalhes: medias.map(m => ({
        id: m.id,
        tipo: m.tipo,
        nomeArquivo: m.nomeArquivo,
        tamanho: Math.round(m.tamanho / 1024 * 100) / 100,
        timestamp: m.timestamp,
        duracao: m.duracao
      }))
    };

    console.log('📊 Informações da Mídia:', info);
    addLog(`Informações exportadas para console: ${info.totalMedias} arquivos, ${info.tamanhoTotal}MB total`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teste de Captura de Vídeo - ABPAC
          </h1>
          <p className="text-gray-600">
            Demonstração do componente MediaCapture com suporte a fotos e vídeos (versão com melhorias de detecção)
          </p>
          
          {/* Informações de Diagnóstico */}
          <Card className="mt-4 mx-auto max-w-4xl">
            <CardHeader>
              <CardTitle className="text-lg">🔍 Diagnóstico do Dispositivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div><strong>📱 User Agent:</strong></div>
                  <div className="text-xs bg-gray-100 p-2 rounded font-mono break-all">
                    {browserInfo ? browserInfo.userAgent : 'Carregando...'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong>🌐 Protocolo:</strong> 
                      <Badge variant={browserInfo?.httpsEnabled ? 'default' : 'destructive'}>
                        {browserInfo ? browserInfo.protocol : 'Carregando...'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>📷 MediaDevices:</strong>
                      <Badge variant={browserInfo?.mediaDevicesSupported ? 'default' : 'destructive'}>
                        {browserInfo?.mediaDevicesSupported ? '✅ Disponível' : '❌ Não disponível'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>🎥 getUserMedia:</strong>
                      <Badge variant={browserInfo?.getUserMediaSupported ? 'default' : 'destructive'}>
                        {browserInfo?.getUserMediaSupported ? '✅ Disponível' : '❌ Não disponível'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>📱 Dispositivo:</strong>
                      <Badge variant="outline">
                        {browserInfo ? browserInfo.deviceType : 'Carregando...'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Componente de Captura */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-600" />
                  Captura de Evidências (Fotos + Vídeos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MediaCapture
                  onCapture={handleMediaCapture}
                  tipoEvidencia="outro"
                  permitirVideo={true}
                  maxDuracaoVideo={15} // 15 segundos para teste
                  maxVideos={3}
                  minVideos={0}
                  maxFotos={5}
                  minFotos={1}
                  descricao="Teste de captura com fotos e vídeos"
                />
              </CardContent>
            </Card>

            {/* Apenas Fotos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Captura Apenas Fotos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MediaCapture
                  onCapture={(media) => {
                    addLog(`Fotos capturadas: ${media.length}`);
                  }}
                  tipoEvidencia="numero_serie"
                  permitirVideo={false}
                  maxFotos={3}
                  minFotos={1}
                  descricao="Apenas fotos permitidas"
                />
              </CardContent>
            </Card>
          </div>

          {/* Informações e Logs */}
          <div className="space-y-4">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Estatísticas
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportMediaInfo}
                      disabled={medias.length === 0}
                    >
                      Exportar Info
                    </Button>
                    <Button
                      size="sm"
                      variant="outline" 
                      onClick={clearMedia}
                      disabled={medias.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Limpar
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {medias.filter(m => m.tipo === 'foto').length}
                    </div>
                    <div className="text-sm text-blue-800">Fotos</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {medias.filter(m => m.tipo === 'video').length}
                    </div>
                    <div className="text-sm text-red-800">Vídeos</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tamanho Total:</span>
                  <Badge variant="outline">
                    {Math.round(medias.reduce((sum, m) => sum + m.tamanho, 0) / 1024 / 1024 * 100) / 100} MB
                  </Badge>
                </div>

                {medias.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-700">Arquivos:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {medias.map((media) => (
                        <div key={media.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            {media.tipo === 'foto' ? (
                              <Camera className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Video className="w-3 h-3 text-red-500" />
                            )}
                            <span className="font-mono">
                              {media.nomeArquivo.length > 20 
                                ? `${media.nomeArquivo.substring(0, 20)}...`
                                : media.nomeArquivo
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {media.duracao && (
                              <span className="text-gray-500">{media.duracao}s</span>
                            )}
                            <span className="text-gray-500">
                              {Math.round(media.tamanho / 1024 * 100) / 100}KB
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Logs da Aplicação
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearLogs}
                    disabled={logs.length === 0}
                  >
                    Limpar Logs
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto bg-gray-900 text-green-400 p-3 rounded font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      Nenhum log ainda. Capture algumas mídias para ver os logs.
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Instruções de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• <strong>Primeira seção:</strong> Permite fotos e vídeos (máx 15s)</p>
                <p>• <strong>Segunda seção:</strong> Apenas fotos permitidas</p>
                <p>• <strong>Vídeos:</strong> Máximo 15 segundos, compressão automática</p>
                <p>• <strong>Fotos:</strong> Compressão automática se &gt; 500KB</p>
                <p>• <strong>Teste offline:</strong> Desative a internet e teste</p>
                <p>• <strong>Dispositivos:</strong> Teste em tablet, smartphone, desktop</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 