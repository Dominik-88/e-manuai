import React from 'react';
import { Outlet } from 'react-router-dom';
import '@/styles/industrial.css';
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
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" 
            aria-hidden="true"
          />
          <p className="text-muted-foreground font-mono text-sm">Načítání aplikace...</p>
          <span className="sr-only">Načítání, prosím čekejte</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background" style={{ minHeight: '100dvh' }}>
      {/* Sticky header */}
      <AppHeader />

      {/* Main content area */}
      <main 
        className="flex-1 pb-20 pt-2" 
        role="main"
        aria-label="Hlavní obsah"
      >
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
