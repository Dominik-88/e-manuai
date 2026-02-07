import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Wrench, 
  MapPin, 
  MessageSquare 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', ariaLabel: 'Přejít na Dashboard' },
  { to: '/manual', icon: BookOpen, label: 'Manuál', ariaLabel: 'Přejít do Manuálu' },
  { to: '/servis', icon: Wrench, label: 'Servis', ariaLabel: 'Přejít do Servisu' },
  { to: '/arealy', icon: MapPin, label: 'Areály', ariaLabel: 'Přejít do Areálů' },
  { to: '/asistent', icon: MessageSquare, label: 'AI', ariaLabel: 'Přejít k AI Asistentovi' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg"
      style={{ 
        WebkitBackdropFilter: 'blur(16px)', 
        backdropFilter: 'blur(16px)', 
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' 
      }}
      role="navigation"
      aria-label="Hlavní navigace"
    >
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to !== '/' && location.pathname.startsWith(item.to));
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'relative flex min-h-[60px] min-w-[60px] flex-col items-center justify-center gap-1 px-2 py-2 transition-all duration-200 rounded-xl',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground active:scale-95'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.ariaLabel}
              >
                {/* Glow bg for active */}
                {isActive && (
                  <div 
                    className="absolute inset-x-2 top-1 bottom-1 rounded-xl bg-primary/10 transition-all" 
                    aria-hidden="true"
                  />
                )}
                <item.icon 
                  className={cn(
                    'relative z-10 h-5 w-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span className={cn(
                  'relative z-10 text-[10px] transition-all',
                  isActive ? 'font-bold' : 'font-medium'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div 
                    className="absolute bottom-0 h-0.5 w-8 rounded-t-full bg-primary" 
                    aria-hidden="true"
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
