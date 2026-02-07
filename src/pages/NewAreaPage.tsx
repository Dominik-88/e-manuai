import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useMachine } from '@/hooks/useMachine';
import { toast } from 'sonner';
import { ArrowLeft, Save, MapPin, LocateFixed, Globe, Landmark, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { OKRES_NAMES } from '@/types/database';
import type { OkresCode } from '@/types/database';

const areaSchema = z.object({
  nazev: z.string().min(2, 'Název musí mít alespoň 2 znaky').max(200),
  typ: z.enum(['vodojem', 'úpravna vody', 'čerpací stanice', 'vrt', 'vinice', 'sad', 'park', 'zahrada', 'jiné']),
  okres: z.string().optional(),
  plocha_m2: z.number().min(0).optional(),
  obvod_oploceni_m: z.number().min(0).optional(),
  gps_latitude: z.number().min(-90).max(90).optional(),
  gps_longitude: z.number().min(-180).max(180).optional(),
  google_maps_link: z.string().url('Neplatný odkaz').optional().or(z.literal('')),
  kategorie_travnate_plochy: z.string().optional(),
  poznamky: z.string().max(1000).optional(),
});

type AreaFormData = z.infer<typeof areaSchema>;

export default function NewAreaPage() {
  const navigate = useNavigate();
  const { machine } = useMachine();
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      nazev: '', typ: 'vodojem', okres: undefined,
      plocha_m2: undefined, obvod_oploceni_m: undefined,
      gps_latitude: undefined, gps_longitude: undefined,
      google_maps_link: '', kategorie_travnate_plochy: '', poznamky: '',
    },
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolokace není dostupná'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue('gps_latitude', parseFloat(pos.coords.latitude.toFixed(6)));
        form.setValue('gps_longitude', parseFloat(pos.coords.longitude.toFixed(6)));
        toast.success('GPS souřadnice nastaveny');
        setLocating(false);
      },
      () => { toast.error('Nepodařilo se získat polohu'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (data: AreaFormData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('arealy').insert({
        nazev: data.nazev, typ: data.typ as any,
        okres: (data.okres || null) as any,
        plocha_m2: data.plocha_m2 || null, obvod_oploceni_m: data.obvod_oploceni_m || null,
        gps_latitude: data.gps_latitude || null, gps_longitude: data.gps_longitude || null,
        google_maps_link: data.google_maps_link || null,
        kategorie_travnate_plochy: data.kategorie_travnate_plochy || null,
        poznamky: data.poznamky || null,
        prirazeny_stroj_id: machine?.id || null,
      });
      if (error) throw error;
      toast.success('Areál byl úspěšně přidán');
      navigate('/arealy');
    } catch (error) {
      console.error('Error saving area:', error);
      toast.error('Chyba při ukládání areálu');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 shrink-0" aria-label="Zpět">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nový areál</h1>
          <p className="text-xs text-muted-foreground">Přidejte novou lokalitu</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Section: Základní údaje */}
          <div className="form-section">
            <div className="form-section-title">
              <Landmark className="h-4 w-4" />
              Základní údaje
            </div>
            <FormField control={form.control} name="nazev"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název areálu *</FormLabel>
                  <FormControl><Input {...field} className="h-12 text-base" placeholder="např. VDJ Písek – Hradiště" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="typ"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ objektu *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-12"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['vodojem', 'úpravna vody', 'čerpací stanice', 'vrt', 'vinice', 'sad', 'park', 'zahrada', 'jiné'].map(t => (
                          <SelectItem key={t} value={t} className="h-11 capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField control={form.control} name="okres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Okres</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Vyberte okres" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(Object.entries(OKRES_NAMES) as [OkresCode, string][]).map(([code, name]) => (
                          <SelectItem key={code} value={code} className="h-11">{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
          </div>

          {/* Section: Rozměry */}
          <div className="form-section">
            <div className="form-section-title">
              <Ruler className="h-4 w-4" />
              Rozměry
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="plocha_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plocha (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="h-12 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField control={form.control} name="obvod_oploceni_m"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Obvod oplocení (bm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="h-12 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="kategorie_travnate_plochy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie travnaté plochy</FormLabel>
                  <FormControl><Input {...field} className="h-12" placeholder="např. A, B, C" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
          </div>

          {/* Section: GPS & Lokace */}
          <div className="form-section">
            <div className="form-section-title">
              <Globe className="h-4 w-4" />
              GPS & Lokace
            </div>
            <Button type="button" variant="outline" onClick={handleGetLocation} disabled={locating} className="h-11 w-full gap-2">
              <LocateFixed className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Získávám polohu...' : 'Použít moji polohu'}
            </Button>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="gps_latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00001" {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="h-12 font-mono" placeholder="49.30812" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField control={form.control} name="gps_longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00001" {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="h-12 font-mono" placeholder="14.14712" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
            <FormField control={form.control} name="google_maps_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Maps odkaz</FormLabel>
                  <FormControl><Input {...field} className="h-12" placeholder="https://maps.google.com/..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
          </div>

          {/* Section: Poznámky */}
          <div className="form-section">
            <FormField control={form.control} name="poznamky"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poznámky</FormLabel>
                  <FormControl><Textarea {...field} rows={3} className="resize-none" placeholder="Doplňující informace..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
          </div>

          {/* Sticky submit */}
          <div className="sticky bottom-20 z-30 flex gap-3 rounded-xl bg-card/95 p-3 backdrop-blur-sm border border-border">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-12 flex-1">
              Zrušit
            </Button>
            <Button type="submit" disabled={submitting} className="h-12 flex-1">
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Uložit areál</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
