---
name: deploy
description: Put the site online on the owner's own Cloudflare account, or publish an update. Use when the owner says "publish my site", "put it online", "deploy" or "push my changes live".
---

# Deploy (put the site online)

The site goes to the owner's own Cloudflare account, at a free address like
`https://my-site.<their-name>.workers.dev`. Nothing is hosted by anyone else.

First time:

1. The Worker name is the first part of the free address. Ask what they would like it to be (their
   business name, lowercase, letters and dashes: `joes-diner`). Set `"name"` in `wrangler.jsonc` and
   `"name"` in `package.json` to it.
2. Run `npm run check`. Fix every ERROR first.
3. Run `npm run deploy`. The first time, `wrangler` opens a browser page asking them to sign in to
   Cloudflare and click **Allow**. Tell them to do that and come back. If asked to choose a free
   "workers.dev" account name, that name is theirs to pick.
4. Wrangler prints the live address. Open it with them and confirm it looks right. Tell them the address.
5. Offer the next steps: their own domain (`connect-domain`), the contact form (`turn-on-contact-form`).

Every later update: edit, run `npm run check`, then `npm run deploy`. Updates are live in seconds.

Without a Cloudflare account (to test): `npx wrangler deploy --dry-run` builds and validates everything
and uploads nothing.

If something fails:
- "Not logged in" or an authentication error: run `npx wrangler login` and have them click Allow.
- "Workers.dev subdomain" prompt: they must pick a name once; accept it.
- A check ERROR stops the deploy by design: fix it, do not bypass it.
- Never print or save any Cloudflare token. Sign-in stays in the browser and in wrangler's own storage.
