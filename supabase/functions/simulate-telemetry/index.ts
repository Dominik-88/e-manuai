import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json().catch(() => ({}))
    let { stroj_id } = body

    // If no stroj_id provided, fetch the first active machine
    if (!stroj_id) {
      const { data: machine } = await supabase
        .from('stroje')
        .select('id, aktualni_mth')
        .eq('stav', 'aktivní')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (!machine) {
        return new Response(JSON.stringify({ error: 'No active machine found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      stroj_id = machine.id
    }

    // Get current telemetry to increment MTH
    const { data: existing } = await supabase
      .from('telemetrie_stroje')
      .select('mth')
      .eq('stroj_id', stroj_id)
      .maybeSingle()

    const currentMth = existing?.mth ?? 0
    const rtkOptions = ['FIX', 'FLOAT', 'NONE'] as const
    const modeOptions = ['autonomous', 'semi-auto', 'manual', 'idle'] as const

    // Generate realistic data around Prague area
    const baseLat = 49.75 + (Math.random() - 0.5) * 0.1
    const baseLng = 13.38 + (Math.random() - 0.5) * 0.1

    const simulatedData = {
      stroj_id,
      rtk_status: rtkOptions[Math.floor(Math.random() * rtkOptions.length)],
      speed: +(Math.random() * 4.5 + 0.5).toFixed(1),
      latitude: +baseLat.toFixed(6),
      longitude: +baseLng.toFixed(6),
      battery_level: Math.floor(Math.random() * 40 + 60),
      mode: modeOptions[Math.floor(Math.random() * modeOptions.length)],
      s_mode: Math.floor(Math.random() * 5) + 1,
      mth: +(currentMth + 0.1).toFixed(1),
      hdop: +(Math.random() * 1.5 + 0.5).toFixed(2),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('telemetrie_stroje')
      .upsert(simulatedData, { onConflict: 'stroj_id' })

    if (error) {
      console.error('Simulate upsert error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, data: simulatedData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Simulate error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
