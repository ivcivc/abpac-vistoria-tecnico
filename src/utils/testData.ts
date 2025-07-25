import { v4 as uuidv4 } from 'uuid';
import { VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { VistoriaItem, Evidencia, Despesa } from '@/types/storage';

/**
 * Gera uma vistoria de teste completa para testar o fluxo de conclusão
 */
export function generateTestVistoria(): VistoriaLocal {
  const vistoriaId = uuidv4();
  
  // Gerar itens
  const itens = [
    generateTestItem(vistoriaId, 'Rastreador', 'verificar'),
    generateTestItem(vistoriaId, 'Bloqueador', 'instalar'),
    generateTestItem(vistoriaId, 'Sensor', 'substituir')
  ];
  
  // Marcar alguns itens como concluídos
  itens[0].concluido = true;
  itens[0].status = 'concluido';
  itens[0].dataConclusao = new Date();
  
  // Vistoria com progresso parcial
  return {
    id: vistoriaId,
    token: `TOKEN-${vistoriaId.substring(0, 8)}`,
    local: 'Oficina Teste - São Paulo',
    dataAgendada: new Date().toISOString(),
    dataAcesso: new Date().toISOString(),
    tipoVistoria: 'Instalação',
    tecnicoNome: 'Técnico de Teste',
    status: 'em_andamento',
    sincronizada: false,
    veiculo: {
      placa: 'ABC1234',
      modelo: 'Fiat Uno',
      cor: 'Branco',
      ano: 2020
    },
    nomeEquipamento: 'Kit Rastreamento Completo',
    itens: itens,
    progresso: 33 // Um item de três concluído
  };
}

/**
 * Gera um item de teste para a vistoria
 */
function generateTestItem(
  vistoriaId: string, 
  tipo: string, 
  acao: 'verificar' | 'instalar' | 'substituir' | 'remover'
): VistoriaItem {
  const itemId = uuidv4();
  
  // Gerar evidências
  const evidencias = [
    generateTestEvidencia(itemId, 'numero_serie'),
    generateTestEvidencia(itemId, 'local_instalacao'),
    generateTestEvidencia(itemId, 'outro')
  ];
  
  // Gerar despesas
  const despesas = [
    generateTestDespesa(itemId, vistoriaId, 'SERVICO'),
    generateTestDespesa(itemId, vistoriaId, 'MATERIAL')
  ];
  
  return {
    id: itemId,
    estoque_remessa_id: Math.floor(Math.random() * 10000),
    vistoriaId,
    tipo,
    categoria: 'Categoria Teste',
    fabricante: 'Fabricante Teste',
    modelo: `Modelo ${tipo}`,
    numeroSerie: `SN-${Math.floor(Math.random() * 1000000)}`,
    status: 'pendente',
    acao,
    observacoes: 'Observações de teste para o item',
    localInstalacao: acao !== 'verificar' ? 'Painel do veículo' : undefined,
    evidencias,
    despesas,
    concluido: false
  };
}

/**
 * Gera uma evidência de teste
 */
function generateTestEvidencia(
  itemId: string, 
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outro'
): Evidencia {
  return {
    id: uuidv4(),
    itemId,
    tipo: Math.random() > 0.3 ? 'foto' : 'video',
    url: `https://example.com/fake-image-${tipoEvidencia}.jpg`,
    localUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`,
    tamanho: 1024 * 10, // 10KB
    timestamp: new Date(),
    descricao: `Evidência de ${tipoEvidencia}`,
    tipoEvidencia,
    geolocalizacao: {
      latitude: -23.550520,
      longitude: -46.633308,
      precisao: 10
    }
  };
}

/**
 * Gera uma despesa de teste
 */
function generateTestDespesa(
  itemId: string,
  vistoriaId: string,
  tipo: 'SERVICO' | 'MATERIAL' | 'DESLOCAMENTO' | 'OUTROS'
): Despesa {
  const valor = tipo === 'SERVICO' ? 150 : 
                tipo === 'MATERIAL' ? 75 : 
                tipo === 'DESLOCAMENTO' ? 50 : 25;
  
  return {
    id: uuidv4(),
    itemId,
    vistoriaId,
    tipo,
    valor,
    descricao: `Despesa de ${tipo.toLowerCase()} para o item`,
    timestamp: new Date(),
    aprovada: Math.random() > 0.5
  };
}

/**
 * Popula o banco de dados local com dados de teste
 */
export async function populateTestData(localVistoriaService: any): Promise<string> {
  const testVistoria = generateTestVistoria();
  
  try {
    // Adicionar a vistoria ao armazenamento local
    await localVistoriaService.adicionarVistoriaAcessada(
      testVistoria.token,
      testVistoria,
      testVistoria.tecnicoNome || 'Técnico de Teste'
    );
    
    console.log('✅ Dados de teste populados com sucesso!');
    return testVistoria.id;
  } catch (error) {
    console.error('❌ Erro ao popular dados de teste:', error);
    throw error;
  }
} 