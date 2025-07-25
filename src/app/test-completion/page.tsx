'use client';

import { useState, useEffect } from 'react';
import { VistoriaDetails } from '@/components/vistoria';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { populateTestData } from '@/utils/testData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Database } from 'lucide-react';

export default function TestCompletionPage() {
  const [vistorias, setVistorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVistoriaId, setSelectedVistoriaId] = useState<string | null>(null);
  const [isPopulating, setIsPopulating] = useState(false);

  // Carregar vistorias disponíveis
  const loadVistorias = async () => {
    setLoading(true);
    try {
      const service = new LocalVistoriaService();
      const result = await service.obterVistoriasLocais();
      
      if (result.success && result.data) {
        setVistorias(result.data);
        console.log('Vistorias carregadas:', result.data);
      } else {
        console.error('Erro ao carregar vistorias:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar vistorias:', error);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar dados de teste
  const handleAddTestData = async () => {
    setIsPopulating(true);
    try {
      const service = new LocalVistoriaService();
      const newVistoriaId = await populateTestData(service);
      
      // Recarregar vistorias
      await loadVistorias();
      
      // Selecionar a nova vistoria
      setSelectedVistoriaId(newVistoriaId);
      
      console.log('Dados de teste adicionados com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar dados de teste:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  useEffect(() => {
    loadVistorias();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Teste de Fluxo de Conclusão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              onClick={loadVistorias} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Vistorias
            </Button>
            
            <Button
              onClick={handleAddTestData}
              variant="secondary"
              size="sm"
              disabled={isPopulating}
            >
              <Database className="h-4 w-4 mr-2" />
              {isPopulating ? 'Adicionando...' : 'Adicionar Dados de Teste'}
            </Button>
          </div>

          {loading ? (
            <div className="text-center p-4">Carregando vistorias...</div>
          ) : vistorias.length === 0 ? (
            <div className="text-center p-4 border rounded-md bg-muted/20">
              <p>Nenhuma vistoria encontrada.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Adicionar Dados de Teste" para criar uma vistoria de teste.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Selecione uma vistoria para testar:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vistorias.map((vistoria) => (
                  <Card 
                    key={vistoria.id}
                    className={`cursor-pointer transition-all ${
                      selectedVistoriaId === vistoria.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedVistoriaId(vistoria.id)}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{vistoria.local}</div>
                      <div className="text-sm text-muted-foreground">
                        {vistoria.veiculo.modelo} - {vistoria.veiculo.placa}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs px-2 py-1 rounded bg-muted">
                          Status: {vistoria.status}
                        </div>
                        {vistoria.sincronizada && (
                          <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                            Sincronizada
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVistoriaId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Detalhes da Vistoria</h2>
          <VistoriaDetails vistoriaId={selectedVistoriaId} />
        </div>
      )}
    </div>
  );
} 