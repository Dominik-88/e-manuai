

# Oprava index.html -- meta tagy, PWA, fonty

## Souhrn

Analyzoval jsem vsechny 4 body. Dva jsou skutecne problemy k oprave, dva jsou nerelevantni pro Lovable prostredi.

---

## 1. Duplicitni Meta Tagy -- OPRAVIT

**Problem:** `og:title`, `og:description`, `twitter:title`, `twitter:description` a `twitter:image` jsou na radcich 47-51 (injektovane Lovable systemem), ale `og:type`, `og:image` a `twitter:card` jsou na radcich 26-30 se dvema prazdnymi radky a chybejicim `og:title`/`og:description`. Vysledek: nekonzistentni poradi, prazdne radky, roztrousene tagy.

**Reseni:** Seskupit vsechny OG a Twitter tagy na jedno misto, odstranit prazdne radky, zajistit ze kazdy tag existuje prave jednou.

## 2. PWA assety -- ZADNY PROBLEM

Vsechny soubory **existuji**:
- `public/manifest.json` -- existuje
- `public/favicon.ico` -- existuje
- `public/icons/icon-*.png` -- vsech 8 velikosti existuje
- `public/sw.js` -- existuje

PWA konfigurace je funkcni, zadna oprava neni potreba.

## 3. Hard-coded font preloady -- OPRAVIT (nizka priorita)

**Problem:** Radky 40-41 preloaduji konkretni woff2 soubory s verzovanym URL (`/v20/`, `/v31/`). Pokud Google zmeni verzi, preload selze (ne fatalne -- font se nacte pres CSS fallback, ale ztrati se optimalizace).

**Reseni:** Odstranit tyto 2 preload radky. Font CSS na radku 44-46 uz fonty nacita spravne pres `display=swap`. Preconnect na radcich 35-36 zustane a zajisti rychle pripojeni. Celkovy dopad na vykon je minimalni (mozna +50ms na prvnim nacetni).

## 4. Single-file architektura -- NERELEVANTNI

Tvrzeni ze "vse musi byt v jednom souboru" se tyka jinych prostredi (CodePen, StackBlitz HTML sandbox). Lovable pouziva Vite + React s modulovym systemem. `<script type="module" src="/src/main.tsx">` je **spravny a jediny mozny zpusob** jak Vite aplikaci spustit. Zadna zmena neni potreba.

---

## Implementace

Jediny soubor k uprave: **`index.html`**

Zmeny:
1. Odstranit prazdne radky v OG/Twitter sekci (radky 24-25, 31-33)
2. Presunout `og:title` a `og:description` z konce `<head>` (radky 47-51) nahoru k ostatnim OG tagum (za radek 27)
3. Presunout `twitter:title`, `twitter:description`, `twitter:image` za `twitter:card` (radek 30)
4. Odstranit 2 font preload radky (40-41) -- volitelne, nizka priorita

Vysledna struktura `<head>`:
```
meta charset, viewport, title, description, author
PWA meta tagy
Favicon
Open Graph (type, title, description, image) -- vse pohromade
Twitter Card (card, title, description, image) -- vse pohromade
Preconnect
Font CSS (bez preloadu konkretni woff2)
```

