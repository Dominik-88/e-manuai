import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, MapPin, BookOpen, MessageSquare } from 'lucide-react';

const quickActions = [
  {
    to: '/servis/novy',
    icon: Wrench,
    label: 'Nový servis',
    description: 'Přidat servisní záznam',
    color: 'bg-primary/20 text-primary',
  },
  {
    to: '/provoz/novy',
    icon: Clock,
    label: 'Provoz',
    description: 'Zaznamenat práci',
    color: 'bg-info/20 text-info',
  },
  {
    to: '/arealy',
    icon: MapPin,
    label: 'Areály',
    description: 'Zobrazit lokality',
    color: 'bg-success/20 text-success',
  },
  {
    to: '/manual',
    icon: BookOpen,
    label: 'Manuál',
    description: 'Technická dokumentace',
    color: 'bg-warning/20 text-warning',
  },
];

export function QuickActionsCard() {
  return (
    <div className="dashboard-widget">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Rychlé akce
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* AI Assistant shortcut */}
      <Link 
        to="/asistent"
        className="mt-3 flex items-center gap-3 rounded-lg bg-gradient-to-r from-primary/20 to-info/20 p-3 transition-all hover:from-primary/30 hover:to-info/30"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <MessageSquare className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">AI Asistent</p>
          <p className="text-xs text-muted-foreground">Zeptejte se na cokoliv o stroji</p>
        </div>
        <div className="led-indicator led-blue animate-pulse-glow" />
      </Link>
    </div>
  );
}
