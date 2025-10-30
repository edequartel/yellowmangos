// api/chat/startvector.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  const DEFAULT_ASSISTANT_ID = process.env.ASSISTANT_ID;            // optional default
  const DEFAULT_VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID; // optional default

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });
  }

  // Require a token with scope chat:send
  if (!requireJWT(req, res, "chat:send")) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const message: string | undefined = body.message;
  let thread_id: string | undefined = body.thread_id;

  // assistant_id from body, else default env
  const assistant_id: string | undefined =
    typeof body.assistant_id === "string" && body.assistant_id.trim()
      ? body.assistant_id.trim()
      : (DEFAULT_ASSISTANT_ID && DEFAULT_ASSISTANT_ID.trim()) || undefined;

  if (!assistant_id) {
    return res.status(400).json({ error: "assistant_id missing and no default ASSISTANT_ID set" });
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message required" });
  }

  // ── Option A: enforce vector_store_ids as an ARRAY (or a single vector_store_id fallback)
  let vectorStoreIds: string[] | undefined;
  if (Array.isArray(body.vector_store_ids)) {
    vectorStoreIds = body.vector_store_ids
      .map((s: unknown) => (typeof s === "string" ? s.trim() : ""))
      .filter(Boolean);
    // dedupe
    vectorStoreIds = Array.from(new Set(vectorStoreIds));
  } else if (typeof body.vector_store_ids === "string") {
    // Explicitly reject comma-separated strings to keep JSON clean
    return res.status(400).json({
      error:
        'vector_store_ids must be an array of strings, e.g. ["vs_...","vs_..."]. ' +
        "Do not send a single comma-separated string.",
    });
  } else if (typeof body.vector_store_id === "string" && body.vector_store_id.trim()) {
    vectorStoreIds = [body.vector_store_id.trim()];
  } else if (DEFAULT_VECTOR_STORE_ID) {
    vectorStoreIds = [DEFAULT_VECTOR_STORE_ID];
  }

  // Create a thread if none provided
  if (!thread_id) {
    const crt = await fetch(`${OPENAI_BASE}/threads`, {
      method: "POST",
      headers: headers(OPENAI_API_KEY),
      body: JSON.stringify({}),
    });
    await okOrThrow(crt);
    const t = await crt.json();
    thread_id = t.id;
  }

  // Add the user message
  const add = await fetch(`${OPENAI_BASE}/threads/${thread_id}/messages`, {
    method: "POST",
    headers: headers(OPENAI_API_KEY),
    body: JSON.stringify({
      role: "user",
      content: [{ type: "text", text: message.trim() }],
    }),
  });
  await okOrThrow(add);

  // Start the run; attach vector stores (if any) via tool_resources
  const runBody: Record<string, any> = { assistant_id };
  if (vectorStoreIds && vectorStoreIds.length > 0) {
    runBody.tool_resources = {
      file_search: { vector_store_ids: vectorStoreIds },
    };
  }

  const runRes = await fetch(`${OPENAI_BASE}/threads/${thread_id}/runs`, {
    method: "POST",
    headers: headers(OPENAI_API_KEY),
    body: JSON.stringify(runBody),
  });
  await okOrThrow(runRes);
  const run = await runRes.json();

  return res.json({ thread_id, run_id: run.id, status: run.status });
}