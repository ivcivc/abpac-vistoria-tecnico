/**
 * Serviço Integrado de Upload de Evidências - Mobile-First
 * Task 4.7 - Sistema completo offline-first com retry automático
 */

import { ImageCompressionService, CompressionOptions } from '@/services/media/ImageCompressionService';
import { EvidenceStorageService, EvidenceMetadata } from '@/services/media/EvidenceStorageService';
import { SyncQueueService } from '@/services/sync/SyncQueueService';
import { UploadService } from '@/services/uploadService';

export interface EvidenceUploadOptions {
  vistoriaId: string;
  itemId: string;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outras_evidencias';
  token: string;
  
  // Opções de compressão
  compression?: CompressionOptions;
  forceCompression?: boolean;
  
  // Comportamento de upload
  uploadImmediate?: boolean; // Tentar upload imediato
  addToQueue?: boolean; // Adicionar à fila se falhar
  priority?: number; // Prioridade na fila (1=alta, 2=média, 3=baixa)
  
  // Callbacks
  onProgress?: (phase: UploadPhase, progress: number) => void;
  onCompressionComplete?: (originalSize: number, compressedSize: number) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (evidenceId: string, urlRemota: string) => void;
  onError?: (error: string, phase: UploadPhase) => void;
}

export type UploadPhase = 'compression' | 'storage' | 'upload' | 'queue';

export interface EvidenceUploadResult {
  success: boolean;
  evidenceId?: string;
  metadata?: EvidenceMetadata;
  status: 'stored_local' | 'uploaded' | 'queued' | 'error';
  error?: string;
  compressionSavings?: number; // Percentual de redução
}

export class EvidenceUploadService {
  
