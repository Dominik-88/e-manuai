import React, { useState } from 'react';
import { Plus, X, Wrench, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const actions = [
  {
    icon: Wrench,
    label: 'Servisní záznam',
    to: '/servis/novy',
    color: 'bg-primary hover:bg-primary/90',
  },
  {
    icon: Clock,
    label: 'Provozní záznam',
    to: '/provoz/novy',
    color: 'bg-info hover:bg-info/90',
  },
  {
    icon: MapPin,
    label: 'Nový areál',
    to: '/arealy/novy',
    color: 'bg-success hover:bg-success/90',
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
    <div className="fixed bottom-20 right-4 z-50">
      {/* Action buttons */}
      <div className={cn(
        'mb-3 flex flex-col gap-2 transition-all duration-200',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}>
        {actions.map((action, index) => (
          <button
            key={action.to}
            onClick={() => handleActionClick(action.to)}
            className={cn(
              'flex items-center gap-3 rounded-full px-4 py-3 text-white shadow-lg transition-all duration-200',
              action.color,
              isOpen ? 'translate-x-0' : 'translate-x-16'
            )}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <action.icon className="h-5 w-5" />
            <span className="whitespace-nowrap text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-transform duration-200',
          isOpen ? 'rotate-45 bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
