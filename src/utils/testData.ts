import { v4 as uuidv4 } from 'uuid';
import { LocalVistoriaService, VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { VistoriaItem, Evidencia, Despesa } from '@/types/storage';

/**
 * ATENÇÃO: Funções de geração de dados de teste REMOVIDAS
 * 
 * Motivo: Os dados criados artificialmente não seguem a estrutura real do backend:
 * - Backend usa categoria/fabricante como OBJETOS (com descricao/nome)
 * - Backend usa 'fotos_videos' não 'evidencias'
 * - Backend não tem campo 'modelo' diretamente
 * 
 * Para teste, use apenas dados reais vindos do backend (como ID 2).
 */

console.warn('⚠️ [testData.ts] Funções de criação de dados fake foram REMOVIDAS.');
console.warn('⚠️ Use apenas dados reais vindos do backend para teste.');

// Função vazia para não quebrar imports existentes
export function generateTestVistoria(): never {
  throw new Error('❌ Função removida! Use dados reais do backend para teste.');
}

export async function populateTestData(localVistoriaService: any): Promise<never> {
  throw new Error('❌ Função removida! Use dados reais do backend para teste.');
} 