  /**
   * Processa e armazena uma evidência com upload automático
   */
  static async processEvidence(
    file: File | Blob,
    options: EvidenceUploadOptions
  ): Promise<EvidenceUploadResult> {
    const startTime = performance.now();
    
    console.log('🎯 EvidenceUpload: INICIANDO processamento', {
      arquivo: file instanceof File ? file.name : 'blob',
      tamanho: file.size,
      tipo: options.tipoEvidencia,
      item: options.itemId
    });

    try {
      // 1. FASE DE COMPRESSÃO
      let processedBlob = file;
      let compressionSavings = 0;
      
      if (options.onProgress) {
        options.onProgress('compression', 0);
      }

      // Verificar se precisa comprimir
      const needsCompression = ImageCompressionService.needsCompression(file) || options.forceCompression;
      
      if (needsCompression && file.type.startsWith('image/')) {
        try {
          const compressionConfig = options.compression || ImageCompressionService.getAutoPreset();
          
          console.log('🗜️ EvidenceUpload: Iniciando compressão', compressionConfig);
          
          const compressionResult = await ImageCompressionService.compressImage(file, compressionConfig);
          
          processedBlob = compressionResult.blob;
          compressionSavings = compressionResult.compressionRatio;
          
          if (options.onCompressionComplete) {
            options.onCompressionComplete(compressionResult.originalSize, compressionResult.compressedSize);
          }
          
          console.log('✅ EvidenceUpload: Compressão concluída', {
            reducao: `${compressionSavings}%`,
            tamanhoFinal: compressionResult.compressedSize
          });
          
        } catch (compressionError) {
          console.warn('⚠️ EvidenceUpload: Falha na compressão, usando arquivo original:', compressionError);
          // Continuar com arquivo original se compressão falhar
        }
      }

      if (options.onProgress) {
        options.onProgress('compression', 100);
      }

      // 2. FASE DE ARMAZENAMENTO LOCAL
      if (options.onProgress) {
        options.onProgress('storage', 0);
      }

      const fileName = file instanceof File ? file.name : `evidencia_${Date.now()}.jpg`;
      
      const evidenceMetadata = await EvidenceStorageService.storeEvidence(
        processedBlob,
        {
          vistoriaId: options.vistoriaId,
          itemId: options.itemId,
          tipoEvidencia: options.tipoEvidencia,
          nomeOriginal: fileName,
          tamanho: processedBlob.size,
          tipo: processedBlob.type,
          compressao: compressionSavings > 0 ? {
            tamanhoOriginal: file.size,
            tamanhoComprimido: processedBlob.size,
            qualidade: options.compression?.quality || 0.8,
            formato: processedBlob.type
          } : undefined
        }
      );

      console.log('💾 EvidenceUpload: Evidência armazenada localmente', {
        id: evidenceMetadata.id,
        tamanho: evidenceMetadata.tamanho
      });

      if (options.onProgress) {
        options.onProgress('storage', 100);
      }

      // 3. FASE DE UPLOAD (se solicitado e online)
      let uploadResult: EvidenceUploadResult = {
        success: true,
        evidenceId: evidenceMetadata.id,
        metadata: evidenceMetadata,
        status: 'stored_local',
        compressionSavings
      };

      if (options.uploadImmediate && navigator.onLine) {
        if (options.onProgress) {
          options.onProgress('upload', 0);
        }

        if (options.onUploadStart) {
          options.onUploadStart();
        }

        try {
          await EvidenceStorageService.updateEvidenceStatus(evidenceMetadata.id, 'uploading');
          
          const apiUploadResult = await UploadService.uploadFile(processedBlob, {
            tipo: 'evidencia',
            referencia: `${options.vistoriaId}_${options.itemId}_${options.tipoEvidencia}`,
            fileName: fileName,
            onProgress: (progress) => {
              if (options.onProgress) {
                options.onProgress('upload', progress.percentage);
              }
            }
          });

          if (apiUploadResult.success && apiUploadResult.arquivo) {
            // Upload bem-sucedido
            await EvidenceStorageService.updateEvidenceStatus(
              evidenceMetadata.id,
              'synced',
              apiUploadResult.arquivo.url
            );
            
            uploadResult.status = 'uploaded';
            
            if (options.onUploadComplete) {
              options.onUploadComplete(evidenceMetadata.id, apiUploadResult.arquivo.url);
            }
            
            console.log('📤 EvidenceUpload: Upload imediato concluído com sucesso');
            
          } else {
            throw new Error(apiUploadResult.error || 'Upload falhou');
          }

        } catch (uploadError) {
          console.warn('⚠️ EvidenceUpload: Falha no upload imediato:', uploadError);
          
          // Atualizar status para erro temporariamente
          await EvidenceStorageService.updateEvidenceStatus(
            evidenceMetadata.id,
            'error',
            undefined,
            uploadError instanceof Error ? uploadError.message : 'Erro no upload'
          );

          // 4. ADICIONAR À FILA SE CONFIGURADO
          if (options.addToQueue !== false) { // Default true
            if (options.onProgress) {
              options.onProgress('queue', 50);
            }

            await SyncQueueService.adicionarUploadEvidencia(
              evidenceMetadata.id,
              options.vistoriaId,
              options.token,
              options.priority || 2
            );
            
            uploadResult.status = 'queued';
            
            console.log('📋 EvidenceUpload: Adicionado à fila de sincronização');
            
            if (options.onProgress) {
              options.onProgress('queue', 100);
            }
          }
        }
      } else if (!navigator.onLine && (options.addToQueue !== false)) {
        // Offline - adicionar diretamente à fila
        if (options.onProgress) {
          options.onProgress('queue', 50);
        }

        await SyncQueueService.adicionarUploadEvidencia(
          evidenceMetadata.id,
          options.vistoriaId,
          options.token,
          options.priority || 2
        );
        
        uploadResult.status = 'queued';
        
        console.log('📱 EvidenceUpload: Offline - adicionado diretamente à fila');
        
        if (options.onProgress) {
          options.onProgress('queue', 100);
        }
      }

      const endTime = performance.now();
      
      console.log('🏁 EvidenceUpload: Processamento concluído', {
        tempo: `${(endTime - startTime).toFixed(0)}ms`,
        status: uploadResult.status,
        reducaoTamanho: compressionSavings > 0 ? `${compressionSavings}%` : 'N/A'
      });

      return uploadResult;

    } catch (error) {
      console.error('❌ EvidenceUpload: Erro no processamento:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (options.onError) {
        options.onError(errorMessage, 'storage');
      }

      return {
        success: false,
        status: 'error',
        error: errorMessage
      };
    }
  }

