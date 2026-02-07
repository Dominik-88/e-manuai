import React, { useState } from 'react';
import { Play, Square, MapPin, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMowingSession } from '@/hooks/useMowingSession';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MowingSessionRecorderProps {
  machineId: string;
  currentMth: number;
}

export function MowingSessionRecorder({ machineId, currentMth }: MowingSessionRecorderProps) {
  const { isAdmin, isTechnik } = useAuth();
  const { isRecording, startTime, pointCount, startSession, stopSession } = useMowingSession(machineId, currentMth);
  const [elapsed, setElapsed] = useState('00:00');

  // Update elapsed time display
  React.useEffect(() => {
    if (!isRecording || !startTime) return;
    const interval = setInterval(() => {
      const diff = Date.now() - startTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  if (!isAdmin && !isTechnik) return null;

  return (
    <div className={cn(
      'dashboard-widget',
      isRecording && '!border-l-success'
    )}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Digital Twin – Záznam sečení
        </h3>
        {isRecording && (
          <div className="flex items-center gap-1.5 rounded-full bg-success/20 px-2.5 py-1 text-xs font-medium text-success">
            <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
            REC
          </div>
        )}
      </div>

      {isRecording ? (
        <div className="space-y-3">
          {/* Live stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Doba sečení</p>
                <p className="font-mono text-lg font-bold">{elapsed}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <Navigation className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">GPS body</p>
                <p className="font-mono text-lg font-bold">{pointCount}</p>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={() => stopSession(currentMth)}
            className="h-14 w-full gap-2 text-base font-bold uppercase"
          >
            <Square className="h-5 w-5" />
            Ukončit záznam
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Zaznamenávejte trasu sečení s GPS pro vytvoření digitálního dvojčete pozemku.
          </p>
          <Button
            onClick={() => startSession()}
            className="h-14 w-full gap-2 text-base font-bold uppercase"
          >
            <Play className="h-5 w-5" />
            Zahájit sečení
          </Button>
        </div>
      )}
    </div>
  );
}
