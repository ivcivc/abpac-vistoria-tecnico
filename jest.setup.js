import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Polyfill para structuredClone
global.structuredClone = obj => {
  return JSON.parse(JSON.stringify(obj));
};

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: jest.fn().mockResolvedValue({
      quota: 1000000000, // 1GB
      usage: 50000000, // 50MB
    }),
  },
  writable: true,
});

// Mock console.warn para testes mais limpos
global.console = {
  ...console,
  warn: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
};

// Reset IndexedDB antes de cada teste
beforeEach(() => {
  // Limpar todas as databases
  const databases = Object.keys(global.indexedDB._databases || {});
  databases.forEach(name => {
    delete global.indexedDB._databases[name];
  });
});
