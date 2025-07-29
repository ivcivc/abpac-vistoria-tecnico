'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Upload, 
  X, 
  Eye, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  Download,
  PlayCircle
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
  duracao?: number;
  compressed?: boolean;
  originalSize?: number;
}

interface MobileEvidenceCaptureProps {
  onCapture: (media: MediaFile[]) => void;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outro';
  maxFotos?: number;
  minFotos?: number;
  descricao?: string;
  fotosExistentes?: MediaFile[];
  disabled?: boolean;
}

export function MobileEvidenceCapture({
  onCapture,
  tipoEvidencia,
  maxFotos = 10,
  minFotos = 0,
  descricao = '',
  fotosExistentes = [],
  disabled = false
}: MobileEvidenceCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [fotos, setFotos] = useState<MediaFile[]>(fotosExistentes);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<MediaFile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: MediaFile | null }>({ show: false, item: null });

  // Sincronizar com fotos existentes
  useEffect(() => {
    console.log('📷 MobileEvidenceCapture: Sincronizando fotos existentes', {
      fotosExistentes: fotosExistentes.length,
      tipoEvidencia
    });
    setFotos(fotosExistentes);
  }, [fotosExistentes, tipoEvidencia]);

  const getTipoEvidenciaConfig = (tipo: string) => {
    switch(tipo) {
      case 'numero_serie': 
        return {
          label: 'Número de Série',
          icon: '🔢',
          color: 'bg-blue-50 border-blue-200',
          hint: 'Capture o número de série do equipamento'
        };
      case 'local_instalacao': 
        return {
          label: 'Local de Instalação',
          icon: '📍',
          color: 'bg-green-50 border-green-200',
          hint: 'Foto do local onde foi instalado'
        };
      default: 
        return {
          label: 'Outras Evidências',
          icon: '📸',
          color: 'bg-purple-50 border-purple-200',
          hint: 'Fotos adicionais relevantes'
        };
    }
  };

  // Função para comprimir imagem
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Definir tamanho máximo (1920x1080 para mobile)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        // Calcular nova dimensão mantendo proporção
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Converter para blob com qualidade otimizada
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8); // 80% qualidade
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    
    console.log('📁 MobileEvidenceCapture: Processando arquivos', {
      quantidade: files.length,
      tipoEvidencia
    });

    try {
      const processedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          // Validar tipo (imagem ou vídeo)
          const isImage = file.type.startsWith('image/');
          const isVideo = file.type.startsWith('video/');
          
          if (!isImage && !isVideo) {
            console.error('❌ Arquivo não é imagem nem vídeo:', file.type);
            return null;
          }

          // Validar tamanho inicial (máx 50MB para imagem, 100MB para vídeo)
          const maxSize = isVideo ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
          if (file.size > maxSize) {
            console.error('❌ Arquivo muito grande:', file.size);
            return null;
          }

          // Processar arquivo
          const originalSize = file.size;
          let processedFile = file;
          let compressed = false;
          
          // Comprimir apenas imagens
          if (isImage) {
            processedFile = await compressImage(file);
            compressed = processedFile.size < originalSize;
          }
          
          const localUrl = URL.createObjectURL(processedFile);
          
          const novoArquivo: MediaFile = {
            id: `mobile_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            url: localUrl,
            localUrl: localUrl,
            tipo: isVideo ? 'video' : 'foto',
            timestamp: new Date(),
            descricao: descricao || getTipoEvidenciaConfig(tipoEvidencia).label,
            tipoEvidencia,
            tamanho: processedFile.size,
            nomeArquivo: file.name,
            compressed: compressed,
            originalSize: originalSize,
            duracao: isVideo ? undefined : undefined // TODO: Extrair duração do vídeo se necessário
          };

          console.log(`${isVideo ? '🎥' : '📸'} MobileEvidenceCapture: Novo ${isVideo ? 'vídeo' : 'foto'} processado`, {
            id: novoArquivo.id,
            nome: file.name,
            tipo: novoArquivo.tipo,
            tamanhoOriginal: Math.round(originalSize / 1024) + 'KB',
            tamanhoFinal: Math.round(processedFile.size / 1024) + 'KB',
            compressao: compressed ? Math.round((1 - processedFile.size / originalSize) * 100) + '%' : 'N/A'
          });

          return novoArquivo;
        })
      );

      // Filtrar arquivos válidos e adicionar às fotos
      const fotosValidas = processedFiles.filter(foto => foto !== null) as MediaFile[];
      const novasFotos = [...fotos, ...fotosValidas];
      
      setFotos(novasFotos);
      onCapture(novasFotos);
      
      // Mostrar preview da primeira foto capturada
      if (fotosValidas.length > 0) {
        setPreviewPhoto(fotosValidas[0]);
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar fotos:', error);
    } finally {
      setIsProcessing(false);
      // Limpar input
      event.target.value = '';
    }
  };

  const handleDeleteRequest = (item: MediaFile) => {
    setDeleteConfirm({ show: true, item });
  };

  const confirmDelete = () => {
    if (deleteConfirm.item) {
      console.log('🗑️ MobileEvidenceCapture: Removendo arquivo', deleteConfirm.item.id);
      const novasFotos = fotos.filter(foto => foto.id !== deleteConfirm.item!.id);
      setFotos(novasFotos);
      onCapture(novasFotos);
      
      // Fechar preview se for o arquivo removido
      if (previewPhoto?.id === deleteConfirm.item.id) {
        setPreviewPhoto(null);
      }
    }
    setDeleteConfirm({ show: false, item: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, item: null });
  };

  const handleTakePhoto = () => {
    console.log('📷 MobileEvidenceCapture: Abrindo câmera');
    cameraInputRef.current?.click();
  };

  const handleSelectFiles = () => {
    console.log('📁 MobileEvidenceCapture: Abrindo galeria');
    fileInputRef.current?.click();
  };

  const config = getTipoEvidenciaConfig(tipoEvidencia);

  if (disabled) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Captura de evidências desabilitada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`${config.color} shadow-md`}>
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{config.label}</h3>
                <p className="text-xs text-gray-600">{config.hint}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white">
              {fotos.length}/{maxFotos}
            </Badge>
          </div>

          {/* Botões de Captura - Mobile First */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleTakePhoto}
              disabled={isProcessing || fotos.length >= maxFotos}
              className="h-14 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Camera className="h-5 w-5 mr-2" />
              )}
              Foto/Vídeo
            </Button>
            
            <Button
              onClick={handleSelectFiles}
              disabled={isProcessing || fotos.length >= maxFotos}
              variant="outline"
              className="h-14 text-base font-semibold border-2 hover:bg-gray-50"
            >
              <Upload className="h-5 w-5 mr-2" />
              Galeria
            </Button>
          </div>

          {/* Grid de Arquivos - Otimizado para Mobile */}
          {fotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((arquivo, index) => (
                <div key={arquivo.id} className="relative group aspect-square">
                  {/* Renderizar imagem ou vídeo */}
                  {arquivo.tipo === 'video' ? (
                    <video
                      src={arquivo.localUrl}
                      className="w-full h-full object-cover rounded-lg border-2 border-white shadow-sm"
                      onClick={() => setPreviewPhoto(arquivo)}
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={arquivo.localUrl}
                      alt={arquivo.descricao}
                      className="w-full h-full object-cover rounded-lg border-2 border-white shadow-sm"
                      onClick={() => setPreviewPhoto(arquivo)}
                    />
                  )}
                  
                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-active:opacity-100 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPhoto(arquivo);
                        }}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(arquivo);
                        }}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Indicadores */}
                  <div className="absolute top-1 right-1 flex gap-1">
                    {/* Indicador de tipo */}
                    {arquivo.tipo === 'video' && (
                      <div className="bg-purple-500 text-white text-xs px-1 py-0.5 rounded flex items-center">
                        <PlayCircle className="h-3 w-3" />
                      </div>
                    )}
                    {arquivo.compressed && (
                      <div className="bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                        <CheckCircle className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-1 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <span>{Math.round(arquivo.tamanho / 1024)}KB</span>
                      <span>{index + 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status e Validação */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              {fotos.length === 0 && (
                <span className="text-gray-500">Nenhum arquivo capturado</span>
              )}
              {fotos.length > 0 && (
                <span className="text-gray-700 font-medium">
                  {fotos.length} arquivo{fotos.length > 1 ? 's' : ''} capturado{fotos.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {minFotos > 0 && fotos.length < minFotos && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Min: {minFotos}
                </Badge>
              )}
              {fotos.length >= minFotos && minFotos > 0 && (
                <Badge variant="default" className="text-xs bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  OK
                </Badge>
              )}
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Processando arquivos...</span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Inputs escondidos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </Card>

      {/* Modal de Preview - Mobile Optimized */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 text-white">
              <div>
                <h3 className="font-semibold">{config.label}</h3>
                <p className="text-sm opacity-80">
                  {Math.round(previewPhoto.tamanho / 1024)}KB
                  {previewPhoto.compressed && (
                    <span className="ml-2 text-green-400">• Otimizada</span>
                  )}
                </p>
              </div>
              <Button
                onClick={() => setPreviewPhoto(null)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mídia */}
            <div className="relative mb-4">
              {previewPhoto.tipo === 'video' ? (
                <video
                  src={previewPhoto.localUrl}
                  className="w-full max-h-96 object-contain rounded-lg"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={previewPhoto.localUrl}
                  alt={previewPhoto.descricao}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleDeleteRequest(previewPhoto)}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Remover
              </Button>
              <Button
                onClick={() => setPreviewPhoto(null)}
                variant="outline"
                className="flex-1 bg-white text-black"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm.show && deleteConfirm.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <Card className="shadow-xl">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-sm text-gray-600">
                    Tem certeza que deseja excluir {deleteConfirm.item.tipo === 'video' ? 'este vídeo' : 'esta foto'}?
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {deleteConfirm.item.nomeArquivo} ({Math.round(deleteConfirm.item.tamanho / 1024)}KB)
                  </p>
                </div>

                {/* Preview pequeno */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                    {deleteConfirm.item.tipo === 'video' ? (
                      <video
                        src={deleteConfirm.item.localUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={deleteConfirm.item.localUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={cancelDelete}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
} 