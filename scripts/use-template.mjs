/* =====================================================================
   USE-TEMPLATE - start your site from one of the three starting points.

   What it does: replaces everything in content/ with the files from
   templates/<name>/ (restaurant, business or blank). Your old content/ is
   moved to .content-backup/ first, so nothing is lost.

   How to use:  npm run template -- restaurant     (or business, or blank)
   Claude runs this for you when you say "set up my site".

   Depends on: Node 20+ only.
   ===================================================================== */

import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = readdirSync(join(root, "templates"));
const name = process.argv[2];
if (!names.includes(name)) {
  console.error(`Pick one of: ${names.join(", ")}\nExample: npm run template -- restaurant`);
  process.exit(1);
}
const content = join(root, "content");
if (existsSync(content)) {
  const backup = join(root, ".content-backup");
  rmSync(backup, { recursive: true, force: true });
  renameSync(content, backup);
}
mkdirSync(content, { recursive: true });
cpSync(join(root, "templates", name), content, { recursive: true });
console.log(`content/ now holds the "${name}" template (your previous files are in .content-backup/).`);
