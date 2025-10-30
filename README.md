# Brain Bananas — Start/Poll/Cancel with JWT (Exyte/Chat)

- Minimal Vercel API for OpenAI Assistants v2
- **JWT-protected** routes (Bearer token with `scope: ["chat:send"]`)
- SwiftUI client using Exyte/Chat with Markdown

## Server env
- `OPENAI_API_KEY` — your OpenAI API key
- `ASSISTANT_ID` — the Assistant to run
- `APP_SIGNING_SECRET` — HMAC secret for verifying JWTs (HS256)

## Token minting (dev-only example)
**Do not ship your signing secret in the app.** In production, mint tokens on your own backend.
For testing, you can mint a token locally:

```bash
node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({sub:'ios',scope:['chat:send']}, process.env.APP_SIGNING_SECRET,{issuer:'brain-bananas',audience:'api',expiresIn:'15m'}))" 
```

Then set that token in the iOS `TokenManager` or paste into Postman.

## Endpoints
- `POST /api/chat/start`  (Bearer JWT required)
- `GET  /api/chat/poll?thread_id=...&run_id=...`  (Bearer JWT required)
- `POST /api/chat/cancel`  (Bearer JWT required)
