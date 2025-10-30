// api/vector/vector.ts
// edq

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

/**
 * GET /api/vector/list?limit=50&after=vs_xxx
 *
 * Lists all vector stores
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });
  }

  // Require a token (scope could be "vector:read")
  if (!requireJWT(req, res, "chat:send")) return;

  const limit = Math.min(
    200,
    Math.max(1, parseInt((req.query.limit as string) || "50", 10))
  );
  const after = (req.query.after as string) || undefined;

  // Build URL for /v1/vector_stores
  const listUrl = new URL(`${OPENAI_BASE}/vector_stores`);
  listUrl.searchParams.set("limit", String(limit));
  if (after) listUrl.searchParams.set("after", after);

  // 1) Call OpenAI to list vector stores
  const listResp = await fetch(listUrl.toString(), {
    method: "GET",
    headers: headers(OPENAI_API_KEY),
  });
  await okOrThrow(listResp);
  const listJson = await listResp.json();

  // 2) Forward the response back to client unchanged
  res.json(listJson);
}