'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout';
import { VistoriaDetails } from '@/components/vistoria/VistoriaDetails';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';

interface VistoriaPageProps {
  params: {
    id: string;
  };
}

/**
 * Página de detalhes de uma vistoria específica
 * 
 * Funcionalidades:
 * - Carregamento de dados da vistoria pelo ID
 * - Exibição de informações detalhadas
 * - Lista de itens da vistoria
 * - Ações de salvar, pausar e concluir
 * - Navegação de volta ao dashboard
 */
export default function VistoriaPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistoriaId, setVistoriaId] = useState<string>('');

  useEffect(() => {
    if (params?.id) {
      setVistoriaId(params.id as string);
      setLoading(false);
    }
  }, [params]);

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Simular recarregamento
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
            {/* Header skeleton */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-10 w-10 bg-muted/50 rounded animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-muted/50 rounded animate-pulse w-1/3" />
                <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-8 bg-muted/50 rounded animate-pulse w-1/4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-muted/50 rounded animate-pulse" />
                        <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-muted/50 rounded animate-pulse" />
                        <div className="h-4 bg-muted/50 rounded animate-pulse w-2/3" />
                        <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-muted/50 rounded animate-pulse w-1/3" />
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={`vistoria-item-skeleton-${i}`} className="border rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="h-5 bg-muted/50 rounded animate-pulse w-1/2" />
                          <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-muted/50 rounded animate-pulse w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AuthenticatedLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
            <div className="flex items-center space-x-4 mb-6">
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Erro ao carregar vistoria
                </h3>
                <p className="text-red-600 mb-4">{error}</p>
                <div className="space-x-2">
                  <Button onClick={handleRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button onClick={handleGoBack} variant="default">
                    Voltar ao Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
          {/* Header com navegação */}
          <div className="flex items-center space-x-4 mb-6">
            <Button
              onClick={handleGoBack}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Detalhes da Vistoria</h1>
              <p className="text-muted-foreground">ID: {vistoriaId}</p>
            </div>
          </div>

          {/* Componente principal de detalhes */}
          <VistoriaDetails vistoriaId={vistoriaId} />
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
} 