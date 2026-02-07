

# Optimalizace repozitare -- odstraneni nepotrebnych souboru

## Souhrn

Po dustkladne analyze celeho repozitare jsem identifikoval **21 souboru**, ktere nejsou nikde pouzity a zbytecne zabiraji misto, zpomaluji build nebo matou vyvojare.

---

## Soubory k odstraneni

### 1. Mrtvy zdrojovy kod

| Soubor | Duvod |
|--------|-------|
| `src/App.css` | Vychozi Vite sablona (logo-spin, .read-the-docs). Nikde neni importovan. |
| `src/components/NavLink.tsx` | Nikde neni importovan -- BottomNav pouziva react-router-dom NavLink primo. |
| `src/test/example.test.ts` | Placeholder test (`expect(true).toBe(true)`), nulova hodnota. |

### 2. Nepouzite UI komponenty (shadcn)

Nasledujicich 16 komponent neni importovano z zadneho souboru v aplikaci:

| Soubor | Pouziti |
|--------|---------|
| `src/components/ui/accordion.tsx` | Nikde |
| `src/components/ui/aspect-ratio.tsx` | Nikde |
| `src/components/ui/avatar.tsx` | Nikde |
| `src/components/ui/breadcrumb.tsx` | Nikde |
| `src/components/ui/calendar.tsx` | Nikde |
| `src/components/ui/carousel.tsx` | Nikde |
| `src/components/ui/chart.tsx` | Nikde |
| `src/components/ui/command.tsx` | Pouze importuje dialog.tsx, sam neni importovan nikym |
| `src/components/ui/context-menu.tsx` | Nikde |
| `src/components/ui/hover-card.tsx` | Nikde |
| `src/components/ui/input-otp.tsx` | Nikde |
| `src/components/ui/menubar.tsx` | Nikde |
| `src/components/ui/navigation-menu.tsx` | Nikde |
| `src/components/ui/pagination.tsx` | Nikde |
| `src/components/ui/resizable.tsx` | Nikde |
| `src/components/ui/slider.tsx` | Nikde |
| `src/components/ui/table.tsx` | Nikde |
| `src/components/ui/toggle.tsx` | Pouze pouzit z toggle-group.tsx |
| `src/components/ui/toggle-group.tsx` | Nikde v aplikaci |

Poznamka: `toggle.tsx` + `toggle-group.tsx` se referencuji navzajem, ale zadny jiny soubor je nepouziva -- oba lze smazat.

Rovnez `sidebar.tsx` neni pouzit zadnou strankou, ale importuje `sheet.tsx`, `skeleton.tsx` atd. -- sam `sidebar.tsx` neni nikde importovan, takze ho tez smazeme. Tim se uvolni i `sheet.tsx` (pouzit jen ze sidebar).

Dalsich k odstraneni:
| `src/components/ui/sidebar.tsx` | Nikde neni importovan |
| `src/components/ui/sheet.tsx` | Pouze z sidebar.tsx (ktery se tez smaze) |
| `src/components/ui/drawer.tsx` | Nikde |

### 3. Staticke soubory

| Soubor | Duvod |
|--------|-------|
| `public/placeholder.svg` | Genericky placeholder. Nikde v kodu neni referencovan. |

### 4. Generovane/duplicitni soubory (NELZE smazat)

Nasledujici soubory vypadaji zbytecne, ale **musi zustat**:

| Soubor | Duvod proc nechat |
|--------|-------------------|
| `bun.lockb` / `bun.lock` | Lovable moze pouzivat bun -- nesahat |
| `package-lock.json` | npm lockfile -- nesahat |
| `src/tailwind.config.lov.json` | Lovable interni konfigurace -- nesahat |
| `.lovable/plan.md` | Lovable interni -- nesahat |
| `README.md` | Standardni, muze zustat (i kdyz je genericky) |
| `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` | TS build cache, regeneruji se automaticky |

---

## Postup implementace

1. Smazat vsech 23 identifikovanych souboru (3 mrtvy kod + 19 nepouzitych UI komponent + 1 placeholder.svg)
2. Overit, ze aplikace stale funguje (zadne broken importy)

---

## Technicke detaily

Celkem bude smazano priblizne **23 souboru** o celkovem rozsahu cca 4000+ radku kodu, cimz:
- Zmensime velikost zdrojoveho kodu
- Zrychlime TypeScript kompilaci (mene souboru ke zpracovani)
- Odstranime matouci nevyuzity kod z repozitare

Soubory, ktere se **nesmi mazat** (auto-generovane systeme): `.env`, `supabase/config.toml`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `components.json`, `tailwind.config.ts`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.*.json`, `postcss.config.js`, `eslint.config.js`, `index.html`.

