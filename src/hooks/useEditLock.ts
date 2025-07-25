import { useMemo } from 'react';
import { VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';

interface EditLockState {
  isLocked: boolean;
  reason: string | null;
  canEdit: boolean;
  lockType: 'completed' | 'synced' | 'approved' | 'none';
}

interface UseEditLockProps {
  vistoria?: VistoriaLocal | null;
  item?: any; // Para itens específicos
  allowedStatuses?: string[]; // Status que permitem edição
}

/**
 * Hook para gerenciar bloqueio de edição baseado no status da vistoria
 * 
 * @param vistoria - Dados da vistoria
 * @param item - Dados do item (opcional, para bloqueios específicos de item)
 * @param allowedStatuses - Status que permitem edição (padrão: ['pendente', 'em_andamento'])
 * @returns Estado do bloqueio de edição
 */
export function useEditLock({ 
  vistoria, 
  item, 
  allowedStatuses = ['pendente', 'em_andamento'] 
}: UseEditLockProps): EditLockState {
  
  return useMemo(() => {
    // Se não há vistoria, não pode editar
    if (!vistoria) {
      return {
        isLocked: true,
        reason: 'Dados da vistoria não carregados',
        canEdit: false,
        lockType: 'none'
      };
    }

    // Verificar se a vistoria foi aprovada (máximo nível de bloqueio)
    if (vistoria.status === 'aprovada') {
      return {
        isLocked: true,
        reason: 'Esta vistoria foi aprovada e não pode mais ser editada',
        canEdit: false,
        lockType: 'approved'
      };
    }

    // Verificar se a vistoria está concluída
    if (vistoria.status === 'concluida') {
      // Se está concluída e sincronizada, bloqueio mais restritivo
      if (vistoria.sincronizada) {
        return {
          isLocked: true,
          reason: 'Esta vistoria foi enviada para o servidor e não pode mais ser alterada',
          canEdit: false,
          lockType: 'synced'
        };
      } else {
        // Se está concluída mas não sincronizada, permitir edição limitada
        return {
          isLocked: true,
          reason: 'Esta vistoria está concluída. Edições podem causar inconsistências',
          canEdit: true, // Permitir edição com aviso
          lockType: 'completed'
        };
      }
    }

    // Verificar status da vistoria contra lista de status permitidos
    if (!allowedStatuses.includes(vistoria.status)) {
      return {
        isLocked: true,
        reason: `Vistoria com status "${vistoria.status}" não permite edição`,
        canEdit: false,
        lockType: 'none'
      };
    }

    // Verificar bloqueios específicos de item
    if (item) {
      // Se o item está concluído e vistoria está em andamento
      if (item.concluido && vistoria.status === 'em_andamento') {
        return {
          isLocked: true,
          reason: 'Este item foi marcado como concluído. Para editar, primeiro marque como não concluído',
          canEdit: true, // Permitir "desconcluir" e editar
          lockType: 'completed'
        };
      }

      // Se o item tem data de conclusão recente (últimos 5 minutos)
      if (item.dataConclusao) {
        const agora = new Date();
        const conclusao = new Date(item.dataConclusao);
        const diferencaMinutos = (agora.getTime() - conclusao.getTime()) / (1000 * 60);
        
        if (diferencaMinutos > 5) {
          return {
            isLocked: true,
            reason: 'Este item foi concluído há mais de 5 minutos. Confirme se deseja realmente editá-lo',
            canEdit: true, // Permitir com confirmação
            lockType: 'completed'
          };
        }
      }
    }

    // Nenhum bloqueio encontrado
    return {
      isLocked: false,
      reason: null,
      canEdit: true,
      lockType: 'none'
    };
  }, [vistoria, item, allowedStatuses]);
}

/**
 * Hook especializado para bloqueio de edição de vistoria completa
 */
export function useVistoriaEditLock(vistoria?: VistoriaLocal | null) {
  return useEditLock({ 
    vistoria, 
    allowedStatuses: ['pendente', 'em_andamento'] 
  });
}

/**
 * Hook especializado para bloqueio de edição de item
 */
export function useItemEditLock(vistoria?: VistoriaLocal | null, item?: any) {
  return useEditLock({ 
    vistoria, 
    item, 
    allowedStatuses: ['pendente', 'em_andamento'] 
  });
}

/**
 * Utilitário para exibir modal de confirmação de edição
 */
export function showEditConfirmation(reason: string): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: ${reason}\n\nDeseja continuar com a edição?`
    );
    resolve(confirmed);
  });
}

/**
 * Utilitário para exibir aviso de bloqueio
 */
export function showLockWarning(reason: string): void {
  alert(`🔒 EDIÇÃO BLOQUEADA: ${reason}`);
} 