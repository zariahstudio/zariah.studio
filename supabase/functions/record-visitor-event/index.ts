import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set(["https://zariahstudio.com", "https://www.zariahstudio.com"]);
const headers = (origin: string | null) => {
  const h = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-headers": "content-type, apikey",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  });
  if (origin && allowedOrigins.has(origin)) h.set("access-control-allow-origin", origin);
  return h;
};
function reply(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), { status, headers: headers(origin) });
}
function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function sha256(value: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((digest) =>
    Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")
  );
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return reply({ error: "origin_not_allowed" }, 403, null);
    return new Response("ok", { status: 200, headers: headers(origin) });
  }
  if (req.method !== "POST") return reply({ error: "method_not_allowed" }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return reply({ error: "origin_not_allowed" }, 403, null);

  const ip = req.headers.get("cf-connecting-ip")?.trim();
  if (!ip || ip.length > 64 || /[,\s]/.test(ip) || !/^[0-9a-f:.]+$/i.test(ip)) {
    return reply({ error: "tracking_unavailable" }, 503, origin);
  }
  let payload: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return reply({ error: "request_too_large" }, 413, origin);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    payload = parsed as Record<string, unknown>;
  } catch {
    return reply({ error: "invalid_request" }, 400, origin);
  }

  const visitorId = payload.visitor_id;
  const eventType = payload.event_type;
  const pagePath = payload.page_path;
  const referrerHost = payload.referrer_host;
  const deviceType = payload.device_type;
  const productSlug = payload.product_slug;
  const allowedEvents = new Set(["session_start", "page_view", "product_click", "cart_add", "cart_view", "checkout_view"]);
  if (!validUuid(visitorId) || typeof eventType !== "string" || !allowedEvents.has(eventType) ||
      typeof pagePath !== "string" || pagePath.length < 1 || pagePath.length > 500 ||
      !pagePath.startsWith("/") || pagePath.startsWith("//") || /[\u0000-\u001f]/.test(pagePath) ||
      !(deviceType === "mobile" || deviceType === "desktop" || deviceType === "tablet" || deviceType === "unknown") ||
      !(referrerHost === null || referrerHost === undefined ||
        typeof referrerHost === "string" && referrerHost.length <= 255 && /^[a-z0-9.:-]+$/i.test(referrerHost)) ||
      !(productSlug === null || productSlug === undefined ||
        typeof productSlug === "string" && /^[a-z0-9_-]{1,160}$/i.test(productSlug))) {
    return reply({ error: "invalid_request" }, 400, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
  if (!supabaseUrl || !serviceKey) return reply({ error: "tracking_unavailable" }, 503, origin);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const [ipHash, visitorHash] = await Promise.all([sha256(ip), sha256(visitorId)]);
    const limits = await Promise.all([
      admin.rpc("consume_public_api_rate_limit", {
        p_scope: "visitor_event_ip", p_key_hash: ipHash, p_window_seconds: 900, p_max_requests: 120,
      }),
      admin.rpc("consume_public_api_rate_limit", {
        p_scope: "visitor_event_id", p_key_hash: visitorHash, p_window_seconds: 60, p_max_requests: 30,
      }),
    ]);
    if (limits.some((r) => r.error || !Array.isArray(r.data) || !r.data[0])) {
      console.error("Visitor event rate limiter unavailable");
      return reply({ error: "tracking_unavailable" }, 503, origin);
    }
    if (limits.some((r) => r.data[0].allowed !== true)) return reply({ error: "rate_limited" }, 429, origin);

    const { data, error } = await admin.rpc("record_visitor_event", {
      p_visitor_id: visitorId,
      p_event_type: eventType,
      p_page_path: pagePath,
      p_referrer_host: referrerHost || null,
      p_device_type: deviceType,
      p_product_slug: productSlug || null,
    });
    if (error) {
      console.error("Visitor event RPC failed:", error.code);
      return reply({ error: "tracking_unavailable" }, 503, origin);
    }
    if (data !== true) return reply({ error: "rate_limited" }, 429, origin);
    return reply({ recorded: true }, 200, origin);
  } catch (error) {
    console.error("Visitor event gateway failed:", error instanceof Error ? error.message : "unknown");
    return reply({ error: "tracking_unavailable" }, 503, origin);
  }
});
