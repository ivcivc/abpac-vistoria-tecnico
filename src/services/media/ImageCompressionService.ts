/**
 * Serviço de Compressão de Imagens - Mobile-First
 * Task 4.3 - Sistema inteligente de compressão para técnicos em campo
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  preserveExif?: boolean;
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export class ImageCompressionService {
  // Presets mobile-friendly para diferentes cenários
  static readonly PRESETS = {
    // Para campo com conexão 2G/3G limitada
    FIELD_LOW: {
      maxWidth: 1280,
      maxHeight: 720,
      quality: 0.6,
      format: 'jpeg' as const
    },
    
    // Para campo com 4G
    FIELD_STANDARD: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'jpeg' as const
    },
    
    // Para evidências críticas (número de série)
    HIGH_DETAIL: {
      maxWidth: 2560,
      maxHeight: 1440,
      quality: 0.9,
      format: 'jpeg' as const
    },
    
    // Para documentos/textos
    DOCUMENT: {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.95,
      format: 'jpeg' as const
    }
  };

  /**
   * Detecta automaticamente o melhor preset baseado na conectividade
   */
  static getAutoPreset(): CompressionOptions {
    // Detectar velocidade da conexão
    const connection = (navigator as any).connection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return this.PRESETS.FIELD_LOW;
        case '3g':
          return this.PRESETS.FIELD_STANDARD;
        case '4g':
        default:
          return this.PRESETS.FIELD_STANDARD;
      }
    }
    
    // Fallback padrão
    return this.PRESETS.FIELD_STANDARD;
  }

  /**
   * Comprime uma imagem usando canvas
   */
  static async compressImage(
    file: File | Blob,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const startTime = performance.now();
    
    console.log('🗜️ ImageCompression: INICIANDO', {
      tamanhoOriginal: file.size,
      tipo: file.type,
      opcoes: options
    });

    // Usar preset automático se não especificado
    const config = {
      ...this.getAutoPreset(),
      ...options
    };

    const originalSize = file.size;

    // Criar URL para a imagem
    const imageUrl = URL.createObjectURL(file);
    
    try {
      // Carregar imagem
      const img = await this.loadImage(imageUrl);
      
      // Calcular dimensões finais
      const { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        config.maxWidth || 1920,
        config.maxHeight || 1080
      );

      // Comprimir usando canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = width;
      canvas.height = height;

      // Configurar qualidade do canvas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converter para blob
      const blob = await this.canvasToBlob(canvas, config.format!, config.quality!);
      
      const compressedSize = blob.size;
      const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
      
      const endTime = performance.now();
      
      console.log('✅ ImageCompression: CONCLUÍDA', {
        tamanhoOriginal: `${(originalSize / 1024).toFixed(1)}KB`,
        tamanhoComprimido: `${(compressedSize / 1024).toFixed(1)}KB`,
        reducao: `${compressionRatio}%`,
        dimensoes: `${width}x${height}`,
        tempo: `${(endTime - startTime).toFixed(0)}ms`
      });

      return {
        blob,
        originalSize,
        compressedSize,
        compressionRatio,
        format: config.format!,
        dimensions: { width, height }
      };

    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  /**
   * Comprime múltiplas imagens em lote
   */
  static async compressBatch(
    files: (File | Blob)[],
    options: CompressionOptions = {},
    onProgress?: (index: number, result: CompressionResult) => void
  ): Promise<CompressionResult[]> {
    console.log('📦 ImageCompression: LOTE INICIADO', {
      quantidadeArquivos: files.length,
      opcoes: options
    });

    const results: CompressionResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await this.compressImage(file, options);
        results.push(result);
        
        if (onProgress) {
          onProgress(i, result);
        }
        
      } catch (error) {
        console.error(`❌ ImageCompression: Erro no arquivo ${i + 1}:`, error);
        // Continuar com outros arquivos mesmo se um falhar
      }
    }
    
    console.log('🏁 ImageCompression: LOTE CONCLUÍDO', {
      processados: results.length,
      total: files.length
    });
    
    return results;
  }

  /**
   * Carrega uma imagem via Promise
   */
  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Calcula dimensões mantendo aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    // Reduzir se necessário
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Converte canvas para blob
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Falha na conversão do canvas para blob'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Estima o tamanho final antes da compressão
   */
  static estimateSize(
    originalSize: number,
    options: CompressionOptions = {}
  ): number {
    const config = { ...this.getAutoPreset(), ...options };
    
    // Estimativa baseada na qualidade
    const qualityFactor = config.quality || 0.8;
    const estimatedSize = originalSize * qualityFactor * 0.7; // Factor empírico
    
    return Math.round(estimatedSize);
  }

  /**
   * Verifica se uma imagem precisa ser comprimida
   */
  static needsCompression(
    file: File | Blob,
    maxSize: number = 2 * 1024 * 1024 // 2MB
  ): boolean {
    return file.size > maxSize || 
           !file.type.includes('image/') ||
           file.type === 'image/bmp' ||
           file.type === 'image/tiff';
  }

  /**
   * Obtém informações detalhadas de uma imagem
   */
  static async getImageInfo(file: File | Blob): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
    aspectRatio: number;
  }> {
    const imageUrl = URL.createObjectURL(file);
    
    try {
      const img = await this.loadImage(imageUrl);
      
      return {
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        aspectRatio: img.width / img.height
      };
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }
}