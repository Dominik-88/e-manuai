import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Jsi AI asistent specializovaný na stroj Barbieri XRot 95 EVO - autonomní sekačku.

TECHNICKÉ SPECIFIKACE:
- Model: Barbieri XRot 95 EVO
- Šířka záběru: 95 cm
- GNSS modul: u-blox ZED-F9P
- Procesor: Broadcom BCM2837 (ARM Cortex-A53, 1.4 GHz)
- Compass Servo Drive: 2.0 (R54)
- Dashboard: http://192.168.4.1:5000

RTK NAVIGACE:
- NTRIP Server: rtk.cuzk.cz:2101
- Mountpoint: MAX3
- RTK FIX: 1-3 cm přesnost (pro autonomii)
- RTK FLOAT: ~1 m přesnost (pouze manuál)
- RTK NONE: bez korekce (nouzový režim)

SERVISNÍ INTERVALY:
- Výměna oleje: PRVNÍ servis 50 mth, pak každých 100 mth (KRITICKÉ)
- Kontrola nožů: každých 50 mth (DŮLEŽITÉ)
- Velký servis: každých 500 mth (KRITICKÉ)

S-MODE AUTONOMNÍ REŽIMY:
- S-Mode 1: Bod-do-bodu
- S-Mode 2: Spirála
- S-Mode 3: Obdélník
- S-Mode 4: Automatické pruhy (95 cm)

PRAVIDLA:
1. Odpovídej česky, stručně a přesně
2. Používej pouze data z kontextu stroje
3. Pokud nevíš, řekni to
4. Odkazuj na relevantní kapitoly manuálu
5. U servisních dotazů vždy uváděj MTH intervaly`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User is authenticated, proceed with the request
    const { messages, machineContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let contextPrompt = SYSTEM_PROMPT;
    if (machineContext) {
      contextPrompt += `\n\nAKTUÁLNÍ STAV STROJE:
- Model: ${machineContext.model}
- S/N: ${machineContext.vyrobni_cislo}
- Aktuální MTH: ${machineContext.aktualni_mth}
- Stav: ${machineContext.stav}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
