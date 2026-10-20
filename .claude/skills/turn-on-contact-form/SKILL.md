---
name: turn-on-contact-form
description: Make the contact form email the owner. Use when the owner says "turn on the contact form", "I want messages emailed to me", or the form says it is not switched on.
---

# Turn on the contact form

Visitors fill in the form; the site emails the owner through the owner's own Cloudflare Email Routing
(free). It only delivers to an address the owner has verified, so it cannot be abused to email strangers.
It needs their own domain on Cloudflare first (`connect-domain`).

Owner steps in the Cloudflare dashboard (give them these, wait for "done"):

1. dash.cloudflare.com, pick the domain, **Email**, **Email Routing**, **Get started** (or **Enable**).
   Accept the DNS records Cloudflare offers to add.
2. **Destination addresses**, **Add destination address**: their own inbox (for example their Gmail).
   Cloudflare sends a verification email; they click the link in it.
3. Tell you the inbox address and which address at the domain to send from (suggest
   `forms@joesdiner.com`; it does not need to exist as a mailbox).

Your steps:

1. In `wrangler.jsonc`, uncomment the `send_email` and `vars` blocks and fill them in:
   `destination_address` and `CONTACT_TO` = the verified inbox; `CONTACT_FROM` = `forms@<their domain>`;
   `SITE_NAME` = the business name.
2. Check `content/site.json` has `"contactForm": true` and that the contact page has `layout: contact`.
3. `npm run deploy`.
4. Test with them: open the contact page on the live site, send a message, and have them confirm it
   arrived (check spam once). A message that sounds like a sales pitch is silently dropped on purpose
   (`src/form-spam.js`), so test with a normal sentence.
5. If it says "not switched on": a value in `wrangler.jsonc` is missing. If it says "did not go through"
   after a real message: the destination is not verified yet, or `CONTACT_FROM` is not at their
   domain. Run `npx wrangler tail` while they send a message to see the reason.

To turn the form off: set `"contactForm": false` in `content/site.json`.
