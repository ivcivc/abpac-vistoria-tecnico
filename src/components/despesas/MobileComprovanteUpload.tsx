'use client';

/**
 * Upload Mobile de Comprovantes - Task 5.2
 * Reutiliza a estrutura do MobileEvidenceCapture para upload de comprovantes de despesas
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Eye, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';

export interface ComprovanteFile {
  id: string;
  file: File;
  localUrl: string;
  tipo: 'foto' | 'pdf';
  tamanho: number;
  nome: string;
  timestamp: string;
}

interface MobileComprovanteUploadProps {
  onFilesChange: (files: ComprovanteFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // em MB
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

export function MobileComprovanteUpload({
  onFilesChange,
  maxFiles = 3,
  maxFileSize = 10, // 10MB
  acceptedTypes = ['image/*', 'application/pdf'],
  disabled = false,
  className = ''
}: MobileComprovanteUploadProps) {
  const [files, setFiles] = useState<ComprovanteFile[]>([]);
  const [previewFile, setPreviewFile] = useState<ComprovanteFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const generateFileId = (): string => {
    return `comprovante_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const processFile = async (file: File): Promise<ComprovanteFile | null> => {
    // Validar tamanho
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`Arquivo muito grande. Máximo: ${maxFileSize}MB`);
      return null;
    }

    // Validar tipo
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isValidType) {
      alert('Tipo de arquivo não aceito. Use fotos (JPG, PNG) ou PDFs.');
      return null;
    }

    const comprovanteFile: ComprovanteFile = {
      id: generateFileId(),
      file,
      localUrl: URL.createObjectURL(file),
      tipo: file.type.startsWith('image/') ? 'foto' : 'pdf',
      tamanho: file.size,
      nome: file.name,
      timestamp: new Date().toISOString()
    };

    return comprovanteFile;
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsProcessing(true);

    try {
      const newFiles: ComprovanteFile[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Verificar limite de arquivos
        if (files.length + newFiles.length >= maxFiles) {
          alert(`Máximo de ${maxFiles} comprovantes permitidos.`);
          break;
        }

        const processedFile = await processFile(file);
        if (processedFile) {
          newFiles.push(processedFile);
        }
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
      }

    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      alert('Erro ao processar arquivos');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Câmera traseira
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      handleFileSelect(target.files);
    };
    input.click();
  };

  const handleGallerySelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes.join(',');
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      handleFileSelect(target.files);
    };
    input.click();
  };

  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    
    if (fileToRemove) {
      // Revogar URL para liberar memória
      URL.revokeObjectURL(fileToRemove.localUrl);
      
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
      
      // Fechar preview se for o arquivo sendo visualizado
      if (previewFile?.id === fileId) {
        setPreviewFile(null);
      }
    }
  };

  const getFileIcon = (tipo: 'foto' | 'pdf') => {
    return tipo === 'foto' ? ImageIcon : FileText;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botões de ação */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleCameraCapture}
          disabled={disabled || isProcessing || files.length >= maxFiles}
          variant="outline"
          className="h-14 flex flex-col items-center justify-center space-y-1"
        >
          <Camera className="h-5 w-5" />
          <span className="text-xs">Câmera</span>
        </Button>
        
        <Button
          onClick={handleGallerySelect}
          disabled={disabled || isProcessing || files.length >= maxFiles}
          variant="outline"
          className="h-14 flex flex-col items-center justify-center space-y-1"
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs">Galeria/PDF</span>
        </Button>
      </div>

      {/* Estado de processamento */}
      {isProcessing && (
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-blue-700">Processando arquivo...</span>
        </div>
      )}

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Comprovantes ({files.length}/{maxFiles})
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {files.map((file) => {
              const IconComponent = getFileIcon(file.tipo);
              
              return (
                <div
                  key={file.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {file.nome}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.tamanho)}</span>
                      <span>•</span>
                      <span className="uppercase">{file.tipo}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {file.tipo === 'foto' && (
                      <Button
                        onClick={() => setPreviewFile(file)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => removeFile(file.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {files.length === 0 && !isProcessing && (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Nenhum comprovante adicionado
          </p>
          <p className="text-xs text-gray-500">
            Use os botões acima para adicionar fotos ou PDFs
          </p>
        </div>
      )}

      {/* Informações de limite */}
      <div className="text-xs text-gray-500 text-center">
        <p>Máximo: {maxFiles} arquivos • {maxFileSize}MB cada</p>
        <p>Aceito: Fotos (JPG, PNG) e PDFs</p>
      </div>

      {/* Modal de preview para fotos */}
      {previewFile && previewFile.tipo === 'foto' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <Button
              onClick={() => setPreviewFile(null)}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <img
              src={previewFile.localUrl}
              alt={previewFile.nome}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white p-2 rounded">
              <p className="text-sm font-medium truncate">{previewFile.nome}</p>
              <p className="text-xs opacity-80">{formatFileSize(previewFile.tamanho)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}