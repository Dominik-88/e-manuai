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
import { ArrowLeft, Save, Wrench, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';

const serviceSchema = z.object({
  datum_servisu: z.string().min(1, 'Vyplňte datum'),
  mth_pri_servisu: z.number().min(0, 'MTH musí být kladné číslo'),
  typ_zasahu: z.enum(['preventivní', 'oprava', 'porucha', 'jiné']),
  popis: z.string().min(10, 'Popis musí mít alespoň 10 znaků').max(1000),
  provedl_osoba: z.string().min(2, 'Vyplňte jméno technika').max(100),
  provedla_firma: z.string().max(100).optional(),
  areal_id: z.string().optional(),
  servisni_interval_id: z.string().optional(),
  naklady: z.number().min(0).optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function NewServicePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { machine } = useMachine();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      datum_servisu: new Date().toISOString().split('T')[0],
      mth_pri_servisu: 0, typ_zasahu: 'preventivní', popis: '',
      provedl_osoba: profile?.full_name || '', provedla_firma: '',
      areal_id: undefined, servisni_interval_id: undefined, naklady: undefined,
    },
  });

  useEffect(() => { if (machine) form.setValue('mth_pri_servisu', machine.aktualni_mth); }, [machine, form]);
  useEffect(() => { if (profile?.full_name && !form.getValues('provedl_osoba')) form.setValue('provedl_osoba', profile.full_name); }, [profile, form]);

  const { data: areas } = useQuery({
    queryKey: ['areas'], queryFn: async () => {
      const { data, error } = await supabase.from('arealy').select('id, nazev, okres').order('nazev');
      if (error) throw error; return data;
    },
  });

  const { data: intervals } = useQuery({
    queryKey: ['service-intervals'], queryFn: async () => {
      const { data, error } = await supabase.from('servisni_intervaly').select('id, nazev').order('nazev');
      if (error) throw error; return data;
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    if (!machine || !user) { toast.error('Chybí data stroje nebo uživatele'); return; }
    if (data.mth_pri_servisu < machine.aktualni_mth * 0.9) {
      toast.error(`MTH nesmí výrazně klesnout pod aktuální hodnotu (${machine.aktualni_mth.toFixed(1)} h)`); return;
    }
    if (new Date(data.datum_servisu) > new Date()) { toast.error('Datum servisu nesmí být v budoucnosti'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('servisni_zaznamy').insert({
        stroj_id: machine.id, user_id: user.id, datum_servisu: data.datum_servisu,
        mth_pri_servisu: data.mth_pri_servisu, typ_zasahu: data.typ_zasahu,
        popis: data.popis, provedl_osoba: data.provedl_osoba,
        provedla_firma: data.provedla_firma || null, areal_id: data.areal_id || null,
        servisni_interval_id: data.servisni_interval_id || null, naklady: data.naklady || null,
      });
      if (error) throw new Error(error.message);
      if (data.mth_pri_servisu > machine.aktualni_mth) {
        await supabase.from('stroje').update({ aktualni_mth: data.mth_pri_servisu, datum_posledni_aktualizace_mth: new Date().toISOString() }).eq('id', machine.id);
      }
      toast.success('Servisní záznam byl uložen');
      navigate('/servis');
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
          <h1 className="text-xl font-bold">Nový servisní záznam</h1>
          <p className="text-xs text-muted-foreground">
            {machine?.vyrobni_cislo || '...'} · MTH: {machine?.aktualni_mth?.toFixed(1) || '...'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Section: Základní údaje */}
          <div className="form-section">
            <div className="form-section-title"><Wrench className="h-4 w-4" />Základní údaje</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="datum_servisu" render={({ field }) => (
                <FormItem><FormLabel>Datum servisu *</FormLabel><FormControl><Input type="date" {...field} className="h-12 text-base" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="mth_pri_servisu" render={({ field }) => (
                <FormItem><FormLabel>Stav MTH *</FormLabel><FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-12 font-mono text-lg" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="typ_zasahu" render={({ field }) => (
              <FormItem>
                <FormLabel>Typ zásahu *</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-2">
                    {[{ value: 'preventivní', label: 'Preventivní' }, { value: 'oprava', label: 'Oprava' }, { value: 'porucha', label: 'Porucha' }, { value: 'jiné', label: 'Jiné' }].map(type => (
                      <Label key={type.value} className="flex min-h-12 cursor-pointer items-center justify-center rounded-lg border-2 border-border p-3 text-sm font-medium transition-colors hover:bg-muted [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/10">
                        <RadioGroupItem value={type.value} className="sr-only" />{type.label}
                      </Label>
                    ))}
                  </RadioGroup>
                </FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="servisni_interval_id" render={({ field }) => (
              <FormItem><FormLabel>Servisní interval</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Vyberte typ servisu" /></SelectTrigger></FormControl>
                  <SelectContent>{intervals?.map(i => <SelectItem key={i.id} value={i.id} className="h-11">{i.nazev}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Section: Popis práce */}
          <div className="form-section">
            <div className="form-section-title"><FileText className="h-4 w-4" />Popis práce</div>
            <FormField control={form.control} name="popis" render={({ field }) => (
              <FormItem><FormLabel>Popis * (min. 10 znaků)</FormLabel><FormControl><Textarea {...field} rows={4} placeholder="Popište provedené práce..." className="resize-none text-base" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          {/* Section: Technik & Náklady */}
          <div className="form-section">
            <div className="form-section-title"><Users className="h-4 w-4" />Technik & Náklady</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="provedl_osoba" render={({ field }) => (
                <FormItem><FormLabel>Provedl *</FormLabel><FormControl><Input {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="provedla_firma" render={({ field }) => (
                <FormItem><FormLabel>Firma</FormLabel><FormControl><Input {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="areal_id" render={({ field }) => (
                <FormItem><FormLabel>Areál</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Vyberte areál" /></SelectTrigger></FormControl>
                    <SelectContent>{areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.nazev} {a.okres && `(${a.okres})`}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="naklady" render={({ field }) => (
                <FormItem><FormLabel>Náklady Kč</FormLabel><FormControl>
                  <Input type="number" step="1" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} className="h-12 font-mono" />
                </FormControl><FormMessage /></FormItem>
              )} />
            </div>
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
