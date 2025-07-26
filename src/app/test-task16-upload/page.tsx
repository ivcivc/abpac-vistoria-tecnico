'use client';

import { useState } from 'react';
import { ItemDetail } from '@/components/vistoria/ItemDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TestTask16UploadPage() {
  // Item simulado para teste
  const [item, setItem] = useState({
    id: 'TEST_ITEM_001',
    vistoriaId: 'TEST_VISTORIA_001',
    acao: 'INSTALAR',
    categoria: {
      id: 1,
      nome: 'Rastreador GPS',
      categoria: 'LOCALIZADOR'
    },
    fabricante: {
      id: 1,
      nome: 'Tecnologia Teste LTDA'
    },
    local_instalacao_planejado: 'Porta do motorista',
    numero_serie_planejado: 'ABC123TEST',
    observacoes_planejadas: 'Teste de upload de evidências',
    status_item: 'PENDENTE',
    local_instalacao_executado: '',
    numero_serie_executado: '',
    observacoes_tecnico: '',
    fotos_videos: [],
    despesas: []
  });

  const [updateCount, setUpdateCount] = useState(0);

  const handleUpdate = (updatedItem: any) => {
    console.log('🔄 TestTask16: Item atualizado com upload', updatedItem);
    setItem(updatedItem);
    setUpdateCount(prev => prev + 1);
  };

  const resetItem = () => {
    setItem(prev => ({
      ...prev,
      status_item: 'PENDENTE',
      local_instalacao_executado: '',
      numero_serie_executado: '',
      observacoes_tecnico: '',
      fotos_videos: [],
      fotos_numero_serie: [],
      fotos_local_instalacao: [],
      fotos_outras_evidencias: [],
      despesas: [],
      upload_error: undefined
    }));
    setUpdateCount(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📤</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Task 16 - Upload Real de Evidências
                </h1>
                <p className="text-sm text-gray-600">
                  Teste de integração com backend AdonisJS - Endpoint /api/upload
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={item.status_item === 'CONCLUIDO' ? 'default' : 'secondary'}>
                {item.status_item}
              </Badge>
              
              <Button onClick={resetItem} variant="outline" size="sm">
                🔄 Resetar Teste
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Informações do Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <span className="text-xl">✅</span> Task 16 - Integração Implementada!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>🔧</span> Implementações:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• UploadService - Conecta com /api/upload</li>
                  <li>• ItemDetail - Upload automático ao salvar</li>
                  <li>• Progresso de upload em tempo real</li>
                  <li>• Estrutura fotos_videos compatível com backend</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>⚡</span> Funcionalidades:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Upload real para servidor AdonisJS</li>
                  <li>• Fallback local se upload falhar</li>
                  <li>• Metadados: tipo, referência, tamanho</li>
                  <li>• Progresso visual por arquivo</li>
                </ul>
              </div>
            </div>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span> 
                {updateCount > 0 ? (
                  <span className="text-green-600 ml-1">
                    ✅ Item atualizado {updateCount} vez(es) com uploads reais!
                  </span>
                ) : (
                  <span className="text-blue-600 ml-1">
                    🧪 Aguardando teste - Capture evidências e salve o item
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Debug */}
        {item.fotos_videos && item.fotos_videos.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <span className="text-lg">🎯</span> Evidências Enviadas ao Backend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-green-700">
                  <strong>Total:</strong> {item.fotos_videos.length} arquivo(s) enviado(s) com sucesso
                </p>
                
                <div className="space-y-2">
                  {item.fotos_videos.map((arquivo: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded border border-green-200">
                      <div className="text-xs text-green-700 space-y-1">
                        <div><strong>ID:</strong> {arquivo.id}</div>
                        <div><strong>Nome:</strong> {arquivo.nome}</div>
                        <div><strong>URL:</strong> {arquivo.url}</div>
                        <div><strong>Tipo:</strong> {arquivo.tipo_evidencia}</div>
                        <div><strong>Tamanho:</strong> {Math.round(arquivo.tamanho / 1024)}KB</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Erro de Upload */}
        {item.upload_error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-medium">Erro no Upload</p>
                  <p className="text-sm text-red-600">{item.upload_error}</p>
                  <p className="text-xs text-red-500 mt-1">
                    Os dados foram salvos localmente e serão sincronizados posteriormente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <span className="text-lg">📋</span> Como Testar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm text-blue-700 space-y-2">
              <li><strong>1.</strong> Certifique-se que o backend AdonisJS está rodando (localhost:3333)</li>
              <li><strong>2.</strong> Preencha o campo "Número de Série Executado"</li>
              <li><strong>3.</strong> Capture pelo menos 1 foto do número de série</li>
              <li><strong>4.</strong> Preencha o campo "Local de Instalação Executado"</li>
              <li><strong>5.</strong> Capture pelo menos 1 foto do local de instalação</li>
              <li><strong>6.</strong> Clique em "Salvar e Concluir Item"</li>
              <li><strong>7.</strong> Observe o progresso de upload em tempo real</li>
              <li><strong>8.</strong> Verifique as evidências enviadas ao backend acima</li>
            </ol>
          </CardContent>
        </Card>

        {/* Item de Teste */}
        <ItemDetail
          item={item}
          readOnly={false}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
} 