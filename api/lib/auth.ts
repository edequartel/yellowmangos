// api/lib/auth.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

export type JWTPayload = {
  sub?: string;
  scope?: string | string[]; // ← accept both
  iss?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
};

type RequiredScope = string | string[];

export function requireJWT(
  req: VercelRequest,
  res: VercelResponse,
  required: RequiredScope
): JWTPayload | null {
  const secret = process.env.APP_SIGNING_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Missing env APP_SIGNING_SECRET" });
    return null;
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Missing Authorization: Bearer <JWT>" });
    return null;
  }

  try {
    const payload = jwt.verify(token, secret) as JWTPayload;

    // Normalize token scopes -> Set<string>
    const rawScope = payload.scope ?? "";
    const have = new Set(
      Array.isArray(rawScope)
        ? rawScope
        : String(rawScope).split(/\s+/).filter(Boolean)
    );

    // Normalize required scopes -> string[]
    const needed = Array.isArray(required) ? required : [required];

    // Allow if token has ANY of the required scopes
    const ok = needed.some((s) => have.has(s));

    if (!ok) {
      res.status(403).json({
        error: "Forbidden: missing required scope",
        required_any_of: needed,
        provided: Array.from(have),
      });
      return null;
    }

    return payload;
  } catch (err: any) {
    res.status(401).json({ error: "Invalid token", details: err?.message });
    return null;
  }
}