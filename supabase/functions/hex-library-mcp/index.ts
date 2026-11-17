import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { Hono } from "npm:hono@^4.9.7";
import { z } from "npm:zod@^4.1.13";

const BUCKET = "layout-hex-references";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aa = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = aa.length ^ bb.length;
  const length = Math.max(aa.length, bb.length);
  for (let i = 0; i < length; i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

function serviceConfig() {
  const baseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const secret = Deno.env.get("SUPABASE_SECRET_KEYS") || "";
  let key = serviceKey;
  if (!key && secret) {
    try {
      const parsed = JSON.parse(secret);
      key = typeof parsed.default === "string" ? parsed.default : "";
    } catch {
      key = "";
    }
  }
  if (!baseUrl || !key) throw new Error("HEX MCP backend configuration is incomplete.");
  const headers: Record<string, string> = { apikey: key };
  if (key.startsWith("eyJ") || key.split(".").length === 3) headers.Authorization = "Bearer " + key;
  return { baseUrl, headers };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function getRows() {
  const { baseUrl, headers } = serviceConfig();
  const query = new URLSearchParams({
    select: "id,title,storage_path,original_filename,mime_type,file_size,created_at",
    order: "created_at.asc",
    limit: "1000",
  });
  const response = await fetch(baseUrl + "/rest/v1/layout_hex_references?" + query.toString(), {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("A1 HEX metadata could not be read (" + response.status + ").");
  const rows = await response.json();
  return (Array.isArray(rows) ? rows : []).map((row: Record<string, unknown>, index: number) => ({
    ...row,
    hex_code: "HEX-" + String(index + 1).padStart(3, "0"),
  }));
}

async function getImage(row: Record<string, unknown>) {
  const { baseUrl } = serviceConfig();
  const path = String(row.storage_path || "");
  if (!path.startsWith("references/") || path.includes("..")) throw new Error("Invalid HEX storage path.");
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url = baseUrl + "/storage/v1/object/public/" + BUCKET + "/" + encodedPath;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("The HEX image could not be fetched from A1 (" + response.status + ").");
  const mimeType = String(row.mime_type || response.headers.get("content-type") || "");
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
    throw new Error("Unsupported image type in HEX metadata.");
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image must be between 1 byte and 8 MB for direct visual transfer.");
  }
  return { data: toBase64(new Uint8Array(buffer)), mimeType };
}

function makeServer() {
  const server = new McpServer({ name: "a1-hex-image-library", version: "1.0.0" });

  server.registerTool(
    "list_hex_images",
    {
      title: "List A1 HEX reference images",
      description: "Read-only: list image references stored in the A1 حساب صراف HEX library. Returns only image-library metadata; no customer, transaction, account, or financial data.",
      inputSchema: {},
    },
    async () => {
      try {
        const rows = await getRows();
        const items = rows.map((row: Record<string, unknown>) => ({
          hex_code: row.hex_code,
          id: row.id,
          title: row.title,
          original_filename: row.original_filename,
          mime_type: row.mime_type,
          file_size: row.file_size,
          created_at: row.created_at,
        }));
        return { content: [{ type: "text", text: JSON.stringify({ count: items.length, images: items }, null, 2) }] };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Could not list HEX images." }] };
      }
    },
  );

  server.registerTool(
    "get_hex_image",
    {
      title: "Get an A1 HEX image",
      description: "Read-only: retrieve the actual image bytes from the A1 HEX library so the AI can visually inspect it. Supply either an exact HEX code (for example HEX-001) or the image UUID. This tool cannot modify or delete anything.",
      inputSchema: {
        hex_code: z.string().regex(/^HEX-\d{3,}$/).optional(),
        id: z.string().uuid().optional(),
      },
    },
    async ({ hex_code, id }) => {
      try {
        if (!hex_code && !id) {
          return { isError: true, content: [{ type: "text", text: "Provide either hex_code or id." }] };
        }
        const rows = await getRows();
        const row = rows.find((item: Record<string, unknown>) =>
          (id && String(item.id) === id) || (hex_code && String(item.hex_code) === hex_code)
        ) as Record<string, unknown> | undefined;
        if (!row) return { isError: true, content: [{ type: "text", text: "HEX image not found in the A1 library." }] };
        const image = await getImage(row);
        return {
          content: [
            { type: "text", text: JSON.stringify({ hex_code: row.hex_code, id: row.id, title: row.title, original_filename: row.original_filename, mime_type: image.mimeType, file_size: row.file_size }) },
            { type: "image", data: image.data, mimeType: image.mimeType },
          ],
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Could not retrieve HEX image." }] };
      }
    },
  );

  return server;
}

const app = new Hono().basePath("/hex-library-mcp");

app.all("*", async (c) => {
  const configuredToken = Deno.env.get("HEX_MCP_ACCESS_TOKEN") || "";
  if (!configuredToken || configuredToken.length < 32) {
    return c.json({ error: "HEX MCP access token is not configured." }, 503);
  }
  const authorization = c.req.header("authorization") || "";
  const suppliedToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!suppliedToken || !constantTimeEqual(suppliedToken, configuredToken)) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  try {
    const server = makeServer();
    const transport = new WebStandardStreamableHTTPServerTransport();
    await server.connect(transport);
    return await transport.handleRequest(c.req.raw);
  } catch (error) {
    console.error("HEX MCP request failed:", error instanceof Error ? error.message : "unknown");
    return c.json({ error: "HEX MCP request failed." }, 500);
  }
});

Deno.serve(app.fetch);
