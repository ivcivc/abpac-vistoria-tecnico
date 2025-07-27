'use client';

import { useState } from 'react';
import { populateTestData } from '@/utils/testData';
import { LocalVistoriaService } from '@/services/vistoria/LocalVistoriaService';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestDebugPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateTestData = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const service = new LocalVistoriaService();
      const vistoriaId = await populateTestData(service);
      
      setResult({ 
        success: true, 
        message: 'Dados de teste criados com sucesso!',
        vistoriaId,
        redirect: `/vistoria/${vistoriaId}` 
      });
      
      console.log('✅ Dados de teste criados. ID da vistoria:', vistoriaId);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao criar dados de teste:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToVistoria = () => {
    if (result?.vistoriaId) {
      router.push(`/vistoria/${result.vistoriaId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Testes de Debug - Vistoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-4">
              <Button 
                onClick={handleCreateTestData}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                    <span>Criando dados de teste...</span>
                  </div>
                ) : (
                  '🔧 Criar Dados de Teste'
                )}
              </Button>

              {result && result.success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✅ Sucesso!
                  </h3>
                  <p className="text-green-700 dark:text-green-300 mb-3">
                    {result.message}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                    ID da Vistoria: <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">{result.vistoriaId}</code>
                  </p>
                  <Button 
                    onClick={handleNavigateToVistoria}
                    variant="outline"
                    className="border-green-300 text-green-800 hover:bg-green-100 dark:border-green-700 dark:text-green-200 dark:hover:bg-green-900/30"
                  >
                    🚀 Ir para Vistoria
                  </Button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    ❌ Erro
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-6">
              <h3 className="font-semibold mb-2">ℹ️ Informações</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Esta página cria dados de teste para simular uma vistoria</li>
                <li>• Os dados incluem itens com diferentes status</li>
                <li>• Use para testar o sistema de vistorias localmente</li>
                <li>• Após criar, clique em "Ir para Vistoria" para ver os detalhes</li>
              </ul>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
} 