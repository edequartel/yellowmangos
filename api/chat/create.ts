// /api/assistants/create.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  const DEFAULT_MODEL = process.env.ASSISTANT_DEFAULT_MODEL; // optional fallback

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });
  }

  // Require your app's JWT with proper scope
  if (!requireJWT(req, res, "assistant:write")) return;

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const {
    name,
    instructions,
    model,
    metadata,
    tools, // optional override
  } = body;

  const effectiveModel =
    (typeof model === "string" && model.trim()) ||
    (typeof DEFAULT_MODEL === "string" && DEFAULT_MODEL.trim()) ||
    "";

  if (!name || !instructions || !effectiveModel) {
    return res.status(400).json({
      error: "Missing required fields: name, instructions, model (or ASSISTANT_DEFAULT_MODEL env)",
    });
  }

  // Default tools = file_search, unless caller provides a tools array
  const finalTools = Array.isArray(tools) && tools.length > 0 ? tools : [{ type: "file_search" }];

  try {
    const resp = await fetch(`${OPENAI_BASE}/assistants`, {
      method: "POST",
      headers: {
        ...headers(OPENAI_API_KEY),
        // If your headers() doesn't already add this and you're on Assistants v2:
        // "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        name,
        instructions,
        model: effectiveModel,
        metadata,
        tools: finalTools,
      }),
    });

    await okOrThrow(resp);
    const data = await resp.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to create assistant" });
  }
}