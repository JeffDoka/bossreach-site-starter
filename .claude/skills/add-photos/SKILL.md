---
name: add-photos
description: Add photos or a logo to the site, resized so it stays fast. Use when the owner has photos of the place or food, a logo, or says "add a picture".
---

# Add photos

Photos go in `public/images/`.

1. Find the files the owner put in the folder. Move them into `public/images/` with short lowercase
   names (`front-door.jpg`).
2. Shrink anything over 300 KB or wider than 2400 pixels. One way that needs no install:
   `npx --yes sharp-cli -i public/images/front-door.jpg -o public/images/ -f webp -q 80 resize 1600`
   This writes `front-door.webp`; delete the big original afterwards so it is not published. If that tool
   fails, tell the owner plainly and ask them to export a smaller copy from their phone or Photos app.
3. Use them:
   - Big picture at the top of the home page: `"heroImage": "/images/front-door.webp"` and a
     `"heroAlt"` describing it ("The front of Joe's Diner on Main Street") in `content/site.json`.
   - Logo: `"logo": "/images/logo.png"` in `content/site.json` (small, about 100 pixels square).
   - In a page: `![Short description](/images/front-door.webp)`.
4. Every picture needs a real description (alt text), not "image" or a file name.
5. Only use photos the owner took or has the right to use. Do not download photos from the internet.
6. Run `npm run check`; it warns about photos that are too big or missing descriptions.
