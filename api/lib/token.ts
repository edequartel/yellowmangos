import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

export const config = { runtime: "nodejs" };

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Use GET" });
    }

    const secret = process.env.APP_SIGNING_SECRET; // must match requireJWT
    if (!secret || secret.trim().length < 16) {
      return res.status(500).json({
        error: "APP_SIGNING_SECRET missing or too short. Set it and redeploy.",
      });
    }

    // 🔒 Hardcode the exact scopes you need (EN, exact token name)
    const scope =
      "assistant:write chat:send chat:start chat:poll chat:cancel vector:list vector:read";

    const expiresInSeconds = 60 * 5;

    const token = jwt.sign(
      { sub: "ios-client", scope },
      secret,
      { issuer: "secure-chat", expiresIn: expiresInSeconds }
    );

    // no cache while debugging
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ token, scope, expires_in: expiresInSeconds });
  } catch (err: any) {
    return res.status(500).json({ error: `Token generation failed: ${err?.message || err}` });
  }
}