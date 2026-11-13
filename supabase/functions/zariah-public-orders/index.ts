import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://www.zariahstudio.com",
  "https://zariahstudio.com",
]);
const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function response(body: Record<string, unknown>, status: number, origin: string | null) {
  const headers = new Headers(jsonHeaders);
  if (origin && allowedOrigins.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
  }
  headers.set("access-control-allow-headers", "content-type, apikey");
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  return new Response(JSON.stringify(body), { status, headers });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request): string {
  // Supabase's edge gateway supplies these proxy headers. Do not accept a body-supplied IP.
  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return forwarded || "unknown";
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return response({ error: "origin_not_allowed" }, 403, null);
    return response({ ok: true }, 200, origin);
  }
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return response({ error: "origin_not_allowed" }, 403, null);

  const namedPublishableKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  let defaultPublishableKey = "";
  if (namedPublishableKeys) {
    try { defaultPublishableKey = JSON.parse(namedPublishableKeys).default ?? ""; } catch { /* checked below */ }
  }
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
    defaultPublishableKey || Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!publishableKey || !serviceKey || !supabaseUrl) {
    console.error("Missing required server environment configuration");
    return response({ error: "service_unavailable" }, 503, origin);
  }
  if (req.headers.get("apikey") !== publishableKey) return response({ error: "unauthorized" }, 401, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
  } catch {
    return response({ error: "invalid_request" }, 400, origin);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ipHash = await sha256(clientIp(req));
  const checkLimit = async (scope: string, key: string, windowSeconds: number, max: number) => {
    const { data, error } = await admin.rpc("consume_public_api_rate_limit", {
      p_scope: scope, p_key_hash: await sha256(key), p_window_seconds: windowSeconds, p_max_requests: max,
    });
    if (error || !Array.isArray(data) || !data[0]) throw new Error("rate_limit_unavailable");
    return data[0].allowed === true;
  };

  try {
    if (body.action === "checkout") {
      const customer = body.customer;
      const items = body.items;
      const idempotencyKey = body.idempotencyKey;
      if (!customer || typeof customer !== "object" || !Array.isArray(items) ||
          typeof idempotencyKey !== "string" || idempotencyKey.length < 16 || idempotencyKey.length > 100) {
        return response({ error: "invalid_request" }, 400, origin);
      }
      const phone = String((customer as Record<string, unknown>).phone ?? "").replace(/[\s()-]/g, "");
      if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone) || items.length < 1 || items.length > 18) {
        return response({ error: "invalid_request" }, 400, origin);
      }
      if (!(await checkLimit("checkout_ip", ipHash, 600, 10)) ||
          !(await checkLimit("checkout_phone", phone, 3600, 5))) {
        return response({ error: "too_many_requests" }, 429, origin);
      }
      const { data, error } = await admin.rpc("create_website_order", {
        p_customer: customer, p_items: items, p_idempotency_key: idempotencyKey,
      });
      if (error) {
        console.error("Checkout RPC failed", error.code);
        return response({ error: "order_unavailable" }, 400, origin);
      }
      return response({ order: data }, 200, origin);
    }

    if (body.action === "tracking") {
      const orderNumber = String(body.orderNumber ?? "").trim().toUpperCase();
      const phone = String(body.phone ?? "").replace(/[\s()-]/g, "");
      if (!orderNumber || orderNumber.length > 40 || !phone || phone.length > 20) {
        return response({ error: "not_found" }, 404, origin);
      }
      const pairHash = await sha256(orderNumber + "|" + phone);
      if (!(await checkLimit("tracking_ip", ipHash, 900, 12)) ||
          !(await checkLimit("tracking_pair", pairHash, 900, 6))) {
        return response({ error: "too_many_requests" }, 429, origin);
      }
      const { data, error } = await admin.rpc("lookup_order_tracking", {
        p_order_number: orderNumber, p_phone: phone,
      });
      if (error) {
        console.error("Tracking RPC failed", error.code);
        return response({ error: "tracking_unavailable" }, 503, origin);
      }
      if (!data?.found) return response({ error: "not_found" }, 404, origin);
      return response({ order: data }, 200, origin);
    }
    return response({ error: "invalid_action" }, 400, origin);
  } catch (error) {
    console.error("Public order gateway failed", error instanceof Error ? error.message : "unknown");
    return response({ error: "service_unavailable" }, 503, origin);
  }
});
