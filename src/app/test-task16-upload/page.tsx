'use client';

import { useState } from 'react';
import { ItemDetail } from '@/components/vistoria/ItemDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TestTask16UploadPage() {
  // Item simulado para teste (usando any para evitar conflitos de tipo em teste)
  const [item, setItem] = useState<any>({
    id: 'TEST_ITEM_001',
    vistoriaId: 'TEST_VISTORIA_001',
    acao: 'INSTALAR',
    tipo: 'LOCALIZADOR',
    categoria: {
      id: 1,
      nome: 'Rastreador GPS',
      categoria: 'LOCALIZADOR'
    },
    fabricante: {
      id: 1,
      nome: 'Tecnologia Teste LTDA'
    },
    modelo: 'Teste Model',
    numeroSerie: 'ABC123TEST',
    status: 'PENDENTE',
    local_instalacao_planejado: 'Porta do motorista',
    numero_serie_planejado: 'ABC123TEST',
    observacoes_planejadas: 'Teste de upload de evidências',
    status_item: 'PENDENTE',
    local_instalacao_executado: '',
    numero_serie_executado: '',
    observacoes_tecnico: '',
    fotos_videos: [],
    despesas: [],
    upload_error: undefined
  });

  const [updateCount, setUpdateCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const handleUpdate = (updatedItem: any) => {
    addLog('🔄 Item sendo atualizado...');
    
    // Verificar se houve uploads bem-sucedidos
    if (updatedItem.fotos_videos && updatedItem.fotos_videos.length > 0) {
      addLog(`✅ Upload concluído! ${updatedItem.fotos_videos.length} arquivo(s) enviado(s)`);
      setUploadResults(updatedItem.fotos_videos);
    }
    
    // Verificar se houve erro de upload
    if (updatedItem.upload_error) {
      addLog(`❌ Erro no upload: ${updatedItem.upload_error}`);
    }
    
    // Verificar se o item foi concluído
    if (updatedItem.status === 'CONCLUIDO' || updatedItem.concluido) {
      addLog(`🎯 Item marcado como CONCLUÍDO`);
    }
    
    setItem(updatedItem);
    setUpdateCount(prev => prev + 1);
    setIsUploading(false);
  };

  const resetItem = () => {
    addLog('🔄 Reset do item de teste...');
    setItem((prev: any) => ({
      ...prev,
      status_item: 'PENDENTE',
      local_instalacao_executado: '',
      numero_serie_executado: '',
      observacoes_tecnico: '',
      fotos_videos: [],
      despesas: [],
      upload_error: undefined
    }));
    setUpdateCount(0);
    setLogs([]);
    setUploadResults([]);
  };

  const testBackendConnection = async () => {
    addLog('🔍 Testando conexão com backend...');
    try {
      const response = await fetch('http://localhost:3333/api/upload-simple', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Backend conectado! Resposta: ${JSON.stringify(data)}`);
      } else {
        addLog(`❌ Backend retornou erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      addLog(`❌ Erro de conexão com backend: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <span className="text-xl">🧪</span> Task 16 - Teste de Upload Real
              <Badge variant="secondary" className="ml-auto">
                v2.0 - Melhorado
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button 
                onClick={resetItem} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                🔄 Reset Teste
              </Button>
              <Button 
                onClick={testBackendConnection} 
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                🔍 Testar Backend
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>🔧</span> Implementações:
                </h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• UploadService - Conecta com /api/upload-simple</li>
                  <li>• ItemDetail - Upload automático ao salvar</li>
                  <li>• Progresso de upload em tempo real</li>
                  <li>• Estrutura fotos_videos compatível com backend</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <span>⚡</span> Status:
                </h4>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span>Updates:</span>
                    <Badge variant={updateCount > 0 ? "default" : "secondary"}>
                      {updateCount}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Upload:</span>
                    <Badge variant={isUploading ? "destructive" : uploadResults.length > 0 ? "default" : "secondary"}>
                      {isUploading ? "Em andamento..." : uploadResults.length > 0 ? `${uploadResults.length} enviados` : "Aguardando"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs em Tempo Real */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <span className="text-lg">📋</span> Logs de Debug
              <Badge variant="outline" className="ml-auto">
                {logs.length} logs
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-40 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">Aguardando ações...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados do Upload */}
        {uploadResults.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <span className="text-lg">🎯</span> Arquivos Enviados ao Backend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-green-700">
                  <strong>Total:</strong> {uploadResults.length} arquivo(s) enviado(s) com sucesso
                </p>
                
                <div className="space-y-2">
                  {uploadResults.map((arquivo: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded border border-green-200">
                      <div className="text-xs text-green-700 space-y-1">
                        <div><strong>ID:</strong> {arquivo.id}</div>
                        <div><strong>Nome:</strong> {arquivo.nome}</div>
                        <div><strong>URL:</strong> {arquivo.url}</div>
                        <div><strong>Tipo:</strong> {arquivo.tipo_evidencia || arquivo.tipo}</div>
                        <div><strong>Tamanho:</strong> {Math.round((arquivo.tamanho || 1024) / 1024)}KB</div>
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
              <li><strong>1.</strong> Clique em "🔍 Testar Backend" para verificar conexão</li>
              <li><strong>2.</strong> Preencha o campo "Número de Série Executado"</li>
              <li><strong>3.</strong> Capture pelo menos 1 foto do número de série</li>
              <li><strong>4.</strong> Preencha o campo "Local de Instalação Executado"</li>
              <li><strong>5.</strong> Capture pelo menos 1 foto do local de instalação</li>
              <li><strong>6.</strong> Clique em "Salvar e Concluir Item"</li>
              <li><strong>7.</strong> Observe os logs de debug acima</li>
              <li><strong>8.</strong> Verifique os arquivos enviados (se aparecerem)</li>
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