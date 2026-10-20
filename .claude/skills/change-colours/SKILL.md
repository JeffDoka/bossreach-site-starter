---
name: change-colours
description: Change the site's colours, or match them to a logo or photo. Use when the owner says "make it green", "use our brand colours", "change the colours" or "it is too dark".
---

# Change colours

Colours are four values in `content/site.json`, under `colours`:

- `primary`: the header bar, headings and links. Text on it is white, so it must be fairly dark.
- `accent`: buttons and small highlights. White text sits on it, so keep it medium to dark.
- `background`: the page. Keep it very light (white, cream) so text stays easy to read.
- `text`: body text. Keep it dark.

Steps:

1. If they name a colour ("forest green"), pick a dark, rich version for `primary` and a warm
   contrasting `accent`. If they give a logo or photo, take the main colours from it.
2. Check contrast: white on `primary` and on `accent` should be easy to read (roughly WCAG AA, 4.5 to
   1), and `text` on `background` too. If a colour is too light, darken it.
3. Edit only the `colours` block. Do not touch the CSS files unless they ask for a different look
   (fonts, spacing), in which case edit `theme/<template>.css`.
4. Tell them to look at the preview at http://localhost:8787 (start `npm run dev` if it is not running).
5. If they say "go back", restore the old values you changed.
