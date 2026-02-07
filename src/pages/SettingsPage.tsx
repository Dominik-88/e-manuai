import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMachine } from '@/hooks/useMachine';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Wrench, Save, Gauge, Sun } from 'lucide-react';
import { SunGlareToggle } from '@/components/settings/SunGlareToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const { user, profile, role, signOut } = useAuth();
  const { machine, updateMth, refetch } = useMachine();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [mthValue, setMthValue] = useState('');
  const [mthOpen, setMthOpen] = useState(false);
  const [mthSaving, setMthSaving] = useState(false);

  // Init fullName when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  // Init mthValue when machine loads
  useEffect(() => {
    if (machine) {
      setMthValue(machine.aktualni_mth.toString());
    }
  }, [machine]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Profil aktualizován');
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error('Chyba při ukládání profilu');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMth = async () => {
    const newMth = parseFloat(mthValue);
    if (isNaN(newMth) || newMth < 0) {
      toast.error('Neplatná hodnota MTH');
      return;
    }
    // Validation: MTH must not decrease (data integrity rule)
    if (machine && newMth < machine.aktualni_mth) {
      toast.error(`MTH nesmí klesnout pod aktuální hodnotu (${machine.aktualni_mth.toFixed(1)} h)`);
      return;
    }
    setMthSaving(true);
    try {
      await updateMth(newMth);
      await refetch();
      toast.success(`MTH aktualizováno na ${newMth}`);
      setMthOpen(false);
    } catch (err) {
      console.error('MTH update error:', err);
      toast.error('Chyba při aktualizaci MTH. Nemáte oprávnění?');
    } finally {
      setMthSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nastavení</h1>

      {/* User profile */}
      <div className="dashboard-widget space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold">{profile?.full_name || 'Uživatel'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              {role === 'admin' ? 'Administrátor' : role === 'technik' ? 'Technik' : 'Operátor'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Celé jméno</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <Button onClick={handleSaveProfile} disabled={saving} className="h-14 w-full text-base">
          {saving ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Uložit profil
            </>
          )}
        </Button>
      </div>

      {/* Machine settings */}
      {machine && (
        <div className="dashboard-widget space-y-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-semibold">{machine.model}</p>
              <p className="text-sm text-muted-foreground">S/N: {machine.vyrobni_cislo}</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <div>
              <p className="text-sm text-muted-foreground">Aktuální MTH</p>
              <p className="font-mono text-3xl font-bold">{machine.aktualni_mth.toFixed(1)}</p>
            </div>
            <Dialog open={mthOpen} onOpenChange={setMthOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-14 gap-2 text-base"
                  onClick={() => setMthValue(machine.aktualni_mth.toString())}
                >
                  <Gauge className="h-5 w-5" />
                  Upravit MTH
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aktualizovat motohodiny</DialogTitle>
                  <DialogDescription>
                    Zadejte aktuální hodnotu motohodin z displeje stroje.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Aktuální hodnota</Label>
                    <p className="font-mono text-2xl font-bold text-muted-foreground">{machine.aktualni_mth.toFixed(1)} h</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newMth">Nová hodnota MTH</Label>
                    <Input
                      id="newMth"
                      type="number"
                      step="0.1"
                      min={machine.aktualni_mth}
                      value={mthValue}
                      onChange={e => setMthValue(e.target.value)}
                      className="h-14 font-mono text-2xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Hodnota nesmí být nižší než aktuální ({machine.aktualni_mth.toFixed(1)} h)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMthOpen(false)} className="h-12">
                    Zrušit
                  </Button>
                  <Button onClick={handleUpdateMth} disabled={mthSaving} className="h-12">
                    {mthSaving ? 'Ukládání...' : 'Uložit MTH'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Sun-Glare & Haptic settings */}
      <div className="dashboard-widget space-y-4">
        <div className="flex items-center gap-3">
          <Sun className="h-6 w-6 text-warning" />
          <div>
            <p className="font-semibold">Terénní režim</p>
            <p className="text-sm text-muted-foreground">Kontrast a haptická odezva</p>
          </div>
        </div>
        <SunGlareToggle />
      </div>

      {/* Sign out */}
      <Button variant="destructive" onClick={signOut} className="h-14 w-full text-base">
        Odhlásit se
      </Button>
    </div>
  );
}
