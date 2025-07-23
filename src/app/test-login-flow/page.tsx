'use client';

import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestLoginFlowPage() {
  const { authState, logout, validateToken, setTechnicianName } = useAuth();
  const { name, isAuthenticated } = useTechnician();
  const [flowLog, setFlowLog] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    addLog('📱 Página de teste carregada');
    addLog(`🔐 Estado atual: ${authState.isAuthenticated ? 'Autenticado' : 'Não autenticado'}`);
    addLog(`👤 Nome técnico: ${authState.technicianName || 'null'}`);
    addLog(`🎯 Token presente: ${authState.token ? 'Sim' : 'Não'}`);
    addLog(`⚡ Inicializado: ${authState.initialized ? 'Sim' : 'Não'}`);
  }, [authState]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setFlowLog(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const testTokenLogin = () => {
    const testToken = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';
    addLog(`🧪 Testando login com token: ${testToken.substring(0, 20)}...`);
    
    validateToken(testToken).then((result) => {
      addLog(`✅ Token validado com sucesso`);
      addLog(`📋 Dados recebidos: ${JSON.stringify(result).substring(0, 100)}...`);
    }).catch((error) => {
      addLog(`❌ Erro na validação: ${error.message}`);
    });
  };

  const testTechnicianName = () => {
    const testName = 'Técnico Teste - ' + new Date().toLocaleTimeString();
    addLog(`👤 Definindo nome técnico: ${testName}`);
    setTechnicianName(testName);
  };

  const testLogout = () => {
    addLog('🚪 Fazendo logout para limpar estado...');
    logout();
    addLog('✅ Logout realizado - estado deve estar limpo');
  };

  const testGoHome = () => {
    addLog('🏠 Navegando para página inicial (/)');
    router.push('/');
  };

  const testGoLogin = () => {
    addLog('🔐 Navegando para página de login');
    router.push('/login');
  };

  const testGoLoginWithToken = () => {
    const testToken = '1da66df8d2b911ed2007a7923ae6b79ce8eb6067ad7308453976e5cd3e7427cf';
    const loginUrl = `/login?token=${testToken}`;
    addLog(`🎯 Navegando para login com token: ${loginUrl}`);
    router.push(loginUrl);
  };

  const testGoDashboard = () => {
    addLog('📊 Tentando acessar dashboard diretamente');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🔬 Teste do Fluxo de Login
          </h1>
          <p className="text-gray-600 mt-2">
            Verificando por que usuários podem estar pulando o login por token
          </p>
        </div>

        {/* Estado Atual */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Estado Atual do Sistema:
          </h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
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
              <p><strong>loading:</strong> 
                <span className={authState.loading ? 'text-orange-600' : 'text-green-600'}>
                  {authState.loading ? '🔄 Carregando' : '✅ Pronto'}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <p><strong>technicianName:</strong> 
                <span className={authState.technicianName ? 'text-blue-600 font-bold' : 'text-gray-500'}>
                  {authState.technicianName || 'null'}
                </span>
              </p>
              <p><strong>token:</strong> 
                <span className={authState.token ? 'text-purple-600' : 'text-gray-500'}>
                  {authState.token ? authState.token.substring(0, 15) + '...' : 'null'}
                </span>
              </p>
              <p><strong>currentVistoria:</strong> 
                <span className={authState.currentVistoria ? 'text-green-600' : 'text-gray-500'}>
                  {authState.currentVistoria ? 'Presente' : 'null'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Testes de Login */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🧪 Testes de Login:
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={testTokenLogin}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              🔑 Testar Validação Token
            </button>
            
            <button
              onClick={testTechnicianName}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              👤 Definir Nome Técnico
            </button>
            
            <button
              onClick={testLogout}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            >
              🚪 Logout (Limpar Estado)
            </button>
            
            <button
              onClick={() => setFlowLog([])}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              🗑️ Limpar Log
            </button>
          </div>
        </div>

        {/* Testes de Navegação */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🧭 Testes de Navegação:
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={testGoHome}
              className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              🏠 Ir para Home (/)
            </button>
            
            <button
              onClick={testGoLogin}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              🔐 Ir para Login
            </button>
            
            <button
              onClick={testGoLoginWithToken}
              className="bg-cyan-500 text-white py-2 px-4 rounded hover:bg-cyan-600"
            >
              🎯 Login COM Token
            </button>
            
            <button
              onClick={testGoDashboard}
              className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
            >
              📊 Dashboard Direto
            </button>
          </div>
        </div>

        {/* Log de Fluxo */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📋 Log do Fluxo:
          </h2>
          
          <div className="bg-gray-50 border rounded p-4 max-h-64 overflow-y-auto">
            {flowLog.map((log, index) => (
              <div key={index} className="text-sm text-gray-700 border-b border-gray-200 pb-1 mb-1">
                {log}
              </div>
            ))}
            {flowLog.length === 0 && (
              <p className="text-gray-500 text-center">Execute um teste para ver o log...</p>
            )}
          </div>
        </div>

        {/* Como Testar */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">
            📝 Como Testar o Fluxo Correto:
          </h2>
          
          <ol className="text-yellow-700 space-y-2">
            <li><strong>1. Limpar Estado:</strong> Clique em "🚪 Logout (Limpar Estado)"</li>
            <li><strong>2. Testar Home:</strong> Clique em "🏠 Ir para Home (/)" - deve redirecionar para login</li>
            <li><strong>3. Testar Login com Token:</strong> Clique em "🎯 Login COM Token" - deve validar e pedir nome</li>
            <li><strong>4. Verificar Dashboard:</strong> Após identificação, deve ir para dashboard com nome correto</li>
            <li><strong>5. Testar Persistência:</strong> Recarregue a página - deve manter autenticação</li>
          </ol>
        </div>

        {/* Links Rápidos */}
        <div className="text-center space-x-4">
          <a href="/test-final-success" className="text-blue-600 hover:underline">🎉 Página de Sucesso</a>
          <a href="/dashboard" className="text-green-600 hover:underline">📊 Dashboard</a>
          <a href="/login" className="text-purple-600 hover:underline">🔐 Login</a>
        </div>
      </div>
    </div>
  );
} 