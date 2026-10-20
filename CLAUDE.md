# Instructions for Claude: this is a small-business website

The person you are helping owns a small business (a restaurant, a shop, a salon) and is **not a
programmer**. They will ask for things in plain words: "change Sunday hours", "add my menu", "make it
green". Do the work, explain what you did in one or two plain sentences, and never make them read code.

## How to talk

- Plain words. Say "your site" not "the repo", "put it online" not "deploy" (once is fine: "deploy, which
  means putting it online").
- Ask for what you need in one short question at a time (business name, address, hours, phone). Never
  ask for something you can find in a file or work out.
- After every change, run `npm run check` and tell them if it found anything. Fix the errors yourself.
- Never show them a long diff. Say what changed and, when useful, tell them to look at the preview.
- If a step needs them to click in a web page (Cloudflare), give numbered steps with the exact button
  names, and wait for them to say it is done.

## How the site works

Everything the owner would change is a plain file:

| File | What it holds |
| --- | --- |
| `content/site.json` | Name, tagline, description, phone, email, address, opening hours, colours, social links, photos, the three "highlight" cards, the web address (`url`) |
| `content/menu.json` | The menu (restaurant): sections of items with name, description, price |
| `content/pages/*.md` | One page each, in Markdown. `index.md` is the home page. The top of each file has `title`, `description`, `order` (menu position), and optionally `layout: menu` or `layout: contact`, `nav: false` to hide it from the menu |
| `public/images/` | Photos and the logo. Anything in `public/` is copied to the site as is |
| `theme/*.css` | The look. `base.css` is shared; `restaurant.css`, `business.css`, `blank.css` belong to each template |
| `wrangler.jsonc` | Cloudflare settings: site name, contact form, custom domain |

`scripts/build.mjs` turns those files into the finished site in `dist/`. **Never edit `dist/`**: it is
rebuilt every time. Edit the files above, then the preview updates by itself.

Three starting points live in `templates/` (restaurant, business, blank). `npm run template -- <name>`
swaps `content/` for one of them (the old content is saved in `.content-backup/`).

## Commands (run these for the owner)

- `npm install` once, after the folder is first made.
- `npm run dev` starts a private preview at http://localhost:8787 (keep it running in the background
  while you edit; it refreshes when files change).
- `npm run check` checks titles, descriptions, Google business data, picture descriptions and picture
  sizes. Errors stop a deploy; warnings are advice.
- `npm run deploy` checks, then puts the site online on the owner's Cloudflare account.

## Skills you have (in `.claude/skills/`)

`set-up-my-site`, `add-my-menu`, `change-colours`, `add-a-page`, `add-photos`, `turn-on-contact-form`,
`check-my-site`, `deploy`, `connect-domain`. Use the matching one when the owner asks for that thing.

## Rules that keep the site good

- Every page needs a unique `title` and a `description` of 70 to 160 characters written for a customer.
- Opening hours, address and phone in `content/site.json` must match their Google Maps listing exactly.
  They feed the business data Google reads.
- Every picture needs `alt` text (a short description of what it shows). For Markdown images:
  `![A bowl of ramen](/images/ramen.jpg)`.
- Photos: aim under 300 KB and under 2400 pixels wide. If the owner drops in a big photo, shrink it
  (for example `npx --yes sharp-cli -i public/images/big.jpg -o public/images/ -f webp -q 80 resize 1600`)
  and delete the original from `public/images/`.
- Keep it fast: no JavaScript libraries, no web fonts, no sliders. The pages are plain HTML on purpose.
- Colours in `content/site.json` must keep text readable: dark text on a light background, white text on
  the primary colour.
- Never invent facts (hours, prices, awards, reviews). If you do not know, ask.
- Never put passwords, tokens or API keys in any file. Cloudflare sign-in happens in the browser when
  `wrangler` asks; the owner clicks Allow.
- The "Built with Bossreach" link in the footer is the owner's choice. It is on by default
  (`"showBuiltWith": true`). If they ask to remove it, set it to `false`; the licence allows that.

## The optional puzzle block

`content/site.json` has a `puzzle` block, **off by default**. It is for a free puzzle from bossfeed.fun
that can sit on the home page. It is **available once bossfeed ships /embed**: the address
`https://bossfeed.fun/embed/3072` does not work yet. Do not turn it on (`"enabled": true`) and do not
offer it to the owner until that address opens a playable puzzle in a normal browser tab.

## Do not

- Do not edit `dist/`, `node_modules/` or `.wrangler/`.
- Do not add packages. This site has one development tool (`wrangler`) on purpose.
- Do not run `wrangler delete` or anything that removes the live site unless the owner clearly asks.
- Do not deploy without running `npm run check` first (`npm run deploy` already does).
