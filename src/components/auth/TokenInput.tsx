'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthService } from '@/services/auth/AuthService';

interface TokenInputProps {
  onTokenSubmit: (token: string) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
  defaultValue?: string; // Token inicial da URL
}

export function TokenInput({
  onTokenSubmit,
  loading = false,
  error,
  className = '',
  defaultValue = '',
}: TokenInputProps) {
  const [isExpanded, setIsExpanded] = useState(!!defaultValue); // Expandir automaticamente se há token
  const [token, setToken] = useState(defaultValue); // Usar defaultValue como inicial
  const [showToken, setShowToken] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);
  const authService = new AuthService();

  // Atualizar token se defaultValue mudou
  useEffect(() => {
    if (defaultValue && defaultValue !== token) {
      setToken(defaultValue);
      setIsExpanded(true);
    }
  }, [defaultValue, token]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Limpar campos ao expandir
      setToken('');
      setShowToken(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onTokenSubmit(token.trim());
    }
  };

  const handleGenerateMockToken = () => {
    const mockToken = authService.generateMockToken();
    setToken(mockToken);
    setShowToken(true);
  };

  const isValidFormat = token ? authService.isValidTokenFormat(token) : true;

  if (!isExpanded) {
    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleExpand}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          🔑 Inserir token manualmente
        </Button>

        {process.env.NODE_ENV === 'development' && (
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsDevelopment(!isDevelopment)}
            className="text-xs text-muted-foreground"
          >
            Modo desenvolvedor
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md ${className}`}>
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="token" className="text-sm font-medium">
                Token de Acesso
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <div className="relative">
              <input
                id="token"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
                placeholder="VIS1234567890ABCDEF..."
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10 ${
                  !isValidFormat ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'
                }`}
                disabled={loading}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showToken ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>

            {!isValidFormat && token && (
              <p className="text-sm text-red-600 flex items-center">
                ❌ Formato de token inválido (mínimo 8 caracteres)
              </p>
            )}

            {isValidFormat && token && (
              <p className="text-sm text-green-600 flex items-center">✅ Formato do token válido</p>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border">{error}</p>}

            <div className="flex flex-col space-y-2">
              <Button
                type="submit"
                disabled={loading || !token.trim() || !isValidFormat}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                    Validando...
                  </>
                ) : (
                  <>✅ Validar Token</>
                )}
              </Button>

              {(isDevelopment || process.env.NODE_ENV === 'development') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateMockToken}
                  className="w-full text-xs"
                  disabled={loading}
                >
                  🔧 Gerar token de desenvolvimento
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded">
              <p className="font-medium">💡 Dica:</p>
              <p>• O token é fornecido pela ABPAC para cada vistoria</p>
              <p>• Normalmente recebido por link direto</p>
              {process.env.NODE_ENV === 'development' && (
                <p>• Em desenvolvimento: use o botão acima para gerar um token</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
