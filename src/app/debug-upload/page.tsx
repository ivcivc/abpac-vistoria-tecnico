'use client';

import { useState } from 'react';
import { UploadService } from '@/services/uploadService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      addLog(`📁 Arquivo selecionado: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)}KB)`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      addLog('❌ Nenhum arquivo selecionado');
      return;
    }

    setUploading(true);
    addLog('🚀 Iniciando upload...');

    try {
      const uploadResult = await UploadService.uploadFile(file, {
        tipo: 'test',
        referencia: 'debug_test',
        onProgress: (progress) => {
          addLog(`📊 Progresso: ${progress.percentage}% (${progress.loaded}/${progress.total} bytes)`);
        }
      });

      if (uploadResult.success) {
        addLog(`✅ Upload concluído com sucesso!`);
        setResult(uploadResult);
      } else {
        addLog(`❌ Erro no upload: ${uploadResult.error}`);
        setResult(uploadResult);
      }
    } catch (error) {
      addLog(`💥 Erro inesperado: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const testBackend = async () => {
    addLog('🔍 Testando backend...');
    try {
      const response = await fetch('http://localhost:3333/api/upload-simple', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Backend OK: ${JSON.stringify(data)}`);
      } else {
        addLog(`❌ Backend erro ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Backend offline: ${error}`);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setLogs([]);
    setUploading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <span className="text-xl">🐛</span> Debug Upload - Teste Simples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={testBackend} variant="outline" size="sm">
              🔍 Testar Backend
            </Button>
            <Button onClick={reset} variant="outline" size="sm">
              🔄 Reset
            </Button>
          </div>
          
          <p className="text-sm text-red-700">
            Esta página testa APENAS o upload de arquivo, sem MediaCapture ou outros componentes.
          </p>
        </CardContent>
      </Card>

      {/* File Input */}
      <Card>
        <CardHeader>
          <CardTitle>1. Selecionar Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mb-4"
          />
          
          {file && (
            <div className="p-3 bg-gray-100 rounded">
              <p><strong>Arquivo:</strong> {file.name}</p>
              <p><strong>Tamanho:</strong> {Math.round(file.size / 1024)}KB</p>
              <p><strong>Tipo:</strong> {file.type}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Button */}
      <Card>
        <CardHeader>
          <CardTitle>2. Fazer Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? '⏳ Enviando...' : '📤 Enviar Arquivo'}
          </Button>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>3. Logs de Debug ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
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

      {/* Result */}
      {result && (
        <Card className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={result.success ? "text-green-800" : "text-red-800"}>
              4. Resultado do Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 