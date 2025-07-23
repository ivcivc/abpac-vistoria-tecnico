import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pendente' | 'em_andamento' | 'concluida' | 'aprovada' | 'rejeitada';
  className?: string;
  showText?: boolean;
}

export function StatusBadge({ 
  status, 
  className,
  showText = true 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pendente':
        return {
          text: 'Pendente',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          dotColor: 'bg-gray-500'
        };
      case 'em_andamento':
        return {
          text: 'Em Andamento',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          dotColor: 'bg-blue-500'
        };
      case 'concluida':
        return {
          text: 'Concluída',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          dotColor: 'bg-green-500'
        };
      case 'aprovada':
        return {
          text: 'Aprovada',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          dotColor: 'bg-emerald-500'
        };
      case 'rejeitada':
        return {
          text: 'Rejeitada',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          dotColor: 'bg-red-500'
        };
      default:
        return {
          text: 'Desconhecido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          dotColor: 'bg-gray-500'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.bgColor,
      config.color,
      className
    )}>
      <div className={cn('h-2 w-2 rounded-full', config.dotColor)} />
      {showText && <span>{config.text}</span>}
    </div>
  );
}
