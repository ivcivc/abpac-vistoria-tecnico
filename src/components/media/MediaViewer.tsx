'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaFile } from './MediaCapture';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn,
  ZoomOut,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export interface MediaViewerProps {
  medias: MediaFile[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (media: MediaFile) => void;
  showControls?: boolean;
  allowFullscreen?: boolean;
  showMetadata?: boolean;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  volume: number;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  canPlay: boolean;
  isBuffering: boolean;
}

interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isSafari: boolean;
  isChrome: boolean;
  userAgent: string;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  medias,
  initialIndex = 0,
  isOpen,
  onClose,
  onDelete,
  showControls = true,
  allowFullscreen = true,
  showMetadata = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isMuted: true, // Começar mudo por padrão
    volume: 1,
    isLoading: true,
    hasError: false,
    errorMessage: '',
    canPlay: false,
    isBuffering: false
  });

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isAndroid: false,
    isIOS: false,
    isMobile: false,
    isSafari: false,
    isChrome: false,
    userAgent: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMedia = medias[currentIndex];

  // Detectar informações do dispositivo
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent) && !/Edge/i.test(userAgent);

    setDeviceInfo({
      isAndroid,
      isIOS,
      isMobile,
      isSafari,
      isChrome,
      userAgent
    });

    console.log('📱 Device Info:', { isAndroid, isIOS, isMobile, isSafari, isChrome });
  }, []);

  // Reset video state when changing media
  useEffect(() => {
    if (currentMedia?.tipo === 'video') {
      setVideoState({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isMuted: true, // Garantir que sempre comece mudo
        volume: 1,
        isLoading: true,
        hasError: false,
        errorMessage: '',
        canPlay: false,
        isBuffering: false
      });
      
      // Reset video element if it exists
      if (videoRef.current) {
        const video = videoRef.current;
        video.currentTime = 0;
        video.pause();
        video.muted = true; // Forçar mudo no elemento
        video.load(); // Recarregar o vídeo
      }

      // Limpar timeout de retry se existir
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }
  }, [currentIndex, currentMedia?.id]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          navigateToPrevious();
          break;
        case 'ArrowRight':
          navigateToNext();
          break;
        case ' ':
          e.preventDefault();
          if (currentMedia?.tipo === 'video') {
            toggleVideoPlay();
          }
          break;
        case 'f':
        case 'F':
          if (allowFullscreen) {
            toggleFullscreen();
          }
          break;
        case 'm':
        case 'M':
          if (currentMedia?.tipo === 'video') {
            toggleVideoMute();
          }
          break;
        case '+':
        case '=':
          if (currentMedia?.tipo === 'foto') {
            setImageZoom(prev => Math.min(prev + 0.5, 5));
          }
          break;
        case '-':
          if (currentMedia?.tipo === 'foto') {
            setImageZoom(prev => Math.max(prev - 0.5, 0.5));
          }
          break;
        case '0':
          if (currentMedia?.tipo === 'foto') {
            setImageZoom(1);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex, currentMedia, isFullscreen, allowFullscreen]);

  // Resetar zoom quando trocar de mídia
  useEffect(() => {
    setImageZoom(1);
  }, [currentIndex]);

  // Controles de navegação
  const navigateToPrevious = useCallback(() => {
    if (medias.length > 1) {
      setCurrentIndex((prev) => (prev === 0 ? medias.length - 1 : prev - 1));
    }
  }, [medias.length]);

  const navigateToNext = useCallback(() => {
    if (medias.length > 1) {
      setCurrentIndex((prev) => (prev === medias.length - 1 ? 0 : prev + 1));
    }
  }, [medias.length]);

  // Controles de vídeo melhorados
  const toggleVideoPlay = useCallback(async () => {
    if (!videoRef.current || videoState.hasError) return;
    
    try {
      const video = videoRef.current;
      
      if (video.paused) {
        // Tentar reproduzir
        setVideoState(prev => ({ ...prev, isBuffering: true }));
        
        // Para dispositivos móveis, especialmente Android, garantir que o vídeo está carregado
        if (deviceInfo.isMobile && video.readyState < 2) {
          video.load();
          await new Promise(resolve => {
            const onCanPlay = () => {
              video.removeEventListener('canplay', onCanPlay);
              resolve(true);
            };
            video.addEventListener('canplay', onCanPlay);
          });
        }
        
        await video.play();
        setVideoState(prev => ({ ...prev, isBuffering: false }));
      } else {
        video.pause();
      }
    } catch (error) {
      console.error('Erro ao alternar reprodução do vídeo:', error);
      setVideoState(prev => ({ 
        ...prev, 
        hasError: true, 
        errorMessage: 'Erro ao reproduzir vídeo. Tente novamente.',
        isBuffering: false
      }));
    }
  }, [deviceInfo.isMobile, videoState.hasError]);

  const toggleVideoMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    setVideoState(prev => ({ ...prev, isMuted: newMuted }));
  }, []);

  // Handlers de vídeo melhorados
  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    setVideoState(prev => ({
      ...prev,
      currentTime: videoRef.current!.currentTime,
      duration: videoRef.current!.duration || 0,
      isBuffering: false
    }));
  }, []);

  const handleVideoPlayStateChange = useCallback(() => {
    if (!videoRef.current) return;
    
    setVideoState(prev => ({
      ...prev,
      isPlaying: !videoRef.current!.paused,
      isBuffering: false
    }));
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    
    console.log('✅ Vídeo metadata carregado:', {
      duration: videoRef.current.duration,
      videoWidth: videoRef.current.videoWidth,
      videoHeight: videoRef.current.videoHeight,
      readyState: videoRef.current.readyState
    });
    
    setVideoState(prev => ({
      ...prev,
      duration: videoRef.current!.duration || 0,
      volume: videoRef.current!.volume,
      isMuted: videoRef.current!.muted,
      isLoading: false,
      hasError: false,
      errorMessage: '',
      canPlay: true
    }));
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    if (!videoRef.current) return;
    
    console.log('✅ Vídeo pode ser reproduzido');
    setVideoState(prev => ({
      ...prev,
      isLoading: false,
      canPlay: true,
      hasError: false,
      errorMessage: ''
    }));
  }, []);

  const handleVideoWaiting = useCallback(() => {
    console.log('⏳ Vídeo aguardando buffer...');
    setVideoState(prev => ({
      ...prev,
      isBuffering: true
    }));
  }, []);

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const error = e.currentTarget.error;
    let errorMessage = 'Erro no carregamento do vídeo';
    
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'O carregamento do vídeo foi abortado.';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Erro de rede durante o carregamento do vídeo.';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = deviceInfo.isAndroid 
            ? 'Formato de vídeo não suportado no Android. Tente abrir em um player externo.'
            : 'O vídeo parece estar corrompido ou em um formato não suportado.';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = deviceInfo.isAndroid
            ? 'Formato de vídeo não suportado no Android. Use um player externo.'
            : 'O formato do vídeo não é suportado por este navegador.';
          break;
        default:
          errorMessage = `Erro desconhecido: código ${error.code}`;
      }
    }
    
    console.error('❌ Erro no vídeo:', errorMessage, { errorObject: error, deviceInfo });
    setVideoState(prev => ({
      ...prev,
      isLoading: false,
      hasError: true,
      errorMessage,
      canPlay: false,
      isBuffering: false
    }));
  }, [deviceInfo]);

  const handleVideoLoadStart = useCallback(() => {
    console.log('🔄 Iniciando carregamento do vídeo...');
    setVideoState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      errorMessage: '',
      isBuffering: false
    }));
  }, []);

  // Função para tentar recarregar o vídeo
  const retryVideo = useCallback(() => {
    if (!videoRef.current) return;
    
    console.log('🔄 Tentando recarregar vídeo...');
    const video = videoRef.current;
    
    setVideoState(prev => ({
      ...prev,
      hasError: false,
      errorMessage: '',
      isLoading: true,
      canPlay: false
    }));
    
    // Recarregar o vídeo
    video.load();
  }, []);

  // Função para abrir vídeo em player externo (especialmente útil para Android)
  const openInExternalPlayer = useCallback(() => {
    if (!currentMedia) return;
    
    try {
      // Criar um link temporário para download/abertura
      const link = document.createElement('a');
      link.href = currentMedia.localUrl || currentMedia.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Para Android, tentar abrir diretamente
      if (deviceInfo.isAndroid) {
        // Tentar usar intent do Android para abrir em player nativo
        const intentUrl = `intent:${currentMedia.localUrl || currentMedia.url}#Intent;action=android.intent.action.VIEW;type=video/*;end`;
        window.location.href = intentUrl;
      } else {
        // Para outros dispositivos, abrir em nova aba
        link.click();
      }
    } catch (error) {
      console.error('Erro ao abrir vídeo externamente:', error);
      // Fallback: fazer download
      handleDownload();
    }
  }, [currentMedia, deviceInfo.isAndroid]);

  const seekVideo = useCallback((time: number) => {
    if (!videoRef.current || videoState.hasError) return;
    
    try {
      const clampedTime = Math.max(0, Math.min(time, videoRef.current.duration || 0));
      videoRef.current.currentTime = clampedTime;
    } catch (error) {
      console.error('Erro ao navegar no vídeo:', error);
    }
  }, [videoState.hasError]);

  const handleVolumeChange = useCallback((volume: number) => {
    if (!videoRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    videoRef.current.volume = clampedVolume;
    setVideoState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Download
  const handleDownload = useCallback(() => {
    if (currentMedia) {
      const link = document.createElement('a');
      link.href = currentMedia.localUrl || currentMedia.url;
      link.download = currentMedia.nomeArquivo;
      link.click();
    }
  }, [currentMedia]);

  // Formatar tempo para vídeos
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !currentMedia) return null;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-sm ${
        isFullscreen ? 'bg-black' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`Visualizador de mídia - ${currentMedia.tipo} ${currentIndex + 1} de ${medias.length}`}
      aria-describedby="media-description"
      tabIndex={-1}
    >
      {/* Header com controles */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {currentIndex + 1} de {medias.length}
              </Badge>
              <Badge 
                variant={currentMedia.tipo === 'foto' ? 'default' : 'destructive'}
                className="bg-white/20 text-white"
              >
                {currentMedia.tipo === 'foto' ? '📷 Foto' : '🎥 Vídeo'}
              </Badge>
              {/* Badge de dispositivo para debug */}
              {(deviceInfo.isAndroid || deviceInfo.isIOS) && (
                <Badge variant="outline" className="bg-white/10 text-white text-xs">
                  {deviceInfo.isAndroid ? '🤖 Android' : '🍎 iOS'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {allowFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                  title="Tela cheia (F)"
                  aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
                title="Download"
                aria-label={`Baixar ${currentMedia.tipo} - ${currentMedia.nomeArquivo}`}
              >
                <Download className="w-4 h-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(currentMedia)}
                  className="text-red-400 hover:bg-red-500/20"
                  title="Excluir"
                  aria-label={`Excluir ${currentMedia.tipo} - ${currentMedia.descricao}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
                title="Fechar (ESC)"
                aria-label="Fechar visualizador"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex items-center justify-center w-full h-full p-4 pt-20 pb-20">
        {currentMedia.tipo === 'foto' ? (
          <div className="relative max-w-full max-h-full overflow-hidden" role="img" aria-label={`Imagem: ${currentMedia.descricao}`}>
            <img
              ref={imageRef}
              src={currentMedia.localUrl || currentMedia.url}
              alt={currentMedia.descricao || 'Imagem da vistoria'}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${imageZoom})` }}
              draggable={false}
              aria-describedby="media-description"
            />
            {/* Controles de zoom para imagens */}
            {showControls && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 rounded-lg p-2">
                                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setImageZoom(prev => Math.max(prev - 0.5, 0.5))}
                   className="text-white hover:bg-white/20"
                   title="Diminuir zoom (-)"
                   disabled={imageZoom <= 0.5}
                   aria-label={`Diminuir zoom da imagem - atual ${Math.round(imageZoom * 100)}%`}
                 >
                   <ZoomOut className="w-4 h-4" />
                 </Button>
                 <span className="text-white text-sm min-w-12 text-center" aria-live="polite" aria-label={`Zoom atual: ${Math.round(imageZoom * 100)}%`}>
                   {Math.round(imageZoom * 100)}%
                 </span>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setImageZoom(prev => Math.min(prev + 0.5, 5))}
                   className="text-white hover:bg-white/20"
                   title="Aumentar zoom (+)"
                   disabled={imageZoom >= 5}
                   aria-label={`Aumentar zoom da imagem - atual ${Math.round(imageZoom * 100)}%`}
                 >
                   <ZoomIn className="w-4 h-4" />
                 </Button>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setImageZoom(1)}
                   className="text-white hover:bg-white/20"
                   title="Zoom original (0)"
                   aria-label="Resetar zoom para tamanho original"
                 >
                   1:1
                 </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative max-w-full max-h-full" role="application" aria-label={`Player de vídeo: ${currentMedia.descricao}`}>
            <video
              ref={videoRef}
              src={currentMedia.localUrl || currentMedia.url}
              className="max-w-full max-h-full object-contain"
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={handleVideoPlayStateChange}
              onPause={handleVideoPlayStateChange}
              onLoadStart={handleVideoLoadStart}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onLoadedData={handleVideoLoadedMetadata}
              onCanPlay={handleVideoCanPlay}
              onWaiting={handleVideoWaiting}
              onVolumeChange={() => {
                if (videoRef.current) {
                  setVideoState(prev => ({
                    ...prev,
                    volume: videoRef.current!.volume,
                    isMuted: videoRef.current!.muted
                  }));
                }
              }}
              onError={handleVideoError}
              controls={false}
              preload="metadata"
              playsInline
              muted // Iniciar o elemento de vídeo como mudo
              // Atributos específicos para Android
              webkit-playsinline="true"
              x5-video-player-type="h5"
              x5-video-player-fullscreen="true"
              aria-label={currentMedia.descricao || 'Vídeo da vistoria'}
              aria-describedby="media-description"
            />

            {/* Loading indicator */}
            {(videoState.isLoading || videoState.isBuffering) && !videoState.hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-3 text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="text-sm">
                    {videoState.isBuffering ? 'Carregando buffer...' : 'Carregando vídeo...'}
                  </span>
                </div>
              </div>
            )}

            {/* Error indicator melhorado */}
            {videoState.hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-3 text-white text-center max-w-sm mx-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Erro ao carregar vídeo</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {videoState.errorMessage}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={retryVideo}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Tentar novamente
                    </Button>
                    {deviceInfo.isAndroid && (
                      <Button
                        size="sm"
                        onClick={openInExternalPlayer}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-white border-blue-400/20"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Player externo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Controles de vídeo customizados melhorados */}
            {showControls && !videoState.isLoading && !videoState.hasError && videoState.canPlay && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-3 space-y-2" onClick={e => e.stopPropagation()}>
                {/* Timeline */}
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs min-w-10">
                    {formatTime(videoState.currentTime)}
                  </span>
                  <div className="flex-1 relative">
                    <div className="bg-gray-600 rounded-full h-2 relative">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                        style={{ 
                          width: `${(videoState.currentTime / videoState.duration) * 100 || 0}%` 
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={videoState.duration || 100}
                      step="0.1"
                      value={videoState.currentTime || 0}
                      onChange={(e) => {
                        const time = Number(e.target.value);
                        seekVideo(time);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label={`Timeline do vídeo - ${formatTime(videoState.currentTime)} de ${formatTime(videoState.duration)}`}
                    />
                  </div>
                  <span className="text-white text-xs min-w-10">
                    {formatTime(videoState.duration)}
                  </span>
                </div>

                {/* Controles principais */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => seekVideo(Math.max(videoState.currentTime - 10, 0))}
                      className="text-white hover:bg-white/20"
                      title="Voltar 10s"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleVideoPlay}
                      className="text-white hover:bg-white/20"
                      title="Play/Pause (Espaço)"
                      disabled={!videoState.canPlay}
                    >
                      {videoState.isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => seekVideo(Math.min(videoState.currentTime + 10, videoState.duration))}
                      className="text-white hover:bg-white/20"
                      title="Avançar 10s"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleVideoMute}
                      className="text-white hover:bg-white/20"
                      title="Mudo/Som (M)"
                    >
                      {videoState.isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                    {!deviceInfo.isMobile && (
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={videoState.isMuted ? 0 : videoState.volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="w-20"
                        aria-label={`Volume do vídeo - ${Math.round(videoState.volume * 100)}%`}
                      />
                    )}
                    {/* Botão de player externo para Android */}
                    {deviceInfo.isAndroid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={openInExternalPlayer}
                        className="text-white hover:bg-white/20"
                        title="Abrir em player externo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navegação lateral */}
      {medias.length > 1 && showControls && (
        <>
                     <Button
             variant="ghost"
             size="lg"
             onClick={navigateToPrevious}
             className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
             title="Anterior (←)"
             aria-label={`Ir para ${currentMedia.tipo} anterior (${currentIndex} de ${medias.length})`}
           >
             <ChevronLeft className="w-8 h-8" />
           </Button>
           <Button
             variant="ghost"
             size="lg"
             onClick={navigateToNext}
             className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
             title="Próximo (→)"
             aria-label={`Ir para próximo ${currentMedia.tipo} (${currentIndex + 2} de ${medias.length})`}
           >
             <ChevronRight className="w-8 h-8" />
           </Button>
        </>
      )}

             {/* Metadados na parte inferior */}
       {showMetadata && (
         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
           <div className="max-w-4xl mx-auto text-white" id="media-description">
             <h3 className="font-semibold text-lg mb-2">
               {currentMedia.descricao || 'Sem descrição'}
             </h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span>
                📅 {new Date(currentMedia.timestamp).toLocaleString('pt-BR')}
              </span>
              <span>
                📊 {Math.round(currentMedia.tamanho / 1024)} KB
              </span>
              {currentMedia.duracao && (
                <span>
                  ⏱️ {formatTime(currentMedia.duracao)}
                </span>
              )}
              <span>
                🏷️ {currentMedia.tipoEvidencia.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de carregamento para fullscreen */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
          Modo tela cheia • Pressione ESC para sair
        </div>
      )}
    </div>
  );
}; 