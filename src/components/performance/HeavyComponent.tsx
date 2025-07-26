'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Simulação de operação pesada para demonstrar melhoria de performance
function simulateHeavyOperation(iterations: number): number[] {
  console.time('heavyOperation');
  
  // Array para armazenar resultados
  const results: number[] = [];
  
  // Simulação de cálculos intensivos
  for (let i = 0; i < iterations; i++) {
    // Cálculo de números primos (ineficiente propositalmente)
    const isPrime = (num: number): boolean => {
      for (let i = 2; i < num; i++) {
        if (num % i === 0) return false;
      }
      return num > 1;
    };
    
    // Encontrar o próximo número primo após i*100
    let nextPrime = i * 100;
    while (!isPrime(++nextPrime)) {}
    
    // Calcular a raiz quadrada e adicionar ao array
    results.push(Math.sqrt(nextPrime));
  }
  
  console.timeEnd('heavyOperation');
  return results;
}

// Componente com renderização pesada
export default function HeavyComponent() {
  const [results, setResults] = useState<number[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iterations, setIterations] = useState(100);
  
  // Executar cálculos pesados com feedback de progresso
  const runHeavyCalculation = () => {
    setIsCalculating(true);
    setProgress(0);
    
    // Usar setTimeout para não bloquear a UI
    setTimeout(() => {
      // Dividir o trabalho em chunks para mostrar progresso
      const chunkSize = 10;
      const totalChunks = Math.ceil(iterations / chunkSize);
      let currentChunk = 0;
      let allResults: number[] = [];
      
      const processChunk = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min((currentChunk + 1) * chunkSize, iterations);
        
        // Simular operação pesada para este chunk
        const chunkResults = simulateHeavyOperation(end - start);
        allResults = [...allResults, ...chunkResults];
        
        // Atualizar progresso
        currentChunk++;
        const newProgress = Math.floor((currentChunk / totalChunks) * 100);
        setProgress(newProgress);
        
        // Continuar para o próximo chunk ou finalizar
        if (currentChunk < totalChunks) {
          setTimeout(processChunk, 0);
        } else {
          setResults(allResults);
          setIsCalculating(false);
        }
      };
      
      // Iniciar processamento
      processChunk();
    }, 100);
  };
  
  // Executar cálculo inicial na montagem do componente
  useEffect(() => {
    runHeavyCalculation();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader className="bg-slate-50">
        <CardTitle className="text-lg">Componente com Carga Computacional Pesada</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="mb-4">
          <p className="text-sm text-slate-600 mb-2">
            Este componente executa cálculos intensivos para demonstrar como o lazy loading
            melhora a performance inicial da aplicação, carregando componentes pesados apenas
            quando necessário.
          </p>
          
          {isCalculating ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Calculando números primos e raízes quadradas...</p>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-500">{progress}% concluído</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={runHeavyCalculation}>Recalcular</Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Iterações:</span>
                  <select 
                    value={iterations} 
                    onChange={(e) => setIterations(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={50}>50 (Rápido)</option>
                    <option value={100}>100 (Médio)</option>
                    <option value={200}>200 (Lento)</option>
                    <option value={500}>500 (Muito Lento)</option>
                  </select>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Resultados ({results.length})</h4>
                <div className="text-xs bg-slate-50 p-2 rounded h-[100px] overflow-y-auto">
                  <div className="grid grid-cols-5 gap-2">
                    {results.slice(0, 50).map((result, index) => (
                      <div key={index} className="font-mono">
                        {result.toFixed(4)}
                      </div>
                    ))}
                    {results.length > 50 && (
                      <div className="col-span-5 text-center text-slate-500">
                        ... e mais {results.length - 50} resultados
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-slate-500 mt-4">
          <p className="font-medium">Informações técnicas:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Este componente foi carregado dinamicamente com <code>dynamic import</code></li>
            <li>Tamanho do bundle separado: ~5KB</li>
            <li>Carregado apenas quando necessário</li>
            <li>Skeleton mostrado durante o carregamento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 