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
  Loader2
} from 'lucide-react';

export interface MediaFile {
  id: string;
  url: string;
  localUrl: string;
  tipo: 'foto';
  timestamp: Date;
  descricao: string;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outro';
  tamanho: number;
  nomeArquivo: string;
}

interface MediaCaptureProps {
  onCapture: (media: MediaFile[]) => void;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outro';
  maxFotos?: number;
  descricao?: string;
  fotosExistentes?: MediaFile[];
  disabled?: boolean;
}

export function MediaCapture({
  onCapture,
  tipoEvidencia,
  maxFotos = 5,
  descricao = '',
  fotosExistentes = [],
  disabled = false
}: MediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [fotos, setFotos] = useState<MediaFile[]>(fotosExistentes);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(true);

  useEffect(() => {
    // Verificar suporte à câmera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
    }

    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    // Inicializar fotos apenas quando fotosExistentes mudar de fora
    setFotos(fotosExistentes);
  }, [fotosExistentes]);

  const startCamera = async () => {
    try {
      setError(null);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Preferir câmera traseira
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
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
            errorMessage = 'Acesso à câmera negado. Permita o acesso para tirar fotos.';
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
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
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

      // Parar câmera se atingiu limite
      if (novasFotos.length >= maxFotos) {
        stopCamera();
      }

    } catch (err) {
      console.error('Erro ao capturar foto:', err);
      setError('Erro ao capturar foto. Tente novamente.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (fotos.length >= maxFotos) return;

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Apenas arquivos de imagem são permitidos');
        return;
      }

      // Validar tamanho (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 10MB.');
        return;
      }

      const localUrl = URL.createObjectURL(file);
      
      const novaFoto: MediaFile = {
        id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: localUrl,
        localUrl: localUrl,
        tipo: 'foto',
        timestamp: new Date(),
        descricao: descricao || getTipoEvidenciaLabel(tipoEvidencia),
        tipoEvidencia,
        tamanho: file.size,
        nomeArquivo: file.name
      };

      const novasFotos = [...fotos, novaFoto];
      setFotos(novasFotos);
      onCapture(novasFotos);
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
        <Badge variant="outline">
          {fotos.length}/{maxFotos} fotos
        </Badge>
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
                <Button
                  onClick={capturePhoto}
                  disabled={isCapturing || fotos.length >= maxFotos}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
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
              disabled={fotos.length >= maxFotos}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Usar Câmera
            </Button>
          )}
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={fotos.length >= maxFotos}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      )}

      {/* Input de arquivo (oculto) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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

      {/* Status */}
      {fotos.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">
                {fotos.length} {fotos.length === 1 ? 'foto capturada' : 'fotos capturadas'} 
                {fotos.length >= maxFotos && ' (limite atingido)'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 