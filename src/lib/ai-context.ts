// AI Context Builder - Enriches AI requests with machine state,
// service history, area data, and technical specifications.

import { supabase } from '@/integrations/supabase/client';

export async function buildAIContext(machineId: string): Promise<string> {
  const [machineResult, servicesResult, areasResult, intervalsResult] = await Promise.all([
    supabase.from('stroje').select('*').eq('id', machineId).single(),
    supabase.from('servisni_zaznamy')
      .select('datum_servisu, mth_pri_servisu, typ_zasahu, popis, provedl_osoba')
      .eq('stroj_id', machineId)
      .eq('is_deleted', false)
      .order('datum_servisu', { ascending: false })
      .limit(10),
    supabase.from('arealy')
      .select('nazev, okres, plocha_m2, obvod_oploceni_m, gps_latitude, gps_longitude')
      .order('nazev'),
    supabase.from('servisni_intervaly')
      .select('nazev, interval_mth, prvni_servis_mth, kriticnost')
      .order('kriticnost', { ascending: false }),
  ]);

  const machine = machineResult.data;
  const services = servicesResult.data || [];
  const areas = areasResult.data || [];
  const intervals = intervalsResult.data || [];

  // Calculate interval statuses
  const intervalStatus = intervals.map(interval => {
    const lastService = services.find(s => 
      s.popis?.toLowerCase().includes(interval.nazev.toLowerCase())
    );
    const lastMth = lastService?.mth_pri_servisu || 0;
    const isFirst = lastMth === 0;
    const effectiveInterval = isFirst && interval.prvni_servis_mth 
      ? interval.prvni_servis_mth 
      : interval.interval_mth;
    const nextMth = lastMth + effectiveInterval;
    const remaining = nextMth - (machine?.aktualni_mth || 0);
    
    return `- ${interval.nazev}: interval ${interval.interval_mth} mth` +
      (interval.prvni_servis_mth ? ` (první: ${interval.prvni_servis_mth} mth)` : '') +
      ` | zbývá ${remaining.toFixed(0)} mth | ${interval.kriticnost}`;
  });

  return `
AKTUÁLNÍ STAV STROJE:
- Model: ${machine?.model || 'Barbieri XRot 95 EVO'}
- S/N: ${machine?.vyrobni_cislo || 'N/A'}
- MTH: ${machine?.aktualni_mth || 0}
- Stav: ${machine?.stav || 'neznámý'}
- Poslední aktualizace MTH: ${machine?.datum_posledni_aktualizace_mth || 'N/A'}

SERVISNÍ INTERVALY (aktuální stav):
${intervalStatus.join('\n')}

SERVISNÍ HISTORIE (10 posledních):
${services.length > 0 
  ? services.map(s => `${s.datum_servisu}: ${s.typ_zasahu} - ${s.popis} (${s.mth_pri_servisu} mth, ${s.provedl_osoba})`).join('\n')
  : 'Žádné záznamy'}

DOSTUPNÉ AREÁLY (${areas.length}):
${areas.map(a => `${a.nazev} (${a.okres}): ${a.plocha_m2 || '?'}m², GPS: ${a.gps_latitude?.toFixed(5)},${a.gps_longitude?.toFixed(5)}`).join('\n')}

TECHNICKÉ SPECIFIKACE:
- Compass Servo Drive 2.0 (R54)
- Procesor: Broadcom BCM2837 @ 1.4GHz, 1GB RAM
- GNSS: u-blox ZED-F9P (GPS, GLONASS, BEIDOU, Galileo)
- RTK přesnost: 1-3cm (FIX režim)
- Šířka záběru: 95 cm
- Palivo: bezolovnatý benzín 95 oktanů (max E10)
- Dashboard: http://192.168.4.1:5000
- NTRIP: rtk.cuzk.cz:2101, mountpoint MAX3
`.trim();
}
