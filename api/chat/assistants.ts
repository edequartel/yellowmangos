// api/assistants/list.ts
// Lists all Assistants (v2). Works with your TokenManager (Bearer JWT to this route).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });
  }

  // Require a short-lived JWT from your iOS app (TokenManager)
  // Adjust scope name if you prefer (e.g., "assistants:read")
  if (!requireJWT(req, res, "chat:send")) return;

  // Optional pagination: ?limit=50&after=asst_xxx
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const after = typeof req.query.after === "string" ? req.query.after : undefined;

  try {
    const url = new URL(`${OPENAI_BASE}/assistants`);
    url.searchParams.set("limit", String(limit));
    if (after) url.searchParams.set("after", after);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        ...headers(OPENAI_API_KEY),
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
    });

    await okOrThrow(resp);
    const json = await resp.json();

    // You can also map/trim fields here if you want a lighter payload
    return res.status(200).json(json);
  } catch (err: any) {
    console.error("assistants/list error:", err);
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}