# Bossreach site starter

A small, fast website for a restaurant, a shop, a salon or any local business. You build it by talking
to [Claude Code](https://claude.com/claude-code), and it goes online on **your own** free Cloudflare
account, on **your own** web address. Nobody hosts it for you, and nobody can switch it off.

- **Three starting points:** Restaurant (menu page), Small business (services page), Blank.
- **Your facts live in plain files** (`content/site.json`, `content/menu.json`, `content/pages/*.md`).
  Claude edits them when you say "change Sunday hours" or "add my menu".
- **A contact form** that emails you through your own Cloudflare, with a spam filter.
- **A check** (`npm run check`) for the things Google looks at, and for photos that are too big.
- **Free to run:** Cloudflare's free plan covers a small business site (100,000 visits a day). A domain
  name is about $10 a year.
- MIT licence. The small "Built with Bossreach" link in the footer is a thank-you you may remove
  (set `"showBuiltWith": false` in `content/site.json`).

Step-by-step instructions for a non-technical owner: **https://bossreach.io/websites**

## What you need

1. A computer (Windows or Mac).
2. A Claude subscription (Pro or higher) for Claude Code.
3. [Node.js](https://nodejs.org) (the "LTS" version, 20 or newer).
4. A free [Cloudflare](https://dash.cloudflare.com) account.
5. For your own address: a domain, about $10 a year.

## Make your site

In PowerShell (Windows) or Terminal (Mac):

```
npm create cloudflare@latest -- my-site --template=github:JeffDoka/bossreach-site-starter --no-deploy --no-git
cd my-site
claude
```

Then tell Claude what you want:

> Set up my site. It is a restaurant called Joe's Diner in Wichita, open 7 to 3, closed Mondays.

Claude asks for what it needs, fills in your details, and shows a preview at http://localhost:8787.

## Put it online

Tell Claude "publish my site". It runs `npm run deploy`, which checks the site and then uploads it. The
first time, a browser page asks you to sign in to Cloudflare; click **Allow**. You get a free address
like `https://my-site.your-name.workers.dev`. Then say "connect joesdiner.com" to use your own domain.

## Doing it by hand (no Claude)

```
npm install
npm run dev        # preview at http://localhost:8787
npm run check      # SEO and photo-size check
npm run deploy     # check, then put it online
```

`npx wrangler deploy --dry-run` builds and validates everything without uploading, which is handy to
test before you have a Cloudflare account.

## What is in the folder

| Path | What it is |
| --- | --- |
| `content/` | **Your site.** `site.json`, `menu.json`, `pages/*.md` |
| `public/images/` | Your photos and logo |
| `theme/` | The look (CSS) |
| `templates/` | The three starting points (`npm run template -- restaurant`) |
| `scripts/` | `build.mjs` (makes the site), `check.mjs` (the checks), `use-template.mjs` |
| `src/worker.js` | The tiny program that handles the contact form |
| `wrangler.jsonc` | Cloudflare settings (site name, contact form, your domain) |
| `.claude/skills/` | The things Claude knows how to do for you |
| `CLAUDE.md` | Instructions for Claude |

`dist/` is made automatically; never edit it.

## Optional: a puzzle on your site

`content/site.json` has a `puzzle` block that is **off**. It will let you put a free bossfeed.fun puzzle
on your home page. It is available once bossfeed ships `/embed`; until then leave it off.

## Help

Stuck? Ask Claude, or write to us through https://bossreach.io/websites.
