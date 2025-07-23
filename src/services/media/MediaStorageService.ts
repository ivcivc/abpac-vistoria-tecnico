import { CRUDService } from '@/services/storage/CRUDService';
import { STORES } from '@/types/storage';
import { MediaFile } from '@/components/media/MediaCapture';

export interface MediaStorageResult {
  success: boolean;
  data?: MediaFile | MediaFile[];
  error?: string;
}

export interface MediaCompressionOptions {
  quality: number; // 0.1 a 1.0
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'webp';
}

/**
 * Serviço para gerenciar armazenamento local de mídia (fotos e vídeos)
 *
 * Funcionalidades:
 * - Armazenamento de fotos e vídeos no IndexedDB
 * - Compressão automática de imagens
 * - Gerenciamento de metadados
 * - Limpeza de arquivos antigos
 */
export class MediaStorageService {
  private crudService: CRUDService;
  private defaultCompressionOptions: MediaCompressionOptions = {
    quality: 0.8,
    maxWidth: 1280,
    maxHeight: 1280,
    format: 'jpeg'
  };

  constructor() {
    this.crudService = new CRUDService();
  }

  /**
   * Salvar mídia (foto ou vídeo) no armazenamento local
   */
  async salvarMidia(
    vistoriaId: string,
    itemId: string,
    media: MediaFile,
    compressionOptions?: Partial<MediaCompressionOptions>
  ): Promise<MediaStorageResult> {
    try {
      console.log(`💾 [MEDIA-STORAGE] Salvando ${media.tipo}:`, media.id);

      // Comprimir apenas imagens (fotos)
      let mediaProcessada = media;
      if (media.tipo === 'foto' && media.tamanho > 500 * 1024) { // Se maior que 500KB
        console.log('🗜️ [MEDIA-STORAGE] Comprimindo imagem...');
        mediaProcessada = await this.compressImage(media, {
          ...this.defaultCompressionOptions,
          ...compressionOptions
        });
      }

      // Para vídeos, apenas armazenar (compressão já foi feita no componente)
      if (media.tipo === 'video') {
        console.log(`🎥 [MEDIA-STORAGE] Armazenando vídeo de ${Math.round(media.tamanho / 1024 / 1024 * 100) / 100}MB`);
      }

      // Preparar dados para armazenamento
      const mediaData = {
        ...mediaProcessada,
        vistoriaId,
        itemId,
        syncStatus: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Salvar no IndexedDB
      const result = await this.crudService.create(STORES.EVIDENCIAS, mediaData);

      if (result.success) {
        console.log(`✅ [MEDIA-STORAGE] ${media.tipo} salvo com sucesso:`, media.id);
        return {
          success: true,
          data: result.data
        };
      } else {
        throw new Error(result.error || `Erro ao salvar ${media.tipo}`);
      }

    } catch (error) {
      console.error(`❌ [MEDIA-STORAGE] Erro ao salvar ${media.tipo}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Erro desconhecido ao salvar ${media.tipo}`
      };
    }
  }

  /**
   * Salvar foto no armazenamento local (método específico mantido para compatibilidade)
   */
  async salvarFoto(
    vistoriaId: string,
    itemId: string,
    foto: MediaFile,
    compressionOptions?: Partial<MediaCompressionOptions>
  ): Promise<MediaStorageResult> {
    // Usar método genérico para manter compatibilidade
    return this.salvarMidia(vistoriaId, itemId, foto, compressionOptions);
  }

  /**
   * Salvar vídeo no armazenamento local
   */
  async salvarVideo(
    vistoriaId: string,
    itemId: string,
    video: MediaFile
  ): Promise<MediaStorageResult> {
    // Usar método genérico para vídeos
    return this.salvarMidia(vistoriaId, itemId, video);
  }

  /**
   * Buscar mídia (fotos e vídeos) de um item específico
   */
  async buscarMidiaDoItem(vistoriaId: string, itemId: string): Promise<MediaStorageResult> {
    try {
      console.log('🔍 [MEDIA-STORAGE] Buscando mídia do item:', itemId);

      // Buscar todas e filtrar por vistoriaId e itemId
      const allResult = await this.crudService.getAll(STORES.EVIDENCIAS);
      
      if (!allResult.success || !allResult.data) {
        throw new Error(allResult.error || 'Erro ao buscar mídia');
      }

      const midiaItem = (allResult.data as any[]).filter(
        (media: any) => media.vistoriaId === vistoriaId && media.itemId === itemId
      );

      console.log(`✅ [MEDIA-STORAGE] Mídia encontrada:`, midiaItem.length, 'arquivos');
      return {
        success: true,
        data: midiaItem || []
      };

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao buscar mídia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar mídia'
      };
    }
  }

