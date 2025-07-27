'use client';

import { useState, useEffect } from 'react';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DebugRealDataPage() {
  const [vistorias, setVistorias] = useState<any[]>([]);
  const [selectedVistoria, setSelectedVistoria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    setLoading(true);
    try {
      const service = new LocalVistoriaService();
      const result = await service.obterVistoriasLocais();
      
      console.log('🔍 [DEBUG-REAL] Resultado do service:', result);
      
      if (result.success && result.data) {
        setVistorias(result.data);
        console.log('🔍 [DEBUG-REAL] Vistorias encontradas:', result.data.length);
        
        // Analisar a primeira vistoria em detalhes
        if (result.data.length > 0) {
          const firstVistoria = result.data[0];
          console.log('🔍 [DEBUG-REAL] Primeira vistoria:', firstVistoria);
          console.log('🔍 [DEBUG-REAL] Itens da primeira vistoria:', firstVistoria.itens);
          
          if (Array.isArray(firstVistoria.itens)) {
            firstVistoria.itens.forEach((item, index) => {
              console.log(`🔍 [DEBUG-REAL] Item ${index}:`, item);
              console.log(`🔍 [DEBUG-REAL] Item ${index} - categoria:`, item?.categoria);
              console.log(`🔍 [DEBUG-REAL] Item ${index} - fabricante:`, item?.fabricante);
              console.log(`🔍 [DEBUG-REAL] Item ${index} - modelo:`, item?.modelo);
              console.log(`🔍 [DEBUG-REAL] Item ${index} - tipo:`, typeof item);
            });
          }
          
          setSelectedVistoria(firstVistoria);
        }
      }
    } catch (error) {
      console.error('❌ [DEBUG-REAL] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeItem = (item: any) => {
    const analysis = {
      isObject: typeof item === 'object',
      hasCategoria: !!item?.categoria,
      hasFabricante: !!item?.fabricante,
      hasModelo: !!item?.modelo,
      keys: item ? Object.keys(item) : [],
      values: {}
    };

    if (item) {
      for (const key of Object.keys(item)) {
        analysis.values[key] = {
          value: item[key],
          type: typeof item[key]
        };
      }
    }

    return analysis;
  };

  const formatItemInfo = (item: any) => {
    console.log('🔍 [DEBUG-FORMAT] Formatando item:', item);
    const parts = [];
    if (item?.categoria) parts.push(item.categoria);
    if (item?.fabricante) parts.push(item.fabricante);
    if (item?.modelo) parts.push(item.modelo);
    const result = parts.join(' - ') || 'Item sem descrição';
    console.log('🔍 [DEBUG-FORMAT] Resultado:', result);
    return result;
  };

  const handleNavigateToVistoria = (vistoriaId: string) => {
    router.push(`/vistoria/${vistoriaId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
              <p>Carregando dados reais do localStorage...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug - Dados Reais do Backend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Lista de Vistorias */}
              <div>
                <h3 className="font-semibold mb-4">📋 Vistorias no localStorage</h3>
                {vistorias.length === 0 ? (
                  <p className="text-gray-500">Nenhuma vistoria encontrada no localStorage</p>
                ) : (
                  <div className="space-y-2">
                    {vistorias.map((vistoria, index) => (
                      <div
                        key={vistoria.id || index}
                        className={`p-3 border rounded cursor-pointer ${
                          selectedVistoria?.id === vistoria.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedVistoria(vistoria)}
                      >
                        <div className="font-medium">ID: {vistoria.id}</div>
                        <div className="text-sm text-gray-600">
                          Local: {vistoria.local}
                        </div>
                        <div className="text-sm text-gray-600">
                          Itens: {Array.isArray(vistoria.itens) ? vistoria.itens.length : 'N/A'}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToVistoria(vistoria.id);
                          }}
                          className="mt-2"
                        >
                          🚀 Ir para Vistoria
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Análise da Vistoria Selecionada */}
              <div>
                <h3 className="font-semibold mb-4">🔬 Análise Detalhada</h3>
                {!selectedVistoria ? (
                  <p className="text-gray-500">Selecione uma vistoria para analisar</p>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Info da Vistoria */}
                    <div className="bg-blue-50 p-4 rounded">
                      <h4 className="font-medium mb-2">Informações da Vistoria</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>ID:</strong> {selectedVistoria.id}</div>
                        <div><strong>Local:</strong> {selectedVistoria.local}</div>
                        <div><strong>Status:</strong> {selectedVistoria.status}</div>
                        <div><strong>Técnico:</strong> {selectedVistoria.tecnicoNome}</div>
                        <div><strong>Tipo de Itens:</strong> {typeof selectedVistoria.itens}</div>
                        <div><strong>É Array:</strong> {Array.isArray(selectedVistoria.itens) ? 'Sim' : 'Não'}</div>
                        <div><strong>Quantidade de Itens:</strong> {Array.isArray(selectedVistoria.itens) ? selectedVistoria.itens.length : 'N/A'}</div>
                      </div>
                    </div>

                    {/* Análise dos Itens */}
                    {Array.isArray(selectedVistoria.itens) && selectedVistoria.itens.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">📦 Análise dos Itens</h4>
                        {selectedVistoria.itens.map((item, index) => {
                          const analysis = analyzeItem(item);
                          return (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <div className="font-medium mb-2">Item {index + 1}</div>
                              <div className="text-sm space-y-1">
                                <div><strong>É Objeto:</strong> {analysis.isObject ? 'Sim' : 'Não'}</div>
                                <div><strong>Tem Categoria:</strong> {analysis.hasCategoria ? 'Sim' : 'Não'}</div>
                                <div><strong>Tem Fabricante:</strong> {analysis.hasFabricante ? 'Sim' : 'Não'}</div>
                                <div><strong>Tem Modelo:</strong> {analysis.hasModelo ? 'Sim' : 'Não'}</div>
                                <div><strong>Campos:</strong> {analysis.keys.join(', ')}</div>
                                <div><strong>Formatado:</strong> {formatItemInfo(item)}</div>
                              </div>
                              
                              {/* Valores detalhados */}
                              <details className="mt-2">
                                <summary className="cursor-pointer text-blue-600">Ver valores detalhados</summary>
                                <div className="mt-2 text-xs bg-white p-2 rounded">
                                  <pre>{JSON.stringify(analysis.values, null, 2)}</pre>
                                </div>
                              </details>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>

            <div className="mt-6 flex space-x-4">
              <Button onClick={loadRealData} variant="outline">
                🔄 Recarregar Dados
              </Button>
              <Button 
                onClick={() => {
                  console.log('🔍 [DEBUG] Dados completos das vistorias:', vistorias);
                  console.log('🔍 [DEBUG] Vistoria selecionada:', selectedVistoria);
                }}
              >
                📝 Log Completo no Console
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
} 