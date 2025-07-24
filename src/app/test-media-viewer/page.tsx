'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MediaViewer } from '@/components/media/MediaViewer';
import { MediaFile } from '@/components/media/MediaCapture';
import { Eye, Trash2, Download, Info, RefreshCw } from 'lucide-react';

export default function TestMediaViewerPage() {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentViewerIndex, setCurrentViewerIndex] = useState(0);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [medias, setMedias] = useState<MediaFile[]>([
    {
      id: 'foto-1',
      url: 'https://picsum.photos/800/600?random=1',
      localUrl: 'https://picsum.photos/800/600?random=1',
      tipo: 'foto',
      timestamp: new Date('2024-01-15T10:30:00'),
      descricao: 'Foto do número de série do equipamento',
      tipoEvidencia: 'numero_serie',
      tamanho: 1024 * 150, // 150KB
      nomeArquivo: 'numero_serie_001.jpg'
    },
    {
      id: 'foto-2',
      url: 'https://picsum.photos/600/800?random=2',
      localUrl: 'https://picsum.photos/600/800?random=2',
      tipo: 'foto',
      timestamp: new Date('2024-01-15T10:40:00'),
      descricao: 'Foto do local de instalação após conclusão',
      tipoEvidencia: 'local_instalacao',
      tamanho: 1024 * 200, // 200KB
      nomeArquivo: 'local_instalacao_001.jpg'
    },
    {
      id: 'foto-3',
      url: 'https://picsum.photos/1200/800?random=3',
      localUrl: 'https://picsum.photos/1200/800?random=3',
      tipo: 'foto',
      timestamp: new Date('2024-01-15T10:50:00'),
      descricao: 'Foto panorâmica do ambiente',
      tipoEvidencia: 'outro',
      tamanho: 1024 * 300, // 300KB
      nomeArquivo: 'panoramica_001.jpg'
    }
  ]);

  // Função para criar vídeos de teste usando canvas (simula captura nativa)
  const generateTestVideo = async (duration: number, label: string): Promise<MediaFile | null> => {
    try {
      // Criar canvas para desenhar o vídeo
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;

      // Obter stream do canvas
      const stream = canvas.captureStream(30); // 30 FPS
      
      // Verificar suporte do MediaRecorder
      const supportedTypes = [
        'video/webm;codecs=vp8',
        'video/webm;codecs=vp9',
        'video/mp4;codecs=avc1',
        'video/webm'
      ];
      
      let mimeType = '';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        console.error('Nenhum formato de vídeo suportado');
        return null;
      }

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      // Promise para aguardar o fim da gravação
      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
      });

      // Iniciar gravação
      mediaRecorder.start();
      
      // Animar o canvas
      let frame = 0;
      const animate = () => {
        // Limpar canvas
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar círculo animado
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 50 + Math.sin(frame * 0.1) * 20;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${frame * 2}, 70%, 50%)`;
        ctx.fill();
        
        // Desenhar texto
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, centerX, centerY - 100);
        ctx.fillText(`Frame: ${frame}`, centerX, centerY + 100);
        
        frame++;
        
        if (frame < duration * 30) { // 30 FPS * duration
          requestAnimationFrame(animate);
        } else {
          mediaRecorder.stop();
        }
      };
      
      animate();
      
      // Aguardar conclusão da gravação
      const videoBlob = await recordingPromise;
      const localUrl = URL.createObjectURL(videoBlob);
      
      return {
        id: `generated-video-${Date.now()}`,
        url: localUrl,
        localUrl: localUrl,
        tipo: 'video',
        timestamp: new Date(),
        descricao: `Vídeo de teste gerado (${duration}s) - ${label}`,
        tipoEvidencia: 'outro',
        tamanho: videoBlob.size,
        nomeArquivo: `teste_${label.toLowerCase().replace(' ', '_')}_${duration}s.${mimeType.includes('webm') ? 'webm' : 'mp4'}`,
        duracao: duration
      };
      
    } catch (error) {
      console.error('Erro ao gerar vídeo de teste:', error);
      return null;
    }
  };

  // Gerar vídeos de teste na inicialização
  const generateAllTestVideos = async () => {
    setIsGeneratingVideos(true);
    
    try {
      // Gerar vídeo de 10 segundos
      const video10s = await generateTestVideo(10, 'Teste 10s');
      if (video10s) {
        setMedias(prev => [...prev, video10s]);
      }
      
      // Aguardar um pouco antes do próximo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gerar vídeo de 30 segundos
      const video30s = await generateTestVideo(30, 'Teste 30s');
      if (video30s) {
        setMedias(prev => [...prev, video30s]);
      }
      
    } catch (error) {
      console.error('Erro ao gerar vídeos:', error);
    } finally {
      setIsGeneratingVideos(false);
    }
  };

  // Gerar vídeos automaticamente na primeira carga
  useEffect(() => {
    // Verificar se já existem vídeos
    const hasVideos = medias.some(m => m.tipo === 'video');
    if (!hasVideos && !isGeneratingVideos) {
      generateAllTestVideos();
    }
  }, []);

  const handleOpenViewer = (index: number) => {
    setCurrentViewerIndex(index);
    setIsViewerOpen(true);
  };

  const handleDeleteMedia = (media: MediaFile) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir "${media.descricao}"?`);
    if (confirmed) {
      // Revogar URL se for um blob local
      if (media.localUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(media.localUrl);
      }
      setMedias(prev => prev.filter(m => m.id !== media.id));
      setIsViewerOpen(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / 1024 / 1024 * 100) / 100} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEvidenceBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'numero_serie': return 'bg-blue-500';
      case 'local_instalacao': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              Teste do MediaViewer - Vídeos Nativos
            </CardTitle>
            <p className="text-sm text-gray-600">
              Esta página testa o MediaViewer com vídeos gerados nativamente usando Canvas + MediaRecorder, 
              simulando exatamente o que acontece no MediaCapture
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-green-800 mb-2">✅ Vídeos de Teste Nativos:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Os vídeos são gerados usando Canvas + MediaRecorder (mesmo processo do MediaCapture)</p>
                <p>• Usa os mesmos codecs e formatos suportados pelo navegador</p>
                <p>• Cria Blob URLs locais, simulando captura real</p>
                <p>• Testa compatibilidade real com o MediaViewer</p>
              </div>
            </div>
            
            {isGeneratingVideos && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando vídeos de teste... Aguarde alguns segundos.</span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Controles disponíveis:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">Navegação por teclado:</h4>
                  <ul className="space-y-1 text-blue-600">
                    <li>• <kbd className="bg-white px-1 rounded">ESC</kbd> - Fechar/Sair do fullscreen</li>
                    <li>• <kbd className="bg-white px-1 rounded">←</kbd>/<kbd className="bg-white px-1 rounded">→</kbd> - Navegar entre mídias</li>
                    <li>• <kbd className="bg-white px-1 rounded">F</kbd> - Tela cheia</li>
                    <li>• <kbd className="bg-white px-1 rounded">Espaço</kbd> - Play/Pause (vídeos)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">Controles de mídia:</h4>
                  <ul className="space-y-1 text-blue-600">
                    <li>• <kbd className="bg-white px-1 rounded">M</kbd> - Mudo/Som (vídeos)</li>
                    <li>• <kbd className="bg-white px-1 rounded">+</kbd>/<kbd className="bg-white px-1 rounded">-</kbd> - Zoom (fotos)</li>
                    <li>• <kbd className="bg-white px-1 rounded">0</kbd> - Reset zoom (fotos)</li>
                    <li>• Clique nos controles para interação</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão para regenerar vídeos */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Gerenciamento de Vídeos de Teste</h3>
                <p className="text-sm text-gray-600">
                  Gere novos vídeos de teste ou recarregue os existentes
                </p>
              </div>
              <Button 
                onClick={generateAllTestVideos} 
                disabled={isGeneratingVideos}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingVideos ? 'animate-spin' : ''}`} />
                {isGeneratingVideos ? 'Gerando...' : 'Gerar Novos Vídeos'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de mídias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medias.map((media, index) => (
            <Card key={media.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {media.tipo === 'foto' ? (
                  <img
                    src={media.localUrl || media.url}
                    alt={media.descricao}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                        🎥
                      </div>
                      <p className="text-sm">Vídeo Nativo</p>
                      <p className="text-xs text-gray-400">{formatDuration(media.duracao)}</p>
                      {media.localUrl?.startsWith('blob:') && (
                        <p className="text-xs text-green-400 mt-1">Blob Local</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Overlay com tipo */}
                <div className="absolute top-2 left-2">
                  <Badge 
                    variant={media.tipo === 'foto' ? 'default' : 'destructive'}
                    className="bg-black/70 text-white"
                  >
                    {media.tipo === 'foto' ? '📷' : '🎥'} {media.tipo.toUpperCase()}
                  </Badge>
                </div>

                {/* Badge para vídeos nativos */}
                {media.tipo === 'video' && media.localUrl?.startsWith('blob:') && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500 text-white text-xs">
                      NATIVO
                    </Badge>
                  </div>
                )}

                {/* Overlay com botão de visualizar */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Button
                    onClick={() => handleOpenViewer(index)}
                    size="sm"
                    className="opacity-0 hover:opacity-100 transition-opacity bg-white/90 text-black hover:bg-white"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Visualizar
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2">
                    {media.descricao}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`text-xs ${getEvidenceBadgeColor(media.tipoEvidencia)} text-white`}
                    >
                      {media.tipoEvidencia.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>📅 {media.timestamp.toLocaleDateString('pt-BR')}</span>
                      <span>📊 {formatFileSize(media.tamanho)}</span>
                    </div>
                    {media.duracao && (
                      <div className="flex justify-between">
                        <span>⏱️ {formatDuration(media.duracao)}</span>
                        <span>📁 {media.nomeArquivo}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenViewer(index)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = media.localUrl || media.url;
                        link.download = media.nomeArquivo;
                        link.click();
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMedia(media)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Estatísticas das Mídias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {medias.filter(m => m.tipo === 'foto').length}
                </div>
                <div className="text-sm text-gray-600">Fotos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {medias.filter(m => m.tipo === 'video').length}
                </div>
                <div className="text-sm text-gray-600">Vídeos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatFileSize(medias.reduce((acc, m) => acc + m.tamanho, 0))}
                </div>
                <div className="text-sm text-gray-600">Tamanho total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatDuration(medias.reduce((acc, m) => acc + (m.duracao || 0), 0))}
                </div>
                <div className="text-sm text-gray-600">Duração total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções de teste */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções de Teste - Vídeos Nativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">✅ Para testar:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                <li>Aguarde os vídeos de teste serem gerados automaticamente</li>
                <li>Clique em "Ver" em qualquer vídeo para abrir o MediaViewer</li>
                <li>Teste especialmente os vídeos marcados como "NATIVO"</li>
                <li>Verifique se os vídeos reproduzem sem erro de formato</li>
                <li>Use as setas do teclado para navegar entre as mídias</li>
                <li>Teste todos os controles de vídeo (play, pause, volume, timeline)</li>
                <li>Verifique o comportamento em diferentes dispositivos</li>
              </ol>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">🔧 Vídeos Nativos:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                <li>Gerados usando Canvas + MediaRecorder (igual ao MediaCapture)</li>
                <li>Usam os mesmos codecs suportados pelo navegador</li>
                <li>Criam Blob URLs locais (não dependem de rede)</li>
                <li>Testam a compatibilidade real do MediaViewer</li>
                <li>Simulam exatamente o processo de captura nativa</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-1">⚠️ Se ainda houver erro:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                <li>O problema está no MediaViewer, não na captura</li>
                <li>Verifique o console para mensagens de erro específicas</li>
                <li>Teste em diferentes navegadores (Chrome, Firefox, Safari)</li>
                <li>Verifique se há diferenças entre desktop e mobile</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MediaViewer */}
      <MediaViewer
        medias={medias}
        initialIndex={currentViewerIndex}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onDelete={handleDeleteMedia}
        showControls={true}
        allowFullscreen={true}
        showMetadata={true}
      />
    </div>
  );
} 