'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Carregando vistoria:', vistoriaId);
      const localVistoriaService = new LocalVistoriaService();
      const vistoriaResult = await localVistoriaService.obterVistoriaPorId(vistoriaId);

      if (!vistoriaResult.success || !vistoriaResult.data) {
        throw new Error(vistoriaResult.error || 'Vistoria não encontrada');
      }

      const vistoriaData = vistoriaResult.data;
      setVistoria(vistoriaData);

      console.log('🔍 [DEBUG] ItemId buscado:', itemId);
      console.log('🔍 [DEBUG] Itens disponíveis:', vistoriaData.itens);
      console.log('🔍 [DEBUG] Estrutura do primeiro item:', vistoriaData.itens?.[0]);

      // Procurar o item específico usando estoque_remessa_id como ID principal
      const itemEncontrado = vistoriaData.itens?.find((i: any) => 
        i.estoque_remessa_id?.toString() === itemId ||
        i.id?.toString() === itemId
      );

      if (!itemEncontrado) {
        console.error('❌ [DEBUG] Item não encontrado. IDs disponíveis:', 
          vistoriaData.itens?.map((i: any) => ({ 
            id: i.id, 
            estoque_remessa_id: i.estoque_remessa_id,
            pre_remessa_id: i.pre_remessa_id 
          }))
        );
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
  }, [vistoriaId, itemId]);

  const handleItemUpdate = useCallback(async (itemAtualizado: VistoriaItem) => {
    try {
      console.log('💾 Salvando item atualizado:', itemAtualizado);

      const localVistoriaService = new LocalVistoriaService();
      const result = await localVistoriaService.atualizarItem(vistoriaId, itemAtualizado);

      if (result.success) {
        console.log('✅ Item salvo com sucesso');
        setItem(itemAtualizado);
        
        // Mostrar feedback visual
        // TODO: Implementar toast/notification na Task futura
        
        // NÃO recarregar dados para evitar loop infinito
        // Os dados já foram atualizados no estado local
      } else {
        throw new Error(result.error || 'Erro ao salvar item');
      }
    } catch (err) {
      console.error('❌ Erro ao salvar item:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }, [vistoriaId]);

  const voltarParaVistoria = () => {
    router.push(`/vistoria/${vistoriaId}`);
  };

  useEffect(() => {
    if (vistoriaId && itemId) {
      carregarDados();
    }
  }, [vistoriaId, itemId, carregarDados]);

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