import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

// Enhanced validation schema
const createServiceSchema = (lastServiceMth: number) => z.object({
  datum_servisu: z.string().refine(val => {
    const date = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
  }, 'Datum nesmí být v budoucnosti'),
  mth_pri_servisu: z.number()
    .min(0, 'MTH musí být kladné číslo')
    .refine(val => val >= lastServiceMth, {
      message: `MTH nesmí být nižší než u posledního servisu (${lastServiceMth} mth)`,
    }),
  typ_zasahu: z.enum(['preventivní', 'oprava', 'porucha', 'jiné']),
  popis: z.string()
    .min(10, 'Popis musí mít alespoň 10 znaků')
    .max(1000, 'Popis může mít maximálně 1000 znaků'),
  provedl_osoba: z.string()
    .min(2, 'Vyplňte jméno technika')
    .max(100, 'Jméno může mít maximálně 100 znaků'),
  provedla_firma: z.string().max(100, 'Název firmy může mít maximálně 100 znaků').optional(),
  areal_id: z.string().optional(),
  servisni_interval_id: z.string().optional(),
  naklady: z.number().min(0, 'Náklady nemohou být záporné').optional(),
});

type ServiceFormData = z.infer<ReturnType<typeof createServiceSchema>>;

export default function NewServicePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { machine } = useMachine();
  const [submitting, setSubmitting] = useState(false);

  // Fetch last service MTH
  const { data: lastService } = useQuery({
    queryKey: ['last-service-mth', machine?.id],
    queryFn: async () => {
      if (!machine) return null;
      const { data, error } = await supabase
        .from('servisni_zaznamy')
        .select('mth_pri_servisu')
        .eq('stroj_id', machine.id)
        .eq('is_deleted', false)
        .order('mth_pri_servisu', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!machine,
  });

  const lastServiceMth = lastService?.mth_pri_servisu || 0;
  const serviceSchema = createServiceSchema(lastServiceMth);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      datum_servisu: new Date().toISOString().split('T')[0],
      mth_pri_servisu: machine?.aktualni_mth || 0,
      typ_zasahu: 'preventivní',
      popis: '',
      provedl_osoba: profile?.full_name || '',
      provedla_firma: '',
      areal_id: undefined,
      servisni_interval_id: undefined,
      naklady: undefined,
    },
  });

  // Fetch areas for dropdown
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arealy')
        .select('id, nazev, okres')
        .order('nazev');
      if (error) throw error;
      return data;
    },
  });

  // Fetch service intervals
  const { data: intervals } = useQuery({
    queryKey: ['service-intervals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servisni_intervaly')
        .select('id, nazev')
        .order('nazev');
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    if (!machine || !user) {
      toast.error('Chybí data stroje nebo uživatele');
      return;
    }

    setSubmitting(true);

    try {
      // Create service record
      const { error } = await supabase
        .from('servisni_zaznamy')
        .insert({
          stroj_id: machine.id,
          user_id: user.id,
          datum_servisu: data.datum_servisu,
          mth_pri_servisu: data.mth_pri_servisu,
          typ_zasahu: data.typ_zasahu,
          popis: data.popis,
          provedl_osoba: data.provedl_osoba,
          provedla_firma: data.provedla_firma || null,
          areal_id: data.areal_id || null,
          servisni_interval_id: data.servisni_interval_id || null,
          naklady: data.naklady || null,
        });


      if (error) throw error;

      // Update machine MTH if the service MTH is higher
      if (data.mth_pri_servisu > machine.aktualni_mth) {
        await supabase
          .from('stroje')
          .update({ 
            aktualni_mth: data.mth_pri_servisu,
            datum_posledni_aktualizace_mth: new Date().toISOString()
          })
          .eq('id', machine.id);
      }

      toast.success('Servisní záznam byl uložen');
      navigate('/servis');
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Chyba při ukládání záznamu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-14 w-14">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nový servisní záznam</h1>
          <p className="text-muted-foreground">
            Stroj: {machine?.vyrobni_cislo} | Aktuální MTH: {machine?.aktualni_mth}
          </p>
        </div>
      </div>

      {/* MTH warning if lower than last */}
      {lastServiceMth > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Poslední zaznamenaný servis byl při <strong>{lastServiceMth} mth</strong>. 
            Nový záznam nemůže mít nižší hodnotu.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="dashboard-widget space-y-4">
            {/* Date and MTH */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="datum_servisu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum servisu *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-14 text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mth_pri_servisu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stav MTH při servisu *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min={lastServiceMth}
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        className="h-14 font-mono text-lg"
                      />
                    </FormControl>
                    <FormDescription>
                      Min. {lastServiceMth} mth (poslední servis)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type of service - larger touch targets */}
            <FormField
              control={form.control}
              name="typ_zasahu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typ zásahu *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      {[
                        { value: 'preventivní', label: 'Preventivní', color: 'border-success' },
                        { value: 'oprava', label: 'Oprava', color: 'border-warning' },
                        { value: 'porucha', label: 'Porucha', color: 'border-destructive' },
                        { value: 'jiné', label: 'Jiné', color: 'border-muted' },
                      ].map(type => (
                        <Label
                          key={type.value}
                          className={`flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-4 text-base font-medium transition-colors hover:bg-muted [&:has([data-state=checked])]:${type.color} [&:has([data-state=checked])]:bg-primary/10`}
                        >
                          <RadioGroupItem value={type.value} className="sr-only" />
                          {type.label}
                        </Label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service interval selection */}
            <FormField
              control={form.control}
              name="servisni_interval_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servisní interval (volitelné)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 text-base">
                        <SelectValue placeholder="Vyberte typ servisu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {intervals?.map(interval => (
                        <SelectItem key={interval.id} value={interval.id} className="h-12">
                          {interval.nazev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Propojí záznam s plánovaným servisním intervalem
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />



            {/* Description */}
            <FormField
              control={form.control}
              name="popis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popis práce * (min. 10 znaků)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={4}
                      placeholder="Popište provedené práce..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Technician */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="provedl_osoba"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provedl (jméno) *</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provedla_firma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma (volitelné)</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Area and costs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="areal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Areál (volitelné)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Vyberte areál" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {areas?.map(area => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.nazev} {area.okres && `(${area.okres})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="naklady"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Náklady Kč (volitelné)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="h-12 font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="h-12 flex-1"
            >
              Zrušit
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="h-12 flex-1"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Uložit záznam
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
