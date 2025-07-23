'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TechnicianFormData } from '@/types/auth';

interface TechnicianIdentificationProps {
  onSubmit: (data: TechnicianFormData) => void;
  loading?: boolean;
  error?: string | null;
  vistoriaInfo?: {
    local: string;
    dataAgendada: string;
    tipoVistoria?: string;
    tecnicoId?: string | null;
    tecnicoNome?: string | null; // ← ADICIONADO: nome real do técnico do backend
    nomeEstoque?: string;
    veiculo: {
      placa: string;
      modelo: string;
      cor: string;
      ano?: number;
    };
  };
  className?: string;
}

export function TechnicianIdentification({
  onSubmit,
  loading = false,
  error,
  vistoriaInfo,
  className = '',
}: TechnicianIdentificationProps) {
  // Se há técnico_id e nome real do backend, usar como sugestão (mas sempre editável)
  const defaultName = vistoriaInfo?.tecnicoNome || '';

  const [name, setName] = useState(defaultName);
  const [touched, setTouched] = useState(false);

  // Campo sempre editável - técnico pode alterar se não for ele mesmo
  const hasPrefilledName = Boolean(vistoriaInfo?.tecnicoNome);
  const hasTechnicianData = Boolean(vistoriaInfo?.tecnicoId && vistoriaInfo?.tecnicoNome);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (name.trim()) {
      onSubmit({ name: name.trim() });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (touched && !e.target.value.trim()) {
      setTouched(false);
    }
  };

  const isNameValid = name.trim().length >= 2;
  const showError = touched && !isNameValid;

  return (
    <div className={`w-full max-w-lg mx-auto ${className}`}>
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="text-xl font-semibold">Identificação do Técnico</h2>
          <p className="text-muted-foreground text-sm">
            Token validado com sucesso! Agora informe seu nome para continuar.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações da Vistoria */}
          {vistoriaInfo && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center">
                  📍 Informações da Vistoria
                </h3>
                {vistoriaInfo.tipoVistoria && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {vistoriaInfo.tipoVistoria}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Local:</strong> {vistoriaInfo.local}
                </p>
                <p>
                  <strong>Data:</strong>{' '}
                  {new Date(vistoriaInfo.dataAgendada).toLocaleDateString('pt-BR')}
                </p>
                <p>
                  <strong>Veículo:</strong> {vistoriaInfo.veiculo.modelo} (
                  {vistoriaInfo.veiculo.cor})
                </p>
                <p>
                  <strong>Placa:</strong> {vistoriaInfo.veiculo.placa}
                </p>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="technician-name" className="text-sm font-medium">
                Nome Completo *
                {hasPrefilledName && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (sugerido pelo sistema)
                  </span>
                )}
              </label>
              <input
                id="technician-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                onBlur={() => setTouched(true)}
                placeholder="Digite seu nome completo..."
                className={`flex h-12 w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background ${
                  showError ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'
                }`}
                disabled={loading}
                autoComplete="name"
                maxLength={100}
              />

              {showError && (
                <p className="text-sm text-red-600 flex items-center">
                  ❌ Nome deve ter pelo menos 2 caracteres
                </p>
              )}

              {hasPrefilledName && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-md">
                  <p className="text-sm font-medium text-blue-800 flex items-center">
                    💡 Nome sugerido - altere se não for você
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Se este nome estiver correto, pode prosseguir. Caso contrário, digite seu
                    próprio nome.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <p className="text-sm text-red-600 flex items-center">⚠️ {error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !isNameValid}
              className="w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
                  Processando...
                </>
              ) : (
                <>🚀 Iniciar Vistoria</>
              )}
            </Button>

            <div className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded">
              <p className="font-medium mb-1">ℹ️ Informação</p>
              <p>
                Seu nome será registrado junto aos dados da vistoria para identificação e
                responsabilidade técnica.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
