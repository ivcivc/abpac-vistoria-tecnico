'use client';

import { useEffect } from 'react';
import { SyncQueueService } from '@/services/sync/SyncQueueService';

export function ServiceInitializer() {
  useEffect(() => {
    // Inicializar processamento da fila de sincronização
    const syncQueueService = SyncQueueService.getInstance();
    syncQueueService.iniciarProcessamento();
    
    console.log('🚀 [APP] Serviços inicializados - Fila de sincronização ativa');
    
    // Limpeza ao desmontar
    return () => {
      syncQueueService.pararProcessamento();
    };
  }, []);
  
  return null;
} 