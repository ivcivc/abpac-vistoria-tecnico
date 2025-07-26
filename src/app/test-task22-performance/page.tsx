'use client';

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Cpu, Gauge, BarChart, List, Clock } from 'lucide-react';

// Importação dinâmica de componentes pesados
const HeavyComponent = dynamic(
  () => import('@/components/performance/HeavyComponent'),
  { 
    loading: () => <SkeletonCard />,
    ssr: false 
  }
);

const VirtualizedList = dynamic(
  () => import('@/components/performance/VirtualizedList'),
  { 
    loading: () => <SkeletonList />,
    ssr: false 
  }
);

const PerformanceMetrics = dynamic(
  () => import('@/components/performance/PerformanceMetrics'),
  { 
    loading: () => <SkeletonMetrics />,
    ssr: false 
  }
);

// Componentes de Skeleton para carregamento
function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 w-full">
      <div className="h-8 bg-slate-200 rounded animate-pulse mb-4"></div>
      <div className="h-24 bg-slate-200 rounded animate-pulse mb-3"></div>
      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="border rounded-lg p-4 w-full">
      <div className="h-8 bg-slate-200 rounded animate-pulse mb-4"></div>
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="h-12 bg-slate-200 rounded animate-pulse mb-2"></div>
      ))}
    </div>
  );
}

