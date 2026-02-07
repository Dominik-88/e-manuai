import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMachine } from '@/hooks/useMachine';
import { Bell, AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Notification {
  id: string;
  dismissKey: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
}

function getDismissedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem('dismissed-notifications');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedKeys(keys: Set<string>) {
  localStorage.setItem('dismissed-notifications', JSON.stringify([...keys]));
}

export function NotificationCenter() {
  const { machine } = useMachine();
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(getDismissedKeys);

  const { data: intervals } = useQuery({
    queryKey: ['service-intervals-notif'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servisni_intervaly')
        .select('id, nazev, interval_mth, prvni_servis_mth, kriticnost');
      if (error) throw error;
      return data;
    },
  });

  const { data: lastServices } = useQuery({
    queryKey: ['last-services-notif'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servisni_zaznamy')
        .select('servisni_interval_id, mth_pri_servisu')
        .eq('is_deleted', false)
        .order('mth_pri_servisu', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allNotifications = useMemo<Notification[]>(() => {
    if (!intervals || !machine) return [];
    const currentMth = machine.aktualni_mth;
    const notifs: Notification[] = [];

    for (const interval of intervals) {
      const lastService = lastServices?.find(s => s.servisni_interval_id === interval.id);
      const lastMth = lastService?.mth_pri_servisu ?? (interval.prvni_servis_mth ?? 0);
      const nextDue = lastMth + interval.interval_mth;
      const remaining = nextDue - currentMth;
      // Dismiss key includes lastMth so it resets after a new service
      const dismissKey = `${interval.id}_${lastMth}`;

      if (remaining <= 0) {
        notifs.push({
          id: interval.id,
          dismissKey,
          type: 'critical',
          title: interval.nazev,
          message: `Po termínu o ${Math.abs(remaining).toFixed(0)} mth!`,
        });
      } else if (remaining <= interval.interval_mth * 0.2) {
        notifs.push({
          id: interval.id,
          dismissKey,
          type: 'warning',
          title: interval.nazev,
          message: `Zbývá ${remaining.toFixed(0)} mth do servisu`,
        });
      }
    }

    return notifs.sort((a, b) => (a.type === 'critical' ? -1 : 1) - (b.type === 'critical' ? -1 : 1));
  }, [intervals, lastServices, machine]);

  const notifications = useMemo(
    () => allNotifications.filter(n => !dismissedKeys.has(n.dismissKey)),
    [allNotifications, dismissedKeys]
  );

  const dismiss = useCallback((dismissKey: string) => {
    setDismissedKeys(prev => {
      const next = new Set(prev);
      next.add(dismissKey);
      saveDismissedKeys(next);
      return next;
    });
  }, []);

  const criticalCount = notifications.filter(n => n.type === 'critical').length;
  const totalCount = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-14 w-14" aria-label="Notifikace">
          <Bell className="h-6 w-6" />
          {totalCount > 0 && (
            <span className={cn(
              'absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-destructive-foreground',
              criticalCount > 0 ? 'bg-destructive' : 'bg-warning'
            )}>
              {totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Servisní upozornění</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle className="h-8 w-8 text-success" />
              <p className="text-sm text-muted-foreground">Vše v pořádku</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notif => (
                <div key={notif.dismissKey} className="flex items-start gap-3 px-4 py-3">
                  {notif.type === 'critical' ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  ) : (
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className={cn(
                      'text-xs',
                      notif.type === 'critical' ? 'font-semibold text-destructive' : 'text-muted-foreground'
                    )}>
                      {notif.message}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(notif.dismissKey)}
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Zavřít upozornění ${notif.title}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
