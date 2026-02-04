import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { FloatingActionButton } from './FloatingActionButton';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-mono">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sticky header */}
      <AppHeader />

      {/* Main content area */}
      <main className="flex-1 pb-20 pt-2">
        <div className="container mx-auto px-4">
          {children || <Outlet />}
        </div>
      </main>

      {/* Floating action button */}
      <FloatingActionButton />

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
