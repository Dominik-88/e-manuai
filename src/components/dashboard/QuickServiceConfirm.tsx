import React, { useState } from 'react';
import { Check, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const quickActions = [
  { label: 'Kontrola nožů', typ: 'preventivní' as const, popis: 'Denní vizuální kontrola stavu nožů' },
  { label: 'Kontrola oleje', typ: 'preventivní' as const, popis: 'Kontrola hladiny motorového oleje' },
  { label: 'Kontrola filtru', typ: 'preventivní' as const, popis: 'Kontrola vzduchového filtru' },
];

export function QuickServiceConfirm() {
  const { user, isAdmin, isTechnik } = useAuth();
  const { machine } = useMachine();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  if (!isAdmin && !isTechnik) return null;
  if (!machine) return null;

  const handleQuickConfirm = async (action: typeof quickActions[0]) => {
    if (!user) return;
    setLoading(action.label);

    try {
      const { error } = await supabase
        .from('servisni_zaznamy')
        .insert({
          stroj_id: machine.id,
          datum_servisu: new Date().toISOString().split('T')[0],
          mth_pri_servisu: machine.aktualni_mth,
          typ_zasahu: action.typ,
          popis: action.popis,
          provedl_osoba: user.email || 'Neznámý',
          user_id: user.id,
        });

      if (error) throw error;

      setConfirmed(prev => new Set(prev).add(action.label));
      queryClient.invalidateQueries({ queryKey: ['recent-services'] });
      queryClient.invalidateQueries({ queryKey: ['last-services'] });
      toast.success(`${action.label} potvrzena`);

      if ('vibrate' in navigator) navigator.vibrate(50);
    } catch (err) {
      console.error(err);
      toast.error('Chyba při ukládání');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="dashboard-widget !border-l-success">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Rychlé potvrzení úkonu
      </h3>
      <div className="grid gap-2">
        {quickActions.map(action => {
          const isDone = confirmed.has(action.label);
          const isLoading = loading === action.label;

          return (
            <Button
              key={action.label}
              variant={isDone ? 'secondary' : 'outline'}
              disabled={isDone || isLoading}
              onClick={() => handleQuickConfirm(action)}
              className={cn(
                'h-14 justify-start gap-3 text-base',
                isDone && 'opacity-60'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isDone ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              {action.label}
              {isDone && <span className="ml-auto text-xs text-success">✓ Hotovo</span>}
            </Button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Jedním klikem potvrdíte dnešní kontrolu a vytvoříte servisní záznam.
      </p>
    </div>
  );
}
