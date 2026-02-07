import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { OfflineIndicator } from './OfflineIndicator';
import { NotificationCenter } from './NotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  const { user, profile, role, signOut } = useAuth();
  const { machine, loading } = useMachine();

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-cover bg-center"
      style={{
        backgroundImage: 'linear-gradient(to right, hsl(var(--card) / 0.92), hsl(var(--card) / 0.85)), url(/images/barbieri-hero.jpeg)',
        WebkitBackdropFilter: 'blur(12px)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Logo + Machine info */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary">
              <span className="font-mono text-xs font-bold leading-none text-primary-foreground">BHV</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold leading-none">e-ManuAI</h1>
              {!loading && machine && (
                <p className="text-xs text-muted-foreground">{machine.vyrobni_cislo}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Center: MTH Display - Large touch target */}
        {!loading && machine && (
          <Link to="/" className="flex items-center gap-2 rounded-lg bg-steel-dark px-4 py-2 transition-colors hover:bg-steel">
            <span className="text-xs uppercase text-muted-foreground">MTH</span>
            <span className="font-mono text-2xl font-bold text-foreground">
              {machine.aktualni_mth.toFixed(1)}
            </span>
          </Link>
        )}

        {/* Right: Status + Actions */}
        <div className="flex items-center gap-2">
          <OfflineIndicator />
          <NotificationCenter />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-14 w-14">
                <User className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user && (
                <>
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{profile?.full_name || 'Uživatel'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="mt-1.5 text-xs">
                      {role === 'admin' ? 'Admin' : role === 'technik' ? 'Technik' : 'Operátor'}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild className="h-12">
                <Link to="/nastaveni" className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Nastavení
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="h-12 text-destructive">
                Odhlásit se
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
