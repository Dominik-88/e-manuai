import React, { useState } from 'react';
import { Plus, X, Wrench, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const actions = [
  {
    icon: Wrench,
    label: 'Servisní záznam',
    to: '/servis/novy',
  },
  {
    icon: Clock,
    label: 'Provozní záznam',
    to: '/provoz/novy',
  },
  {
    icon: MapPin,
    label: 'Nový areál',
    to: '/arealy/novy',
  },
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleActionClick = (to: string) => {
    setIsOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* Backdrop blur — covers entire viewport when menu is open */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-background/40 backdrop-blur-sm transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        className="fixed right-4 z-50"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 16px))' }}
      >
        {/* Action buttons */}
        <div
          className={cn(
            'mb-3 flex flex-col gap-3 transition-all duration-200',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          )}
          role="menu"
          aria-label="Rychlé akce"
        >
          {actions.map((action, index) => (
            <button
              key={action.to}
              onClick={() => handleActionClick(action.to)}
              className={cn(
                'flex min-h-12 min-w-12 items-center gap-3 rounded-full border-2 border-primary-foreground/20 bg-primary px-5 py-3 text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 active:scale-95',
                isOpen ? 'translate-x-0' : 'translate-x-16'
              )}
              style={{ transitionDelay: `${index * 50}ms` }}
              role="menuitem"
              aria-label={action.label}
            >
              <action.icon className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95',
            isOpen
              ? 'rotate-45 bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground'
          )}
          aria-label={isOpen ? 'Zavřít menu' : 'Otevřít rychlé akce'}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