  /**
   * Processa múltiplas evidências em lote
   */
  static async processBatchEvidences(
    files: (File | Blob)[],
    baseOptions: Omit<EvidenceUploadOptions, 'onProgress' | 'onUploadStart' | 'onUploadComplete' | 'onError'>,
    onFileProgress?: (fileIndex: number, phase: UploadPhase, progress: number) => void,
    onFileComplete?: (fileIndex: number, result: EvidenceUploadResult) => void
  ): Promise<EvidenceUploadResult[]> {
    console.log('📦 EvidenceUpload: LOTE INICIADO', {
      quantidadeArquivos: files.length,
      tipo: baseOptions.tipoEvidencia
    });

    const results: EvidenceUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      console.log(`📁 EvidenceUpload: Processando arquivo ${i + 1}/${files.length}`);
      
      try {
        const fileOptions: EvidenceUploadOptions = {
          ...baseOptions,
          onProgress: onFileProgress ? (phase, progress) => onFileProgress(i, phase, progress) : undefined,
        };
        
        const result = await this.processEvidence(file, fileOptions);
        results.push(result);
        
        if (onFileComplete) {
          onFileComplete(i, result);
        }
        
      } catch (error) {
        console.error(`❌ EvidenceUpload: Erro no arquivo ${i + 1}:`, error);
        
        const errorResult: EvidenceUploadResult = {
          success: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
        
        results.push(errorResult);
        
        if (onFileComplete) {
          onFileComplete(i, errorResult);
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    console.log('🏁 EvidenceUpload: LOTE CONCLUÍDO', {
      sucessos: successCount,
      total: files.length,
      taxaSucesso: `${((successCount / files.length) * 100).toFixed(1)}%`
    });
    
    return results;
  }

  /**
   * Retry manual de uma evidência específica
   */
  static async retryEvidenceUpload(
    evidenceId: string,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      console.log(`🔄 EvidenceUpload: Retry manual da evidência ${evidenceId}`);
      
      // Buscar evidência no armazenamento
      const allEvidences = await EvidenceStorageService.getStorageStats();
      const evidence = allEvidences.naoSincronizadas.find(e => e.id === evidenceId);
      
      if (!evidence) {
        console.error('❌ EvidenceUpload: Evidência não encontrada para retry');
        return false;
      }
      
      // Atualizar status
      await EvidenceStorageService.updateEvidenceStatus(evidenceId, 'uploading');
      
      if (onProgress) onProgress(10);
      
      // Fazer fetch do blob
      const response = await fetch(evidence.urlLocal);
      
      if (!response.ok) {
        throw new Error(`Falha ao recuperar blob: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (onProgress) onProgress(30);
      
      // Fazer upload
      const uploadResult = await UploadService.uploadFile(blob, {
        tipo: 'evidencia',
        referencia: `${evidence.vistoriaId}_${evidence.itemId}_${evidence.tipoEvidencia}`,
        fileName: evidence.nomeOriginal,
        onProgress: (progress) => {
          if (onProgress) {
            onProgress(30 + (progress.percentage * 0.7)); // 30% a 100%
          }
        }
      });
      
      if (uploadResult.success && uploadResult.arquivo) {
        await EvidenceStorageService.updateEvidenceStatus(
          evidenceId,
          'synced',
          uploadResult.arquivo.url
        );
        
        console.log('✅ EvidenceUpload: Retry bem-sucedido');
        return true;
        
      } else {
        throw new Error(uploadResult.error || 'Upload falhou');
      }
      
    } catch (error) {
      console.error('❌ EvidenceUpload: Falha no retry:', error);
      
      await EvidenceStorageService.updateEvidenceStatus(
        evidenceId,
        'error',
        undefined,
        error instanceof Error ? error.message : 'Erro no retry'
      );
      
      return false;
    }
  }

  /**
   * Obtém estatísticas de upload para uma vistoria
   */
  static async getUploadStats(vistoriaId: string): Promise<{
    total: number;
    synced: number;
    pending: number;
    uploading: number;
    errors: number;
    totalSize: number;
    syncedSize: number;
    percentComplete: number;
  }> {
    const evidences = await EvidenceStorageService.getEvidencesByVistoria(vistoriaId);
    
    const stats = {
      total: evidences.length,
      synced: evidences.filter(e => e.status === 'synced').length,
      pending: evidences.filter(e => e.status === 'local').length,
      uploading: evidences.filter(e => e.status === 'uploading').length,
      errors: evidences.filter(e => e.status === 'error').length,
      totalSize: evidences.reduce((sum, e) => sum + e.tamanho, 0),
      syncedSize: evidences.filter(e => e.status === 'synced').reduce((sum, e) => sum + e.tamanho, 0),
      percentComplete: 0
    };
    
    stats.percentComplete = stats.total > 0 ? Math.round((stats.synced / stats.total) * 100) : 0;
    
    return stats;
  }

  /**
   * Força retry de todas as evidências com erro
   */
  static async retryAllFailedEvidences(
    vistoriaId: string,
    token: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number }> {
    const evidences = await EvidenceStorageService.getEvidencesByVistoria(vistoriaId);
    const failedEvidences = evidences.filter(e => e.status === 'error');
    
    console.log(`🔄 EvidenceUpload: Retry em lote - ${failedEvidences.length} evidências`);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < failedEvidences.length; i++) {
      const evidence = failedEvidences[i];
      
      if (onProgress) {
        onProgress(i + 1, failedEvidences.length);
      }
      
      const retrySuccess = await this.retryEvidenceUpload(evidence.id, token);
      
      if (retrySuccess) {
        success++;
      } else {
        failed++;
      }
      
      // Pequeno delay para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🏁 EvidenceUpload: Retry em lote concluído', { success, failed });
    
    return { success, failed };
  }
}