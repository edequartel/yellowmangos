// api/vector/list.ts
// edq

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

/**
 * GET /api/vector/list?limit=50&after=file_yyy&vector_store_id=vs_abc
 *
 * Uses query ?vector_store_id=... or falls back to env OPENAI_VECTOR_STORE_ID
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  const ENV_VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });
  }

  // 🔐 accepteer meerdere scopes
  if (!requireJWT(req, res, ["vector:list", "vector:read", "chat:send"])) return;

  // ✅ vector_store_id uit query of fallback op env
  const queryVectorId = (req.query.vector_store_id as string | undefined)?.trim();
  const VECTOR_STORE_ID = queryVectorId || ENV_VECTOR_STORE_ID;
  if (!VECTOR_STORE_ID) {
    return res.status(400).json({
      error:
        "No vector_store_id provided and OPENAI_VECTOR_STORE_ID is not set.",
    });
  }

  const limit = Math.min(
    200,
    Math.max(1, parseInt((req.query.limit as string) || "50", 10))
  );
  const after = (req.query.after as string) || undefined;

  const listUrl = new URL(`${OPENAI_BASE}/vector_stores/${VECTOR_STORE_ID}/files`);
  listUrl.searchParams.set("limit", String(limit));
  if (after) listUrl.searchParams.set("after", after);

  // 1) List vector store files (Assistants v2 beta header)
  const listResp = await fetch(listUrl.toString(), {
    method: "GET",
    headers: headers(OPENAI_API_KEY, { beta: "assistants=v2" }),
  });
  await okOrThrow(listResp);
  const listJson = await listResp.json();

  const data: Array<{
    id: string;
    status: string;
    usage_bytes: number;
    created_at: number;
    last_error?: unknown;
  }> = listJson.data || [];

  // 2) Hydrateer /v1/files/{id} voor filename/bytes/purpose
  const files = await Promise.all(
    data.map(async (vf) => {
      try {
        const metaResp = await fetch(`${OPENAI_BASE}/files/${vf.id}`, {
          method: "GET",
          headers: headers(OPENAI_API_KEY),
        });
        await okOrThrow(metaResp);
        const meta = await metaResp.json();
        return {
          id: vf.id,
          status: vf.status,
          usage_bytes: vf.usage_bytes,
          created_at: vf.created_at,
          filename: meta.filename as string | undefined,
          bytes: meta.bytes as number | undefined,
          purpose: meta.purpose as string | undefined,
          last_error: vf.last_error ?? undefined,
        };
      } catch {
        return {
          id: vf.id,
          status: vf.status,
          usage_bytes: vf.usage_bytes,
          created_at: vf.created_at,
          filename: undefined,
          bytes: undefined,
          purpose: undefined,
          last_error: vf.last_error ?? undefined,
        };
      }
    })
  );

  const last = data.length > 0 ? data[data.length - 1].id : null;

  res.json({
    vector_store_id: VECTOR_STORE_ID,
    paging: {
      has_more: Boolean(listJson.has_more),
      last_id: last,
      next_after: listJson.has_more ? last : null,
    },
    files,
  });
}