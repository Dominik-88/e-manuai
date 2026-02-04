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
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    to: '/manual',
    icon: BookOpen,
    label: 'Manuál',
  },
  {
    to: '/servis',
    icon: Wrench,
    label: 'Servis',
  },
  {
    to: '/arealy',
    icon: MapPin,
    label: 'Areály',
  },
  {
    to: '/asistent',
    icon: MessageSquare,
    label: 'AI',
  },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
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
                  'flex min-h-[60px] min-w-[60px] flex-col items-center justify-center gap-1 px-2 py-2 text-muted-foreground transition-colors',
                  isActive && 'text-primary'
                )}
              >
                <item.icon className={cn(
                  'h-6 w-6 transition-transform',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-[10px] font-medium uppercase tracking-wide',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-12 bg-primary" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
