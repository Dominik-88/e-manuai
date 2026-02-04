import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Bell, Wifi, WifiOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useMachine } from '@/hooks/useMachine';
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
  const isOnline = useOnlineStatus();
  const { machine, loading } = useMachine();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Logo + Machine info */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
              <span className="font-mono text-sm font-bold text-primary-foreground">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold leading-none">XRot 95 EVO</h1>
              {!loading && machine && (
                <p className="text-xs text-muted-foreground">{machine.vyrobni_cislo}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Center: MTH Display */}
        {!loading && machine && (
          <div className="flex items-center gap-2">
            <div className="dashboard-widget !p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">MTH</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  {machine.aktualni_mth.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Status + Actions */}
        <div className="flex items-center gap-2">
          {/* Online status */}
          <div className="status-bar">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 text-success" />
                <span className="hidden text-xs sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-warning" />
                <span className="hidden text-xs sm:inline">Offline</span>
              </>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative touch-target-sm">
            <Bell className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              2
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target-sm">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user && (
                <>
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || 'Uživatel'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {role === 'admin' ? 'Admin' : role === 'technik' ? 'Technik' : 'Operátor'}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link to="/nastaveni" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Nastavení
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                Odhlásit se
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
