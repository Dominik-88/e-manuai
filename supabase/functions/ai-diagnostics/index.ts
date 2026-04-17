import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Jsi AI diagnostik pro stroj Barbieri XRot 95 EVO – autonomní sekačku.

Tvůj úkol: Analyzovat fotografie dílů stroje a vyhodnotit stupeň opotřebení.

DÍLY KTERÉ UMÍŠ ROZPOZNAT:
- Nože sekačky (ostrost, poškození, ohyb)
- Klínové řemeny (praskliny, opotřebení, napnutí)
- Vzduchový filtr (zanesení, poškození)
- Olejový filtr (stav, deformace)
- Svíčky (elektrody, usazeniny)
- Ložiska (koroze, vůle)
- Obecný stav dílu

HODNOCENÍ (vždy vrať jedno z):
- ✅ DOBRÝ STAV: Díl je funkční, bez viditelných vad
- ⚠️ OPOTŘEBENÍ: Díl vykazuje známky opotřebení, plánuj výměnu
- 🔴 KRITICKÉ: Díl vyžaduje okamžitou výměnu

PRAVIDLA:
1. Odpovídej česky, stručně a strukturovaně
2. Vždy uveď: typ dílu, hodnocení, doporučení
3. Pokud na fotce nepoznáš díl, řekni to upřímně
4. Doporuč konkrétní servisní úkon a interval
5. NIKDY nevymýšlej – pokud si nejsi jistý, řekni to`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, mimeType, machineContext } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- SIZE LIMIT: ~5 MB raw base64 (~6.7M chars) ---
    const MAX_B64_CHARS = 7_000_000;
    if (imageBase64.length > MAX_B64_CHARS) {
      return new Response(JSON.stringify({ error: "Obrázek je příliš velký (max 5 MB)." }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- BASE64 FORMAT VALIDATION ---
    if (!/^[A-Za-z0-9+/=\s]+$/.test(imageBase64)) {
      return new Response(JSON.stringify({ error: "Neplatný formát base64." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- MIME TYPE ALLOWLIST ---
    const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
    const safeMime = typeof mimeType === "string" && ALLOWED_MIME.includes(mimeType)
      ? mimeType
      : "image/jpeg";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const contextInfo = machineContext
      ? `\n\nAKTUÁLNÍ STAV STROJE: Model ${machineContext.model}, MTH: ${machineContext.aktualni_mth}, Stav: ${machineContext.stav}`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextInfo },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Analyzuj tento díl stroje Barbieri XRot 95 EVO. Vyhodnoť stupeň opotřebení a doporuč další postup.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Příliš mnoho požadavků. Zkuste to později." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Vyčerpány AI kredity." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text().catch(() => "");
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "Nepodařilo se analyzovat snímek.";

    return new Response(JSON.stringify({ analysis: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI diagnostics error:", e);
    return new Response(JSON.stringify({ error: "Interní chyba serveru" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
