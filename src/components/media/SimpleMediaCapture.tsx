'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Eye } from 'lucide-react';

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
}

interface SimpleMediaCaptureProps {
  onCapture: (media: MediaFile[]) => void;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outro';
  maxFotos?: number;
  minFotos?: number;
  descricao?: string;
  fotosExistentes?: MediaFile[];
  disabled?: boolean;
}

export function SimpleMediaCapture({
  onCapture,
  tipoEvidencia,
  maxFotos = 999,
  minFotos = 0,
  descricao = '',
  fotosExistentes = [],
  disabled = false
}: SimpleMediaCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [fotos, setFotos] = useState<MediaFile[]>(fotosExistentes);

  // Sincronizar com fotos existentes
  useEffect(() => {
    console.log('📷 SimpleMediaCapture: Sincronizando fotos existentes', {
      fotosExistentes: fotosExistentes.length,
      tipoEvidencia
    });
    setFotos(fotosExistentes);
  }, [fotosExistentes, tipoEvidencia]);

  const getTipoEvidenciaLabel = (tipo: string) => {
    switch(tipo) {
      case 'numero_serie': return 'Número de Série';
      case 'local_instalacao': return 'Local de Instalação';
      default: return 'Outras Evidências';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('📁 SimpleMediaCapture: Processando arquivos', {
      quantidade: files.length,
      tipoEvidencia
    });

    Array.from(files).forEach((file) => {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        console.error('❌ Arquivo não é imagem:', file.type);
        return;
      }

      // Validar tamanho (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error('❌ Arquivo muito grande:', file.size);
        return;
      }

      const localUrl = URL.createObjectURL(file);
      
      const novaFoto: MediaFile = {
        id: `simple_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        url: localUrl,
        localUrl: localUrl,
        tipo: 'foto',
        timestamp: new Date(),
        descricao: descricao || getTipoEvidenciaLabel(tipoEvidencia),
        tipoEvidencia,
        tamanho: file.size,
        nomeArquivo: file.name
      };

      console.log('📸 SimpleMediaCapture: Nova foto adicionada', {
        id: novaFoto.id,
        nome: file.name,
        tamanho: Math.round(file.size / 1024) + 'KB'
      });

      const novasFotos = [...fotos, novaFoto];
      setFotos(novasFotos);
      onCapture(novasFotos);
    });

    // Limpar input
    event.target.value = '';
  };

  const removeFoto = (fotoId: string) => {
    console.log('🗑️ SimpleMediaCapture: Removendo foto', fotoId);
    const novasFotos = fotos.filter(foto => foto.id !== fotoId);
    setFotos(novasFotos);
    onCapture(novasFotos);
  };

  const handleSelectFiles = () => {
    console.log('📁 SimpleMediaCapture: Abrindo seleção de arquivos');
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    console.log('📷 SimpleMediaCapture: Abrindo câmera');
    cameraInputRef.current?.click();
  };

  if (disabled) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            📷 {getTipoEvidenciaLabel(tipoEvidencia)} (Desabilitado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">Captura de evidências desabilitada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📷 {getTipoEvidenciaLabel(tipoEvidencia)}
            <Badge variant="outline">{fotos.length} foto(s)</Badge>
          </span>
          {minFotos > 0 && fotos.length < minFotos && (
            <Badge variant="destructive">Min: {minFotos}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {descricao && (
          <p className="text-sm text-blue-700">{descricao}</p>
        )}

        {/* Botões de Captura */}
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleTakePhoto}
            size="sm"
            variant="default"
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Tirar Foto
          </Button>
          
          <Button
            type="button"
            onClick={handleSelectFiles}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Selecionar Arquivo
          </Button>
        </div>

        {/* Lista de Fotos */}
        {fotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative group">
                <img
                  src={foto.localUrl}
                  alt={foto.descricao}
                  className="w-full h-20 object-cover rounded border"
                />
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      type="button"
                      onClick={() => window.open(foto.localUrl, '_blank')}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFoto(foto.id)}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b">
                  {Math.round(foto.tamanho / 1024)}KB
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-gray-600">
          {fotos.length === 0 && 'Nenhuma foto capturada'}
          {fotos.length > 0 && `${fotos.length} foto(s) capturada(s)`}
          {minFotos > 0 && fotos.length < minFotos && ` - Mínimo: ${minFotos}`}
        </div>

        {/* Inputs escondidos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
} 