function SkeletonMetrics() {
  return (
    <div className="border rounded-lg p-4 w-full">
      <div className="h-8 bg-slate-200 rounded animate-pulse mb-4"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-24 bg-slate-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

// Componente principal da página de teste
export default function TestPerformancePage() {
  const [activeTab, setActiveTab] = useState('lazy-loading');
  const [itemCount, setItemCount] = useState(1000);
  const [renderHeavy, setRenderHeavy] = useState(false);
  const [performanceLog, setPerformanceLog] = useState<string[]>([]);
  
  // Função memoizada para gerar itens de teste
  const generateItems = useCallback((count: number) => {
    const startTime = performance.now();
    
    const items = Array(count).fill(0).map((_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      description: `This is a description for item ${i}`,
      value: Math.floor(Math.random() * 1000),
      tags: Array(Math.floor(Math.random() * 5) + 1)
        .fill(0)
        .map((_, j) => `tag-${j}`)
    }));
    
    const endTime = performance.now();
    
    addLog(`Gerados ${count} itens em ${(endTime - startTime).toFixed(2)}ms`);
    return items;
  }, []);
  
  // Itens memoizados para evitar recálculos desnecessários
  const items = useMemo(() => generateItems(itemCount), [generateItems, itemCount]);
  
  // Função para adicionar logs de performance
  const addLog = useCallback((message: string) => {
    setPerformanceLog(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  }, []);
  
  // Manipuladores de eventos memoizados
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    addLog(`Tab alterada para: ${value}`);
  }, [addLog]);
  
  const handleToggleHeavyComponent = useCallback(() => {
    const newState = !renderHeavy;
    setRenderHeavy(newState);
    addLog(`Componente pesado ${newState ? 'renderizado' : 'removido'}`);
  }, [renderHeavy, addLog]);
  
  const handleChangeItemCount = useCallback((newCount: number) => {
    setItemCount(newCount);
    addLog(`Quantidade de itens alterada para: ${newCount}`);
  }, [addLog]);
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="bg-slate-800 text-white">
            <div className="flex items-center gap-2">
              <Gauge className="h-6 w-6" />
              <CardTitle>Otimização de Performance (Task 22)</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-6">
              Esta página demonstra as técnicas de otimização de performance implementadas na Task 22.
              Cada tab mostra uma técnica diferente para melhorar a performance da aplicação.
            </p>
            
            <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="lazy-loading">
                  <Clock className="h-4 w-4 mr-2" />
                  Lazy Loading
                </TabsTrigger>
                <TabsTrigger value="skeleton">
                  <BarChart className="h-4 w-4 mr-2" />
                  Skeleton Screens
                </TabsTrigger>
                <TabsTrigger value="virtualization">
                  <List className="h-4 w-4 mr-2" />
                  Virtualização
                </TabsTrigger>
                <TabsTrigger value="memoization">
                  <Cpu className="h-4 w-4 mr-2" />
                  Memoização
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="lazy-loading" className="space-y-4">
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Lazy Loading</AlertTitle>
                  <AlertDescription>
                    Componentes pesados são carregados sob demanda usando dynamic import, 
                    reduzindo o tamanho inicial do bundle JavaScript.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col gap-4">
                  <Button 
                    onClick={handleToggleHeavyComponent}
                    variant={renderHeavy ? "destructive" : "default"}
                  >
                    {renderHeavy ? "Remover Componente Pesado" : "Renderizar Componente Pesado"}
                  </Button>
                  
                  {renderHeavy && (
                    <Suspense fallback={<SkeletonCard />}>
                      <HeavyComponent />
                    </Suspense>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="skeleton" className="space-y-4">
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Skeleton Screens</AlertTitle>
                  <AlertDescription>
                    Placeholders animados são exibidos enquanto o conteúdo está carregando,
                    melhorando a percepção de velocidade e experiência do usuário.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SkeletonCard />
                  <SkeletonList />
                </div>
              </TabsContent>
              
              <TabsContent value="virtualization" className="space-y-4">
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Virtualização de Listas</AlertTitle>
                  <AlertDescription>
                    Apenas os itens visíveis na viewport são renderizados, 
                    permitindo lidar com grandes volumes de dados sem impacto na performance.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Button onClick={() => handleChangeItemCount(100)} variant="outline" size="sm">100 itens</Button>
                    <Button onClick={() => handleChangeItemCount(1000)} variant="outline" size="sm">1.000 itens</Button>
                    <Button onClick={() => handleChangeItemCount(10000)} variant="outline" size="sm">10.000 itens</Button>
                  </div>
                  
                  <div className="h-[400px] border rounded-lg">
                    <Suspense fallback={<SkeletonList />}>
                      <VirtualizedList items={items} />
                    </Suspense>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="memoization" className="space-y-4">
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Memoização</AlertTitle>
                  <AlertDescription>
                    Funções e valores computados são armazenados em cache para evitar recálculos 
                    desnecessários usando useMemo e useCallback.
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col gap-4">
                  <Suspense fallback={<SkeletonMetrics />}>
                    <PerformanceMetrics itemCount={itemCount} />
                  </Suspense>
                </div>
              </TabsContent>
            </Tabs>
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Logs de Performance</h3>
              <div className="bg-slate-100 border rounded-md p-3 h-[200px] overflow-y-auto text-sm font-mono">
                {performanceLog.length === 0 ? (
                  <p className="text-slate-500 italic">Nenhum log disponível</p>
                ) : (
                  performanceLog.map((log, index) => (
                    <div key={index} className="py-1 border-b border-slate-200 last:border-0">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentação</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <h3 className="font-medium mb-2">Técnicas Implementadas</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><strong>Lazy Loading:</strong> Componentes carregados sob demanda com dynamic import</li>
              <li><strong>Skeleton Screens:</strong> Placeholders durante o carregamento</li>
              <li><strong>Virtualização:</strong> Renderização apenas dos itens visíveis</li>
              <li><strong>Memoização:</strong> Cache de valores e funções com useMemo e useCallback</li>
              <li><strong>Code Splitting:</strong> Divisão do código em chunks menores</li>
            </ul>
            
            <h3 className="font-medium mb-2">Componentes Criados</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><code>HeavyComponent</code> - Componente com carga computacional pesada</li>
              <li><code>VirtualizedList</code> - Lista virtualizada para grandes volumes de dados</li>
              <li><code>PerformanceMetrics</code> - Métricas de performance em tempo real</li>
              <li><code>SkeletonCard</code>, <code>SkeletonList</code>, <code>SkeletonMetrics</code> - Componentes de carregamento</li>
            </ul>
            
            <h3 className="font-medium mb-2">Requisitos Atendidos</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>11.1</strong> - Otimização de carregamento inicial</li>
              <li><strong>11.2</strong> - Melhoria de experiência durante carregamento</li>
              <li><strong>11.3</strong> - Otimização para grandes volumes de dados</li>
              <li><strong>11.5</strong> - Performance em dispositivos de baixo desempenho</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 