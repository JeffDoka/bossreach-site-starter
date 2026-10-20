---
name: check-my-site
description: Check the site for Google and for speed, and fix what it finds. Use when the owner says "check my site", "is it ready for Google", or before they share the link.
---

# Check my site

1. Run `npm run check`. It lists ERROR lines (fix these) and WARN lines (advice).
2. Fix every ERROR yourself. Typical ones: a page without a `description`, a picture without `alt`
   text, missing business data on the home page. Then run the check again.
3. For each WARN, fix it if you can without inventing facts:
   - Title or description too short or long: rewrite it in `content/pages/<page>.md`.
   - "Add your street address / phone / opening hours": ask the owner, then fill `content/site.json`.
   - "Still has sample text": replace it with their real words, or ask.
   - Photo too big: use the `add-photos` skill steps to shrink it.
   - "Set url": needs their web address (see `connect-domain`). Until they have one, tell them it is
     fine to leave it for now.
4. Finish with one plain summary: what you fixed, and anything still waiting on the owner.
5. Remind them that Google can take days or weeks to show a new site. They can speed it up by
   adding the business at business.google.com and the site address at search.google.com/search-console
   (free).
