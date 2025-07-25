'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  X, 
  RotateCcw, 
  Download,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Video,
  Square,
  Play,
  Pause,
  VolumeX
} from 'lucide-react';

export interface MediaFile {
  id: string;
  url: string;
  localUrl: string;
  tipo: 'foto' | 'video';
  timestamp: Date;
  descricao: string;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outro';
  tamanho: number;
  nomeArquivo: string;
  duracao?: number; // Para vídeos, em segundos
}

interface MediaCaptureProps {
  onCapture: (media: MediaFile[]) => void;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outro';
  maxFotos?: number;
  minFotos?: number;
  descricao?: string;
  fotosExistentes?: MediaFile[];
  disabled?: boolean;
  // Novas props para vídeo
  permitirVideo?: boolean;
  maxDuracaoVideo?: number; // em segundos
  maxVideos?: number;
  minVideos?: number;
}

export function MediaCapture({
  onCapture,
  tipoEvidencia,
  maxFotos = 999, // Sem limite prático
  minFotos = 0,
  descricao = '',
  fotosExistentes = [],
  disabled = false,
  // Novas props para vídeo
  permitirVideo = false,
  maxDuracaoVideo = 30, // 30 segundos por padrão
  maxVideos = 5,
  minVideos = 0
}: MediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null); // Novo ref para input de vídeo
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [fotos, setFotos] = useState<MediaFile[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados melhorados para suporte à câmera
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null); // null = verificando
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false); // NOVO ESTADO
  const [deviceInfo, setDeviceInfo] = useState<{
    isIOS: boolean;
    isMobile: boolean;
    isSecure: boolean;
    userAgent: string;
  } | null>(null);
  
  // Estados para vídeo
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [recordingTimerRef, setRecordingTimerRef] = useState<NodeJS.Timeout | null>(null);
  const [supportedVideoMimeType, setSupportedVideoMimeType] = useState<string | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Adicionar estado para debug
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Adicionar estado para modo de captura de vídeo
  const [videoMode, setVideoMode] = useState<'native' | 'mediarecorder'>('native');

  // Adicionar função de debug
  const logDebug = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    console.log(logEntry);
    setDebugInfo(prev => prev + '\n' + logEntry);
  };

  useEffect(() => {
    // Detectar informações do dispositivo
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      
      setDeviceInfo({
        isIOS,
        isMobile,
        isSecure,
        userAgent
      });

      console.log('🔍 Informações do dispositivo:', {
        isIOS,
        isMobile,
        isSecure,
        userAgent: userAgent.substring(0, 100) + '...'
      });
    };

    detectDevice();

    // Detectar o melhor formato de vídeo suportado
    const checkVideoSupport = () => {
      const mimeTypes = [
        'video/webm;codecs=vp8', // Priorizar WebM para maior compatibilidade com MediaRecorder
        'video/webm',
        'video/mp4;codecs=avc1', // Usar MP4 como fallback, pois pode ser instável
      ];

      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          console.log(`📹 Formato de vídeo suportado: ${mimeType}`);
          setSupportedVideoMimeType(mimeType);
          return;
        }
      }
      console.log('⚠️ Nenhum formato de gravação de vídeo suportado.');
      setSupportedVideoMimeType(null);
    };

    checkVideoSupport();

    // Detectar suporte à câmera de forma mais robusta
    const checkCameraSupport = async () => {
      try {
        console.log('🔍 Verificando suporte à câmera...');
        
        // Verificações básicas
        if (!navigator.mediaDevices) {
          console.log('❌ navigator.mediaDevices não disponível');
          setCameraSupported(false);
          return;
        }

        if (!navigator.mediaDevices.getUserMedia) {
          console.log('❌ getUserMedia não disponível');
          setCameraSupported(false);
          return;
        }

        // Verificar se está em contexto seguro (HTTPS)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          console.log('❌ Contexto não seguro (requer HTTPS)');
          setCameraSupported(false);
          setError('Acesso à câmera requer conexão segura (HTTPS)');
          return;
        }

                 // Verificações específicas para iOS - mais restritivas
         const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).chrome;
         const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
         
         if (isIOS || (isSafari && /Mac/.test(navigator.userAgent))) {
           console.log('📱 Dispositivo iOS/Safari detectado');
           
           // No iOS Safari ou Safari no Mac, a câmera tem limitações
           if ((window.navigator as any).standalone) {
             console.log('📱 Rodando como PWA - câmera limitada');
           }
           
           // Apenas Safari tem restrições severas, Chrome no Mac deve funcionar
           if (isSafari) {
             console.log('📱 Safari detectado - usando apenas upload');
             setCameraSupported(false);
             return;
           }
         }
         
         console.log('🖥️ Dispositivo não-iOS ou Chrome detectado - testando câmera');

        // Para outros dispositivos, tentar enumerar dispositivos
        let hasCamera = false;
        try {
          if (navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            hasCamera = devices.some(device => device.kind === 'videoinput');
            console.log('📹 Câmeras encontradas:', devices.filter(d => d.kind === 'videoinput').length);
          }
        } catch (enumError) {
          console.log('⚠️ Erro ao enumerar dispositivos (tentando teste de acesso):', enumError);
        }

        // Se não conseguiu enumerar ou não encontrou câmeras, fazer teste direto
        if (!hasCamera) {
          console.log('🧪 Fazendo teste direto de acesso à câmera...');
          try {
            const testStream = await navigator.mediaDevices.getUserMedia({ 
              video: { width: 640, height: 480 }, 
              audio: false 
            });
            
            // Se chegou aqui, a câmera funciona
            testStream.getTracks().forEach(track => track.stop());
            console.log('✅ Teste direto de câmera bem-sucedido');
            hasCamera = true;
          } catch (testError) {
            console.log('❌ Teste direto falhou:', testError);
            hasCamera = false;
          }
        }

        if (!hasCamera) {
          console.log('❌ Nenhuma câmera acessível detectada');
          setCameraSupported(false);
          return;
        }

        setCameraSupported(true);
        console.log('✅ Suporte à câmera confirmado');

      } catch (err) {
        console.error('❌ Erro ao verificar suporte à câmera:', err);
        setCameraSupported(false);
        setError('Erro ao verificar suporte à câmera');
      }
    };

    checkCameraSupport();

    return () => {
      stopCamera();
    };
  }, []);

  // NOVO: useEffect para iniciar a câmera DEPOIS que o elemento de vídeo for renderizado
  useEffect(() => {
    // A condição garante que a câmera só será iniciada quando solicitado (`shouldRenderVideo`),
    // o elemento de vídeo estiver pronto (`videoRef.current`), e ainda não houver um stream ativo.
    if (shouldRenderVideo && videoRef.current && !stream) {
      startCamera();
    }
    // A dependência de 'stream' previne múltiplas chamadas caso o stream já tenha sido obtido.
  }, [shouldRenderVideo, stream]);

  // Sincronizar com fotos existentes vindas de props
  useEffect(() => {
    if (fotosExistentes.length > 0) {
      const fotosOnly = fotosExistentes.filter(media => media.tipo === 'foto');
      const videosOnly = fotosExistentes.filter(media => media.tipo === 'video');
      setFotos(fotosOnly);
      setVideos(videosOnly);
    } else {
      setFotos([]);
      setVideos([]);
    }
  }, [fotosExistentes]); // Escutar mudanças em fotosExistentes

  const startCamera = async () => {
    try {
      // O 'isRequestingCamera' agora é controlado pelo 'handleStartCameraClick'.
      // Apenas iniciamos a lógica de obtenção do stream aqui.
      console.log('📷 Iniciando câmera...');
      console.log('📷 Dispositivo:', deviceInfo);

      // Configurações otimizadas por dispositivo
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Preferir câmera traseira
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: permitirVideo // Incluir áudio apenas se permitir vídeo
      };

      // Ajustes específicos para iOS
      if (deviceInfo?.isIOS) {
        console.log('📱 Aplicando configurações específicas para iOS');
        constraints.video = {
          ...(constraints.video as MediaTrackConstraints),
          // iOS funciona melhor com configurações mais simples
          width: { ideal: 1280 },
          height: { ideal: 720 }
        };
      }

      console.log('📷 Constraints:', constraints);

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Stream obtido:', {
        active: mediaStream.active,
        tracks: mediaStream.getTracks().length,
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length,
        videoTrackSettings: mediaStream.getVideoTracks()[0]?.getSettings()
      });

      // NOVA ABORDAGEM SIMPLES E DIRETA
      if (videoRef.current) {
        const videoElement = videoRef.current;
        
        // Configurar propriedades essenciais
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true;
        
        // Configurar o stream
        videoElement.srcObject = mediaStream;
        
        console.log('📹 Stream configurado no elemento video');
        
        // FORÇAR ATIVAÇÃO IMEDIATA - sem dependência de eventos
        console.log('🚀 FORÇANDO ativação imediata da câmera');
        setStream(mediaStream);
        setIsCameraActive(true);
        setIsRequestingCamera(false);
        setError(null); // Limpar qualquer erro anterior
        
        // Aguardar um momento e verificar se precisa forçar play
        setTimeout(async () => {
          try {
            if (videoElement.paused) {
              console.log('📹 Elemento pausado, forçando play...');
              await videoElement.play();
              console.log('✅ Play executado com sucesso');
            }
                     } catch (playError) {
             const error = playError as Error;
             console.log('⚠️ Erro no play automático (normal em alguns navegadores):', error.message);
             // Não é crítico, o vídeo ainda pode funcionar
           }
        }, 100);
        
        // Log adicional para debug
        setTimeout(() => {
          console.log('🔍 Status final do vídeo:', {
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            readyState: videoElement.readyState,
            paused: videoElement.paused,
            currentTime: videoElement.currentTime,
            duration: videoElement.duration,
            offsetDimensions: `${videoElement.offsetWidth}x${videoElement.offsetHeight}`
          });
        }, 500);
      }

    } catch (err) {
      console.error('❌ Erro ao acessar câmera:', err);
      setIsRequestingCamera(false);
      
      let errorMessage = 'Erro ao acessar câmera';
      
      if (err instanceof Error) {
        console.log('❌ Tipo de erro:', err.name, err.message);
        
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = permitirVideo 
              ? '🚫 Acesso à câmera e microfone negado. Clique no ícone da câmera na barra de endereços e permita o acesso.'
              : '🚫 Acesso à câmera negado. Clique no ícone da câmera na barra de endereços e permita o acesso.';
            break;
          case 'NotFoundError':
            errorMessage = '📷 Nenhuma câmera encontrada no dispositivo.';
            break;
          case 'NotReadableError':
            errorMessage = '🔒 Câmera está sendo usada por outro aplicativo.';
            break;
          case 'OverconstrainedError':
            errorMessage = '⚙️ Configurações de câmera não suportadas. Tentando configuração alternativa...';
            
            // Tentar com configurações mais simples
            setTimeout(() => {
              trySimpleCamera();
            }, 1000);
            break;
          case 'SecurityError':
            errorMessage = deviceInfo?.isSecure
              ? '🔐 Erro de segurança ao acessar câmera.'
              : '🔒 Câmera só funciona em conexões seguras (HTTPS). Use HTTPS ou localhost.';
            break;
          case 'AbortError':
            errorMessage = '⏹️ Operação cancelada pelo usuário.';
            break;
          default:
            errorMessage = `❌ Erro desconhecido: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    }
  };

  // NOVO: Handler para o clique do botão, que prepara o estado para a ativação.
  const handleStartCameraClick = () => {
    setError(null);
    setIsRequestingCamera(true); // Mostra o estado de carregamento
    setShouldRenderVideo(true); // Dispara a renderização do elemento <video>
  };

  // Função para reiniciar tentativa de câmera
  const retryCamera = () => {
    console.log('🔄 Reiniciando tentativa de câmera...');
    
    // Parar câmera atual se existir e resetar todos os estados
    stopCamera();
    
    // Aguardar um pouco antes de tentar novamente para o DOM atualizar
    setTimeout(() => {
      handleStartCameraClick(); // Inicia o fluxo de ativação novamente
    }, 500);
  };

  // Função auxiliar para tentar câmera com configurações simples
  const trySimpleCamera = async () => {
    try {
      console.log('🔄 Tentando configuração simples de câmera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log('✅ Stream simples obtido:', {
        active: mediaStream.active,
        tracks: mediaStream.getTracks().length,
        videoTracks: mediaStream.getVideoTracks().length,
        videoTrackSettings: mediaStream.getVideoTracks()[0]?.getSettings()
      });

      if (videoRef.current) {
        const videoElement = videoRef.current;
        
        // Configurar propriedades essenciais
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.muted = true;
        
        // Configurar o stream
        videoElement.srcObject = mediaStream;
        
        console.log('📹 Stream simples configurado no elemento video');
        
        // FORÇAR ATIVAÇÃO IMEDIATA - abordagem direta
        console.log('🚀 SIMPLE FORÇANDO ativação imediata da câmera');
        setStream(mediaStream);
        setIsCameraActive(true);
        setError(null);
        setIsRequestingCamera(false);
        
        // Aguardar um momento e verificar se precisa forçar play
        setTimeout(async () => {
          try {
            if (videoElement.paused) {
              console.log('📹 SIMPLE Elemento pausado, forçando play...');
              await videoElement.play();
              console.log('✅ SIMPLE Play executado com sucesso');
            }
          } catch (playError) {
            const error = playError as Error;
            console.log('⚠️ SIMPLE Erro no play automático (normal em alguns navegadores):', error.message);
            // Não é crítico, o vídeo ainda pode funcionar
          }
        }, 100);
      }
    } catch (err) {
      console.error('❌ Configuração simples também falhou:', err);
      // Se a configuração simples falhar, mostrar erro detalhado
      setError('Erro ao acessar câmera mesmo com configurações básicas. Verifique se a câmera não está sendo usada por outro aplicativo.');
      setIsRequestingCamera(false);
    }
  };

  const stopCamera = () => {
    // Parar gravação se estiver ativa
    if (isRecording) {
      stopVideoRecording();
    }

    // Parar stream da câmera
    if (stream) {
      console.log('🛑 Parando câmera...');
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Track parado:', track.kind, track.label);
      });
    }

    // Resetar todos os estados relevantes para a câmera
    setStream(null);
    setIsCameraActive(false);
    setShouldRenderVideo(false);
    setIsRequestingCamera(false);
    setError(null);

    // Limpar timer se existir
    if (recordingTimerRef) {
      clearInterval(recordingTimerRef);
      setRecordingTimerRef(null);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Não foi possível obter contexto do canvas');
      }

      // Configurar canvas com as dimensões do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Desenhar frame atual do vídeo no canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Converter para blob com compressão
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao gerar imagem'));
            }
          },
          'image/jpeg',
          0.8 // Qualidade 80%
        );
      });

      // Criar URL local para a imagem
      const localUrl = URL.createObjectURL(blob);
      
      // Criar objeto MediaFile
      const novaFoto: MediaFile = {
        id: `foto_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        url: localUrl, // URL temporária, será substituída após upload
        localUrl: localUrl,
        tipo: 'foto',
        timestamp: new Date(),
        descricao: descricao || getTipoEvidenciaLabel(tipoEvidencia),
        tipoEvidencia,
        tamanho: blob.size,
        nomeArquivo: `${tipoEvidencia}_${Date.now()}.jpg`
      };

      const novasFotos = [...fotos, novaFoto];
      setFotos(novasFotos);
      
      // Combinar toda mídia
      const todaMedia = [...novasFotos, ...videos];
      onCapture(todaMedia);

      console.log('📸 Foto capturada:', novaFoto.id, `${Math.round(blob.size / 1024)}KB`);

    } catch (err) {
      console.error('❌ Erro ao capturar foto:', err);
      setError('Erro ao capturar foto. Tente novamente.');
    } finally {
      setIsCapturing(false);
    }
  };

  // =============== FUNÇÕES DE VÍDEO ===============

  // Modificar o método de iniciar gravação de vídeo para usar o input nativo
  const startVideoRecording = () => {
    if (!permitirVideo) return;
    
    try {
      logDebug('Iniciando captura de vídeo nativa');
      
      // Usar input nativo para todos os dispositivos
      if (videoInputRef.current) {
        videoInputRef.current.click();
      }
    } catch (err) {
      logDebug('Erro ao iniciar captura de vídeo', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao iniciar gravação');
    }
  };

  // Simplificar o método de processar vídeo gravado - não será mais necessário
  // já que usaremos diretamente o arquivo do input

  const stopVideoRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    try {
      // Parar timer
      if (recordingTimerRef) {
        clearInterval(recordingTimerRef);
        setRecordingTimerRef(null);
      }

      // Parar gravação
      mediaRecorderRef.current.stop();
      setIsRecording(false);

    } catch (err) {
      console.error('❌ Erro ao parar gravação:', err);
      setError('Erro ao finalizar gravação de vídeo');
      setIsRecording(false);
    }
  };

  const processRecordedVideo = async () => {
    try {
      const totalSize = recordedChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
      logDebug('Processando vídeo', { 
        chunks: recordedChunksRef.current.length,
        totalSize,
        mimeType: supportedVideoMimeType 
      });

      if (recordedChunksRef.current.length === 0) {
        setError('Nenhum dado de vídeo disponível');
        return;
      }

      // Criar blob do vídeo
      const videoBlob = new Blob(recordedChunksRef.current, { 
        type: supportedVideoMimeType || 'video/webm;codecs=vp8' 
      });
      
      logDebug('Blob criado', { 
        size: videoBlob.size, 
        type: videoBlob.type,
        isValid: videoBlob.size > 0 
      });

      if (videoBlob.size === 0) {
        setError('O vídeo capturado está vazio');
        return;
      }

      // Testar se o blob é válido criando uma URL temporária
      const testUrl = URL.createObjectURL(videoBlob);
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        logDebug('Vídeo válido detectado', {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
        URL.revokeObjectURL(testUrl);
      };
      
      video.onerror = () => {
        logDebug('Erro ao carregar vídeo de teste');
        URL.revokeObjectURL(testUrl);
      };
      
      video.src = testUrl;

      const localUrl = URL.createObjectURL(videoBlob);
      const extensao = supportedVideoMimeType?.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `video_${Date.now()}.${extensao}`;

      const newVideo: MediaFile = {
        id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        url: localUrl,
        localUrl: localUrl,
        tipo: 'video',
        timestamp: new Date(),
        descricao: descricao || `${getTipoEvidenciaLabel(tipoEvidencia)} - Vídeo`,
        tipoEvidencia,
        tamanho: videoBlob.size,
        nomeArquivo: fileName,
        duracao: recordingTime
      };

      const novosVideos = [...videos, newVideo];
      setVideos(novosVideos);

      // Combinar fotos e vídeos para onCapture
      const todaMedia = [...fotos, ...novosVideos];
      onCapture(todaMedia);

      // Limpar chunks
      recordedChunksRef.current = [];
      setRecordingTime(0);

      console.log('✅ Vídeo processado e salvo:', newVideo.id);

    } catch (err) {
      logDebug('Erro ao processar vídeo', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar vídeo');
    }
  };

  const removeVideo = (videoId: string) => {
    const novosVideos = videos.filter(video => video.id !== videoId);
    setVideos(novosVideos);
    
    // Atualizar callback com toda a mídia
    const todaMedia = [...fotos, ...novosVideos];
    onCapture(todaMedia);
  };

  const downloadVideo = (video: MediaFile) => {
    const link = document.createElement('a');
    link.href = video.localUrl;
    link.download = video.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // =============== COMPRESSÃO DE VÍDEO ===============

  const compressVideo = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Para vídeos pequenos (< 5MB), não comprimir
        if (videoBlob.size < 5 * 1024 * 1024) {
          console.log('🎥 Vídeo pequeno, não precisa comprimir');
          resolve(videoBlob);
          return;
        }

        console.log('🗜️ Comprimindo vídeo...');
        
        // Criar elementos de vídeo e canvas para processamento
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Erro ao obter contexto do canvas para compressão'));
          return;
        }

        video.onloadedmetadata = async () => {
          try {
            // Configurar dimensões do canvas (reduzir para HD se necessário)
            const maxWidth = 1280;
            const maxHeight = 720;
            
            let { videoWidth: width, videoHeight: height } = video;
            const aspectRatio = width / height;

            if (width > maxWidth) {
              width = maxWidth;
              height = width / aspectRatio;
            }

            if (height > maxHeight) {
              height = maxHeight;
              width = height * aspectRatio;
            }

            canvas.width = width;
            canvas.height = height;

            // Configurar MediaRecorder para compressão
            const canvasStream = canvas.captureStream(15); // 15 FPS para economizar espaço
            const mediaRecorder = new MediaRecorder(canvasStream, {
              mimeType: 'video/webm;codecs=vp8',
              videoBitsPerSecond: 500000 // 500 kbps para boa compressão
            });

            const compressedChunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                compressedChunks.push(event.data);
              }
            };

            mediaRecorder.onstop = () => {
              const compressedBlob = new Blob(compressedChunks, { type: 'video/webm' });
              
              // Verificar se realmente conseguiu comprimir
              if (compressedBlob.size < videoBlob.size) {
                console.log(`✅ Vídeo comprimido: ${Math.round(videoBlob.size / 1024 / 1024 * 100) / 100}MB → ${Math.round(compressedBlob.size / 1024 / 1024 * 100) / 100}MB`);
                resolve(compressedBlob);
              } else {
                console.log('⚠️ Compressão não reduziu o tamanho, usando original');
                resolve(videoBlob);
              }
            };

            mediaRecorder.onerror = (event) => {
              console.error('❌ Erro na compressão:', event);
              resolve(videoBlob); // Usar original em caso de erro
            };

            // Iniciar gravação comprimida
            mediaRecorder.start();

            // Reproduzir vídeo frame por frame no canvas
            const drawFrame = () => {
              if (video.ended) {
                mediaRecorder.stop();
                return;
              }

              ctx.drawImage(video, 0, 0, width, height);
              
              // Próximo frame
              setTimeout(drawFrame, 1000 / 15); // 15 FPS
            };

            video.play();
            drawFrame();

          } catch (error) {
            console.error('❌ Erro durante compressão:', error);
            resolve(videoBlob); // Usar original em caso de erro
          }
        };

        video.onerror = () => {
          console.error('❌ Erro ao carregar vídeo para compressão');
          resolve(videoBlob); // Usar original em caso de erro
        };

        video.src = URL.createObjectURL(videoBlob);
        video.muted = true;

      } catch (error) {
        console.error('❌ Erro na configuração de compressão:', error);
        resolve(videoBlob); // Usar original em caso de erro
      }
    });
  };

  // =============== FIM FUNÇÕES DE VÍDEO ===============

  // Modificar o método de upload de arquivo para lidar melhor com vídeos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      // Determinar se é foto ou vídeo
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      // Validar tipo de arquivo
      if (!isImage && !isVideo) {
        setError('Apenas arquivos de imagem ou vídeo são permitidos');
        return;
      }

      // Se é vídeo mas não permite vídeo
      if (isVideo && !permitirVideo) {
        setError('Upload de vídeos não está habilitado');
        return;
      }

      // Validar tamanho (máx 10MB para fotos, 50MB para vídeos)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Arquivo muito grande. Máximo ${isVideo ? '50MB' : '10MB'}.`);
        return;
      }

      const localUrl = URL.createObjectURL(file);
      
      const novoMedia: MediaFile = {
        id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        url: localUrl,
        localUrl: localUrl,
        tipo: isVideo ? 'video' : 'foto',
        timestamp: new Date(),
        descricao: descricao || getTipoEvidenciaLabel(tipoEvidencia),
        tipoEvidencia,
        tamanho: file.size,
        nomeArquivo: file.name
      };

      if (isVideo) {
        // Para vídeos, tentar obter duração
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        
        videoElement.onloadedmetadata = () => {
          novoMedia.duracao = Math.round(videoElement.duration);
          
          // Atualizar a lista de vídeos com a duração correta
          setVideos(prev => prev.map(v => 
            v.id === novoMedia.id ? {...v, duracao: Math.round(videoElement.duration)} : v
          ));
          
          // Atualizar callback
          const todaMedia = [...fotos, ...videos.map(v => 
            v.id === novoMedia.id ? {...v, duracao: Math.round(videoElement.duration)} : v
          )];
          onCapture(todaMedia);
          
          // Limpar
          URL.revokeObjectURL(videoElement.src);
        };
        
        videoElement.onerror = () => {
          logDebug('Erro ao carregar metadados do vídeo', file.name);
          // Mesmo com erro, continuamos usando o vídeo
          URL.revokeObjectURL(videoElement.src);
        };
        
        videoElement.src = localUrl;

        const novosVideos = [...videos, novoMedia];
        setVideos(novosVideos);
        
        // Combinar toda mídia
        const todaMedia = [...fotos, ...novosVideos];
        onCapture(todaMedia);
        
        logDebug('Vídeo adicionado com sucesso', {
          nome: file.name,
          tamanho: file.size,
          tipo: file.type
        });
      } else {
        // Para fotos
        const novasFotos = [...fotos, novoMedia];
        setFotos(novasFotos);
        
        // Combinar toda mídia
        const todaMedia = [...novasFotos, ...videos];
        onCapture(todaMedia);
      }
    });

    // Limpar input
    event.target.value = '';
  };

  const removePhoto = (fotoId: string) => {
    const novasFotos = fotos.filter(foto => foto.id !== fotoId);
    setFotos(novasFotos);
    
    // Combinar toda mídia
    const todaMedia = [...novasFotos, ...videos];
    onCapture(todaMedia);
  };

  const downloadPhoto = (foto: MediaFile) => {
    const link = document.createElement('a');
    link.href = foto.localUrl;
    link.download = foto.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTipoEvidenciaLabel = (tipo: string) => {
    switch (tipo) {
      case 'numero_serie': return 'Número de Série';
      case 'local_instalacao': return 'Local de Instalação';
      default: return 'Evidência';
    }
  };

  const getTipoEvidenciaColor = (tipo: string) => {
    switch (tipo) {
      case 'numero_serie': return 'bg-blue-100 text-blue-800';
      case 'local_instalacao': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (disabled) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6 text-center">
          <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Captura de evidências desabilitada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Captura de Evidências</span>
          <Badge variant="outline" className={getTipoEvidenciaColor(tipoEvidencia)}>
            {getTipoEvidenciaLabel(tipoEvidencia)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de câmera */}
        <div className="relative">
          {/* Mensagem de erro */}
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-red-600 hover:bg-red-100 p-1 h-auto"
                onClick={() => setError(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {/* Debug Info (em desenvolvimento) */}
          {debugInfo && (
            <details className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs">
              <summary className="cursor-pointer font-medium">Debug Info</summary>
              <pre className="mt-2 whitespace-pre-wrap">{debugInfo}</pre>
            </details>
          )}

          {/* Vídeo da câmera (só renderiza quando necessário) */}
          {shouldRenderVideo && (
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Canvas para captura (escondido) */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Overlay de carregamento */}
              {isRequestingCamera && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white mb-2" />
                  <p className="text-white text-sm">Acessando câmera...</p>
                </div>
              )}
              
              {/* Overlay de gravação */}
              {isRecording && (
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    REC {formatRecordingTime(recordingTime)}
                  </Badge>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={stopVideoRecording}
                    className="h-7"
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Parar
                  </Button>
                </div>
              )}
              
              {/* Botão de captura */}
              {isCameraActive && !isRecording && (
                <div className="absolute bottom-2 inset-x-0 flex justify-center items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/80 hover:bg-white border-none"
                    onClick={capturePhoto}
                    disabled={isCapturing || disabled}
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                  
                  {permitirVideo && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white/80 hover:bg-white border-none text-red-500"
                      onClick={startVideoRecording}
                      disabled={isRecording || disabled}
                    >
                      <Video className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Área de controles da câmera */}
          <div className="mt-3 flex flex-wrap gap-2">
            {!isCameraActive ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleStartCameraClick}
                  disabled={isRequestingCamera || disabled || cameraSupported === false}
                  className="flex-1"
                >
                  {isRequestingCamera ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Acessando...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Câmera/Foto
                    </>
                  )}
                </Button>
                
                {permitirVideo && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={startVideoRecording}
                    disabled={disabled}
                    className="flex-1"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Gravar Vídeo
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={stopCamera}
                disabled={disabled}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Fechar Câmera
              </Button>
            )}
          </div>
          
          {/* Inputs escondidos */}
          <input 
            ref={uploadInputRef}
            type="file" 
            accept="image/*,video/*" 
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
          
          {/* Input para captura direta em dispositivos móveis */}
          <input 
            ref={captureInputRef}
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {/* Novo input específico para vídeo */}
          <input 
            ref={videoInputRef}
            type="file" 
            accept="video/*" 
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        
        {/* Galeria de fotos */}
        {fotos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Fotos Capturadas ({fotos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {fotos.map((foto) => (
                  <div key={foto.id} className="relative group">
                    <img
                      src={foto.localUrl}
                      alt={foto.descricao}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    
                    {/* Overlay com ações */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadPhoto(foto)}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePhoto(foto.id)}
                        className="bg-white text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Info da foto */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black bg-opacity-75 text-white text-xs p-1 rounded">
                        {foto.timestamp.toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Galeria de vídeos */}
        {videos.length > 0 && permitirVideo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Vídeos Capturados ({videos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="relative group">
                    <video
                      src={video.localUrl}
                      className="w-full h-40 object-cover rounded-lg border"
                      controls
                      preload="metadata"
                      muted
                    />
                    
                    {/* Overlay com ações */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadVideo(video)}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeVideo(video.id)}
                        className="bg-white text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Info do vídeo */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                        <div className="flex justify-between items-center">
                          <span>{video.timestamp.toLocaleTimeString('pt-BR')}</span>
                          {video.duracao && (
                            <span className="flex items-center gap-1">
                              <VolumeX className="w-3 h-3" />
                              {formatRecordingTime(video.duracao)}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-300 mt-1">
                          {Math.round(video.tamanho / 1024 / 1024 * 100) / 100} MB
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status */}
        {(fotos.length > 0 || videos.length > 0) && (
          <Card className={
            (fotos.length >= minFotos && (!permitirVideo || videos.length >= minVideos))
              ? "border-green-200 bg-green-50" 
              : "border-yellow-200 bg-yellow-50"
          }>
            <CardContent className="p-4 space-y-2">
              {/* Status das fotos */}
              {fotos.length > 0 && (
                <div className={`flex items-center gap-2 ${fotos.length >= minFotos ? 'text-green-700' : 'text-yellow-700'}`}>
                  {fotos.length >= minFotos ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {fotos.length} {fotos.length === 1 ? 'foto capturada' : 'fotos capturadas'}
                    {minFotos > 0 && fotos.length < minFotos && ` (faltam ${minFotos - fotos.length})`}
                    {minFotos > 0 && fotos.length >= minFotos && ' (mínimo atingido)'}
                  </span>
                </div>
              )}
              
              {/* Status dos vídeos */}
              {permitirVideo && videos.length > 0 && (
                <div className={`flex items-center gap-2 ${videos.length >= minVideos ? 'text-green-700' : 'text-yellow-700'}`}>
                  {videos.length >= minVideos ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {videos.length} {videos.length === 1 ? 'vídeo capturado' : 'vídeos capturados'}
                    {minVideos > 0 && videos.length < minVideos && ` (faltam ${minVideos - videos.length})`}
                    {minVideos > 0 && videos.length >= minVideos && ' (mínimo atingido)'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Avisos se não há mídia obrigatória */}
        {fotos.length === 0 && minFotos > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Mínimo de {minFotos} {minFotos === 1 ? 'foto obrigatória' : 'fotos obrigatórias'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {permitirVideo && videos.length === 0 && minVideos > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Mínimo de {minVideos} {minVideos === 1 ? 'vídeo obrigatório' : 'vídeos obrigatórios'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
} 