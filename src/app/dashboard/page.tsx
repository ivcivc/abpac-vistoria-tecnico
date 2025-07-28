'use client';

import { useState, useEffect } from 'react';
import { MobileDashboard } from '@/components/mobile/MobileDashboard';
import { useAuth, useTechnician } from '@/contexts/SimpleAuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const router = useRouter();

  const handleNavigateToVistoria = (vistoriaId: string) => {
    console.log('🎯 [DASHBOARD] Navegando para vistoria:', vistoriaId);
    router.push(`/vistoria/${vistoriaId}`);
  };

  return (
    <MobileDashboard onNavigateToVistoria={handleNavigateToVistoria} />
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireToken={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
