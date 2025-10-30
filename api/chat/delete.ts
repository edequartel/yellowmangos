// /api/chat/delete.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers as baseHeaders, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });
  }

  // Require your JWT scope
  if (!requireJWT(req, res, "assistant:write")) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const assistant_id: string =
    typeof body.assistant_id === "string" ? body.assistant_id.trim() : "";
  if (!assistant_id) {
    return res.status(400).json({ error: "assistant_id required" });
  }

  const url = `${OPENAI_BASE}/assistants/${assistant_id}`;

  // Build headers safely: DO NOT spread a Headers object (it drops values).
  const h = new Headers(baseHeaders(OPENAI_API_KEY));
  h.set("X-HTTP-Method-Override", "DELETE");
  // If you use Assistants v2 in your stack, ensure this is included
  // h.set("OpenAI-Beta", "assistants=v2");
  // No body -> no need for Content-Type

  // Debug: log outgoing headers
  try {
    const out = Object.fromEntries(Array.from(h.entries()));
    console.log("[delete.ts] Outgoing headers to OpenAI:", out);
  } catch { /* ignore logging errors */ }

  // Helper to parse delete responses robustly
  const parseDelete = async (resp: Response) => {
    if (resp.status === 204) {
      // No content, fabricate a minimal delete payload
      return { id: assistant_id, object: "assistant.deleted", deleted: true };
    }
    const text = await resp.text();
    if (!text) {
      return { id: assistant_id, object: "assistant.deleted", deleted: true };
    }
    try {
      return JSON.parse(text);
    } catch {
      // Not JSON; return as-is for debugging
      return { id: assistant_id, object: "assistant.deleted", deleted: true, raw: text };
    }
  };

  try {
    // Primary path: POST + override (gateway-safe)
    let resp = await fetch(url, {
      method: "POST",
      headers: h,
      // No body
    });

    // If OpenAI/gateway ignored the override and returned an Assistant object,
    // or a 405/400, try a real DELETE as fallback.
    let data = await parseDelete(resp);

    if (
      (resp.ok && data && data.object === "assistant") || // got full assistant instead of deleted
      resp.status === 405 || resp.status === 400
    ) {
      // Try true DELETE
      const h2 = new Headers(baseHeaders(OPENAI_API_KEY));
      // h2.set("OpenAI-Beta", "assistants=v2");
      console.log("[delete.ts] Retry with real DELETE");
      resp = await fetch(url, { method: "DELETE", headers: h2 });
      await okOrThrow(resp);
      data = await parseDelete(resp);
    } else {
      await okOrThrow(resp);
    }

    // Normalize to deleted-shape if necessary
    if (data && data.object === "assistant") {
      // It still returned an Assistant; normalize to deleted=false for clarity
      return res.status(200).json({
        id: data.id ?? assistant_id,
        object: "assistant",
        deleted: false,
        note: "OpenAI returned Assistant object; DELETE override likely stripped by gateway.",
        original: data,
      });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    // Best-effort error body
    return res.status(500).json({ error: err?.message || "Failed to delete assistant" });
  }
}