'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface PerformanceMetricsProps {
  itemCount: number;
}

// Componente para demonstrar memoização e otimização de performance
export default function PerformanceMetrics({ itemCount }: PerformanceMetricsProps) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [renderTimes, setRenderTimes] = useState<{ memoized: number; nonMemoized: number }>({
    memoized: 0,
    nonMemoized: 0
  });
  const [nonMemoizedResult, setNonMemoizedResult] = useState<number>(0);
  
  // Função para calcular a soma dos números primos até n (ineficiente propositalmente)
  const calculatePrimeSum = (n: number): number => {
    console.time('calculation');
    
    const isPrime = (num: number): boolean => {
      for (let i = 2; i < num; i++) {
        if (num % i === 0) return false;
      }
      return num > 1;
    };
    
    let sum = 0;
    for (let i = 2; i <= n; i++) {
      if (isPrime(i)) {
        sum += i;
      }
    }
    
    console.timeEnd('calculation');
    return sum;
  };
  
  // Versão memoizada - calcula apenas quando itemCount muda
  const memoizedResult = useMemo(() => {
    const startTime = performance.now();
    const result = calculatePrimeSum(itemCount);
    const endTime = performance.now();
    
    setRenderTimes(prev => ({ ...prev, memoized: endTime - startTime }));
    return result;
  }, [itemCount]);
  
  // Usar useEffect para calcular a versão não memoizada para evitar loop infinito
  useEffect(() => {
    const startTime = performance.now();
    const result = calculatePrimeSum(itemCount);
    const endTime = performance.now();
    
    setNonMemoizedResult(result);
    setRenderTimes(prev => ({ ...prev, nonMemoized: endTime - startTime }));
  }, [itemCount, refreshCount]); // Recalcular quando itemCount ou refreshCount mudar
  
  // Função memoizada para forçar recálculo
  const handleRefresh = useCallback(() => {
    setRefreshCount(prev => prev + 1);
  }, []);
  
  // Calcular ganho de performance
  const performanceGain = renderTimes.nonMemoized > 0 
    ? ((renderTimes.nonMemoized - renderTimes.memoized) / renderTimes.nonMemoized) * 100 
    : 0;
  
  // Calcular métricas adicionais
  const metrics = useMemo(() => {
    return {
      averagePrime: memoizedResult / (itemCount / 2),
      density: (memoizedResult / (itemCount * itemCount)) * 100
    };
  }, [memoizedResult, itemCount]);
  
  return (
    <Card className="w-full">
      <CardHeader className="bg-slate-50">
        <CardTitle className="text-lg">Métricas de Performance com Memoização</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Com Memoização (useMemo)</h3>
            <div className="text-2xl font-mono">{memoizedResult.toLocaleString()}</div>
            <div className="text-xs text-slate-500">
              Tempo de cálculo: {renderTimes.memoized.toFixed(2)}ms
            </div>
            <Progress 
              value={100} 
              className="h-2"
              indicatorClassName="bg-green-500"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Sem Memoização</h3>
            <div className="text-2xl font-mono">{nonMemoizedResult.toLocaleString()}</div>
            <div className="text-xs text-slate-500">
              Tempo de cálculo: {renderTimes.nonMemoized.toFixed(2)}ms
            </div>
            <Progress 
              value={renderTimes.memoized > 0 ? (renderTimes.memoized / renderTimes.nonMemoized) * 100 : 100} 
              className="h-2"
              indicatorClassName="bg-amber-500"
            />
          </div>
        </div>
        
        <div className="bg-slate-50 p-3 rounded-md mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Ganho de Performance</h3>
            <span className="text-sm font-medium text-green-600">{performanceGain.toFixed(2)}%</span>
          </div>
          <Progress 
            value={performanceGain} 
            className="h-2 mb-2"
            indicatorClassName="bg-blue-500"
          />
          <p className="text-xs text-slate-500">
            A memoização evita recálculos desnecessários quando as dependências não mudam.
            Quanto maior o ganho, mais eficiente é a memoização.
          </p>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium">Métricas Adicionais</h3>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              Forçar Recálculo ({refreshCount})
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Número de Itens:</span>
              <span className="font-medium ml-2">{itemCount}</span>
            </div>
            <div>
              <span className="text-slate-500">Média de Primos:</span>
              <span className="font-medium ml-2">{metrics.averagePrime.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Densidade:</span>
              <span className="font-medium ml-2">{metrics.density.toFixed(4)}%</span>
            </div>
            <div>
              <span className="text-slate-500">Renderizações:</span>
              <span className="font-medium ml-2">{refreshCount + 1}</span>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-slate-500 mt-4">
          <p className="font-medium">Informações técnicas:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>useMemo - Memoriza valores calculados</li>
            <li>useCallback - Memoriza funções</li>
            <li>Evita recálculos em renderizações subsequentes</li>
            <li>Ideal para operações computacionalmente intensivas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 