'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';

interface ItemDiagnostico {
  id: string | number;
  estoque_remessa_id?: string | number;
  status: string;
  descricao: string;
  categoria: any;
  fabricante: any;
  duplicado?: boolean;
}

interface VistoriaDiagnostico {
  id: string | number;
  itens: ItemDiagnostico[];
  duplicacoes: {
    itemId: string | number;
    ocorrencias: number;
    statusDiferentes: string[];
  }[];
}

export default function DebugDuplicacaoPage() {
  const [vistorias, setVistorias] = useState<VistoriaDiagnostico[]>([]);
  const [loading, setLoading] = useState(true);

  const analisarDuplicacoes = () => {
    setLoading(true);
    
    try {
      // Obter todas as vistorias do localStorage
      const keys = Object.keys(localStorage).filter(key => key.startsWith('vistoria_'));
      const vistoriasData: VistoriaDiagnostico[] = [];

      keys.forEach(key => {
        try {
          const vistoriaData = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (vistoriaData && vistoriaData.itens && Array.isArray(vistoriaData.itens)) {
            const itens: ItemDiagnostico[] = vistoriaData.itens.map((item: any) => ({
              id: item.id || item.estoque_remessa_id,
              estoque_remessa_id: item.estoque_remessa_id,
              status: item.status || 'PENDENTE',
              descricao: item.descricao || 'Sem descrição',
              categoria: item.categoria,
              fabricante: item.fabricante
            }));

            // Detectar duplicações
            const duplicacoes: { [key: string]: { ocorrencias: number; statusDiferentes: string[] } } = {};
            
            itens.forEach(item => {
              const itemKey = item.estoque_remessa_id || item.id;
              if (!duplicacoes[itemKey]) {
                duplicacoes[itemKey] = {
                  ocorrencias: 0,
                  statusDiferentes: []
                };
              }
              duplicacoes[itemKey].ocorrencias++;
              if (!duplicacoes[itemKey].statusDiferentes.includes(item.status)) {
                duplicacoes[itemKey].statusDiferentes.push(item.status);
              }
            });

            // Marcar itens duplicados
            itens.forEach(item => {
              const itemKey = item.estoque_remessa_id || item.id;
              item.duplicado = duplicacoes[itemKey].ocorrencias > 1;
            });

            const duplicacoesEncontradas = Object.entries(duplicacoes)
              .filter(([_, data]) => data.ocorrencias > 1)
              .map(([itemId, data]) => ({
                itemId,
                ocorrencias: data.ocorrencias,
                statusDiferentes: data.statusDiferentes
              }));

            vistoriasData.push({
              id: vistoriaData.id,
              itens,
              duplicacoes: duplicacoesEncontradas
            });
          }
        } catch (error) {
          console.error(`Erro ao processar ${key}:`, error);
        }
      });

      setVistorias(vistoriasData);
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const corrigirDuplicacoes = async (vistoriaId: string | number) => {
    try {
      console.log(`🔧 Iniciando correção de duplicações para vistoria ${vistoriaId}`);
      
      const localService = new LocalVistoriaService();
      const result = await localService.limparDuplicacoes(vistoriaId.toString());
      
             if (result.success) {
         const message = (result as any).message || 'Correção concluída';
         console.log(`✅ ${message}`);
         alert(`Correção concluída: ${message}`);
       } else {
        console.error(`❌ Erro na correção: ${result.error}`);
        alert(`Erro na correção: ${result.error}`);
      }
      
      // Reanalizar após correção
      analisarDuplicacoes();
    } catch (error) {
      console.error('Erro ao corrigir duplicações:', error);
      alert('Erro inesperado ao corrigir duplicações');
    }
  };

  useEffect(() => {
    analisarDuplicacoes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Diagnóstico de Duplicação - Carregando...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Diagnóstico de Duplicação de Itens</h1>
          <Button onClick={analisarDuplicacoes} className="mb-4">
            🔄 Reanalizar
          </Button>
        </div>

        {vistorias.map(vistoria => (
          <Card key={vistoria.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vistoria {vistoria.id}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {vistoria.itens.length} itens total
                  </span>
                  {vistoria.duplicacoes.length > 0 && (
                    <Button 
                      onClick={() => corrigirDuplicacoes(vistoria.id)}
                      variant="destructive" 
                      size="sm"
                    >
                      🔧 Corrigir Duplicações
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vistoria.duplicacoes.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">
                      ⚠️ {vistoria.duplicacoes.length} Duplicação(ões) Encontrada(s)
                    </h3>
                    {vistoria.duplicacoes.map(dup => (
                      <div key={dup.itemId} className="mb-2 p-2 bg-white dark:bg-gray-800 rounded border">
                        <div className="font-medium">Item ID: {dup.itemId}</div>
                        <div className="text-sm text-gray-600">
                          Ocorrências: {dup.ocorrencias} | 
                          Status diferentes: {dup.statusDiferentes.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                    {vistoria.itens
                      .filter(item => item.duplicado)
                      .map((item, index) => (
                      <div 
                        key={`${item.id}-${index}`} 
                        className="p-3 border rounded bg-red-50 dark:bg-red-900/10 border-red-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {item.descricao}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {item.id} | Estoque: {item.estoque_remessa_id} | Status: {item.status}
                            </div>
                            <div className="text-xs text-gray-500">
                              Categoria: {typeof item.categoria === 'object' ? item.categoria?.descricao : item.categoria} | 
                              Fabricante: {typeof item.fabricante === 'object' ? item.fabricante?.nome : item.fabricante}
                            </div>
                          </div>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            DUPLICADO
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-green-800 dark:text-green-300 font-medium">
                    ✅ Nenhuma duplicação encontrada ({vistoria.itens.length} itens únicos)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 