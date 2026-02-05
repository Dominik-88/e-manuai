import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Filter, Wrench, Calendar, User, FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function ServicePage() {
  const { machine } = useMachine();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', machine?.id],
    queryFn: async () => {
      if (!machine) return [];
      
      const { data, error } = await supabase
        .from('servisni_zaznamy')
        .select(`
          *,
          arealy (nazev)
        `)
        .eq('stroj_id', machine.id)
        .eq('is_deleted', false)
        .order('datum_servisu', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!machine,
  });

  const filteredServices = services?.filter(service =>
    service.popis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provedl_osoba.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.typ_zasahu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypBadgeColor = (typ: string) => {
    switch (typ) {
      case 'preventivní': return 'bg-success/20 text-success border-success/30';
      case 'oprava': return 'bg-warning/20 text-warning border-warning/30';
      case 'porucha': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleExportPDF = async () => {
    if (!machine || !filteredServices?.length) {
      toast.error('Žádné záznamy k exportu');
      return;
    }
    try {
      await exportServicesToPDF(filteredServices, machine);
      toast.success('PDF bylo úspěšně staženo');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Chyba při exportu PDF');
    }
  };

  const handleExportExcel = () => {
    if (!machine || !filteredServices?.length) {
      toast.error('Žádné záznamy k exportu');
      return;
    }
    try {
      exportServicesToExcel(filteredServices, machine);
      toast.success('Excel byl úspěšně stažen');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Chyba při exportu Excel');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Servisní knížka</h1>
          <p className="text-muted-foreground">
            Historie a evidence servisních zásahů
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-14 gap-2">
                <FileDown className="h-5 w-5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF} className="h-12 gap-2">
                <FileDown className="h-5 w-5 text-destructive" />
                Export do PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} className="h-12 gap-2">
                <FileSpreadsheet className="h-5 w-5 text-success" />
                Export do Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild className="h-14 gap-2">
            <Link to="/servis/novy">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nový záznam</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Hledat v servisech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-10 text-base"
          />
        </div>
        <Button variant="outline" size="icon" className="h-14 w-14">
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Service list */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : filteredServices && filteredServices.length > 0 ? (
        <div className="space-y-3">
          {filteredServices.map(service => (
            <Link
              key={service.id}
              to={`/servis/${service.id}`}
              className="dashboard-widget block transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('border text-xs capitalize', getTypBadgeColor(service.typ_zasahu))}>
                      {service.typ_zasahu}
                    </Badge>
                    <span className="font-mono text-sm text-muted-foreground">
                      {service.mth_pri_servisu} mth
                    </span>
                  </div>
                  
                  <p className="mt-2 line-clamp-2 text-sm">
                    {service.popis}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(service.datum_servisu), 'd. M. yyyy', { locale: cs })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {service.provedl_osoba}
                    </span>
                    {service.arealy?.nazev && (
                      <span className="flex items-center gap-1">
                        📍 {service.arealy.nazev}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(service.datum_servisu), { 
                      addSuffix: true,
                      locale: cs 
                    })}
                  </span>
                  {service.naklady && (
                    <p className="mt-1 font-mono text-sm font-medium text-foreground">
                      {service.naklady.toLocaleString()} Kč
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="dashboard-widget py-16 text-center">
          <Wrench className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-xl font-semibold">Zatím žádné servisní záznamy</h3>
          <p className="mt-2 text-muted-foreground">
            Vytvořte první záznam pro sledování servisní historie
          </p>
          <Button asChild className="mt-6 h-14">
            <Link to="/servis/novy">
              <Plus className="mr-2 h-5 w-5" />
              Přidat první záznam
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
