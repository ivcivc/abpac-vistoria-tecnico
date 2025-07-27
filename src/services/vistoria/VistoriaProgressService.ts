import { LocalVistoriaService } from './LocalVistoriaService';

export interface ProgressoVistoria {
  percentualConclusao: number;
  itensConcluidos: number;
  itensComProblema: number;
  itensPendentes: number;
  totalItens: number;
  ultimaAtualizacao: string;
}

export class VistoriaProgressService {
  private localService: LocalVistoriaService;

  constructor() {
    this.localService = new LocalVistoriaService();
  }

  /**
   * Calcula o progresso de uma vistoria baseado nos seus itens
   */
  async calcularProgresso(vistoriaId: string): Promise<{ success: boolean; progresso?: ProgressoVistoria; error?: string }> {
    try {
      console.log(`📊 [VistoriaProgressService] Calculando progresso para vistoria ${vistoriaId}`);
      
      const result = await this.localService.obterVistoriaPorId(vistoriaId);
      
      if (!result.success || !result.data) {
        return { success: false, error: 'Vistoria não encontrada' };
      }

      const vistoria = result.data;
      const itens = vistoria.itens || [];
      
      if (itens.length === 0) {
        return {
          success: true,
          progresso: {
            percentualConclusao: 0,
            itensConcluidos: 0,
            itensComProblema: 0,
            itensPendentes: 0,
            totalItens: 0,
            ultimaAtualizacao: new Date().toISOString()
          }
        };
      }

      // Calcular estatísticas
      let concluidos = 0;
      let problemas = 0;
      let pendentes = 0;

      itens.forEach((item: any) => {
        const status = item.status?.toUpperCase();
        
        switch (status) {
          case 'CONCLUIDO':
          case 'APROVADO':
            concluidos++;
            break;
          case 'PROBLEMA':
          case 'REPROVADO':
          case 'REJEITADO':
            problemas++;
            break;
          default:
            pendentes++;
            break;
        }
      });

      const totalItens = itens.length;
      const percentualConclusao = Math.round((concluidos / totalItens) * 100);

      const progresso: ProgressoVistoria = {
        percentualConclusao,
        itensConcluidos: concluidos,
        itensComProblema: problemas,
        itensPendentes: pendentes,
        totalItens,
        ultimaAtualizacao: new Date().toISOString()
      };

      console.log(`✅ [VistoriaProgressService] Progresso calculado:`, progresso);
      
      return { success: true, progresso };

    } catch (error) {
      console.error('💥 [VistoriaProgressService] Erro ao calcular progresso:', error);
      return { success: false, error: `Erro inesperado: ${error}` };
    }
  }

  /**
   * Atualiza o progresso de uma vistoria e salva no armazenamento local
   */
  async atualizarProgressoVistoria(vistoriaId: string): Promise<{ success: boolean; progresso?: ProgressoVistoria; error?: string }> {
    try {
      console.log(`🔄 [VistoriaProgressService] Atualizando progresso da vistoria ${vistoriaId}`);
      
      // Calcular novo progresso
      const progressoResult = await this.calcularProgresso(vistoriaId);
      
      if (!progressoResult.success || !progressoResult.progresso) {
        return progressoResult;
      }

      // Obter vistoria atual
      const vistoriaResult = await this.localService.obterVistoriaPorId(vistoriaId);
      
      if (!vistoriaResult.success || !vistoriaResult.data) {
        return { success: false, error: 'Vistoria não encontrada para atualização' };
      }

      // Atualizar vistoria com novo progresso
      const vistoriaAtualizada = {
        ...vistoriaResult.data,
        progresso: progressoResult.progresso,
        ultimaAtualizacao: new Date().toISOString()
      };

      // Salvar no armazenamento local usando o CRUDService
      const crudService = (this.localService as any).crudService;
      const updateResult = await crudService.update(
        'VISTORIAS_LOCAIS',
        vistoriaAtualizada
      );

      if (!updateResult.success) {
        return { success: false, error: 'Erro ao salvar progresso atualizado' };
      }

      console.log(`✅ [VistoriaProgressService] Progresso atualizado e salvo com sucesso`);
      
      return { success: true, progresso: progressoResult.progresso };

    } catch (error) {
      console.error('💥 [VistoriaProgressService] Erro ao atualizar progresso:', error);
      return { success: false, error: `Erro inesperado: ${error}` };
    }
  }

  /**
   * Obtém apenas o progresso de uma vistoria sem recalcular
   */
  async obterProgresso(vistoriaId: string): Promise<{ success: boolean; progresso?: ProgressoVistoria; error?: string }> {
    try {
      const result = await this.localService.obterVistoriaPorId(vistoriaId);
      
      if (!result.success || !result.data) {
        return { success: false, error: 'Vistoria não encontrada' };
      }

      // Se não há progresso salvo, calcular
      if (typeof result.data.progresso !== 'object' || !result.data.progresso) {
        return await this.calcularProgresso(vistoriaId);
      }

      return { success: true, progresso: result.data.progresso as ProgressoVistoria };

    } catch (error) {
      console.error('💥 [VistoriaProgressService] Erro ao obter progresso:', error);
      return { success: false, error: `Erro inesperado: ${error}` };
    }
  }
} 