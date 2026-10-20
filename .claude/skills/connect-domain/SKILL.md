---
name: connect-domain
description: Put the site on the owner's own web address (for example joesdiner.com). Use when the owner says "connect my domain", "use joesdiner.com" or "I bought a domain".
---

# Connect my domain

The domain must be a "site" in the same Cloudflare account as the Worker. Two ways to get there:

- **Buy it in Cloudflare** (about $10 a year for a .com): dash.cloudflare.com, then **Domain
  Registration**, **Register Domains**, search, buy. It is added to the account automatically.
- **Already own one elsewhere**: dash.cloudflare.com, **Add a domain**, enter it, choose the Free plan,
  then follow the two nameserver steps at their registrar. Email keeps working. Cloudflare emails when
  it is active (minutes to a day).

Steps for you, once the domain shows as **Active** in their Cloudflare dashboard:

1. Ask for the domain exactly (`joesdiner.com`).
2. In `wrangler.jsonc`, uncomment the `routes` block and set both patterns, the bare domain and the
   `www.` one:
   `{ "pattern": "joesdiner.com", "custom_domain": true }, { "pattern": "www.joesdiner.com", "custom_domain": true }`
3. In `content/site.json` set `"url": "https://joesdiner.com"` (no slash at the end). This turns on the
   sitemap and Google's canonical address.
4. `npm run check`, then `npm run deploy`. Cloudflare creates the DNS records and the HTTPS
   certificate itself; it can take a few minutes the first time.
5. Open https://joesdiner.com with them to confirm. If `www` should go to the bare domain (or the other
   way), say so; both work as written.
6. Mention the contact form needs the domain too (`turn-on-contact-form`).

If deploy says the domain "is not on this account" or a record already exists: the domain is not Active
on this Cloudflare account yet, or an old DNS record for the name exists. Ask them to delete the old
record for that name under **DNS** in the dashboard, then deploy again.
