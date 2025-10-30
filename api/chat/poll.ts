// api/chat/poll.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OPENAI_BASE, headers, okOrThrow } from "../lib/openai";
import { requireJWT } from "../lib/auth";

/**
 * Concatenate all text chunks from the first assistant message (with text).
 */
function extractTextFromMessages(messages: any[]): string {
  for (const msg of messages ?? []) {
    if (msg.role === "assistant") {
      let buf = "";
      for (const c of msg.content ?? []) {
        if (c?.type === "text" && c.text?.value) buf += c.text.value;
      }
      if (buf.trim().length > 0) return buf.trim();
    }
  }
  return "";
}

/**
 * Collect unique file_ids from file_citation annotations on text content.
 */
function extractCitationsFromMessages(messages: any[]): string[] {
  const ids = new Set<string>();

  for (const msg of messages ?? []) {
    if (msg.role !== "assistant") continue;
    for (const c of msg.content ?? []) {
      if (c?.type !== "text" || !c.text?.annotations) continue;
      for (const ann of c.text.annotations) {
        if (ann?.type === "file_citation" && ann.file_citation?.file_id) {
          ids.add(ann.file_citation.file_id);
        }
      }
    }
  }

  return Array.from(ids);
}

/**
 * Return the first assistant message that actually has text content.
 */
function firstAssistantWithText(messages: any[]): any | null {
  for (const msg of messages ?? []) {
    if (msg.role !== "assistant") continue;

    let hasText = false;
    for (const c of msg.content ?? []) {
      if (c?.type === "text" && c.text?.value?.trim()) {
        hasText = true;
        break;
      }
    }
    if (hasText) return msg;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Use GET" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing env OPENAI_API_KEY" });
    }

    // Require a token with scope chat:send (same scope is fine for poll)
    if (!requireJWT(req, res, "chat:send")) return;

    const thread_id = String(req.query.thread_id || "");
    const run_id = String(req.query.run_id || "");
    if (!thread_id || !run_id) {
      return res.status(400).json({ error: "thread_id and run_id required" });
    }

    // 1) Check run status
    const runReq = await fetch(`${OPENAI_BASE}/threads/${thread_id}/runs/${run_id}`, {
      headers: headers(OPENAI_API_KEY),
    });
    await okOrThrow(runReq);
    const run = await runReq.json();

    // If not completed yet, return the current status (and last_error if any)
    if (run.status !== "completed") {
      return res.json({
        status: run.status,
        thread_id,
        run_id,
        last_error: run.last_error?.message ?? null,
      });
    }

    // 2) Fetch recent messages to get the assistant’s reply
    const msgsReq = await fetch(
      `${OPENAI_BASE}/threads/${thread_id}/messages?limit=50&order=desc`,
      { headers: headers(OPENAI_API_KEY) }
    );
    await okOrThrow(msgsReq);
    const data = await msgsReq.json(); // { object: "list", data: [ ... ], ... }

    const messages = data?.data ?? [];
    const assistantMsg = firstAssistantWithText(messages);
    const text = assistantMsg
      ? extractTextFromMessages([assistantMsg])
      : "";
    const citations = assistantMsg
      ? extractCitationsFromMessages([assistantMsg])
      : [];

    // 3) Respond with status + text + raw content + attachments
    return res.json({
      status: "completed",
      text,
      content: assistantMsg?.content ?? null,
      attachments: assistantMsg?.attachments ?? null,
      citations: citations.length ? citations : null,
      thread_id,
      run_id,
    });
  } catch (err: any) {
    // Ensure we never throw raw errors
    return res.status(500).json({
      error: "poll_failed",
      message: err?.message ?? String(err),
    });
  }
}