  /**
   * Buscar fotos de um item específico (mantido para compatibilidade)
   */
  async buscarFotosDoItem(vistoriaId: string, itemId: string): Promise<MediaStorageResult> {
    try {
      const result = await this.buscarMidiaDoItem(vistoriaId, itemId);
      
      if (result.success && result.data) {
        // Filtrar apenas fotos
        const fotos = (result.data as any[]).filter((media: any) => media.tipo === 'foto');
        console.log('✅ [MEDIA-STORAGE] Fotos encontradas:', fotos.length);
        return {
          success: true,
          data: fotos
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao buscar fotos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar fotos'
      };
    }
  }

  /**
   * Buscar vídeos de um item específico
   */
  async buscarVideosDoItem(vistoriaId: string, itemId: string): Promise<MediaStorageResult> {
    try {
      const result = await this.buscarMidiaDoItem(vistoriaId, itemId);
      
      if (result.success && result.data) {
        // Filtrar apenas vídeos
        const videos = (result.data as any[]).filter((media: any) => media.tipo === 'video');
        console.log('✅ [MEDIA-STORAGE] Vídeos encontrados:', videos.length);
        return {
          success: true,
          data: videos
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao buscar vídeos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar vídeos'
      };
    }
  }

  /**
   * Buscar toda mídia de uma vistoria
   */
  async buscarMidiaDaVistoria(vistoriaId: string): Promise<MediaStorageResult> {
    try {
      console.log('🔍 [MEDIA-STORAGE] Buscando mídia da vistoria:', vistoriaId);

      // Buscar todas e filtrar por vistoriaId
      const allResult = await this.crudService.getAll(STORES.EVIDENCIAS);
      
      if (!allResult.success || !allResult.data) {
        throw new Error('Erro ao buscar mídia da vistoria');
      }

      const midiaVistoria = (allResult.data as any[]).filter(
        (media: any) => media.vistoriaId === vistoriaId
      );

      console.log(`✅ [MEDIA-STORAGE] Mídia da vistoria encontrada:`, midiaVistoria.length, 'arquivos');
      return {
        success: true,
        data: midiaVistoria || []
      };

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao buscar mídia da vistoria:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar mídia'
      };
    }
  }

  /**
   * Buscar todas as fotos de uma vistoria
   */
  async buscarFotosDaVistoria(vistoriaId: string): Promise<MediaStorageResult> {
    try {
      const result = await this.buscarMidiaDaVistoria(vistoriaId);
      
      if (result.success && result.data) {
        // Filtrar apenas fotos
        const fotos = (result.data as any[]).filter((media: any) => media.tipo === 'foto');
        console.log('✅ [MEDIA-STORAGE] Fotos da vistoria encontradas:', fotos.length);
        return {
          success: true,
          data: fotos
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao buscar fotos da vistoria:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar fotos'
      };
    }
  }

  /**
   * Buscar todos os vídeos de uma vistoria
   */
  async buscarVideosDaVistoria(vistoriaId: string): Promise<MediaStorageResult> {
    try {
      const result = await this.buscarMidiaDaVistoria(vistoriaId);
      
      if (result.success && result.data) {
        // Filtrar apenas vídeos
        const videos = (result.data as any[]).filter((media: any) => media.tipo === 'video');
        console.log('✅ [MEDIA-STORAGE] Vídeos da vistoria encontrados:', videos.length);
        return {
          success: true,
          data: videos
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao buscar vídeos da vistoria:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar vídeos'
      };
    }
  }

  /**
   * Remover mídia (foto ou vídeo)
   */
  async removerMidia(midiaId: string): Promise<MediaStorageResult> {
    try {
      console.log('🗑️ [MEDIA-STORAGE] Removendo mídia:', midiaId);

      const result = await this.crudService.delete(STORES.EVIDENCIAS, midiaId);

      if (result.success) {
        console.log('✅ [MEDIA-STORAGE] Mídia removida com sucesso:', midiaId);
        return {
          success: true
        };
      } else {
        throw new Error(result.error || 'Erro ao remover mídia');
      }

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao remover mídia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao remover mídia'
      };
    }
  }

  /**
   * Remover foto (mantido para compatibilidade)
   */
  async removerFoto(fotoId: string): Promise<MediaStorageResult> {
    return this.removerMidia(fotoId);
  }

  /**
   * Remover vídeo
   */
  async removerVideo(videoId: string): Promise<MediaStorageResult> {
    return this.removerMidia(videoId);
  }

  /**
   * Comprimir imagem
   */
  private async compressImage(
    foto: MediaFile,
    options: MediaCompressionOptions
  ): Promise<MediaFile> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calcular novas dimensões mantendo aspect ratio
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > options.maxWidth) {
            width = options.maxWidth;
            height = width / aspectRatio;
          }

          if (height > options.maxHeight) {
            height = options.maxHeight;
            width = height * aspectRatio;
          }

          // Criar canvas para redimensionamento
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Erro ao obter contexto do canvas'));
            return;
          }

          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Converter para blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erro ao comprimir imagem'));
                return;
              }

              // Criar nova URL
              const newLocalUrl = URL.createObjectURL(blob);

              // Retornar foto comprimida
              resolve({
                ...foto,
                localUrl: newLocalUrl,
                url: newLocalUrl,
                tamanho: blob.size,
                nomeArquivo: foto.nomeArquivo.replace(/\.(jpg|jpeg|png)$/i, '.jpg')
              });
            },
            `image/${options.format}`,
            options.quality
          );

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem para compressão'));
      };

      img.src = foto.localUrl;
    });
  }

  /**
   * Obter estatísticas de armazenamento
   */
  async obterEstatisticas(): Promise<{
    totalFotos: number;
    tamanhoTotal: number;
    fotosPendentesSync: number;
  }> {
    try {
      const result = await this.crudService.getAll(STORES.EVIDENCIAS);
      
      if (!result.success || !result.data) {
        return {
          totalFotos: 0,
          tamanhoTotal: 0,
          fotosPendentesSync: 0
        };
      }

      const fotos = result.data as (MediaFile & { syncStatus?: string })[];
      
      return {
        totalFotos: fotos.length,
        tamanhoTotal: fotos.reduce((total, foto) => total + foto.tamanho, 0),
        fotosPendentesSync: fotos.filter(foto => foto.syncStatus === 'pending').length
      };

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao obter estatísticas:', error);
      return {
        totalFotos: 0,
        tamanhoTotal: 0,
        fotosPendentesSync: 0
      };
    }
  }

  /**
   * Limpar mídia antiga (mais de X dias)
   */
  async limparMidiaAntiga(diasAntigos: number = 30): Promise<{
    midiaRemovida: number;
    espacoLiberado: number;
  }> {
    try {
      console.log(`🧹 [MEDIA-STORAGE] Limpando mídia com mais de ${diasAntigos} dias...`);

      const result = await this.crudService.getAll(STORES.EVIDENCIAS);
      
      if (!result.success || !result.data) {
        return { midiaRemovida: 0, espacoLiberado: 0 };
      }

      const midias = result.data as (MediaFile & { createdAt?: string })[];
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      let midiaRemovida = 0;
      let espacoLiberado = 0;

      for (const midia of midias) {
        const dataMidia = midia.createdAt ? new Date(midia.createdAt) : midia.timestamp;
        
        if (dataMidia < dataLimite) {
          const removeResult = await this.removerMidia(midia.id);
          if (removeResult.success) {
            midiaRemovida++;
            espacoLiberado += midia.tamanho;
          }
        }
      }

      console.log(`✅ [MEDIA-STORAGE] Limpeza concluída: ${midiaRemovida} arquivos removidos, ${Math.round(espacoLiberado / 1024 / 1024 * 100) / 100}MB liberados`);

      return { midiaRemovida, espacoLiberado };

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro na limpeza:', error);
      return { midiaRemovida: 0, espacoLiberado: 0 };
    }
  }

  /**
   * Limpar fotos antigas (mantido para compatibilidade)
   */
  async limparFotosAntigas(diasAntigos: number = 30): Promise<{
    fotosRemovidas: number;
    espacoLiberado: number;
  }> {
    const result = await this.limparMidiaAntiga(diasAntigos);
    return {
      fotosRemovidas: result.midiaRemovida,
      espacoLiberado: result.espacoLiberado
    };
  }

  /**
   * Marcar mídia como sincronizada
   */
  async marcarComoSincronizada(midiaId: string, urlServidor: string): Promise<MediaStorageResult> {
    try {
      const result = await this.crudService.findBy(STORES.EVIDENCIAS, { field: 'id', value: midiaId });
      
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error('Mídia não encontrada');
      }

      const midia = result.data[0] as any;
      const midiaAtualizada = {
        ...midia,
        url: urlServidor,
        syncStatus: 'synced' as const,
        updatedAt: new Date().toISOString()
      };

      const updateResult = await this.crudService.update(STORES.EVIDENCIAS, midiaAtualizada);

      if (updateResult.success) {
        console.log('✅ [MEDIA-STORAGE] Mídia marcada como sincronizada:', midiaId);
        return {
          success: true,
          data: updateResult.data as MediaFile
        };
      } else {
        throw new Error('Erro ao atualizar status de sincronização');
      }

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao marcar como sincronizada:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Marcar foto como sincronizada (mantido para compatibilidade)
   */
  async marcarFotoComoSincronizada(fotoId: string, urlServidor: string): Promise<MediaStorageResult> {
    return this.marcarComoSincronizada(fotoId, urlServidor);
  }
}