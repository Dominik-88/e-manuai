import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit2, Trash2, Copy, Calendar, User, Wrench,
  Clock, MapPin, AlertTriangle, Save, X, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, isTechnik } = useAuth();
  const { machine } = useMachine();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editData, setEditData] = useState<{
    datum_servisu: string;
    mth_pri_servisu: number;
    typ_zasahu: string;
    popis: string;
    provedl_osoba: string;
    provedla_firma: string;
    naklady: number | null;
    servisni_interval_id: string | null;
    areal_id: string | null;
  } | null>(null);

  const { data: service, isLoading } = useQuery({
    queryKey: ['service-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servisni_zaznamy')
        .select('*, arealy(nazev)')
        .eq('id', id!)
        .eq('is_deleted', false)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: intervals } = useQuery({
    queryKey: ['service-intervals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('servisni_intervaly').select('id, nazev').order('nazev');
      if (error) throw error;
      return data;
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('arealy').select('id, nazev').order('nazev');
      if (error) throw error;
      return data;
    },
  });

  const canEdit = isAdmin || isTechnik || service?.user_id === user?.id;

  const startEditing = () => {
    if (!service) return;
    setEditData({
      datum_servisu: service.datum_servisu,
      mth_pri_servisu: service.mth_pri_servisu,
      typ_zasahu: service.typ_zasahu,
      popis: service.popis,
      provedl_osoba: service.provedl_osoba,
      provedla_firma: service.provedla_firma || '',
      naklady: service.naklady,
      servisni_interval_id: service.servisni_interval_id,
      areal_id: service.areal_id,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData || !service || !user) return;
    if (editData.popis.length < 10) {
      toast.error('Popis musí mít alespoň 10 znaků');
      return;
    }
    if (new Date(editData.datum_servisu) > new Date()) {
      toast.error('Datum nesmí být v budoucnosti');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('servisni_zaznamy')
        .update({
          datum_servisu: editData.datum_servisu,
          mth_pri_servisu: editData.mth_pri_servisu,
          typ_zasahu: editData.typ_zasahu as 'preventivní' | 'oprava' | 'porucha' | 'jiné',
          popis: editData.popis,
          provedl_osoba: editData.provedl_osoba,
          provedla_firma: editData.provedla_firma || null,
          naklady: editData.naklady,
          servisni_interval_id: editData.servisni_interval_id,
          areal_id: editData.areal_id,
        })
        .eq('id', service.id);

      if (error) throw error;

      // Audit log
      await supabase.rpc('insert_audit_log', {
        _tabulka: 'servisni_zaznamy',
        _zaznam_id: service.id,
        _typ_zmeny: 'editace',
        _puvodni_data: service as any,
        _nova_data: editData as any,
      });

      queryClient.invalidateQueries({ queryKey: ['service-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['recent-services'] });
      setIsEditing(false);
      toast.success('Záznam byl aktualizován');
    } catch (err) {
      toast.error('Chyba při ukládání');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!service || !user || !deleteReason.trim()) {
      toast.error('Vyplňte důvod smazání');
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('servisni_zaznamy')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          deleted_reason: deleteReason.trim(),
        })
        .eq('id', service.id);

      if (error) {
        toast.error('Chyba při mazání: ' + error.message);
        console.error('Delete error:', error);
        return;
      }

      // Audit log — fire and forget
      supabase.rpc('insert_audit_log', {
        _tabulka: 'servisni_zaznamy',
        _zaznam_id: service.id,
        _typ_zmeny: 'smazání',
        _puvodni_data: service as any,
        _poznamka: deleteReason.trim(),
      }).then(({ error: auditErr }) => {
        if (auditErr) console.warn('Audit log failed:', auditErr);
      });

      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['recent-services'] });
      queryClient.invalidateQueries({ queryKey: ['last-services'] });
      toast.success('Záznam byl smazán');
      navigate('/servis');
    } catch (err: any) {
      toast.error('Chyba při mazání: ' + (err.message || ''));
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!service || !machine || !user) return;
    try {
      const { error } = await supabase.from('servisni_zaznamy').insert({
        stroj_id: machine.id,
        user_id: user.id,
        datum_servisu: new Date().toISOString().split('T')[0],
        mth_pri_servisu: machine.aktualni_mth,
        typ_zasahu: service.typ_zasahu,
        popis: service.popis,
        provedl_osoba: service.provedl_osoba,
        provedla_firma: service.provedla_firma,
        servisni_interval_id: service.servisni_interval_id,
        areal_id: service.areal_id,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Duplikát vytvořen s aktuálním MTH');
      navigate('/servis');
    } catch {
      toast.error('Chyba při duplikaci');
    }
  };

  const getTypColor = (typ: string) => {
    switch (typ) {
      case 'preventivní': return 'bg-success/20 text-success border-success/30';
      case 'oprava': return 'bg-warning/20 text-warning border-warning/30';
      case 'porucha': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/servis')} className="h-14 w-14">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="dashboard-widget py-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-warning" />
          <h2 className="mt-4 text-xl font-semibold">Záznam nenalezen</h2>
          <p className="mt-2 text-muted-foreground">Servisní záznam neexistuje nebo byl smazán.</p>
          <Button asChild className="mt-4 h-14">
            <Link to="/servis">Zpět na seznam</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/servis')} className="h-14 w-14" aria-label="Zpět">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Detail servisního záznamu</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(service.datum_servisu), 'd. MMMM yyyy', { locale: cs })}
          </p>
        </div>
      </div>

      {/* Action toolbar */}
      {canEdit && !isEditing && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={startEditing} className="h-12 flex-1 gap-2">
            <Edit2 className="h-4 w-4" />
            Upravit
          </Button>
          <Button variant="outline" onClick={handleDuplicate} className="h-12 flex-1 gap-2">
            <Copy className="h-4 w-4" />
            Duplikovat
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="h-12 gap-2 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Content - view or edit mode */}
      <div className="dashboard-widget space-y-4">
        {isEditing && editData ? (
          <>
            {/* Edit form */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Datum servisu</label>
                <Input
                  type="date"
                  value={editData.datum_servisu}
                  onChange={e => setEditData({ ...editData, datum_servisu: e.target.value })}
                  className="h-14 text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">MTH při servisu</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editData.mth_pri_servisu}
                  onChange={e => setEditData({ ...editData, mth_pri_servisu: parseFloat(e.target.value) || 0 })}
                  className="h-14 font-mono text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Typ zásahu</label>
              <Select value={editData.typ_zasahu} onValueChange={v => setEditData({ ...editData, typ_zasahu: v })}>
                <SelectTrigger className="h-14 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventivní">Preventivní</SelectItem>
                  <SelectItem value="oprava">Oprava</SelectItem>
                  <SelectItem value="porucha">Porucha</SelectItem>
                  <SelectItem value="jiné">Jiné</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Servisní interval</label>
              <Select
                value={editData.servisni_interval_id || ''}
                onValueChange={v => setEditData({ ...editData, servisni_interval_id: v || null })}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Žádný" />
                </SelectTrigger>
                <SelectContent>
                  {intervals?.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nazev}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Popis práce</label>
              <Textarea
                value={editData.popis}
                onChange={e => setEditData({ ...editData, popis: e.target.value })}
                rows={4}
                className="resize-none text-base"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Provedl</label>
                <Input
                  value={editData.provedl_osoba}
                  onChange={e => setEditData({ ...editData, provedl_osoba: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Firma</label>
                <Input
                  value={editData.provedla_firma}
                  onChange={e => setEditData({ ...editData, provedla_firma: e.target.value })}
                  className="h-12 text-base"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Areál</label>
                <Select
                  value={editData.areal_id || ''}
                  onValueChange={v => setEditData({ ...editData, areal_id: v || null })}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Žádný" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas?.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.nazev}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Náklady (Kč)</label>
                <Input
                  type="number"
                  value={editData.naklady ?? ''}
                  onChange={e => setEditData({ ...editData, naklady: e.target.value ? parseFloat(e.target.value) : null })}
                  className="h-12 font-mono text-base"
                />
              </div>
            </div>

            {/* Edit actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="h-14 flex-1 text-base">
                <X className="mr-2 h-5 w-5" />
                Zrušit
              </Button>
              <Button onClick={handleSave} disabled={saving} className="h-14 flex-1 text-base">
                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Uložit
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* View mode */}
            <div className="flex items-center gap-3">
              <Badge className={cn('border text-sm capitalize', getTypColor(service.typ_zasahu))}>
                {service.typ_zasahu}
              </Badge>
              <span className="font-mono text-lg font-bold">{service.mth_pri_servisu} mth</span>
            </div>

            <p className="whitespace-pre-wrap text-base leading-relaxed">{service.popis}</p>

            <div className="grid gap-3 rounded-lg bg-muted/30 p-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Datum:</span>
                <span className="font-medium">
                  {format(new Date(service.datum_servisu), 'd. MMMM yyyy', { locale: cs })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Provedl:</span>
                <span className="font-medium">{service.provedl_osoba}</span>
                {service.provedla_firma && (
                  <span className="text-muted-foreground">({service.provedla_firma})</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">MTH:</span>
                <span className="font-mono font-medium">{service.mth_pri_servisu} h</span>
              </div>
              {(service as any).arealy?.nazev && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Areál:</span>
                  <span className="font-medium">{(service as any).arealy.nazev}</span>
                </div>
              )}
              {service.naklady && (
                <div className="flex items-center gap-3 text-sm">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Náklady:</span>
                  <span className="font-mono font-medium">{service.naklady.toLocaleString()} Kč</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat servisní záznam?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>{service.typ_zasahu}</strong> ze dne{' '}
                {format(new Date(service.datum_servisu), 'd. M. yyyy', { locale: cs })}
                {' '}při {service.mth_pri_servisu} mth
              </p>
              <p className="text-sm">{service.popis}</p>
              <div className="mt-3 space-y-2">
                <label className="text-sm font-medium">Důvod smazání *</label>
                <Textarea
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Proč chcete smazat tento záznam..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12">Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!deleteReason.trim() || deleting}
              className="h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
