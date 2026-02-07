/**
 * Service Status Card
 * 
 * Zobrazuje aktuální servisní stav stroje:
 * - Nejbližší servis
 * - Počet servisů po termínu
 * - Detailní přehled všech intervalů
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ServiceStatusCardProps {
  strojId: string;
  currentMth: number;
}

interface ServiceInterval {
  service_name: string;
  interval_mth: number;
  next_service_mth: number;
  remaining_mth: number;
  is_overdue: boolean;
  is_approaching: boolean;
  kriticky: boolean;
  last_service_mth: number | null;
  last_service_date: string | null;
}

export function ServiceStatusCard({ strojId, currentMth }: ServiceStatusCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Načti servisní stav
  const { data: serviceStatus, isLoading } = useQuery({
    queryKey: ['service-status', strojId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_service_status')
        .select('*')
        .eq('stroj_id', strojId)
        .order('next_service_mth', { ascending: true });

      if (error) throw error;
      return data as ServiceInterval[];
    },
    refetchInterval: 30000, // Refresh každých 30s
  });

  // Nejbližší kritický servis
  const nextService = serviceStatus?.find(s => s.kriticky);
  
  // Počet servisů po termínu
  const overdueCount = serviceStatus?.filter(s => s.is_overdue && s.kriticky).length || 0;
  
  // Počet servisů blížících se
  const approachingCount = serviceStatus?.filter(s => s.is_approaching && !s.is_overdue && s.kriticky).length || 0;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </Card>
    );
  }

  if (!serviceStatus || serviceStatus.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Wrench className="h-5 w-5" />
          <p className="text-sm">Žádné servisní intervaly nejsou definovány</p>
        </div>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (overdueCount > 0) return 'destructive';
    if (approachingCount > 0) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (overdueCount > 0) return <AlertTriangle className="h-5 w-5" />;
    if (approachingCount > 0) return <Clock className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (overdueCount > 0) return `${overdueCount} servis${overdueCount > 1 ? 'y' : ''} po termínu!`;
    if (approachingCount > 0) return `${approachingCount} servis${approachingCount > 1 ? 'y' : ''} se blíží`;
    return 'Vše v pořádku';
  };

  return (
    <Card className={cn(
      'border-l-4 transition-colors',
      overdueCount > 0 && 'border-l-destructive bg-destructive/5',
      approachingCount > 0 && overdueCount === 0 && 'border-l-warning bg-warning/5',
      overdueCount === 0 && approachingCount === 0 && 'border-l-success bg-success/5'
    )}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              overdueCount > 0 && 'bg-destructive/20 text-destructive',
              approachingCount > 0 && overdueCount === 0 && 'bg-warning/20 text-warning',
              overdueCount === 0 && approachingCount === 0 && 'bg-success/20 text-success'
            )}>
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="font-semibold">Servisní stav</h3>
              <p className="text-sm text-muted-foreground">{getStatusText()}</p>
            </div>
          </div>
          
          <Badge variant={getStatusColor() as any}>
            {currentMth} MTH
          </Badge>
        </div>

        {/* Nejbližší servis */}
        {nextService && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nejbližší servis</p>
                <p className="font-semibold">{nextService.service_name}</p>
              </div>
              <div className="text-right">
                {nextService.is_overdue ? (
                  <Badge variant="destructive">
                    PO TERMÍNU!
                  </Badge>
                ) : (
                  <div>
                    <p className="font-mono text-lg font-bold">
                      {nextService.remaining_mth} MTH
                    </p>
                    <p className="text-xs text-muted-foreground">
                      do servisu
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {!nextService.is_overdue && (
              <div className="space-y-1">
                <Progress 
                  value={((nextService.interval_mth - nextService.remaining_mth) / nextService.interval_mth) * 100}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {nextService.last_service_mth || 0} MTH
                  </span>
                  <span>
                    {nextService.next_service_mth} MTH
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailní přehled */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="mt-4 w-full justify-between"
              size="sm"
            >
              <span className="text-sm">
                Zobrazit všechny intervaly ({serviceStatus.length})
              </span>
              <ChevronRight className={cn(
                'h-4 w-4 transition-transform',
                showDetails && 'rotate-90'
              )} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4 space-y-2">
            {serviceStatus.map((service, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 text-sm',
                  service.is_overdue && 'border-destructive/50 bg-destructive/5',
                  service.is_approaching && !service.is_overdue && 'border-warning/50 bg-warning/5'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{service.service_name}</p>
                    {service.kriticky && (
                      <Badge variant="outline" className="text-xs">
                        Kritický
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Interval: {service.interval_mth} MTH
                    {service.last_service_date && (
                      <> • Poslední: {new Date(service.last_service_date).toLocaleDateString('cs-CZ')}</>
                    )}
                  </p>
                </div>
                
                <div className="text-right">
                  {service.is_overdue ? (
                    <Badge variant="destructive" className="text-xs">
                      -{Math.abs(service.remaining_mth)} MTH
                    </Badge>
                  ) : (
                    <p className="font-mono text-sm font-semibold">
                      {service.remaining_mth} MTH
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
