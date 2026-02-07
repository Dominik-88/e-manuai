import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Filter, Wrench, Calendar, User, FileDown, FileSpreadsheet, X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMachine } from '@/hooks/useMachine';
import { formatDistanceToNow, format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { exportServicesToPDF, exportServicesToExcel } from '@/lib/export';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const typColors: Record<string, string> = {
  'preventivní': '#22c55e',
  'oprava': '#f59e0b',
  'porucha': '#ef4444',
  'jiné': '#6b7280',
};

export default function ServicePage() {
  const { machine } = useMachine();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTyp, setFilterTyp] = useState<string>('all');

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', machine?.id],
    queryFn: async () => {
      if (!machine) return [];
      const { data, error } = await supabase
        .from('servisni_zaznamy')
        .select(`*, arealy (nazev)`)
        .eq('stroj_id', machine.id)
        .eq('is_deleted', false)
        .order('datum_servisu', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!machine,
  });

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(s => {
      const matchesSearch = !searchQuery ||
        s.popis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.provedl_osoba.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.typ_zasahu.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTyp = filterTyp === 'all' || s.typ_zasahu === filterTyp;
      return matchesSearch && matchesTyp;
    });
  }, [services, searchQuery, filterTyp]);

  // Summary statistics
  const totalCost = services?.reduce((sum, s) => sum + (s.naklady || 0), 0) || 0;
  const lastService = services?.[0];

  const getTypBadgeColor = (typ: string) => {
    switch (typ) {
      case 'preventivní': return 'bg-success/20 text-success border-success/30';
      case 'oprava': return 'bg-warning/20 text-warning border-warning/30';
      case 'porucha': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleExportPDF = async () => {
    if (!machine || !filteredServices?.length) { toast.error('Žádné záznamy k exportu'); return; }
    try { await exportServicesToPDF(filteredServices, machine); toast.success('PDF staženo'); } catch { toast.error('Chyba při exportu'); }
  };

  const handleExportExcel = async () => {
    if (!machine || !filteredServices?.length) { toast.error('Žádné záznamy k exportu'); return; }
    try { await exportServicesToExcel(filteredServices, machine); toast.success('Excel stažen'); } catch { toast.error('Chyba při exportu'); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Servisní knížka</h1>
            <p className="text-xs text-muted-foreground">Evidence servisních zásahů</p>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <FileDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF} className="h-11 gap-2">
                <FileDown className="h-4 w-4 text-destructive" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} className="h-11 gap-2">
                <FileSpreadsheet className="h-4 w-4 text-success" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild size="icon" className="h-10 w-10">
            <Link to="/servis/novy" aria-label="Nový servisní záznam">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2">
          <span className="font-mono text-sm font-bold text-primary">{services?.length || 0}</span>
          <span className="text-[10px] text-muted-foreground">záznamů</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-2">
          <DollarSign className="h-3 w-3 text-warning" />
          <span className="font-mono text-sm font-bold text-warning">{totalCost.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground">Kč</span>
        </div>
        {lastService && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2">
            <Calendar className="h-3 w-3 text-success" />
            <span className="text-[10px] text-muted-foreground">
              Poslední: {format(new Date(lastService.datum_servisu), 'd.M.yyyy', { locale: cs })}
            </span>
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Hledat v servisech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-9 text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={filterTyp} onValueChange={setFilterTyp}>
          <SelectTrigger className="h-11 w-[140px] text-xs">
            <Filter className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            <SelectItem value="preventivní">Preventivní</SelectItem>
            <SelectItem value="oprava">Oprava</SelectItem>
            <SelectItem value="porucha">Porucha</SelectItem>
            <SelectItem value="jiné">Jiné</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
      ) : filteredServices && filteredServices.length > 0 ? (
        <div className="space-y-2">
          {filteredServices.map(service => (
            <Link
              key={service.id}
              to={`/servis/${service.id}`}
              className="group relative block overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Color accent strip */}
              <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: typColors[service.typ_zasahu] || '#6b7280' }} />

              <div className="flex items-start gap-3 p-3.5 pl-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('border text-[10px] capitalize', getTypBadgeColor(service.typ_zasahu))}>
                      {service.typ_zasahu}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {service.mth_pri_servisu} mth
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm leading-snug line-clamp-2">{service.popis}</p>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(service.datum_servisu), 'd. M. yyyy', { locale: cs })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {service.provedl_osoba}
                    </span>
                    {service.arealy?.nazev && (
                      <span>📍 {service.arealy.nazev}</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(service.datum_servisu), { addSuffix: true, locale: cs })}
                  </span>
                  {service.naklady != null && service.naklady > 0 && (
                    <p className="mt-1 font-mono text-sm font-medium">{service.naklady.toLocaleString()} Kč</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
            <Wrench className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Zatím žádné servisní záznamy</h3>
          <p className="mt-1 text-sm text-muted-foreground">Vytvořte první záznam pro sledování servisní historie</p>
          <Button asChild className="mt-6 gap-2">
            <Link to="/servis/novy">
              <Plus className="h-4 w-4" />
              Přidat první záznam
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
