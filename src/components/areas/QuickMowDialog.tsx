import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface QuickMowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arealNazev: string;
  arealPlochaM2: number | null;
  onConfirm: (note: string | null) => Promise<void> | void;
  saving?: boolean;
}

export function QuickMowDialog({
  open,
  onOpenChange,
  arealNazev,
  arealPlochaM2,
  onConfirm,
  saving,
}: QuickMowDialogProps) {
  const [note, setNote] = useState('');

  const handleConfirm = async () => {
    await onConfirm(note.trim() || null);
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            Označit jako posekáno
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold text-foreground">{arealNazev}</span>
            {arealPlochaM2 ? (
              <span className="ml-1 text-xs">· {arealPlochaM2.toLocaleString('cs-CZ')} m²</span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="mow-note" className="text-xs font-medium text-muted-foreground">
            Poznámka z terénu (volitelné)
          </label>
          <Textarea
            id="mow-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Např. Pozor na díru v severním rohu, vysoká vlhkost…"
            className="min-h-[80px] resize-none text-sm"
            maxLength={500}
          />
        </div>

        <DialogFooter className="flex-row gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12"
            disabled={saving}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 h-12 bg-success text-success-foreground hover:bg-success/90"
            disabled={saving}
          >
            {saving ? 'Ukládám…' : 'Potvrdit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
