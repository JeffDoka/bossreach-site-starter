---
name: set-up-my-site
description: First-time setup of a new site. Use when the owner says "set up my site", "make me a website", or has just created this folder and wants to start. Picks a template, fills in the business facts and shows a preview.
---

# Set up my site

1. Run `npm install` if `node_modules/` does not exist.
2. Ask, one short question at a time, only what you do not already know:
   - What kind of business is it? Restaurant or cafe -> `restaurant`. A shop, salon, trade or service
     -> `business`. Anything else, or they want to start empty -> `blank`.
   - Business name, one-line tagline, what they do in a sentence or two.
   - Address, phone, public email, opening hours (which days, open and close times, closed days).
   - Colours they like (or a logo to match). If they have none, keep the template's.
3. Run `npm run template -- <restaurant|business|blank>` unless `content/site.json` already holds their
   real business name (then skip, keep their work).
4. Edit `content/site.json`: `name`, `tagline`, `description` (70 to 160 characters, a customer-facing
   summary), `phone`, `email`, `address`, `hours`, `colours`, and `schemaType` (`Restaurant` for a
   restaurant; `CafeOrCoffeeShop`, `BarOrPub`, `Bakery`, `Store`, `HairSalon`, `BeautySalon`,
   `AutoRepair`, or the general `LocalBusiness`). Leave `url` empty until they have a web address.
   For a restaurant also set `cuisine`.
5. Rewrite each file in `content/pages/` in their voice: replace every sample sentence. Keep the front
   matter keys; give every page a real 70 to 160 character `description`. Delete pages they do not want
   (and remove the menu page if it is not a restaurant).
6. If they gave a menu, use the `add-my-menu` skill. If they have photos, use `add-photos`.
7. Start the preview with `npm run dev` (background) and tell them to open http://localhost:8787.
8. Run `npm run check`. Fix every ERROR. Mention any "still has sample text" warning and fix it.
9. Ask if they want to put it online now. If yes, use the `deploy` skill.

Hours format in `content/site.json`: `{ "days": ["Tuesday","Wednesday"], "opens": "07:00", "closes": "15:00" }`
(24-hour times), and `{ "days": ["Monday"], "closed": true }` for closed days. Every day should appear.
