'use client';

import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Item {
  id: string;
  name: string;
  description: string;
  value: number;
  tags: string[];
}

interface VirtualizedListProps {
  items: Item[];
}

// Row memoizado para evitar re-renderizações desnecessárias
const Row = memo(({ data, index, style }: { data: Item[], index: number, style: React.CSSProperties }) => {
  const item = data[index];
  
  // Medição de performance para demonstração
  const startTime = performance.now();
  
  // Simulação de operação custosa para cada item (apenas para demonstração)
  const expensiveOperation = () => {
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += Math.sin(i) * Math.cos(i);
    }
    return result;
  };
  
  // Executar operação custosa
  const result = expensiveOperation();
  
  // Calcular tempo gasto
  const renderTime = performance.now() - startTime;
  
  return (
    <div style={style} className="px-4 py-2 border-b border-slate-200 last:border-0">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-slate-500">{item.description}</div>
          <div className="flex gap-1 mt-1">
            {item.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">{item.value.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-slate-400">{renderTime.toFixed(2)}ms</div>
        </div>
      </div>
    </div>
  );
});

Row.displayName = 'VirtualizedRow';

// Componente principal de lista virtualizada
const VirtualizedList = ({ items }: VirtualizedListProps) => {
  // Medição de performance para demonstração
  const startTime = performance.now();
  
  // Altura da janela de visualização
  const height = 400;
  
  // Altura de cada item
  const itemHeight = 80;
  
  // Largura da lista
  const width = '100%';
  
  // Calcular tempo de renderização
  const renderTime = performance.now() - startTime;
  
  return (
    <Card className="w-full h-full">
      <CardContent className="p-0">
        <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
          <div>
            <span className="font-medium">Lista Virtualizada</span>
            <span className="text-xs text-slate-500 ml-2">({items.length.toLocaleString()} itens)</span>
          </div>
          <div className="text-xs text-slate-500">
            Tempo de renderização: {renderTime.toFixed(2)}ms
          </div>
        </div>
        
        <List
          height={height}
          itemCount={items.length}
          itemSize={itemHeight}
          width={width}
          itemData={items}
        >
          {Row}
        </List>
        
        <div className="p-3 bg-slate-50 border-t text-xs text-slate-500">
          <p>
            <strong>Virtualização:</strong> Apenas os itens visíveis são renderizados, 
            independente do tamanho total da lista.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(VirtualizedList); 