import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BUCKET = "layout-hex-references";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_ORIGINS = new Set(["https://hisabsarraf.new.tg"]);

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-token",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Vary": "Origin",
  };
}
function jsonResponse(status: number, body: Record<string, unknown>, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
function getPublicKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}"); return typeof keys.default === "string" ? keys.default : ""; }
  catch { return ""; }
}
function getSecretKey(): { key: string; legacyJwt: boolean } {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return { key: legacy, legacyJwt: true };
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); return { key: typeof keys.default === "string" ? keys.default : "", legacyJwt: false }; }
  catch { return { key: "", legacyJwt: false }; }
}
function serverHeaders(info: { key: string; legacyJwt: boolean }): Record<string, string> {
  const headers: Record<string, string> = { apikey: info.key };
  if (info.legacyJwt) headers.Authorization = "Bearer " + info.key;
  return headers;
}
function config() {
  const baseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const secret = getSecretKey();
  return baseUrl && secret.key ? { baseUrl, headers: serverHeaders(secret) } : null;
}
async function verifyCreator(token: string): Promise<{ id: string; role: string } | null> {
  const base = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const key = getPublicKey();
  if (!base || !key) return null;
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (!key.startsWith("sb_publishable_")) headers.Authorization = "Bearer " + key;
  try {
    const response = await fetch(base + "/rest/v1/rpc/legacy_verify", { method: "POST", headers, body: JSON.stringify({ p_token: token }), signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const result = await response.json(), user = result?.user;
    const id = String(user?.id || ""), role = String(user?.role || "");
    return result?.success === true && /^\d+$/.test(id) && ["creator", "admin"].includes(role) ? { id, role } : null;
  } catch { return null; }
}
function publicUrl(base: string, path: string): string {
  return base + "/storage/v1/object/public/" + BUCKET + "/" + path.split("/").map(encodeURIComponent).join("/");
}
function validSignature(type: string, b: Uint8Array): boolean {
  if (type === "image/jpeg") return b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255;
  if (type === "image/png") return b.length >= 8 && b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71 && b[4] === 13 && b[5] === 10 && b[6] === 26 && b[7] === 10;
  if (type === "image/gif") return b.length >= 6 && ["GIF87a", "GIF89a"].includes(String.fromCharCode(...b.slice(0, 6)));
  if (type === "image/webp") return b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP";
  return false;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response("forbidden", { status: 403 });
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) return jsonResponse(403, { success: false, error: "مبدأ درخواست مجاز نیست." }, origin);
  if (!["GET", "POST", "DELETE"].includes(req.method)) return jsonResponse(405, { success: false, error: "روش درخواست پشتیبانی نمی‌شود." }, origin);
  const token = (req.headers.get("x-app-token") || "").trim();
  if (!token || token.length > 4096) return jsonResponse(401, { success: false, error: "نشست سازنده معتبر نیست. دوباره وارد شوید." }, origin);
  const creator = await verifyCreator(token);
  if (!creator) return jsonResponse(403, { success: false, error: "فقط سازنده یا مدیر اجازه مدیریت تصاویر HEX را دارد." }, origin);
  const cfg = config();
  if (!cfg) return jsonResponse(503, { success: false, error: "سرویس امن کتابخانه HEX آماده نیست." }, origin);

  if (req.method === "GET") {
    const q = new URLSearchParams({ select: "id,title,storage_path,original_filename,mime_type,file_size,created_at", created_by: "eq." + creator.id, order: "created_at.asc" });
    const response = await fetch(cfg.baseUrl + "/rest/v1/layout_hex_references?" + q.toString(), { headers: cfg.headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      console.error("HEX list error", response.status, (await response.text()).slice(0, 300));
      return jsonResponse(502, { success: false, error: "خواندن تصاویر از کتابخانه A1 ناموفق بود." }, origin);
    }
    const rows = await response.json();
    const items = (Array.isArray(rows) ? rows : []).map((row: Record<string, unknown>, i: number) => ({
      ...row, hex_code: "HEX-" + String(i + 1).padStart(3, "0"), image_url: publicUrl(cfg.baseUrl, String(row.storage_path || "")),
    }));
    return jsonResponse(200, { success: true, items }, origin);
  }

  if (req.method === "DELETE") {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return jsonResponse(400, { success: false, error: "درخواست حذف معتبر نیست." }, origin); }
    const id = String(body.id || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return jsonResponse(400, { success: false, error: "شناسه تصویر معتبر نیست." }, origin);
    const q = new URLSearchParams({ select: "id,storage_path", id: "eq." + id, created_by: "eq." + creator.id, limit: "1" });
    const lookup = await fetch(cfg.baseUrl + "/rest/v1/layout_hex_references?" + q.toString(), { headers: cfg.headers, signal: AbortSignal.timeout(12000) });
    if (!lookup.ok) return jsonResponse(502, { success: false, error: "اطلاعات تصویر از A1 خوانده نشد." }, origin);
    const rows = await lookup.json(), row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return jsonResponse(404, { success: false, error: "تصویر پیدا نشد یا اجازه حذف آن را ندارید." }, origin);
    const delQ = new URLSearchParams({ id: "eq." + id, created_by: "eq." + creator.id });
    const deleted = await fetch(cfg.baseUrl + "/rest/v1/layout_hex_references?" + delQ.toString(), { method: "DELETE", headers: { ...cfg.headers, Prefer: "return=minimal" }, signal: AbortSignal.timeout(12000) });
    if (!deleted.ok) return jsonResponse(502, { success: false, error: "حذف مشخصات تصویر از A1 انجام نشد." }, origin);
    const path = String(row.storage_path || "");
    const storageUrl = cfg.baseUrl + "/storage/v1/object/" + BUCKET + "/" + path.split("/").map(encodeURIComponent).join("/");
    const storageDelete = await fetch(storageUrl, { method: "DELETE", headers: cfg.headers, signal: AbortSignal.timeout(12000) });
    if (!storageDelete.ok) {
      console.error("HEX storage cleanup failed", storageDelete.status, (await storageDelete.text()).slice(0, 300));
      return jsonResponse(200, { success: true, cleanup_pending: true }, origin);
    }
    return jsonResponse(200, { success: true, cleanup_pending: false }, origin);
  }

  const length = Number(req.headers.get("content-length") || "0");
  if (length > MAX_FILE_SIZE + 65536) return jsonResponse(413, { success: false, error: "حجم درخواست بیش از حد مجاز است." }, origin);
  let form: FormData;
  try { form = await req.formData(); } catch { return jsonResponse(400, { success: false, error: "فرمت درخواست بارگذاری معتبر نیست." }, origin); }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonResponse(400, { success: false, error: "فایل تصویر دریافت نشد." }, origin);
  if (!ALLOWED_TYPES.has(file.type)) return jsonResponse(415, { success: false, error: "فقط JPG، PNG، WebP و GIF مجاز است." }, origin);
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) return jsonResponse(413, { success: false, error: "حجم تصویر باید کمتر از ۱۰ مگابایت باشد." }, origin);
  const titleField = form.get("title"), title = typeof titleField === "string" ? titleField.trim().slice(0, 120) : "";
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validSignature(file.type, bytes)) return jsonResponse(415, { success: false, error: "محتوای فایل با فرمت تصویر اعلام‌شده مطابقت ندارد." }, origin);
  const safeName = file.name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.{2,}/g, ".").slice(-100) || "reference-image";
  const path = "references/" + crypto.randomUUID() + "-" + safeName;
  const objectUrl = cfg.baseUrl + "/storage/v1/object/" + BUCKET + "/" + path.split("/").map(encodeURIComponent).join("/");
  let uploaded = false;
  try {
    const up = await fetch(objectUrl, { method: "POST", headers: { ...cfg.headers, "Content-Type": file.type, "Cache-Control": "max-age=3600", "x-upsert": "false" }, body: bytes, signal: AbortSignal.timeout(30000) });
    if (!up.ok) {
      console.error("HEX upload error", up.status, (await up.text()).slice(0, 300));
      return jsonResponse(502, { success: false, error: "ذخیره فایل در فضای تصاویر A1 انجام نشد." }, origin);
    }
    uploaded = true;
    const row = { title: title || file.name.slice(0, 120), description: null, storage_path: path, original_filename: file.name.slice(0, 255), mime_type: file.type, file_size: file.size, created_by: creator.id };
    const insert = await fetch(cfg.baseUrl + "/rest/v1/layout_hex_references", { method: "POST", headers: { ...cfg.headers, "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(row), signal: AbortSignal.timeout(15000) });
    if (!insert.ok) {
      console.error("HEX metadata insert error", insert.status, (await insert.text()).slice(0, 300));
      const cleanup = await fetch(objectUrl, { method: "DELETE", headers: cfg.headers, signal: AbortSignal.timeout(10000) });
      if (cleanup.ok) uploaded = false;
      return jsonResponse(502, { success: false, error: "فایل در A1 بارگذاری شد اما ثبت مشخصات کامل نشد." }, origin);
    }
    const inserted = await insert.json(), rowId = Array.isArray(inserted) ? inserted[0]?.id : null;
    const q = new URLSearchParams({ select: "id", created_by: "eq." + creator.id, order: "created_at.asc" });
    const list = await fetch(cfg.baseUrl + "/rest/v1/layout_hex_references?" + q.toString(), { headers: cfg.headers, signal: AbortSignal.timeout(10000) });
    let hexCode: string | null = null;
    if (list.ok) {
      const all = await list.json(), index = Array.isArray(all) ? all.findIndex((r: Record<string, unknown>) => r.id === rowId) : -1;
      if (index >= 0) hexCode = "HEX-" + String(index + 1).padStart(3, "0");
    }
    return jsonResponse(200, { success: true, id: rowId || null, hex_code: hexCode, path }, origin);
  } catch (e) {
    console.error("HEX upload exception", e instanceof Error ? e.message : "unknown");
    if (uploaded) await fetch(objectUrl, { method: "DELETE", headers: cfg.headers, signal: AbortSignal.timeout(10000) }).catch(() => null);
    return jsonResponse(502, { success: false, error: "ارتباط با سرویس ذخیره‌سازی A1 برقرار نشد." }, origin);
  }
});
