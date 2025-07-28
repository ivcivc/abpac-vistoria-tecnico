import React from "react";
import { Toaster } from "@/components/ui/toaster";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="flex-1">
        {children}
      </main>
      
      {/* Toaster para exibir notificações */}
      <Toaster />
    </div>
  );
} 