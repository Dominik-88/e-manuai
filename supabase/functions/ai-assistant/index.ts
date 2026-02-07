import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;
const VALID_ROLES = ["user", "assistant", "system"];

function isValidUUID(val: unknown): boolean {
  return typeof val === "string" && UUID_REGEX.test(val);
}

function validateRequest(body: any): { valid: true; messages: any[]; machineContext: any } | { valid: false; error: string } {
  const { messages, machineContext } = body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "messages must be a non-empty array" };
  }
  if (messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Too many messages (max ${MAX_MESSAGES})` };
  }

  for (const msg of messages) {
    if (typeof msg.content !== "string" || msg.content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Each message content must be a string ≤${MAX_MESSAGE_LENGTH} chars` };
    }
    if (!VALID_ROLES.includes(msg.role)) {
      return { valid: false, error: `Invalid message role: ${msg.role}` };
    }
  }

  if (machineContext != null) {
    if (typeof machineContext !== "object") {
      return { valid: false, error: "machineContext must be an object" };
    }
    if (machineContext.id != null && !isValidUUID(machineContext.id)) {
      return { valid: false, error: "Invalid machine ID format" };
    }
  }

  return { valid: true, messages, machineContext: machineContext ?? null };
}

const SYSTEM_PROMPT = `Jsi AI asistent specializovaný na stroj Barbieri XRot 95 EVO - autonomní sekačku.

TECHNICKÉ SPECIFIKACE:
- Model: Barbieri XRot 95 EVO
- Šířka záběru: 95 cm
- GNSS modul: u-blox ZED-F9P (GPS, GLONASS, BEIDOU, Galileo)
- Procesor: Broadcom BCM2837 (ARM Cortex-A53, 1.4 GHz), 1GB RAM
- Compass Servo Drive: 2.0 (R54)
- Dashboard: http://192.168.4.1:5000
- Palivo: bezolovnatý benzín 95 oktanů (max E10)

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
3. Pokud nevíš, řekni "Nemám dostatek dat" - NIKDY nevymýšlej čísla
4. Odkazuj na relevantní kapitoly manuálu (kapitola 1-6)
5. U servisních dotazů vždy uváděj MTH intervaly
6. Pokud diagnostikuješ problém, doporuč ověření
7. Nikdy nenahrazuj dokumentaci - odkazuj na manuál`;

async function buildMachineContext(supabaseClient: any, machineContext: any): Promise<string> {
  if (!machineContext) return '';

  try {
    const { data: services } = await supabaseClient
      .from('servisni_zaznamy')
      .select('datum_servisu, mth_pri_servisu, typ_zasahu, popis')
      .eq('stroj_id', machineContext.id || '')
      .eq('is_deleted', false)
      .order('datum_servisu', { ascending: false })
      .limit(10);

    const { data: intervals } = await supabaseClient
      .from('servisni_intervaly')
      .select('nazev, interval_mth, prvni_servis_mth, kriticnost')
      .order('kriticnost', { ascending: false });

    const { count: areaCount } = await supabaseClient
      .from('arealy')
      .select('*', { count: 'exact', head: true });

    const intervalStatus = (intervals || []).map((interval: any) => {
      const lastService = (services || []).find((s: any) =>
        s.popis?.toLowerCase().includes(interval.nazev.toLowerCase())
      );
      const lastMth = lastService?.mth_pri_servisu || 0;
      const isFirst = lastMth === 0;
      const effectiveInterval = isFirst && interval.prvni_servis_mth
        ? interval.prvni_servis_mth
        : interval.interval_mth;
      const nextMth = lastMth + effectiveInterval;
      const remaining = nextMth - (machineContext.aktualni_mth || 0);

      return `- ${interval.nazev}: zbývá ${remaining.toFixed(0)} mth (${interval.kriticnost})`;
    });

    return `

AKTUÁLNÍ STAV STROJE:
- Model: ${machineContext.model}
- S/N: ${machineContext.vyrobni_cislo}
- Aktuální MTH: ${machineContext.aktualni_mth}
- Stav: ${machineContext.stav}

SERVISNÍ INTERVALY:
${intervalStatus.join('\n')}

POSLEDNÍ SERVISY:
${(services || []).slice(0, 5).map((s: any) => 
  `${s.datum_servisu}: ${s.typ_zasahu} - ${s.popis} (${s.mth_pri_servisu} mth)`
).join('\n') || 'Žádné záznamy'}

AREÁLY: ${areaCount || 0} evidovaných`;
  } catch (err) {
    console.error('Context build error:', err);
    return `\nAKTUÁLNÍ STAV: ${machineContext.model}, MTH: ${machineContext.aktualni_mth}`;
  }
}

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

    // Parse and validate input
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, machineContext } = validation;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const enrichedContext = await buildMachineContext(supabaseClient, machineContext);
    const contextPrompt = SYSTEM_PROMPT + enrichedContext;

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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
