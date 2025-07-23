'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ItemDetail } from '@/components/vistoria/ItemDetail';
import { LocalVistoriaService, VistoriaLocal } from '@/services/vistoria/LocalVistoriaService';
import { VistoriaItem } from '@/types/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vistoriaId = params.id as string;
  const itemId = params.itemId as string;

  const [vistoria, setVistoria] = useState<VistoriaLocal | null>(null);
  const [item, setItem] = useState<VistoriaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localVistoriaService = new LocalVistoriaService();

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Carregando vistoria:', vistoriaId);
      const vistoriaResult = await localVistoriaService.obterVistoriaPorId(vistoriaId);

      if (!vistoriaResult.success || !vistoriaResult.data) {
        throw new Error(vistoriaResult.error || 'Vistoria não encontrada');
      }

      const vistoriaData = vistoriaResult.data;
      setVistoria(vistoriaData);

      // Procurar o item específico
      const itemEncontrado = vistoriaData.itens?.find((i: any) => i.id === itemId);

      if (!itemEncontrado) {
        throw new Error('Item não encontrado na vistoria');
      }

      console.log('📦 Item encontrado:', itemEncontrado);
      setItem(itemEncontrado);
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleItemUpdate = async (itemAtualizado: VistoriaItem) => {
    try {
      console.log('💾 Salvando item atualizado:', itemAtualizado);

      const result = await localVistoriaService.atualizarItem(vistoriaId, itemAtualizado);

      if (result.success) {
        console.log('✅ Item salvo com sucesso');
        setItem(itemAtualizado);
        
        // Mostrar feedback visual
        // TODO: Implementar toast/notification na Task futura
        
        // Atualizar dados para refletir mudanças
        await carregarDados();
      } else {
        throw new Error(result.error || 'Erro ao salvar item');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar item:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  };

  const voltarParaVistoria = () => {
    router.push(`/vistoria/${vistoriaId}`);
  };

  useEffect(() => {
    if (vistoriaId && itemId) {
      carregarDados();
    }
  }, [vistoriaId, itemId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Carregando detalhes do item...
              </h3>
              <p className="text-blue-600">Aguarde um momento</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !vistoria || !item) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                {error || 'Item não encontrado'}
              </h3>
              <div className="flex gap-3 justify-center mt-4">
                <Button onClick={carregarDados} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button onClick={voltarParaVistoria}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Vistoria
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={voltarParaVistoria}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Detalhes do Item
                </h1>
                <p className="text-sm text-gray-600">
                  {vistoria.local} • {item.tipo}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <ItemDetail
          item={item}
          readOnly={false}
          onUpdate={handleItemUpdate}
        />
      </div>
    </div>
  );
} 