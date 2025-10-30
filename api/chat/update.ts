// /api/assistants/update.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  const DEFAULT_ASSISTANT_ID = process.env.ASSISTANT_ID; // optional fallback

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });
  }

  // Require a token with scope assistant:write (use your own scope name if different)
  if (!requireJWT(req, res, "assistant:write")) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const assistant_id: string | undefined =
    (typeof body.assistant_id === "string" && body.assistant_id.trim()) ||
    (DEFAULT_ASSISTANT_ID && DEFAULT_ASSISTANT_ID.trim()) ||
    undefined;

  if (!assistant_id) {
    return res.status(400).json({ error: "assistant_id missing and no default ASSISTANT_ID set" });
  }

  const { name, instructions, model, metadata } = body;

  // only send fields explicitly provided; make tools default to file_search
  const patch: Record<string, any> = {};
  if (typeof name !== "undefined") patch.name = name;
  if (typeof instructions !== "undefined") patch.instructions = instructions;
  if (typeof model !== "undefined") patch.model = model;
  if (typeof metadata !== "undefined") patch.metadata = metadata;

  // tools: use provided, else ensure file_search
  if (Array.isArray(body.tools)) {
    patch.tools = body.tools;
  } else {
    patch.tools = [{ type: "file_search" }];
  }

  try {
    const resp = await fetch(`${OPENAI_BASE}/assistants/${assistant_id}`, {
      method: "POST", // force POST
      headers: {
        ...headers(OPENAI_API_KEY),
        "X-HTTP-Method-Override": "PATCH",
        // If your headers() doesn't already add this and you're on Assistants v2:
        // "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify(patch),
    });

    await okOrThrow(resp);
    const data = await resp.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update assistant" });
  }
}