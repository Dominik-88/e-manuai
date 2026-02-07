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
    // Authorize via service_role key or API key in header
    const authHeader = req.headers.get('authorization') || ''
    const apiKey = req.headers.get('x-api-key') || ''
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Accept either Bearer service_role token or x-api-key matching service_role
    const isAuthorized = 
      authHeader === `Bearer ${serviceRoleKey}` || 
      apiKey === serviceRoleKey

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const {
      stroj_id,
      rtk_status = 'neznámý',
      speed = 0,
      latitude,
      longitude,
      battery_level,
      mode = 'idle',
      s_mode,
      mth = 0,
      hdop,
    } = body

    if (!stroj_id) {
      return new Response(JSON.stringify({ error: 'stroj_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await supabase
      .from('telemetrie_stroje')
      .upsert(
        {
          stroj_id,
          rtk_status,
          speed,
          latitude,
          longitude,
          battery_level,
          mode,
          s_mode,
          mth,
          hdop,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stroj_id' }
      )

    if (error) {
      console.error('Upsert error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Ingest error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
