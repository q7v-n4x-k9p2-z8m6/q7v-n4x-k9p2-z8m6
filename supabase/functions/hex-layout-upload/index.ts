import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BUCKET = "layout-hex-references";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_ORIGINS = new Set(["https://hisabsarraf.new.tg"]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(status: number, body: Record<string, unknown>, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getPublicKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    return typeof keys.default === "string" ? keys.default : "";
  } catch {
    return "";
  }
}

function getSecretKey(): { key: string; legacyJwt: boolean } {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return { key: legacy, legacyJwt: true };
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const key = typeof keys.default === "string" ? keys.default : "";
    return { key, legacyJwt: false };
  } catch {
    return { key: "", legacyJwt: false };
  }
}

async function verifyCreatorToken(token: string): Promise<{ id: string; role: string } | null> {
  const baseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const publicKey = getPublicKey();
  if (!baseUrl || !publicKey) return null;

  const headers: Record<string, string> = {
    apikey: publicKey,
    "Content-Type": "application/json",
  };
  if (!publicKey.startsWith("sb_publishable_")) {
    headers.Authorization = "Bearer " + publicKey;
  }

  try {
    const response = await fetch(baseUrl + "/rest/v1/rpc/legacy_verify", {
      method: "POST",
      headers,
      body: JSON.stringify({ p_token: token }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const result = await response.json();
    const user = result?.user;
    const role = String(user?.role || "");
    const id = String(user?.id || "");
    if (result?.success !== true || !id || !["creator", "admin"].includes(role)) return null;
    if (!/^\d+$/.test(id)) return null;
    return { id, role };
  } catch {
    return null;
  }
}

function serverKeyHeaders(keyInfo: { key: string; legacyJwt: boolean }): Record<string, string> {
  const headers: Record<string, string> = { apikey: keyInfo.key };
  if (keyInfo.legacyJwt) headers.Authorization = "Bearer " + keyInfo.key;
  return headers;
}

function safeFileName(name: string): string {
  const cleaned = name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/\.{2,}/g, ".").slice(-100);
  return cleaned || "reference-image";
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return new Response("forbidden", { status: 403 });
    }
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { success: false, error: "روش درخواست پشتیبانی نمی‌شود." }, origin);
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse(403, { success: false, error: "مبدأ درخواست مجاز نیست." }, origin);
  }

  const token = (req.headers.get("x-app-token") || "").trim();
  if (!token || token.length > 4096) {
    return jsonResponse(401, { success: false, error: "نشست سازنده معتبر نیست. دوباره وارد شوید." }, origin);
  }

  const creator = await verifyCreatorToken(token);
  if (!creator) {
    return jsonResponse(403, { success: false, error: "فقط حساب سازنده یا مدیر اجازه افزودن تصویر HEX را دارد." }, origin);
  }

  const baseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const secretKey = getSecretKey();
  if (!baseUrl || !secretKey.key) {
    console.error("HEX upload server configuration is missing required Supabase credentials.");
    return jsonResponse(503, { success: false, error: "سرویس امن بارگذاری هنوز آماده نیست." }, origin);
  }

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_FILE_SIZE + 64 * 1024) {
    return jsonResponse(413, { success: false, error: "حجم درخواست بیش از حد مجاز است." }, origin);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse(400, { success: false, error: "فرمت درخواست بارگذاری معتبر نیست." }, origin);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonResponse(400, { success: false, error: "فایل تصویر دریافت نشد." }, origin);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return jsonResponse(415, { success: false, error: "فقط JPG، PNG، WebP و GIF مجاز است." }, origin);
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return jsonResponse(413, { success: false, error: "حجم تصویر باید کمتر از ۱۰ مگابایت باشد." }, origin);
  }

  const titleInput = form.get("title");
  const descriptionInput = form.get("description");
  const title = typeof titleInput === "string" ? titleInput.trim().slice(0, 120) : "";
  const description = typeof descriptionInput === "string" ? descriptionInput.trim().slice(0, 1000) : "";
  const storagePath = "references/" + crypto.randomUUID() + "-" + safeFileName(file.name);
  const objectUrl = baseUrl + "/storage/v1/object/" + BUCKET + "/" +
    storagePath.split("/").map(encodeURIComponent).join("/");
  const authHeaders = serverKeyHeaders(secretKey);

  try {
    const uploadHeaders = {
      ...authHeaders,
      "Content-Type": file.type,
      "Cache-Control": "max-age=3600",
      "x-upsert": "false",
    };
    const uploadResponse = await fetch(objectUrl, {
      method: "POST",
      headers: uploadHeaders,
      body: await file.arrayBuffer(),
      signal: AbortSignal.timeout(30000),
    });
    if (!uploadResponse.ok) {
      const detail = (await uploadResponse.text()).slice(0, 500);
      console.error("HEX storage upload failed:", uploadResponse.status, detail);
      return jsonResponse(502, { success: false, error: "ذخیره فایل در فضای تصاویر انجام نشد. دوباره تلاش کنید." }, origin);
    }

    const row = {
      title: title || file.name.slice(0, 120),
      description: description || null,
      storage_path: storagePath,
      original_filename: file.name.slice(0, 255),
      mime_type: file.type,
      file_size: file.size,
      created_by: creator.id,
    };
    const insertResponse = await fetch(baseUrl + "/rest/v1/layout_hex_references", {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(15000),
    });

    if (!insertResponse.ok) {
      const detail = (await insertResponse.text()).slice(0, 500);
      console.error("HEX metadata insert failed:", insertResponse.status, detail);
      const cleanupResponse = await fetch(objectUrl, {
        method: "DELETE",
        headers: authHeaders,
        signal: AbortSignal.timeout(10000),
      });
      if (!cleanupResponse.ok) {
        console.error("HEX orphan cleanup failed:", cleanupResponse.status);
      }
      return jsonResponse(502, { success: false, error: "فایل بارگذاری شد اما ثبت مشخصات آن کامل نشد؛ فایل موقت پاک‌سازی شد. دوباره تلاش کنید." }, origin);
    }

    const inserted = await insertResponse.json();
    return jsonResponse(200, {
      success: true,
      id: Array.isArray(inserted) ? inserted[0]?.id ?? null : null,
      path: storagePath,
    }, origin);
  } catch (error) {
    console.error("HEX upload request failed:", error instanceof Error ? error.message : "unknown error");
    return jsonResponse(502, { success: false, error: "ارتباط با سرویس بارگذاری برقرار نشد. دوباره تلاش کنید." }, origin);
  }
});
