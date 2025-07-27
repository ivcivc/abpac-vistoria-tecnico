import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Adicione aqui os providers necessários para os testes
interface AllProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper que fornece todos os providers necessários para os testes
 */
const AllProviders = ({ children }: AllProvidersProps) => {
  return (
    <>
      {/* Adicione aqui os providers necessários para os testes */}
      {children}
    </>
  );
};

/**
 * Função customizada de render que inclui os providers necessários
 * @param ui - Componente a ser renderizado
 * @param options - Opções adicionais de renderização
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options });

/**
 * Mock para o objeto window.matchMedia
 */
export const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

/**
 * Mock para o objeto localStorage
 */
export const mockLocalStorage = () => {
  const localStorageMock = (function() {
    let store: Record<string, string> = {};
    
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
      key: jest.fn((index: number) => Object.keys(store)[index] || null),
      length: jest.fn(() => Object.keys(store).length),
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  
  return localStorageMock;
};

/**
 * Mock para o objeto fetch
 * @param mockResponse - Resposta a ser retornada pelo fetch
 */
export const mockFetch = (mockResponse: any) => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
      status: 200,
      headers: new Headers(),
    }),
  ) as jest.Mock;
  
  return global.fetch;
};

/**
 * Mock para simular erro no fetch
 * @param status - Status HTTP do erro
 * @param statusText - Texto do erro
 */
export const mockFetchError = (status = 500, statusText = 'Internal Server Error') => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status,
      statusText,
      json: () => Promise.reject(new Error(statusText)),
      text: () => Promise.reject(new Error(statusText)),
    }),
  ) as jest.Mock;
  
  return global.fetch;
};

/**
 * Função para esperar que uma promessa seja resolvida
 * Útil para testar componentes que fazem chamadas assíncronas
 */
export const waitForPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Re-exporta todas as funções do testing-library
export * from '@testing-library/react';
export { customRender as render };
