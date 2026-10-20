---
name: add-my-menu
description: Add or change a restaurant menu. Use when the owner pastes a menu, sends a photo or PDF of one, or asks to change a dish or a price.
---

# Add my menu

The menu lives in `content/menu.json`, and the Menu page is `content/pages/menu.md` (it must have
`layout: menu` at the top; it shows the intro text from the file and then every section of the menu).

1. Read what they gave you (pasted text, a photo or a PDF in the folder). If a price or dish name is
   unclear, ask. Never guess a price.
2. Write `content/menu.json` in this shape:

   ```json
   { "sections": [
     { "title": "Breakfast", "note": "Served until 11", "items": [
       { "name": "Two Egg Plate", "description": "Eggs your way, hash browns, toast.", "price": "$9" }
     ] }
   ] }
   ```

   `note` and `description` are optional. Keep prices as text exactly as printed ("$9", "$9.50", "MP").
   Group dishes the way their printed menu does.
3. For "change the price of X" or "remove Y", edit only that item.
4. If there is no menu page yet, create `content/pages/menu.md` with `title: Menu`, a 70 to 160 character
   `description`, `layout: menu`, `order: 10`.
5. If the business is not a restaurant and wants a price list, use the same file and page and rename the
   page title ("Price list"); the layout works for any list of items with prices.
6. Run `npm run check`, then tell them to look at http://localhost:8787/menu/.
