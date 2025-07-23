import { CRUDService } from '../CRUDService';
import { IndexedDBService } from '../IndexedDBService';
import { STORES } from '@/types/storage';

describe('CRUDService', () => {
  let crudService: CRUDService;
  let indexedDBService: IndexedDBService;

  const sampleVistoria = {
    id: 'vistoria-1',
    token: 'test-token',
    tecnico: {
      nome: 'João Silva',
      identificacao: 'TEC001',
    },
    veiculo: {
      placa: 'ABC-1234',
      modelo: 'Honda Civic',
      cor: 'Branco',
      ano: 2023,
    },
    local: 'Rua das Flores, 123',
    dataAgendada: new Date('2024-01-15'),
    status: 'pendente' as const,
    sincronizada: false,
    observacoes: 'Vistoria de rotina',
    progresso: 0,
    itens: [],
  };

  beforeEach(async () => {
    crudService = new CRUDService();
    indexedDBService = IndexedDBService.getInstance();

    // Resetar instância
    (IndexedDBService as any).instance = null;
    indexedDBService = IndexedDBService.getInstance();
    crudService = new CRUDService();

    await indexedDBService.initialize();
  });

  afterEach(() => {
    indexedDBService.close();
  });

  describe('Create Operation', () => {
    it('deve criar um novo registro com sucesso', async () => {
      const result = await crudService.create(STORES.VISTORIAS, sampleVistoria);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(sampleVistoria.id);
      expect(result.data).toHaveProperty('createdAt');
      expect(result.data).toHaveProperty('updatedAt');
    });

    it('deve falhar ao criar registro duplicado', async () => {
      // Criar primeiro registro
      await crudService.create(STORES.VISTORIAS, sampleVistoria);

      // Tentar criar registro com mesmo ID
      const result = await crudService.create(STORES.VISTORIAS, sampleVistoria);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro ao criar registro');
    });
  });

  describe('Read Operations', () => {
    beforeEach(async () => {
      await crudService.create(STORES.VISTORIAS, sampleVistoria);
    });

    it('deve buscar registro por ID', async () => {
      const result = await crudService.getById(STORES.VISTORIAS, sampleVistoria.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as any)?.id).toBe(sampleVistoria.id);
      expect((result.data as any)?.token).toBe(sampleVistoria.token);
    });

    it('deve retornar erro para ID inexistente', async () => {
      const result = await crudService.getById(STORES.VISTORIAS, 'id-inexistente');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Registro não encontrado');
    });

    it('deve buscar todos os registros', async () => {
      // Adicionar mais um registro
      const secondVistoria = { ...sampleVistoria, id: 'vistoria-2', token: 'test-token-2' };
      await crudService.create(STORES.VISTORIAS, secondVistoria);

      const result = await crudService.getAll(STORES.VISTORIAS);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
    });

    it('deve buscar com filtros usando índices', async () => {
      // Adicionar vistorias com status diferentes
      const vistoriaEmAndamento = {
        ...sampleVistoria,
        id: 'vistoria-2',
        token: 'token-2',
        status: 'em_andamento' as const,
      };
      await crudService.create(STORES.VISTORIAS, vistoriaEmAndamento);

      const result = await crudService.findBy(STORES.VISTORIAS, {
        field: 'status',
        value: 'em_andamento',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(1);
      expect((result.data as any)?.[0].status).toBe('em_andamento');
    });

    it('deve buscar com operador contains', async () => {
      const result = await crudService.findBy(STORES.VISTORIAS, {
        field: 'tecnico.nome',
        value: 'João',
        operator: 'contains',
      });

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
    });
  });

  describe('Update Operation', () => {
    beforeEach(async () => {
      await crudService.create(STORES.VISTORIAS, sampleVistoria);
    });

    it('deve atualizar registro existente', async () => {
      const updatedVistoria = {
        ...sampleVistoria,
        status: 'em_andamento' as const,
        observacoes: 'Observações atualizadas',
      };

      const result = await crudService.update(STORES.VISTORIAS, updatedVistoria);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('em_andamento');
      expect(result.data?.observacoes).toBe('Observações atualizadas');
      expect(result.data).toHaveProperty('updatedAt');
    });
  });

  describe('Upsert Operation', () => {
    it('deve criar registro quando não existe', async () => {
      const result = await crudService.upsert(STORES.VISTORIAS, sampleVistoria);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(sampleVistoria.id);
    });

    it('deve atualizar registro quando já existe', async () => {
      // Criar primeiro
      await crudService.create(STORES.VISTORIAS, sampleVistoria);

      // Fazer upsert com mudanças
      const updatedVistoria = {
        ...sampleVistoria,
        observacoes: 'Observações via upsert',
      };

      const result = await crudService.upsert(STORES.VISTORIAS, updatedVistoria);

      expect(result.success).toBe(true);
      expect(result.data?.observacoes).toBe('Observações via upsert');
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await crudService.create(STORES.VISTORIAS, sampleVistoria);
    });

    it('deve deletar registro por ID', async () => {
      const result = await crudService.delete(STORES.VISTORIAS, sampleVistoria.id);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);

      // Verificar que foi deletado
      const getResult = await crudService.getById(STORES.VISTORIAS, sampleVistoria.id);
      expect(getResult.success).toBe(false);
    });

    it('deve deletar múltiplos registros', async () => {
      // Adicionar mais vistorias
      const vistoria2 = {
        ...sampleVistoria,
        id: 'vistoria-2',
        token: 'token-2',
        sincronizada: true,
      };
      const vistoria3 = {
        ...sampleVistoria,
        id: 'vistoria-3',
        token: 'token-3',
        sincronizada: true,
      };

      await crudService.create(STORES.VISTORIAS, vistoria2);
      await crudService.create(STORES.VISTORIAS, vistoria3);

      // Deletar todas as sincronizadas
      const result = await crudService.deleteMany(STORES.VISTORIAS, {
        field: 'sincronizada',
        value: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe(2); // Deletou 2 registros

      // Verificar que apenas a não sincronizada permanece
      const allResult = await crudService.getAll(STORES.VISTORIAS);
      expect(allResult.data?.length).toBe(1);
      expect((allResult.data as any)?.[0].sincronizada).toBe(false);
    });
  });

  describe('Count Operation', () => {
    beforeEach(async () => {
      await crudService.create(STORES.VISTORIAS, sampleVistoria);
      const vistoria2 = {
        ...sampleVistoria,
        id: 'vistoria-2',
        token: 'token-2',
        status: 'concluida' as const,
      };
      await crudService.create(STORES.VISTORIAS, vistoria2);
    });

    it('deve contar todos os registros', async () => {
      const result = await crudService.count(STORES.VISTORIAS);

      expect(result.success).toBe(true);
      expect(result.data).toBe(2);
    });

    it('deve contar com filtro', async () => {
      const result = await crudService.count(STORES.VISTORIAS, {
        field: 'status',
        value: 'pendente',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com erros ao inicializar automaticamente', async () => {
      // Fechar a conexão para forçar reinicialização
      indexedDBService.close();

      const result = await crudService.create(STORES.VISTORIAS, sampleVistoria);

      // Deve tentar inicializar automaticamente e ter sucesso
      expect(result.success).toBe(true);
    });

    it('deve retornar erro para store inválida', async () => {
      const result = await crudService.create('store-invalida' as any, sampleVistoria);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro ao criar registro');
    });
  });
});
