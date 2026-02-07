

# Přidání funkce mazání areálů

## Problem

Na stránce Areály chybí tlačítko/akce pro smazání areálu. RLS politika pro DELETE na tabulce `arealy` existuje a povoluje mazání uživatelům s rolí admin nebo technik, ale v UI žádná možnost smazání není.

## Řešení

Přidat k každému areálu v seznamu tlačítko "Smazat" s potvrzovacím dialogem.

## Technické detaily

### 1. Upravit `src/pages/AreasPage.tsx`

- Importovat `AlertDialog` komponenty, `Trash2` ikonu a `useMutation`/`useQueryClient` z TanStack Query
- Přidat stav pro vybraný areál ke smazání (`areaToDelete`)
- Přidat mutaci volající `supabase.from('arealy').delete().eq('id', id)`
- Po úspěšném smazání invalidovat query `['areas-full']` a zobrazit toast
- Ke každému areálu přidat tlačítko s ikonou koše (Trash2)
- Přidat `AlertDialog` s potvrzením ("Opravdu chcete smazat areál XY?") a tlačítky Zrušit / Smazat
- Tlačítko smazání zobrazit pouze uživatelům s rolí admin nebo technik

### 2. Získání role uživatele

- Využít existující `AuthContext` pro přístup k roli uživatele
- Podmínit zobrazení tlačítka smazání rolí admin/technik

### Uživatelský flow

1. Uživatel vidí u každého areálu ikonu koše (pokud má oprávnění)
2. Klikne na ikonu -- otevře se potvrzovací dialog s názvem areálu
3. Potvrdí smazání -- areál se odstraní z databáze, seznam se aktualizuje
4. Nebo klikne "Zrušit" -- dialog se zavře bez akce

