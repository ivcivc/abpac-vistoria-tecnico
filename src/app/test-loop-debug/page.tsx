'use client';

import { useAuth } from '@/contexts/SimpleAuthContext';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function TestLoopDebugPage() {
  const { authState, logout } = useAuth();
  const [navigationLog, setNavigationLog] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Monitor navigation changes
  useEffect(() => {
    if (isMonitoring) {
      addToLog(`📍 Navegação detectada: ${pathname}`);
    }
  }, [pathname, isMonitoring]);

  // Monitor auth state changes
  useEffect(() => {
    if (isMonitoring) {
      addToLog(`🔐 Estado auth mudou: authenticated=${authState.isAuthenticated}, token=${authState.token ? 'presente' : 'ausente'}, name=${authState.technicianName || 'null'}`);
    }
  }, [authState.isAuthenticated, authState.token, authState.technicianName, isMonitoring]);

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setNavigationLog(prev => [...prev.slice(-20), `${timestamp}: ${message}`]); // Keep only last 20 entries
  };

  const startMonitoring = () => {
    setNavigationLog([]);
    setIsMonitoring(true);
    addToLog('🚀 Monitoramento iniciado');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    addToLog('🛑 Monitoramento parado');
  };

  const testNavigationFlow = () => {
    addToLog('🧪 Testando fluxo de navegação...');
    addToLog('📍 Tentando ir para página inicial (/)');
    router.push('/');
  };

  const testLoginPage = () => {
    addToLog('🔐 Navegando para /login');
    router.push('/login');
  };

  const testDashboard = () => {
    addToLog('📊 Tentando acessar /dashboard');
    router.push('/dashboard');
  };

  const clearState = () => {
    addToLog('🧹 Limpando estado...');
    logout();
    addToLog('✅ Estado limpo');
  };

  const clearLog = () => {
    setNavigationLog([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600">
            🔄 Debug de Loop Infinito
          </h1>
          <p className="text-gray-600 mt-2">
            Monitoramento de navegação e estado de autenticação
          </p>
        </div>

        {/* Estado Atual */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Estado Atual:
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><strong>Página atual:</strong> 
                <span className="text-blue-600 font-mono">
                  {pathname}
                </span>
              </p>
              <p><strong>isAuthenticated:</strong> 
                <span className={authState.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {authState.isAuthenticated ? '✅ Sim' : '❌ Não'}
                </span>
              </p>
              <p><strong>initialized:</strong> 
                <span className={authState.initialized ? 'text-green-600' : 'text-red-600'}>
                  {authState.initialized ? '✅ Sim' : '❌ Não'}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <p><strong>token:</strong> 
                <span className={authState.token ? 'text-green-600' : 'text-red-600'}>
                  {authState.token ? '✅ Presente' : '❌ Ausente'}
                </span>
              </p>
              <p><strong>technicianName:</strong> 
                <span className={authState.technicianName ? 'text-green-600' : 'text-gray-500'}>
                  {authState.technicianName || 'null'}
                </span>
              </p>
              <p><strong>Monitorando:</strong> 
                <span className={isMonitoring ? 'text-green-600' : 'text-gray-500'}>
                  {isMonitoring ? '🟢 Ativo' : '⚪ Inativo'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🎛️ Controles de Teste:
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={startMonitoring}
              disabled={isMonitoring}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              🚀 Iniciar Monitoramento
            </button>
            
            <button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400"
            >
              🛑 Parar Monitoramento
            </button>
            
            <button
              onClick={testNavigationFlow}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              🏠 Testar Home (/)
            </button>
            
            <button
              onClick={testLoginPage}
              className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              🔐 Ir para Login
            </button>
            
            <button
              onClick={testDashboard}
              className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
            >
              📊 Testar Dashboard
            </button>
            
            <button
              onClick={clearState}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              🧹 Limpar Estado
            </button>
          </div>
        </div>

        {/* Log de Navegação */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📋 Log de Navegação:
            </h2>
            <button
              onClick={clearLog}
              className="bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600"
            >
              🗑️ Limpar Log
            </button>
          </div>
          
          <div className="bg-gray-50 border rounded p-4 max-h-96 overflow-y-auto">
            {navigationLog.map((log, index) => (
              <div key={index} className={`text-sm border-b border-gray-200 pb-1 mb-1 ${
                log.includes('Loop detectado') ? 'text-red-600 font-bold' : 
                log.includes('📍') ? 'text-blue-600' :
                log.includes('🔐') ? 'text-purple-600' :
                'text-gray-700'
              }`}>
                {log}
              </div>
            ))}
            {navigationLog.length === 0 && (
              <p className="text-gray-500 text-center">
                {isMonitoring ? 'Aguardando eventos...' : 'Clique em "Iniciar Monitoramento" para começar'}
              </p>
            )}
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">
            📝 Como Usar:
          </h2>
          
          <ol className="text-yellow-700 space-y-2">
            <li><strong>1. Iniciar Monitoramento:</strong> Clique em "🚀 Iniciar Monitoramento"</li>
            <li><strong>2. Testar Navegação:</strong> Clique em "🏠 Testar Home (/)" para ver se há loop</li>
            <li><strong>3. Observar Log:</strong> Veja se há redirecionamentos repetitivos</li>
            <li><strong>4. Se houver loop:</strong> Aparecerá navegação repetida entre /login e /dashboard</li>
            <li><strong>5. Limpar Estado:</strong> Use "🧹 Limpar Estado" para resetar tudo</li>
          </ol>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className={`inline-block px-4 py-2 rounded-lg text-white font-bold ${
            isMonitoring ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            {isMonitoring ? '🟢 MONITORANDO - Teste o fluxo agora!' : '⚪ PARADO - Clique para iniciar'}
          </div>
        </div>
      </div>
    </div>
  );
} 