import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckRequest {
  configId: string;
  type: 'ICMP' | 'SNMP' | 'ZABBIX';
  target: string;
  community?: string;
  version?: string;
  zabbix_api_url?: string;
  zabbix_api_token?: string;
}

interface CheckResult {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  response_time?: number;
  error_message?: string;
}

async function checkICMP(target: string): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://${target}`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'ISP-NOC-Monitor/1.0' }
    }).catch(() => null);

    clearTimeout(timeoutId);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response && (response.status < 500 || response.status === 503)) {
      return {
        status: 'UP',
        response_time: responseTime
      };
    }

    return {
      status: 'DOWN',
      error_message: `Target não respondeu (timeout ou host down)`
    };
  } catch (error: any) {
    return {
      status: 'DOWN',
      error_message: error.message || 'Falha na verificação ICMP'
    };
  }
}

async function checkSNMP(target: string, community: string = 'public'): Promise<CheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const startTime = Date.now();
    const response = await fetch(`http://${target}:161`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Community': community }
    }).catch(() => null);

    clearTimeout(timeoutId);
    const endTime = Date.now();

    if (response) {
      return {
        status: 'UP',
        response_time: endTime - startTime
      };
    }

    return {
      status: 'DOWN',
      error_message: 'SNMP não respondeu'
    };
  } catch (error: any) {
    return {
      status: 'DOWN',
      error_message: error.message || 'Falha na verificação SNMP'
    };
  }
}

async function checkZabbix(apiUrl: string, apiToken: string): Promise<CheckResult> {
  try {
    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'apiinfo.version',
        params: [],
        id: 1
      })
    });

    const endTime = Date.now();

    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        return {
          status: 'UP',
          response_time: endTime - startTime
        };
      }
    }

    return {
      status: 'DOWN',
      error_message: `Zabbix API retornou status ${response.status}`
    };
  } catch (error: any) {
    return {
      status: 'DOWN',
      error_message: error.message || 'Falha na verificação Zabbix'
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { configId, type, target, community, version, zabbix_api_url, zabbix_api_token }: CheckRequest = await req.json();

    if (!configId || !type || !target) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    let result: CheckResult;

    switch (type) {
      case 'ICMP':
        result = await checkICMP(target);
        break;

      case 'SNMP':
        result = await checkSNMP(target, community);
        break;

      case 'ZABBIX':
        if (!zabbix_api_url || !zabbix_api_token) {
          result = {
            status: 'UNKNOWN',
            error_message: 'Credenciais Zabbix não fornecidas'
          };
        } else {
          result = await checkZabbix(zabbix_api_url, zabbix_api_token);
        }
        break;

      default:
        result = {
          status: 'UNKNOWN',
          error_message: 'Tipo de monitoramento não suportado'
        };
    }

    const { data: lastStatus } = await supabase
      .from('monitoring_status')
      .select('status, consecutive_failures')
      .eq('config_id', configId)
      .order('last_check', { ascending: false })
      .limit(1)
      .maybeSingle();

    let consecutiveFailures = 0;
    if (result.status === 'DOWN') {
      if (lastStatus && lastStatus.status === 'DOWN') {
        consecutiveFailures = (lastStatus.consecutive_failures || 0) + 1;
      } else {
        consecutiveFailures = 1;
      }
    }

    const { error: insertError } = await supabase
      .from('monitoring_status')
      .insert({
        config_id: configId,
        status: result.status,
        response_time: result.response_time,
        error_message: result.error_message,
        last_check: new Date().toISOString(),
        consecutive_failures: consecutiveFailures
      });

    if (insertError) {
      console.error('Error inserting status:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in check-monitoring:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
