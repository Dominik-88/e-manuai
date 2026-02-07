import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Clock, MapPin, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { S_MODE_NAMES } from '@/types/database';

const operationSchema = z.object({
  areal_id: z.string().min(1, 'Vyberte areál'),
  datum_cas_start: z.string().min(1, 'Vyplňte datum a čas'),
  datum_cas_konec: z.string().optional(),
  rezim: z.enum(['manuální', 'poloautonomní', 'autonomní']),
  s_mode: z.number().optional(),
  mth_start: z.number().min(0, 'MTH musí být kladné'),
  mth_konec: z.number().optional(),
  plocha_obdelana_m2: z.number().min(0).optional(),
  rtk_stav: z.enum(['FIX', 'FLOAT', 'NONE', 'neznámý']),
  poznamky: z.string().max(1000).optional(),
});

type OperationFormData = z.infer<typeof operationSchema>;

export default function NewOperationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { machine } = useMachine();
  const [submitting, setSubmitting] = useState(false);

  const { data: areas } = useQuery({
    queryKey: ['areas-select'], queryFn: async () => {
      const { data, error } = await supabase.from('arealy').select('id, nazev, okres').order('nazev');
      if (error) throw error; return data;
    },
  });

  const now = new Date();
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const form = useForm<OperationFormData>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      areal_id: '', datum_cas_start: localISO, datum_cas_konec: '',
      rezim: 'manuální', s_mode: undefined, mth_start: 0, mth_konec: undefined,
      plocha_obdelana_m2: undefined, rtk_stav: 'neznámý', poznamky: '',
    },
  });

  useEffect(() => { if (machine) form.setValue('mth_start', machine.aktualni_mth); }, [machine, form]);

  const selectedRezim = form.watch('rezim');
  const mthStart = form.watch('mth_start');
  const mthKonec = form.watch('mth_konec');

  const onSubmit = async (data: OperationFormData) => {
    if (!machine || !user) { toast.error('Chybí data stroje nebo uživatele'); return; }
    setSubmitting(true);
    try {
      const mthDelta = data.mth_konec ? data.mth_konec - data.mth_start : null;
      const { error } = await supabase.from('provozni_zaznamy').insert({
        stroj_id: machine.id, user_id: user.id, areal_id: data.areal_id,
        datum_cas_start: new Date(data.datum_cas_start).toISOString(),
        datum_cas_konec: data.datum_cas_konec ? new Date(data.datum_cas_konec).toISOString() : null,
        rezim: data.rezim as any, s_mode: data.s_mode || null,
        mth_start: data.mth_start, mth_konec: data.mth_konec || null, mth_delta: mthDelta,
        plocha_obdelana_m2: data.plocha_obdelana_m2 || null,
        rtk_stav: data.rtk_stav as any, poznamky: data.poznamky || null,
      });
      if (error) throw new Error(error.message);
      if (data.mth_konec && data.mth_konec > machine.aktualni_mth) {
        await supabase.from('stroje').update({ aktualni_mth: data.mth_konec, datum_posledni_aktualizace_mth: new Date().toISOString() }).eq('id', machine.id);
      }
      toast.success('Provozní záznam uložen');
      navigate('/');
    } catch (error) {
      toast.error(`Chyba: ${error instanceof Error ? error.message : 'Chyba při ukládání záznamu'}`);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 shrink-0" aria-label="Zpět">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nový provozní záznam</h1>
          <p className="text-xs text-muted-foreground">
            {machine?.vyrobni_cislo || '...'} · MTH: {machine?.aktualni_mth?.toFixed(1) || '...'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Section: Lokace & Čas */}
          <div className="form-section">
            <div className="form-section-title"><MapPin className="h-4 w-4" />Lokace & Čas</div>
            <FormField control={form.control} name="areal_id" render={({ field }) => (
              <FormItem><FormLabel>Areál *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Vyberte areál" /></SelectTrigger></FormControl>
                  <SelectContent>{areas?.map(a => <SelectItem key={a.id} value={a.id} className="h-11">{a.nazev} {a.okres && `(${a.okres})`}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="datum_cas_start" render={({ field }) => (
                <FormItem><FormLabel>Začátek *</FormLabel><FormControl><Input type="datetime-local" {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="datum_cas_konec" render={({ field }) => (
                <FormItem><FormLabel>Konec</FormLabel><FormControl><Input type="datetime-local" {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          {/* Section: Režim */}
          <div className="form-section">
            <div className="form-section-title"><Gauge className="h-4 w-4" />Provozní režim</div>
            <FormField control={form.control} name="rezim" render={({ field }) => (
              <FormItem><FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-2">
                  {[{ value: 'manuální', label: 'Manuální' }, { value: 'poloautonomní', label: 'Poloauto' }, { value: 'autonomní', label: 'Autonomní' }].map(mode => (
                    <Label key={mode.value} className="flex min-h-12 cursor-pointer items-center justify-center rounded-lg border-2 border-border p-3 text-sm font-medium transition-colors hover:bg-muted [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/10">
                      <RadioGroupItem value={mode.value} className="sr-only" />{mode.label}
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl><FormMessage /></FormItem>
            )} />
            {selectedRezim === 'autonomní' && (
              <FormField control={form.control} name="s_mode" render={({ field }) => (
                <FormItem><FormLabel>S-Mode</FormLabel>
                  <Select onValueChange={v => field.onChange(parseInt(v))} value={field.value?.toString() || ''}>
                    <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Vyberte S-Mode" /></SelectTrigger></FormControl>
                    <SelectContent>{Object.entries(S_MODE_NAMES).map(([key, name]) => <SelectItem key={key} value={key} className="h-11">S-Mode {key}: {name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="rtk_stav" render={({ field }) => (
              <FormItem><FormLabel>RTK stav</FormLabel><FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-4 gap-2">
                  {[{ value: 'FIX', label: 'FIX' }, { value: 'FLOAT', label: 'FLOAT' }, { value: 'NONE', label: 'NONE' }, { value: 'neznámý', label: 'N/A' }].map(rtk => (
                    <Label key={rtk.value} className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border-2 border-border p-2 text-xs font-medium transition-colors hover:bg-muted [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/10">
                      <RadioGroupItem value={rtk.value} className="sr-only" />{rtk.label}
                    </Label>
                  ))}
                </RadioGroup>
              </FormControl><FormMessage /></FormItem>
            )} />
          </div>

          {/* Section: Motohodiny */}
          <div className="form-section">
            <div className="form-section-title"><Clock className="h-4 w-4" />Motohodiny & Výkon</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="mth_start" render={({ field }) => (
                <FormItem><FormLabel>MTH start *</FormLabel><FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-12 font-mono text-lg" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mth_konec" render={({ field }) => (
                <FormItem><FormLabel>MTH konec</FormLabel><FormControl>
                  <Input type="number" step="0.1" value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} className="h-12 font-mono text-lg" />
                </FormControl>
                  {mthKonec && mthStart && mthKonec > mthStart && <FormDescription className="font-mono">Δ {(mthKonec - mthStart).toFixed(1)} mth</FormDescription>}
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="plocha_obdelana_m2" render={({ field }) => (
              <FormItem><FormLabel>Obdělaná plocha (m²)</FormLabel><FormControl>
                <Input type="number" step="1" value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} className="h-12 font-mono" />
              </FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="poznamky" render={({ field }) => (
              <FormItem><FormLabel>Poznámky</FormLabel><FormControl><Textarea {...field} rows={3} className="resize-none" placeholder="Doplňující informace..." /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          {/* Sticky submit */}
          <div className="sticky bottom-20 z-30 flex gap-3 rounded-xl bg-card/95 p-3 backdrop-blur-sm border border-border">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-12 flex-1">Zrušit</Button>
            <Button type="submit" disabled={submitting} className="h-12 flex-1">
              {submitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><Save className="mr-2 h-4 w-4" />Uložit záznam</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
