import { AuthService } from '../AuthService';

// Mock do CRUDService
jest.mock('../../storage/CRUDService', () => ({
  CRUDService: jest.fn().mockImplementation(() => ({
    upsert: jest.fn(),
    getById: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockLocation: any;
  let mockHistory: any;

  beforeEach(() => {
    authService = new AuthService();

    // Mock do window.location
    mockLocation = {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
    };

    // Mock do window.history
    mockHistory = {
      replaceState: jest.fn(),
    };

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    Object.defineProperty(window, 'history', {
      value: mockHistory,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTokenFromURL', () => {
    it('deve extrair token da URL quando presente', () => {
      mockLocation.href = 'http://localhost:3000?token=VIS1234567890ABCDEF';

      const token = authService.extractTokenFromURL();

      expect(token).toBe('VIS1234567890ABCDEF');
      expect(mockHistory.replaceState).toHaveBeenCalled();
    });

    it('deve retornar null quando token não está na URL', () => {
      mockLocation.href = 'http://localhost:3000';

      const token = authService.extractTokenFromURL();

      expect(token).toBe(null);
      expect(mockHistory.replaceState).not.toHaveBeenCalled();
    });

    it('deve retornar null em ambiente SSR', () => {
      // Simular ambiente SSR removendo window
      const originalWindow = global.window;
      delete (global as any).window;

      const token = authService.extractTokenFromURL();

      expect(token).toBe(null);

      // Restaurar window
      global.window = originalWindow;
    });
  });

  describe('validateToken', () => {
    beforeEach(() => {
      // Mock para setTimeout
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve validar token válido com sucesso', async () => {
      const validToken = 'VIS1234567890ABCDEF';

      const validationPromise = authService.validateToken(validToken);

      // Avançar temporizadores para simular delay da rede
      jest.advanceTimersByTime(1000);

      const result = await validationPromise;

      expect(result.valid).toBe(true);
      expect(result.vistoria).toBeDefined();
      expect(result.vistoria?.local).toBe('Rua das Flores, 123 - Centro');
    });

    it('deve rejeitar token inválido (muito curto)', async () => {
      const invalidToken = 'VIS123';

      const validationPromise = authService.validateToken(invalidToken);
      jest.advanceTimersByTime(1000);

      const result = await validationPromise;

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token inválido');
    });

    it('deve rejeitar token que não começa com VIS', async () => {
      const invalidToken = 'ABC1234567890ABCDEF';

      const validationPromise = authService.validateToken(invalidToken);
      jest.advanceTimersByTime(1000);

      const result = await validationPromise;

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token inválido');
    });

    it('deve rejeitar token vazio', async () => {
      const invalidToken = '';

      const validationPromise = authService.validateToken(invalidToken);
      jest.advanceTimersByTime(1000);

      const result = await validationPromise;

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Token inválido');
    });

    it('deve retornar erro em ambiente não suportado', async () => {
      // Simular ambiente SSR
      const originalWindow = global.window;
      delete (global as any).window;

      const result = await authService.validateToken('VIS1234567890ABCDEF');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Ambiente não suportado');

      // Restaurar window
      global.window = originalWindow;
    });
  });

  describe('generateMockToken', () => {
    it('deve gerar token mock válido', () => {
      const mockToken = authService.generateMockToken();

      expect(mockToken).toMatch(/^VIS\d+[A-Z0-9]+$/);
      expect(mockToken.length).toBeGreaterThan(10);
    });

    it('deve gerar tokens únicos', () => {
      const token1 = authService.generateMockToken();
      const token2 = authService.generateMockToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('isValidTokenFormat', () => {
    it('deve validar formato correto', () => {
      expect(authService.isValidTokenFormat('VIS1234567890ABCDEF')).toBe(true);
      expect(authService.isValidTokenFormat('VIS123456789012345')).toBe(true);
    });

    it('deve rejeitar formato incorreto', () => {
      expect(authService.isValidTokenFormat('ABC1234567890')).toBe(false);
      expect(authService.isValidTokenFormat('VIS123')).toBe(false);
      expect(authService.isValidTokenFormat('')).toBe(false);
      expect(authService.isValidTokenFormat('vis1234567890')).toBe(false); // case sensitive
    });
  });

  describe('createTokenURL', () => {
    it('deve criar URL com token', () => {
      const token = 'VIS1234567890ABCDEF';
      const url = authService.createTokenURL(token);

      expect(url).toBe('http://localhost:3000/?token=VIS1234567890ABCDEF');
    });

    it('deve usar URL base personalizada', () => {
      const token = 'VIS1234567890ABCDEF';
      const baseUrl = 'https://vistoria.abpac.com.br';
      const url = authService.createTokenURL(token, baseUrl);

      expect(url).toBe('https://vistoria.abpac.com.br/?token=VIS1234567890ABCDEF');
    });
  });

  describe('getAvailableToken', () => {
    it('deve priorizar token da URL sobre armazenamento', async () => {
      mockLocation.href = 'http://localhost:3000?token=VIS1234567890URL';

      // Mock do método getStoredAuthSession para retornar sessão armazenada
      jest.spyOn(authService, 'getStoredAuthSession').mockResolvedValue({
        token: 'VIS1234567890STORAGE',
        technicianName: 'João Silva',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      });

      const result = await authService.getAvailableToken();

      expect(result.token).toBe('VIS1234567890URL');
      expect(result.source).toBe('url');
      expect(result.technicianName).toBeUndefined();
    });

    it('deve usar armazenamento quando não há token na URL', async () => {
      mockLocation.href = 'http://localhost:3000';

      const mockSession = {
        token: 'VIS1234567890STORAGE',
        technicianName: 'João Silva',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      };

      jest.spyOn(authService, 'getStoredAuthSession').mockResolvedValue(mockSession);

      const result = await authService.getAvailableToken();

      expect(result.token).toBe('VIS1234567890STORAGE');
      expect(result.source).toBe('storage');
      expect(result.technicianName).toBe('João Silva');
    });

    it('deve retornar null quando não há token disponível', async () => {
      mockLocation.href = 'http://localhost:3000';

      jest.spyOn(authService, 'getStoredAuthSession').mockResolvedValue(null);

      const result = await authService.getAvailableToken();

      expect(result.token).toBe(null);
      expect(result.source).toBe(null);
      expect(result.technicianName).toBeUndefined();
    });
  });
});
