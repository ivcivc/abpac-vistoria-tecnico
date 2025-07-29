/**
 * Utilitário para limpar completamente o IndexedDB
 * Usado quando há problemas de migração de schema
 */

export async function clearIndexedDB(): Promise<void> {
  console.log('🗑️ Iniciando limpeza completa do IndexedDB...');
  
  try {
    // Nome do banco usado no sistema
    const dbName = 'VistoriaABPAC';
    
    // Fechar todas as conexões abertas
    console.log('🔒 Fechando conexões abertas...');
    
    // Deletar o banco completamente
    console.log('💥 Deletando banco de dados...');
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    
    return new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => {
        console.log('✅ Banco de dados deletado com sucesso');
        console.log('🔄 Próxima inicialização criará um banco limpo');
        resolve();
      };
      
      deleteRequest.onerror = (event) => {
        console.error('❌ Erro ao deletar banco:', event);
        reject(new Error('Falha ao deletar banco de dados'));
      };
      
      deleteRequest.onblocked = () => {
        console.warn('⚠️ Operação bloqueada - feche outras abas do sistema');
        // Tentar mesmo assim
        setTimeout(() => resolve(), 1000);
      };
    });
    
  } catch (error) {
    console.error('❌ Erro na limpeza do IndexedDB:', error);
    throw error;
  }
}

/**
 * Verifica se o banco precisa ser limpo
 */
export async function checkIndexedDBHealth(): Promise<boolean> {
  try {
    const dbName = 'VistoriaABPAC';
    const dbVersion = 4; // Versão atual
    
    return new Promise((resolve) => {
      const request = indexedDB.open(dbName, dbVersion);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Verificar se todas as stores necessárias existem
        const requiredStores = [
          'vistorias',
          'vistorias-locais', 
          'itens',
          'evidencias',
          'evidence-metadata',
          'despesas', // Esta é a crítica
          'sync-queue',
          'config'
        ];
        
        const availableStores = Array.from(db.objectStoreNames);
        const missingStores = requiredStores.filter(store => !availableStores.includes(store));
        
        console.log('🔍 Health Check IndexedDB:');
        console.log('  - Stores disponíveis:', availableStores);
        console.log('  - Stores necessárias:', requiredStores);
        console.log('  - Stores faltando:', missingStores);
        
        db.close();
        
        // Se tem stores faltando, precisa limpar
        resolve(missingStores.length === 0);
      };
      
      request.onerror = () => {
        console.log('❌ Erro ao verificar saúde do banco - precisa limpar');
        resolve(false);
      };
    });
    
  } catch (error) {
    console.error('❌ Erro no health check:', error);
    return false;
  }
}

/**
 * Função de conveniência para limpar e recarregar
 */
export async function clearAndReload(): Promise<void> {
  await clearIndexedDB();
  
  // Aguardar um pouco para garantir que a limpeza foi concluída
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Recarregar a página para reinicializar tudo
  if (typeof window !== 'undefined') {
    console.log('🔄 Recarregando página para aplicar mudanças...');
    window.location.reload();
  }
}