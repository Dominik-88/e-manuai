import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, MapPin, BookOpen, MessageSquare } from 'lucide-react';

const quickActions = [
  { to: '/servis/novy', icon: Wrench, label: 'Nový servis', color: 'bg-primary/20 text-primary' },
  { to: '/provoz/novy', icon: Clock, label: 'Provoz', color: 'bg-info/20 text-info' },
  { to: '/arealy', icon: MapPin, label: 'Areály', color: 'bg-success/20 text-success' },
  { to: '/manual', icon: BookOpen, label: 'Manuál', color: 'bg-warning/20 text-warning' },
  { to: '/asistent', icon: MessageSquare, label: 'AI', color: 'bg-primary/20 text-primary' },
];

export function QuickActionsCard() {
  return (
    <div className="dashboard-widget">
      <h3 className="section-heading mb-3">Rychlé akce</h3>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:bg-muted active:scale-95"
            style={{ minWidth: '72px' }}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
