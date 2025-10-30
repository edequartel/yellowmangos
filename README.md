# Yellow Mangoes — Markdown → Pages (Next.js on Vercel)

- Uses the **App Router** (`/app`) and includes a required **root layout** at `app/layout.tsx`.
- No experimental PPR used.

## Deploy
- Push to GitHub → Vercel auto-builds.
- If you changed config, in Vercel click **Redeploy → Clear build cache**.

## Add content
- Place `.md` files in `/content` → each becomes `/[slug]`.
