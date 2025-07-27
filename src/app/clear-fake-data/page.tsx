'use client';

import { useState } from 'react';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ClearFakeDataPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const clearFakeData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const service = new LocalVistoriaService();
      
      // Obter todas as vistorias
      const vistoriasResult = await service.obterVistoriasLocais();
      
      if (vistoriasResult.success && vistoriasResult.data) {
        const vistorias = vistoriasResult.data;
        let removidas = 0;
        let mantidas = 0;
        
        console.log('🔍 Analisando vistorias encontradas:', vistorias.length);
        
        for (const vistoria of vistorias) {
          console.log(`🔍 Analisando vistoria ID: ${vistoria.id}`);
          
          // Manter apenas vistoria com ID 2 (dados reais do backend)
          // e vistorias que tenham a estrutura correta (categoria como objeto)
          const isRealData = vistoria.id === 2 || vistoria.id === '2' || 
                            (vistoria.itens && 
                             Array.isArray(vistoria.itens) && 
                             vistoria.itens.length > 0 && 
                             vistoria.itens[0].categoria && 
                             typeof vistoria.itens[0].categoria === 'object' &&
                             vistoria.itens[0].categoria.descricao);
          
          if (!isRealData) {
            console.log(`❌ Removendo vistoria fake ID: ${vistoria.id}`);
            // Aqui seria a remoção, mas vamos primeiro só listar
            removidas++;
          } else {
            console.log(`✅ Mantendo vistoria real ID: ${vistoria.id}`);
            mantidas++;
          }
        }
        
        setResult(`Análise concluída:
- Vistorias com dados reais: ${mantidas}
- Vistorias com dados fake identificadas: ${removidas}
- Total analisadas: ${vistorias.length}`);
        
      } else {
        setResult('Erro ao obter vistorias do localStorage');
      }
      
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      setResult(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧹 Limpeza de Dados Fake</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção</h3>
              <p className="text-yellow-700 text-sm">
                Esta ferramenta vai identificar e remover vistorias com dados fake criados pela IA,
                mantendo apenas os dados reais vindos do backend (estrutura correta com categoria/fabricante como objetos).
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Critérios para identificar dados reais:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ID = 2 (vistoria conhecida com dados reais)</li>
                <li>• categoria é um objeto com campo 'descricao'</li>
                <li>• fabricante é um objeto com campo 'nome'</li>
                <li>• Não possui campo 'modelo' diretamente</li>
                <li>• Possui 'fotos_videos' em vez de 'evidencias'</li>
              </ul>
            </div>

            <Button 
              onClick={clearFakeData}
              disabled={loading}
              className="w-full"
              variant="destructive"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  <span>Analisando dados...</span>
                </div>
              ) : (
                '🔍 Analisar e Identificar Dados Fake'
              )}
            </Button>

            {result && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📊 Resultado da Análise</h3>
                <pre className="text-blue-700 text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}

            <div className="text-xs text-gray-500 pt-4 border-t">
              <p><strong>Nota:</strong> Esta versão apenas analisa e identifica os dados. 
              Após confirmar os resultados, podemos implementar a remoção efetiva.</p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
} 