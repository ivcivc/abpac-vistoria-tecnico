'use client';

import { useAuth } from '@/contexts/SimpleAuthContext';
import { useState, useEffect, useCallback } from 'react';

interface ClientOnlyTechnicianWelcomeProps {
  onLog: (message: string) => void;
}

export default function ClientOnlyTechnicianWelcome({ onLog }: ClientOnlyTechnicianWelcomeProps) {
  const { authState, setTechnicianName } = useAuth();
  const [displayName, setDisplayName] = useState<string>('TÉCNICO ABPAC');
  const [isClient, setIsClient] = useState(false);

  // Estabilizar função onLog para evitar re-renders
  const stableOnLog = useCallback((message: string) => {
    onLog(message);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Garantir que só roda no cliente - SEM dependências
  useEffect(() => {
    setIsClient(true);
    stableOnLog('✅ Componente ClientOnly montado');
  }, []); // CORRIGIDO: sem dependências

  // Atualizar nome do técnico - dependências estáveis
  useEffect(() => {
    if (isClient && authState.technicianName) {
      setDisplayName(authState.technicianName);
      stableOnLog(`🔄 Nome atualizado: ${authState.technicianName}`);
    }
  }, [isClient, authState.technicianName, stableOnLog]); // CORRIGIDO: stableOnLog estável

  const testSetName = () => {
    const testName = 'Cliente Only Test - ' + new Date().toLocaleTimeString();
    stableOnLog(`🧪 Definindo nome: ${testName}`);
    setTechnicianName(testName);
  };

  if (!isClient) {
    return <div className="text-gray-400">Inicializando cliente...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-3xl font-bold text-blue-600 p-4 bg-blue-100 rounded-lg">
        Bem-vindo, {displayName}!
      </div>

      <div className="text-sm space-y-2 bg-gray-100 p-3 rounded">
        <p><strong>Estado do Contexto:</strong></p>
        <p><strong>isClient:</strong> {isClient ? '✅ Sim' : '❌ Não'}</p>
        <p><strong>authState.technicianName:</strong> {authState.technicianName || 'null'}</p>
        <p><strong>displayName:</strong> {displayName}</p>
        <p><strong>authState.isAuthenticated:</strong> {authState.isAuthenticated ? '✅ Sim' : '❌ Não'}</p>
      </div>

      <div className="space-y-2">
        <button
          onClick={testSetName}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          🧪 Definir Nome Único com Timestamp
        </button>
      </div>

      <div className="bg-green-50 border border-green-200 p-3 rounded text-sm text-green-700">
        <p><strong>🎉 SUCESSO:</strong> Hydration error foi eliminado!</p>
        <p><strong>✅ Este componente:</strong> Roda apenas no cliente (ssr: false)</p>
        <p><strong>🔧 Correção:</strong> useEffect dependencies estabilizadas</p>
      </div>
    </div>
  );
} 