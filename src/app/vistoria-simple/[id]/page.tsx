'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, User, MapPin, Calendar } from 'lucide-react';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';

export default function VistoriaSimplePage() {
  const params = useParams();
  const router = useRouter();
  const [vistoriaId, setVistoriaId] = useState<string>('');
  const [vistoria, setVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      const id = params.id as string;
      setVistoriaId(id);
      carregarVistoria(id);
    }
  }, [params]);

  const carregarVistoria = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [VISTORIA-SIMPLE] Carregando vistoria ID:', id);
      
      const localService = new LocalVistoriaService();
      
      // Debug: Listar todas as vistorias
      const todasVistorias = await localService.obterVistoriasLocais();
      console.log('📊 [VISTORIA-SIMPLE] Todas as vistorias:', todasVistorias);
      
      const result = await localService.obterVistoriaPorId(id);
      console.log('🔍 [VISTORIA-SIMPLE] Resultado da busca:', result);
      
      if (result.success && result.data) {
        setVistoria(result.data);
        console.log('✅ [VISTORIA-SIMPLE] Vistoria carregada:', result.data);
      } else {
        setError(result.error || 'Vistoria não encontrada');
        console.error('❌ [VISTORIA-SIMPLE] Erro:', result.error);
      }
    } catch (err) {
      console.error('❌ [VISTORIA-SIMPLE] Erro ao carregar:', err);
      setError('Erro interno ao carregar vistoria');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <div className="container mx-auto p-4 max-w-4xl">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-1/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
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
          <div className="container mx-auto p-4 max-w-4xl">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <h1 className="text-2xl font-bold">Erro ao Carregar Vistoria</h1>
              </div>
              
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      Vistoria não encontrada
                    </h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <p className="text-sm text-red-500 mb-4">
                      ID buscado: {vistoriaId}
                    </p>
                    <div className="space-x-2">
                      <Button 
                        onClick={() => carregarVistoria(vistoriaId)}
                        variant="outline"
                      >
                        Tentar Novamente
                      </Button>
                      <Button onClick={handleGoBack}>
                        Voltar ao Dashboard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AuthenticatedLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Vistoria Simplificada</h1>
                <p className="text-gray-600">ID: {vistoriaId}</p>
              </div>
            </div>

            {/* Informações da Vistoria */}
            {vistoria && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Informações da Vistoria</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Local</p>
                          <p className="text-sm text-gray-600">{vistoria.local}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Data Agendada</p>
                          <p className="text-sm text-gray-600">
                            {new Date(vistoria.dataAgendada).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium">Status</p>
                        <span className={`px-2 py-1 rounded text-xs ${
                          vistoria.status === 'em_andamento' 
                            ? 'bg-blue-100 text-blue-800'
                            : vistoria.status === 'concluida'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {vistoria.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Técnico</p>
                          <p className="text-sm text-gray-600">
                            {vistoria.tecnicoNome || 'Não informado'}
                          </p>
                        </div>
                      </div>

                      {vistoria.veiculo && (
                        <div>
                          <p className="font-medium">Veículo</p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Modelo: {vistoria.veiculo.modelo}</p>
                            <p>Placa: {vistoria.veiculo.placa}</p>
                            <p>Cor: {vistoria.veiculo.cor}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Itens da Vistoria */}
            {vistoria && vistoria.itens && (
              <Card>
                <CardHeader>
                  <CardTitle>Itens da Vistoria ({vistoria.itens.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vistoria.itens.map((item: any, index: number) => (
                      <div 
                        key={`simple-item-${index}-${item.id || item.estoque_remessa_id}`} 
                        className="border rounded-lg p-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {item.categoria?.descricao || item.categoria?.nome || 'Item'}
                            </h4>
                            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {item.acao || 'INSTALAR'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Fabricante: {item.fabricante?.nome || 'ABPAC'}</p>
                            <p>Número de Série: {item.numero_serie || 'N/A'}</p>
                            <p>Status: {item.status || 'pendente'}</p>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => router.push(`/vistoria/${vistoriaId}/item/${item.estoque_remessa_id || item.id}`)}
                            className="mt-2"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug Info */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Debug Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p><strong>Vistoria ID:</strong> {vistoriaId}</p>
                  <p><strong>Vistoria Carregada:</strong> {vistoria ? 'Sim' : 'Não'}</p>
                  <p><strong>Itens:</strong> {vistoria?.itens?.length || 0}</p>
                  <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
} 