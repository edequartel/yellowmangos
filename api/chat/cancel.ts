// api/chat/cancel.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });

  // Require a token with scope chat:send (or chat:cancel if you prefer)
  if (!requireJWT(req, res, "chat:send")) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const { thread_id, run_id } = body;
  if (!thread_id || !run_id) return res.status(400).json({ error: "thread_id and run_id required" });

  const c = await fetch(`${OPENAI_BASE}/threads/${thread_id}/runs/${run_id}/cancel`, {
    method: "POST",
    headers: headers(OPENAI_API_KEY),
    body: JSON.stringify({}),
  });
  await okOrThrow(c);
  const payload = await c.json().catch(() => ({}));
  res.json({ ok: true, payload });
}
