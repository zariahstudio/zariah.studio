import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(data: unknown, status = 200, origin = "https://zariahstudio.com") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validIp(value: string | null): value is string {
  if (!value || value.length > 64 || /[,\s]/.test(value)) return false;
  // Cloudflare overwrites CF-Connecting-IP at the hosted ingress.
  return /^[0-9a-f:.]+$/i.test(value);
}

async function hmacIp(ip: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(ip));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  if (origin !== "https://zariahstudio.com" && origin !== "https://www.zariahstudio.com") {
    return json({ error: "Origin not allowed" }, 403);
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const ip = req.headers.get("cf-connecting-ip");
  if (!validIp(ip)) return json({ error: "Trusted client IP header unavailable" }, 503, origin);

  let payload: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: "Request too large" }, 413, origin);
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400, origin);
  }

  const visitorId = payload.visitor_id;
  const slug = payload.product_slug;
  const pagePath = payload.page_path;
  const referrerHost = payload.referrer_host;
  const deviceType = payload.device_type;

  if (!validUuid(visitorId) ||
      typeof slug !== "string" || !/^[a-z0-9-]{1,160}$/.test(slug) ||
      typeof pagePath !== "string" || pagePath !== `/products/${slug}/` ||
      !(deviceType === "mobile" || deviceType === "desktop" || deviceType === "tablet" || deviceType === "unknown") ||
      !(referrerHost === null || typeof referrerHost === "string" && referrerHost.length <= 255)) {
    return json({ error: "Invalid product view payload" }, 400, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  let serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
  if (!serviceKey) {
    try {
      const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
      serviceKey = secretKeys.default || "";
    } catch {
      serviceKey = "";
    }
  }
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing required Supabase server environment.");
    return json({ error: "Tracking service unavailable" }, 503, origin);
  }

  try {
    const ipHash = await hmacIp(ip, serviceKey);
    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/record_product_view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceKey,
        ...(serviceKey.startsWith("eyJ") ? { "Authorization": `Bearer ${serviceKey}` } : {}),
      },
      body: JSON.stringify({
        p_visitor_id: visitorId,
        p_product_slug: slug,
        p_page_path: pagePath,
        p_referrer_host: referrerHost,
        p_device_type: deviceType,
        p_ip_hash: ipHash,
      }),
    });

    if (!rpcResponse.ok) {
      console.error("record_product_view RPC failed:", rpcResponse.status, await rpcResponse.text());
      return json({ error: "Could not record product view" }, 502, origin);
    }

    const recorded = await rpcResponse.json();
    return json({ recorded: recorded === true }, 200, origin);
  } catch (error) {
    console.error("Product view tracking failed:", error);
    return json({ error: "Tracking service unavailable" }, 503, origin);
  }
});
