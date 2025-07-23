import React from 'react';
import { cn } from '@/lib/utils';

interface SyncBadgeProps {
  isSynced: boolean;
  isSyncing?: boolean;
  className?: string;
  showText?: boolean;
}

export function SyncBadge({ 
  isSynced, 
  isSyncing = false, 
  className,
  showText = true 
}: SyncBadgeProps) {
  const getSyncStatus = () => {
    if (isSyncing) {
      return {
        text: 'Sincronizando...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        dotColor: 'bg-blue-500'
      };
    }
    
    if (isSynced) {
      return {
        text: 'Sincronizado',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        dotColor: 'bg-green-500'
      };
    }
    
    return {
      text: 'Pendente',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      dotColor: 'bg-orange-500'
    };
  };

  const status = getSyncStatus();

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      status.bgColor,
      status.color,
      className
    )}>
      <div className={cn('h-2 w-2 rounded-full', status.dotColor)} />
      {showText && <span>{status.text}</span>}
    </div>
  );
}
