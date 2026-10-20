---
name: add-a-page
description: Add, edit, reorder or remove a page (catering, events, gallery, FAQ, about). Use when the owner says "add a page for ...".
---

# Add a page

Each page is one Markdown file in `content/pages/`. The file name is the web address: `catering.md`
becomes `/catering/`.

1. Ask what the page should say if you do not know. Never invent facts.
2. Create `content/pages/<short-lowercase-name>.md`:

   ```
   ---
   title: Catering
   description: One or two sentences, 70 to 160 characters, written for a customer searching on Google.
   order: 25
   ---
   Body text here.

   ## A heading

   - A list item
   - Another one

   [Call us](tel:5550100) or [send a message](/contact/).
   ```

   `order` is the position in the top menu (lower comes first; Menu is 10, About 20, Contact 30).
   Add `nav: false` to keep the page out of the menu. A page for the contact details and form uses
   `layout: contact`.
3. Markdown that works: `##` and `###` headings (the title is already the main heading, so do not use
   `#`), lists, **bold**, *italic*, links, and pictures `![what it shows](/images/file.jpg)`.
4. Pictures: use the `add-photos` skill first so they are small enough.
5. To remove a page, delete its file. To rename one, rename the file and tell the owner the old
   address stops working.
6. Run `npm run check` and tell them the preview address, for example http://localhost:8787/catering/.
