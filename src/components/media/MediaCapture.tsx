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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [fotos, setFotos] = useState<MediaFile[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(true);
  
  // Estados para vídeo
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [recordingTimerRef, setRecordingTimerRef] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Verificar suporte à câmera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
    }

    return () => {
      stopCamera();
    };
  }, []);

  // Inicializar mídia apenas uma vez - SEM useEffect que causa loop
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
  }, []); // SEM dependências para evitar loop

  const startCamera = async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Preferir câmera traseira
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: permitirVideo // Incluir áudio apenas se permitir vídeo
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      
      let errorMessage = 'Erro ao acessar câmera';
      
      if (err instanceof Error) {
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = permitirVideo 
              ? 'Acesso à câmera e microfone negado. Permita o acesso para gravar vídeos.'
              : 'Acesso à câmera negado. Permita o acesso para tirar fotos.';
            break;
          case 'NotFoundError':
            errorMessage = 'Câmera não encontrada no dispositivo.';
            break;
          case 'NotSupportedError':
            errorMessage = 'Câmera não suportada pelo navegador.';
            break;
          default:
            errorMessage = 'Erro ao acessar câmera. Verifique as permissões.';
        }
      }
      
      setError(errorMessage);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    // Parar gravação se estiver ativa
    if (isRecording) {
      stopVideoRecording();
    }

    // Parar stream da câmera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }

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
        id: `foto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      onCapture(novasFotos);

      // Não parar câmera automaticamente - usuário decide quando parar

    } catch (err) {
      console.error('Erro ao capturar foto:', err);
      setError('Erro ao capturar foto. Tente novamente.');
    } finally {
      setIsCapturing(false);
    }
  };

  // =============== FUNÇÕES DE VÍDEO ===============

  const startVideoRecording = async () => {
    if (!stream || !permitirVideo || isRecording) return;

    try {
      setError(null);
      setRecordedChunks([]);
      setRecordingTime(0);

      // Verificar se o navegador suporta MediaRecorder
      if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        throw new Error('Gravação de vídeo não suportada neste navegador');
      }

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8'
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handler para dados disponíveis
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      // Handler para fim da gravação
      mediaRecorder.onstop = () => {
        console.log('📹 Gravação finalizada');
      };

      // Iniciar gravação
      mediaRecorder.start(1000); // Coletar dados a cada 1 segundo
      setIsRecording(true);

      // Iniciar timer
      const timer = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          
          // Parar automaticamente ao atingir o tempo máximo
          if (newTime >= maxDuracaoVideo) {
            stopVideoRecording();
          }
          
          return newTime;
        });
      }, 1000);

      setRecordingTimerRef(timer);

    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao iniciar gravação de vídeo');
      setIsRecording(false);
    }
  };

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

      // Aguardar um pouco para garantir que todos os chunks foram coletados
      setTimeout(() => {
        processRecordedVideo();
      }, 100);

    } catch (err) {
      console.error('Erro ao parar gravação:', err);
      setError('Erro ao finalizar gravação de vídeo');
      setIsRecording(false);
    }
  };

  const processRecordedVideo = async () => {
    if (recordedChunks.length === 0) {
      setError('Nenhum dado de vídeo foi gravado');
      return;
    }

    try {
      // Criar blob do vídeo original
      const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      
      console.log(`📹 Processando vídeo original: ${Math.round(videoBlob.size / 1024 / 1024 * 100) / 100}MB`);

      // Comprimir vídeo se necessário
      const videoComprimido = await compressVideo(videoBlob);
      const localUrl = URL.createObjectURL(videoComprimido);

      // Criar objeto MediaFile para vídeo
      const novoVideo: MediaFile = {
        id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: localUrl,
        localUrl: localUrl,
        tipo: 'video',
        timestamp: new Date(),
        descricao: descricao || `${getTipoEvidenciaLabel(tipoEvidencia)} - Vídeo`,
        tipoEvidencia,
        tamanho: videoComprimido.size,
        nomeArquivo: `${tipoEvidencia}_video_${Date.now()}.webm`,
        duracao: recordingTime
      };

      const novosVideos = [...videos, novoVideo];
      setVideos(novosVideos);

      // Combinar fotos e vídeos para onCapture
      const todaMedia = [...fotos, ...novosVideos];
      onCapture(todaMedia);

      // Limpar chunks
      setRecordedChunks([]);
      setRecordingTime(0);

      console.log('✅ Vídeo processado e salvo:', novoVideo.id);

    } catch (err) {
      console.error('Erro ao processar vídeo:', err);
      setError('Erro ao processar vídeo gravado');
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
              console.error('Erro na compressão:', event);
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
            console.error('Erro durante compressão:', error);
            resolve(videoBlob); // Usar original em caso de erro
          }
        };

        video.onerror = () => {
          console.error('Erro ao carregar vídeo para compressão');
          resolve(videoBlob); // Usar original em caso de erro
        };

        video.src = URL.createObjectURL(videoBlob);
        video.muted = true;

      } catch (error) {
        console.error('Erro na configuração de compressão:', error);
        resolve(videoBlob); // Usar original em caso de erro
      }
    });
  };

  // =============== FIM FUNÇÕES DE VÍDEO ===============

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
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        videoElement.onloadedmetadata = () => {
          (novoMedia as any).duracao = Math.round(videoElement.duration);
        };
        videoElement.src = localUrl;

        const novosVideos = [...videos, novoMedia];
        setVideos(novosVideos);
        
        // Combinar toda mídia
        const todaMedia = [...fotos, ...novosVideos];
        onCapture(todaMedia);
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
    onCapture(novasFotos);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          <h3 className="font-medium">Captura de Evidências</h3>
          <Badge className={getTipoEvidenciaColor(tipoEvidencia)}>
            {getTipoEvidenciaLabel(tipoEvidencia)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={fotos.length < minFotos ? 'border-red-500 text-red-600' : ''}>
            {fotos.length} fotos {minFotos > 0 && `(mín: ${minFotos})`}
          </Badge>
          {permitirVideo && (
            <Badge variant="outline" className={videos.length < minVideos ? 'border-red-500 text-red-600' : ''}>
              {videos.length} vídeos {minVideos > 0 && `(mín: ${minVideos})`}
            </Badge>
          )}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Câmera */}
      {isCameraActive && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg bg-black"
              />
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {/* Botão de foto */}
                <Button
                  onClick={capturePhoto}
                  disabled={isCapturing || isRecording}
                  className="bg-white text-black hover:bg-gray-100"
                  title="Tirar foto"
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>

                {/* Botões de vídeo (apenas se permitir vídeo) */}
                {permitirVideo && (
                  <>
                    <Button
                      onClick={isRecording ? stopVideoRecording : startVideoRecording}
                      disabled={isCapturing || videos.length >= maxVideos}
                      className={`bg-white hover:bg-gray-100 ${
                        isRecording ? 'text-red-600 border-red-500' : 'text-black'
                      }`}
                      title={isRecording ? 'Parar gravação' : 'Gravar vídeo'}
                    >
                      {isRecording ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                    </Button>
                  </>
                )}
                
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="bg-white text-black hover:bg-gray-100"
                  title="Fechar câmera"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Indicador de tempo de gravação */}
              {isRecording && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-mono">
                      {formatRecordingTime(recordingTime)} / {formatRecordingTime(maxDuracaoVideo)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles */}
      {!isCameraActive && (
        <div className="flex gap-2">
          {cameraSupported && (
            <Button
              onClick={startCamera}
              disabled={fotos.length >= maxFotos && (!permitirVideo || videos.length >= maxVideos)}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              {permitirVideo ? 'Câmera/Vídeo' : 'Usar Câmera'}
            </Button>
          )}
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={false}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Upload {permitirVideo ? 'Mídia' : 'Fotos'}
          </Button>
        </div>
      )}

      {/* Input de arquivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={permitirVideo ? "image/*,video/*" : "image/*"}
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Canvas para captura (oculto) */}
      <canvas ref={canvasRef} className="hidden" />

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
    </div>
  );
} 