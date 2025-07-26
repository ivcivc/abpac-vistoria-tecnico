/**
 * Service para upload de arquivos para o backend AdonisJS
 * Task 16 - Integração com endpoint real /api/upload
 */

import { API_CONFIG } from '@/config/api';

export interface UploadResult {
  success: boolean;
  arquivo?: {
    id: number;
    nome: string;
    url: string;
    tipo: string;
    subtipo: string;
    tamanho: number;
  };
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class UploadService {
  // Substituir a URL hardcoded por uma referência à configuração centralizada
  private static readonly API_BASE_URL = API_CONFIG.BASE_URL.replace('/api', '');
  
  /**
   * Faz upload de um arquivo para o backend
   */
  static async uploadFile(
    file: File | Blob,
    options: {
      tipo?: string;
      referencia?: string;
      fileName?: string;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResult> {
    try {
      const { tipo = 'evidencia', referencia, fileName, onProgress } = options;
      
      // Criar FormData
      const formData = new FormData();
      
      // Adicionar arquivo
      if (file instanceof File) {
        formData.append('file', file);
      } else {
        // Se for Blob, criar um File
        const actualFileName = fileName || `evidencia_${Date.now()}.jpg`;
        const fileFromBlob = new File([file], actualFileName, {
          type: file.type || 'image/jpeg'
        });
        formData.append('file', fileFromBlob);
      }
      
      // Adicionar metadados
      formData.append('type', tipo);
      if (referencia) {
        formData.append('reference', referencia);
      }
      
      console.log('📤 UploadService: Iniciando upload', {
        fileName: fileName || (file instanceof File ? file.name : 'blob'),
        size: file.size,
        type: file.type,
        metadados: { tipo, referencia }
      });
      
      // Fazer upload com XMLHttpRequest para ter progresso
      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Listener de progresso
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100)
              };
              onProgress(progress);
            }
          });
        }
        
        // Listener de conclusão
        xhr.addEventListener('load', () => {
          try {
            console.log('📋 UploadService: Status da resposta:', xhr.status);
            console.log('📋 UploadService: Texto da resposta:', xhr.responseText);
            
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              
              if (response.type === true) {
                console.log('✅ UploadService: Upload realizado com sucesso', response.arquivo);
                resolve({
                  success: true,
                  arquivo: response.arquivo
                });
              } else {
                console.error('❌ UploadService: Resposta de erro do backend', response);
                resolve({
                  success: false,
                  error: response.message || 'Erro no upload'
                });
              }
            } else {
              // Tentar parsear resposta de erro
              let errorMessage = `Erro HTTP ${xhr.status}: ${xhr.statusText}`;
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMessage = errorResponse.message || errorMessage;
                console.log('📋 UploadService: Resposta de erro parseada:', errorResponse);
              } catch (e) {
                console.log('📋 UploadService: Não foi possível parsear resposta de erro');
              }
              
              console.error('❌ UploadService: Status HTTP inválido', xhr.status, errorMessage);
              resolve({
                success: false,
                error: errorMessage
              });
            }
          } catch (error) {
            console.error('❌ UploadService: Erro ao processar resposta', error);
            resolve({
              success: false,
              error: 'Erro ao processar resposta do servidor'
            });
          }
        });
        
        // Listener de erro
        xhr.addEventListener('error', () => {
          console.error('❌ UploadService: Erro de rede');
          resolve({
            success: false,
            error: 'Erro de rede durante o upload'
          });
        });
        
        // Listener de timeout
        xhr.addEventListener('timeout', () => {
          console.error('❌ UploadService: Timeout no upload');
          resolve({
            success: false,
            error: 'Timeout durante o upload'
          });
        });
        
        // Configurar requisição
        xhr.timeout = 60000; // 60 segundos
        xhr.open('POST', `${this.API_BASE_URL}/api/upload-simple`);
        
        // Headers necessários são automaticamente definidos pelo FormData
        
        // Enviar requisição
        xhr.send(formData);
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ UploadService: Erro inesperado', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro inesperado no upload'
      };
    }
  }
  
  /**
   * Faz upload de múltiplos arquivos
   */
  static async uploadMultipleFiles(
    files: (File | Blob)[],
    options: {
      tipo?: string;
      referencia?: string;
      onProgress?: (fileIndex: number, progress: UploadProgress) => void;
      onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    } = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const result = await this.uploadFile(file, {
        ...options,
        fileName: file instanceof File ? file.name : `evidencia_${Date.now()}_${i}.jpg`,
        onProgress: options.onProgress ? (progress) => options.onProgress!(i, progress) : undefined
      });
      
      results.push(result);
      
      if (options.onFileComplete) {
        options.onFileComplete(i, result);
      }
    }
    
    return results;
  }
  
  /**
   * Converte MediaFile para estrutura do backend
   */
  static mediaFileToBackendFormat(mediaFile: any, uploadResult: UploadResult) {
    if (!uploadResult.success || !uploadResult.arquivo) {
      return null;
    }
    
    return {
      id: uploadResult.arquivo.id,
      nome: uploadResult.arquivo.nome,
      url: uploadResult.arquivo.url,
      tipo: uploadResult.arquivo.tipo,
      subtipo: uploadResult.arquivo.subtipo,
      tamanho: uploadResult.arquivo.tamanho,
      tipo_evidencia: mediaFile.tipoEvidencia,
      descricao: mediaFile.descricao,
      timestamp: mediaFile.timestamp,
      duracao: mediaFile.duracao
    };
  }
  
  /**
   * Processa lista de MediaFiles fazendo upload de cada um
   */
  static async processMediaFiles(
    mediaFiles: any[],
    options: {
      tipo?: string;
      referencia?: string;
      onProgress?: (fileIndex: number, progress: UploadProgress) => void;
      onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    } = {}
  ): Promise<any[]> {
    console.log('🚀 UploadService.processMediaFiles: INICIANDO', {
      quantidadeArquivos: mediaFiles.length,
      opcoes: options
    });
    
    const processedFiles: any[] = [];
    
    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i];
      
      console.log(`📁 UploadService.processMediaFiles: Processando arquivo ${i + 1}/${mediaFiles.length}`, {
        id: mediaFile.id,
        nome: mediaFile.nomeArquivo,
        localUrl: mediaFile.localUrl
      });
      
      try {
        console.log(`🔄 UploadService.processMediaFiles: Fazendo fetch do arquivo ${i + 1}`);
        
        // Converter URL local para Blob
        const response = await fetch(mediaFile.localUrl);
        
        if (!response.ok) {
          throw new Error(`Fetch falhou: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        console.log(`✅ UploadService.processMediaFiles: Blob criado para arquivo ${i + 1}`, {
          tamanho: blob.size,
          tipo: blob.type
        });
        
        console.log(`📤 UploadService.processMediaFiles: Iniciando upload do arquivo ${i + 1}`);
        
        // Fazer upload
        const uploadResult = await this.uploadFile(blob, {
          ...options,
          fileName: mediaFile.nomeArquivo,
          onProgress: options.onProgress ? (progress) => {
            console.log(`📊 UploadService.processMediaFiles: Progresso arquivo ${i + 1}: ${progress.percentage}%`);
            options.onProgress!(i, progress);
          } : undefined
        });
        
        console.log(`🎯 UploadService.processMediaFiles: Upload concluído para arquivo ${i + 1}`, uploadResult);
        
        // Converter para formato do backend
        const processedFile = this.mediaFileToBackendFormat(mediaFile, uploadResult);
        
        if (processedFile) {
          processedFiles.push(processedFile);
          console.log(`✅ UploadService.processMediaFiles: Arquivo ${i + 1} processado com sucesso`);
        } else {
          console.warn(`⚠️ UploadService.processMediaFiles: Falha no upload do arquivo ${mediaFile.nomeArquivo}`);
        }
        
        if (options.onFileComplete) {
          options.onFileComplete(i, uploadResult);
        }
        
      } catch (error) {
        console.error(`❌ UploadService.processMediaFiles: Erro ao processar arquivo ${i + 1} (${mediaFile.nomeArquivo})`, error);
        
        if (options.onFileComplete) {
          options.onFileComplete(i, {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }
    }
    
    console.log('🏁 UploadService.processMediaFiles: FINALIZADO', {
      totalProcessados: processedFiles.length,
      totalTentativas: mediaFiles.length
    });
    
    return processedFiles;
  }
} 