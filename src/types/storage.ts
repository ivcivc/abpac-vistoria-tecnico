// Tipos base para o armazenamento local do Sistema de Vistoria ABPAC

export interface Vistoria {
  id: string;
  token: string;
  tecnico: {
    nome: string;
    identificacao: string;
  };
  veiculo: {
    placa: string;
    modelo: string;
    cor: string;
    ano: number;
  };
  local: string;
  dataAgendada: Date;
  dataConclusao?: Date;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'aprovada' | 'rejeitada';
  sincronizada: boolean;
  ultimaSincronizacao?: Date;
  observacoes: string;
  progresso: number; // Calculado baseado nos itens concluídos
  itens: VistoriaItem[];
}

export interface VistoriaItem {
  id: string;
  estoque_remessa_id?: number; // ID do backend
  vistoriaId: string;
  tipo: string;
  categoria: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  numeroSerieNovo?: string; // Para substituições
  status: 'pendente' | 'concluido' | 'problema';
  acao: 'verificar' | 'instalar' | 'substituir' | 'remover';
  observacoes: string;
  localInstalacao?: string;
  evidencias: Evidencia[];
  despesas: Despesa[];
  concluido: boolean;
  dataConclusao?: Date;
}

export interface Evidencia {
  id: string;
  itemId: string;
  tipo: 'foto' | 'video';
  url: string;
  localUrl: string; // URL local para uso offline
  tamanho: number; // Em bytes
  timestamp: Date;
  descricao: string;
  tipoEvidencia: 'numero_serie' | 'local_instalacao' | 'outro';
  geolocalizacao?: {
    latitude: number;
    longitude: number;
    precisao: number;
  };
}

export interface Despesa {
  id: string;
  itemId: string;
  vistoriaId: string;
  categoria: 'combustivel' | 'alimentacao' | 'hospedagem' | 'outro';
  valor: number;
  descricao: string;
  comprovante?: Evidencia;
  timestamp: Date;
  aprovada?: boolean;
}

export interface OfflineOperation {
  id: string;
  tipo: 'create' | 'update' | 'delete';
  entidade: 'vistoria' | 'item' | 'evidencia' | 'despesa';
  dados: any;
  prioridade: 'alta' | 'media' | 'baixa';
  timestamp: Date;
  tentativas: number;
  ultimaTentativa?: Date;
  erro?: string;
}

export interface ConfigLocal {
  id: string;
  chave: string;
  valor: any;
  timestamp: Date;
}

// Tipos para operações de armazenamento
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StorageQuery {
  field: string;
  value: any;
  operator?: 'equals' | 'contains' | 'greater' | 'less';
}

// Tipos para stores do IndexedDB
export interface DatabaseStore {
  name: string;
  keyPath: string;
  indexes?: {
    name: string;
    keyPath: string;
    unique?: boolean;
  }[];
}

// Constantes para nomes das stores
export const STORES = {
  VISTORIAS: 'vistorias',
  VISTORIAS_LOCAIS: 'vistorias-locais', // Histórico de vistorias acessadas neste navegador
  ITENS: 'itens',
  EVIDENCIAS: 'evidencias',
  DESPESAS: 'despesas',
  SYNC_QUEUE: 'sync-queue',
  CONFIG: 'config',
} as const;

export type StoreNames = (typeof STORES)[keyof typeof STORES];
