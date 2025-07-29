import { IndexedDBDebug } from '@/components/debug/IndexedDBDebug';

export default function DebugDBPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Debug do IndexedDB
          </h1>
          <p className="text-gray-600">
            Ferramenta para diagnosticar e corrigir problemas do banco de dados local
          </p>
        </div>
        
        <IndexedDBDebug />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💡 Acesse: <code className="bg-gray-100 px-2 py-1 rounded">/debug-db</code> para usar esta ferramenta
          </p>
        </div>
      </div>
    </div>
  );
}