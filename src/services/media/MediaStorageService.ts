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
 * Serviço para gerenciar armazenamento local de fotos e evidências
 *
 * Funcionalidades:
 * - Armazenamento de fotos no IndexedDB
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
   * Salvar foto no armazenamento local
   */
  async salvarFoto(
    vistoriaId: string,
    itemId: string,
    foto: MediaFile,
    compressionOptions?: Partial<MediaCompressionOptions>
  ): Promise<MediaStorageResult> {
    try {
      console.log('💾 [MEDIA-STORAGE] Salvando foto:', foto.id);

      // Comprimir imagem se necessário
      let fotoProcessada = foto;
      if (foto.tamanho > 500 * 1024) { // Se maior que 500KB
        console.log('🗜️ [MEDIA-STORAGE] Comprimindo imagem...');
        fotoProcessada = await this.compressImage(foto, {
          ...this.defaultCompressionOptions,
          ...compressionOptions
        });
      }

      // Preparar dados para armazenamento
      const mediaData = {
        ...fotoProcessada,
        vistoriaId,
        itemId,
        syncStatus: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Salvar no IndexedDB
      const result = await this.crudService.create(STORES.EVIDENCIAS, mediaData);

      if (result.success) {
        console.log('✅ [MEDIA-STORAGE] Foto salva com sucesso:', foto.id);
        return {
          success: true,
          data: result.data
        };
      } else {
        throw new Error(result.error || 'Erro ao salvar foto');
      }

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao salvar foto:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar foto'
      };
    }
  }

  /**
   * Buscar fotos de um item específico
   */
  async buscarFotosDoItem(vistoriaId: string, itemId: string): Promise<MediaStorageResult> {
    try {
      console.log('🔍 [MEDIA-STORAGE] Buscando fotos do item:', itemId);

      // Por enquanto, buscar todas e filtrar (implementação simples)
      const allResult = await this.crudService.getAll(STORES.EVIDENCIAS);
      
      if (!allResult.success || !allResult.data) {
        throw new Error(allResult.error || 'Erro ao buscar fotos');
      }

      const fotosItem = (allResult.data as any[]).filter(
        (foto: any) => foto.vistoriaId === vistoriaId && foto.itemId === itemId
      );

      const result = {
        success: true,
        data: fotosItem
      };

              console.log('✅ [MEDIA-STORAGE] Fotos encontradas:', result.data?.length || 0);
        return {
          success: true,
          data: result.data || []
        };

      } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao buscar fotos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar fotos'
      };
    }
  }

  /**
   * Buscar todas as fotos de uma vistoria
   */
  async buscarFotosDaVistoria(vistoriaId: string): Promise<MediaStorageResult> {
    try {
      console.log('🔍 [MEDIA-STORAGE] Buscando fotos da vistoria:', vistoriaId);

      // Buscar todas e filtrar por vistoriaId
      const allResult = await this.crudService.getAll(STORES.EVIDENCIAS);
      
      if (!allResult.success || !allResult.data) {
        throw new Error('Erro ao buscar fotos da vistoria');
      }

      const fotosVistoria = (allResult.data as any[]).filter(
        (foto: any) => foto.vistoriaId === vistoriaId
      );

      const result = {
        success: true,
        data: fotosVistoria
      };

              console.log('✅ [MEDIA-STORAGE] Fotos da vistoria encontradas:', result.data?.length || 0);
        return {
          success: true,
          data: result.data || []
        };

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao buscar fotos da vistoria:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar fotos'
      };
    }
  }

  /**
   * Remover foto
   */
  async removerFoto(fotoId: string): Promise<MediaStorageResult> {
    try {
      console.log('🗑️ [MEDIA-STORAGE] Removendo foto:', fotoId);

      const result = await this.crudService.delete(STORES.EVIDENCIAS, fotoId);

      if (result.success) {
        console.log('✅ [MEDIA-STORAGE] Foto removida com sucesso:', fotoId);
        return {
          success: true
        };
      } else {
        throw new Error(result.error || 'Erro ao remover foto');
      }

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro ao remover foto:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao remover foto'
      };
    }
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
   * Limpar fotos antigas (mais de X dias)
   */
  async limparFotosAntigas(diasAntigos: number = 30): Promise<{
    fotosRemovidas: number;
    espacoLiberado: number;
  }> {
    try {
      console.log(`🧹 [MEDIA-STORAGE] Limpando fotos com mais de ${diasAntigos} dias...`);

      const result = await this.crudService.getAll(STORES.EVIDENCIAS);
      
      if (!result.success || !result.data) {
        return { fotosRemovidas: 0, espacoLiberado: 0 };
      }

      const fotos = result.data as (MediaFile & { createdAt?: string })[];
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      let fotosRemovidas = 0;
      let espacoLiberado = 0;

      for (const foto of fotos) {
        const dataFoto = foto.createdAt ? new Date(foto.createdAt) : foto.timestamp;
        
        if (dataFoto < dataLimite) {
          const removeResult = await this.removerFoto(foto.id);
          if (removeResult.success) {
            fotosRemovidas++;
            espacoLiberado += foto.tamanho;
          }
        }
      }

      console.log(`✅ [MEDIA-STORAGE] Limpeza concluída: ${fotosRemovidas} fotos removidas, ${Math.round(espacoLiberado / 1024 / 1024 * 100) / 100}MB liberados`);

      return { fotosRemovidas, espacoLiberado };

    } catch (error) {
      console.error('❌ [MEDIA-STORAGE] Erro na limpeza:', error);
      return { fotosRemovidas: 0, espacoLiberado: 0 };
    }
  }

  /**
   * Marcar foto como sincronizada
   */
  async marcarComoSincronizada(fotoId: string, urlServidor: string): Promise<MediaStorageResult> {
    try {
      const result = await this.crudService.findBy(STORES.EVIDENCIAS, { field: 'id', value: fotoId });
      
              if (!result.success || !result.data || result.data.length === 0) {
          throw new Error('Foto não encontrada');
        }

        const foto = result.data[0] as any;
        const fotoAtualizada = {
          ...foto,
          url: urlServidor,
          syncStatus: 'synced' as const,
          updatedAt: new Date().toISOString()
        };

        const updateResult = await this.crudService.update(STORES.EVIDENCIAS, fotoAtualizada);

        if (updateResult.success) {
          console.log('✅ [MEDIA-STORAGE] Foto marcada como sincronizada:', fotoId);
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
} 