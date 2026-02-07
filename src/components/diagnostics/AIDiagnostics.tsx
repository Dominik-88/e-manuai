import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useMachine } from '@/hooks/useMachine';
import { cn } from '@/lib/utils';

export function AIDiagnostics() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const { machine } = useMachine();

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vyberte prosím obrázek');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Maximální velikost je 10 MB');
      return;
    }

    setError(null);
    setAnalysis(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Přihlaste se prosím');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-diagnostics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64: image,
          mimeType,
          machineContext: machine ? {
            model: machine.model,
            aktualni_mth: machine.aktualni_mth,
            stav: machine.stav,
          } : null,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Příliš mnoho požadavků. Zkuste to později.');
        if (response.status === 402) throw new Error('Vyčerpány AI kredity.');
        throw new Error('Chyba při analýze');
      }

      const data = await response.json();
      setAnalysis(data.analysis);

      if ('vibrate' in navigator) {
        if (data.analysis.includes('🔴') || data.analysis.includes('KRITICKÉ')) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        } else if (data.analysis.includes('⚠️')) {
          navigator.vibrate([200, 100, 200]);
        } else {
          navigator.vibrate(100);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznámá chyba');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setError(null);
    // Reset file inputs
    if (cameraRef.current) cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
  };

  return (
    <div className="dashboard-widget !border-l-info">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        AI Diagnostika opotřebení
      </h3>

      {/* Separate input for camera (with capture) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {/* Separate input for gallery (without capture) */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {!image ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Vyfoťte díl stroje (nože, řemeny, filtry) a AI vyhodnotí stupeň opotřebení.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => cameraRef.current?.click()}
              className="h-14 gap-2 text-base font-bold"
            >
              <Camera className="h-5 w-5" />
              Vyfotit
            </Button>
            <Button
              variant="outline"
              onClick={() => galleryRef.current?.click()}
              className="h-14 gap-2 text-base"
            >
              <Upload className="h-5 w-5" />
              Galerie
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={`data:${mimeType};base64,${image}`}
              alt="Díl k analýze"
              className="h-48 w-full object-cover"
            />
            <button
              onClick={reset}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur"
              aria-label="Zrušit"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Analyze button */}
          {!analysis && (
            <Button
              onClick={analyze}
              disabled={isLoading}
              className="h-14 w-full gap-2 text-base font-bold uppercase"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzuji...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  Analyzovat díl
                </>
              )}
            </Button>
          )}

          {/* Result */}
          {analysis && (
            <div className={cn(
              'rounded-lg border-l-4 p-4',
              analysis.includes('🔴') || analysis.includes('KRITICKÉ')
                ? 'border-l-destructive bg-destructive/10'
                : analysis.includes('⚠️') || analysis.includes('OPOTŘEBENÍ')
                  ? 'border-l-warning bg-warning/10'
                  : 'border-l-success bg-success/10'
            )}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {analysis}
              </div>
            </div>
          )}

          {/* Actions after analysis */}
          {analysis && (
            <Button variant="outline" onClick={reset} className="h-12 w-full gap-2">
              <Camera className="h-4 w-4" />
              Analyzovat další díl
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
