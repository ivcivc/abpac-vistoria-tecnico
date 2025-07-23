'use client';

import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestDashboardPage() {
  const { authState, setTechnicianName } = useAuth();
  const { name, isAuthenticated } = useTechnician();
  const [updateCount, setUpdateCount] = useState(0);
  const router = useRouter();

  // Force re-render para mostrar mudanças em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateCount(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const testSetTechnicianName = () => {
    const testName = 'João Silva';
    console.log('🧪 [TEST] ANTES de definir nome:');
    console.log('  - authState:', authState);
    console.log('  - authState.technicianName:', authState.technicianName);
    console.log('  - useTechnician().name:', name);
    
    // ADICIONAR: Salvar no localStorage para debug
    localStorage.setItem('debug_technician_name', testName);
    localStorage.setItem('debug_set_at', new Date().toISOString());
    
    setTechnicianName(testName);
    
    // Aguardar um pouco e verificar novamente
    setTimeout(() => {
      console.log('🧪 [TEST] DEPOIS de definir nome (500ms):');
      console.log('  - authState:', authState);
      console.log('  - authState.technicianName:', authState.technicianName);
      console.log('  - useTechnician().name:', name);
      console.log('  - localStorage debug_technician_name:', localStorage.getItem('debug_technician_name'));
    }, 500);
    
    alert(`✅ Nome definido: ${testName}\n\n📋 PRÓXIMOS PASSOS:\n1. Veja o console (F12)\n2. Verifique se o nome mudou abaixo\n3. Clique em "Ir para Dashboard"`);
  };

  const goToDashboard = () => {
    console.log('🧪 [TEST] NAVEGANDO para dashboard com:');
    console.log('  - authState.technicianName:', authState.technicianName);
    console.log('  - useTechnician().name:', name);
    console.log('  - localStorage debug_technician_name:', localStorage.getItem('debug_technician_name'));
    
    // CORRIGIDO: Usar router.push ao invés de window.location.href
    router.push('/dashboard');
  };

  const goToDashboardReload = () => {
    console.log('🧪 [TEST] NAVEGANDO com RELOAD para dashboard:');
    localStorage.setItem('debug_navigation_method', 'window.location.href');
    window.location.href = '/dashboard';
  };

  const forceRefresh = () => {
    setUpdateCount(prev => prev + 1);
  };

  const clearDebugData = () => {
    localStorage.removeItem('debug_technician_name');
    localStorage.removeItem('debug_set_at');
    localStorage.removeItem('debug_navigation_method');
    alert('🗑️ Dados de debug limpos!');
  };

  // Verificar dados de debug do localStorage
  const debugTechnicianName = typeof window !== 'undefined' ? localStorage.getItem('debug_technician_name') : null;
  const debugSetAt = typeof window !== 'undefined' ? localStorage.getItem('debug_set_at') : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            🧪 Debug Nome do Técnico (Updates: {updateCount})
          </h1>
          
          <div className="space-y-6">
            {/* Debug do localStorage */}
            {debugTechnicianName && (
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-purple-800 mb-2">
                  Debug LocalStorage:
                </h2>
                <div className="text-sm text-purple-700 space-y-1 font-mono">
                  <p><strong>debug_technician_name:</strong> {debugTechnicianName}</p>
                  <p><strong>debug_set_at:</strong> {debugSetAt}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                Estado Atual do Contexto (Tempo Real):
              </h2>
              <div className="text-sm text-blue-700 space-y-1 font-mono">
                <p><strong>authState.technicianName:</strong> 
                  <span className={authState.technicianName ? 'text-green-600 font-bold' : 'text-red-600'}>
                    {authState.technicianName || 'null'}
                  </span>
                </p>
                <p><strong>useTechnician().name:</strong> 
                  <span className={name ? 'text-green-600 font-bold' : 'text-red-600'}>
                    {name || 'null'}
                  </span>
                </p>
                <p><strong>isAuthenticated:</strong> 
                  <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {isAuthenticated ? 'Sim' : 'Não'}
                  </span>
                </p>
                <p><strong>authState.isAuthenticated:</strong> 
                  <span className={authState.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {authState.isAuthenticated ? 'Sim' : 'Não'}
                  </span>
                </p>
                <p><strong>currentVistoria:</strong> 
                  <span className={authState.currentVistoria ? 'text-green-600' : 'text-orange-600'}>
                    {authState.currentVistoria ? 'Presente' : 'Ausente'}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                Teste do Nome do Técnico:
              </h2>
              <p className="text-green-700 text-sm mb-4">
                Este teste define um nome de técnico e monitora se o estado muda em tempo real.
              </p>
              <div className="space-y-2">
                <button
                  onClick={testSetTechnicianName}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  🧪 Definir Nome: "João Silva"
                </button>
                <button
                  onClick={forceRefresh}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
                >
                  🔄 Forçar Atualização da Tela
                </button>
                <button
                  onClick={goToDashboard}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  📊 Ir para Dashboard (router.push)
                </button>
                <button
                  onClick={goToDashboardReload}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  📊 Ir para Dashboard (window.location)
                </button>
                <button
                  onClick={clearDebugData}
                  className="w-full bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500"
                >
                  🗑️ Limpar Debug
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                Como Debugar:
              </h2>
              <ol className="text-yellow-700 text-sm space-y-1">
                <li>1. Abra o Console (F12)</li>
                <li>2. Clique em "🧪 Definir Nome: João Silva"</li>
                <li>3. Verifique se o nome mudou na seção azul acima</li>
                <li>4. Teste navegação com router.push (azul) vs window.location (vermelho)</li>
                <li>5. Se mudou aqui mas não no dashboard, é problema de navegação/contexto</li>
              </ol>
            </div>

            <div className="space-y-2">
              <a 
                href="/login" 
                className="block text-center bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                Voltar ao Login
              </a>
              <a 
                href="/status" 
                className="block text-center bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
              >
                Status do Sistema
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
