'use client';

import { Suspense } from 'react';
import { VistoriaDetailsContent } from '@/components/vistoria/VistoriaDetailsContent';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthenticatedLayout } from '@/components/layout';

interface VistoriaPageProps {
  params: Promise<{
    id: string;
  }>;
}

function VistoriaPageLoading() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>

          {/* Progress Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>

          {/* Items List Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default async function VistoriaPage({ params }: VistoriaPageProps) {
  const resolvedParams = await params;
  
  return (
    <ProtectedRoute requireToken={true}>
      <Suspense fallback={<VistoriaPageLoading />}>
        <VistoriaDetailsContent vistoriaId={resolvedParams.id} />
      </Suspense>
    </ProtectedRoute>
  );
} 