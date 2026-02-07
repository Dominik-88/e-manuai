

# Rozsiření telemetrie: RLS audit, mapa, offline watchdog, servis logika, PLC simulátor

## Přehled

Pět vylepšení nad existující Supabase Realtime telemetrií, seřazených podle priority.

---

## 1. RLS audit pro telemetrie_stroje

**Aktuální stav**: Tabulka má dvě politiky:
- `SELECT` pro authenticated (`USING (true)`) -- OK, Realtime funguje
- `ALL` pro service_role (`USING (true)`) -- OK, ingest edge function zapisuje přes service_role

**Riziko**: RLS policy pro service_role je `RESTRICTIVE` (ne PERMISSIVE). To je v pořádku, protože service_role obchází RLS ve výchozím nastavení.

**Akce**: Žádná změna není nutná. Politiky jsou správně nastavené. Ověříme to v rámci implementace přidáním logu do konzole při subscribe.

---

## 2. Napojení telemetrie na mapu (živý bod stroje)

Na stránce Areály se na mapě zobrazí aktuální poloha stroje jako pulzující modrý bod (pokud telemetrie obsahuje GPS souřadnice).

**Implementace**:
- Nový komponent `MachineMarker.tsx` -- vykreslí Leaflet marker s custom ikonou (pulzující modrý kruh)
- Použije `useBarbieriiClient()` hook pro získání aktuální pozice
- Zobrazí popup s RTK status, rychlostí, režimem
- Pokud pozice není k dispozici, marker se nezobrazí
- Přidání do `AreasMap.tsx` jako volitelný prop `showMachinePosition`

**Soubory**:
| Soubor | Akce |
|--------|------|
| `src/components/map/MachineMarker.tsx` | Nový -- živý bod stroje |
| `src/components/map/AreasMap.tsx` | Přidat MachineMarker |
| `src/pages/AreasPage.tsx` | Předat `showMachinePosition={true}` |

---

## 3. Offline detekce (last_seen watchdog)

Pokud telemetrie nepřijde déle než 60 sekund, zobrazí se varování "Stroj neodpovídá" s časem posledního signálu.

**Implementace**:
- V `BarbieriRealtimeClient` přidat watchdog timer (60s timeout)
- Nový stav `stale` v ConnectionState: `'disconnected' | 'connecting' | 'connected' | 'stale' | 'error'`
- Při každém příchozím telemetry resetnout timer
- Po 60s bez dat: přepnout stav na `stale`
- V `TelemetryLive.tsx` zobrazit žlutý banner "Stroj neodpovídá od XX:XX:XX"

**Soubory**:
| Soubor | Akce |
|--------|------|
| `src/lib/barbieri-realtime.ts` | Přidat watchdog timer + stav `stale` |
| `src/components/dashboard/TelemetryLive.tsx` | Zobrazit varování při `stale` |

---

## 4. Servisní logika (MTH z telemetrie --> servis_due)

Aktuálně `ServiceIntervalsOverview` bere MTH z tabulky `stroje.aktualni_mth` (manuálně aktualizováno). Nově se MTH bude aktualizovat i z telemetrie automaticky.

**Implementace**:
- V `DashboardPage` porovnat `telemetry.mth` s `machine.aktualni_mth`
- Pokud `telemetry.mth > machine.aktualni_mth`, automaticky aktualizovat `stroje.aktualni_mth` (přes existující `updateMth()` z `useMachine`)
- Přidat debounce (max 1 aktualizace za 30s), aby se nepřepisovalo při každém telemetry frame
- `ServiceIntervalsOverview` tak bude automaticky reagovat na nový MTH

**Soubory**:
| Soubor | Akce |
|--------|------|
| `src/pages/DashboardPage.tsx` | Přidat efekt pro sync MTH z telemetrie |

---

## 5. PLC Simulátor pro testování

Nová edge function `simulate-telemetry`, která jednorázově odešle testovací telemetrii pro zadaný stroj. Umožní ověřit celý řetězec bez fyzického robota.

**Implementace**:
- Edge function `simulate-telemetry`:
  - `POST` s volitelným `stroj_id`
  - Vygeneruje realistická data (GPS kolem Prahy, náhodné RTK FIX/FLOAT, rychlost 0-5 km/h, MTH inkrementálně)
  - Zapíše přes `ingest-telemetry` logiku (upsert do `telemetrie_stroje`)
  - Autorizace přes service_role
- Na dashboardu přidat malé dev tlačítko "Simulovat telemetrii" (jen pro adminy), které zavolá tuto funkci

**Soubory**:
| Soubor | Akce |
|--------|------|
| `supabase/functions/simulate-telemetry/index.ts` | Nový -- simulátor |
| `src/components/dashboard/TelemetryLive.tsx` | Přidat dev tlačítko pro adminy |

---

## Technický souhrn

```text
Celkem souborů k úpravě/vytvoření: 7
- 1x nový komponent (MachineMarker)
- 1x nová edge function (simulate-telemetry)
- 5x úprava existujících souborů
- 0x databázová migrace (RLS je OK)
```

## Pořadí implementace

1. Watchdog (stale detection) -- základ pro spolehlivé UX
2. PLC simulátor -- umožní testovat vše ostatní
3. Mapa s živým bodem stroje
4. MTH sync z telemetrie do servisní logiky
