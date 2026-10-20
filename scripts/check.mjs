/* =====================================================================
   CHECK - is the site ready for Google and for visitors?

   What it does: builds the site, then looks at every page and every photo and
   reports in plain words:
     ERROR  something that will hurt you (no title, no description, no business
            details for Google, a photo missing its description for screen readers)
     WARN   worth fixing (text still reads like the sample, a photo that is too big)
   Exit code 1 only when there is an ERROR, so `npm run deploy` stops on those.

   Checks: page title and description length, one main heading, the schema.org
   business data Google reads (name, address, phone, opening hours), alt text on
   every image, the sitemap and canonical address, leftover sample text, and
   photos in public/images (file size, and width for PNG and JPEG).

   How to use: `npm run check`   (add --errors-only to hide the warnings)
   Tune the limits in LIMITS below.

   Depends on: Node 20+ only, and ./build.mjs.
   ===================================================================== */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, build } from "./build.mjs";

export const LIMITS = {
  titleMin: 15, titleMax: 65,
  descMin: 70, descMax: 160,
  imageWarnBytes: 300 * 1024, imageErrorBytes: 2 * 1024 * 1024,
  imageMaxWidth: 2400,
};

const SAMPLE = /(sample diner|sample services|sampleville|\(555\) 010|example\.com|123 main street|lorem ipsum|my business|todo|your business here)/i;

const attr = (tag, name) => new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag)?.[1];

export function checkHtml(slug, html, site) {
  const out = [];
  const at = slug ? `/${slug}/` : "/";
  const err = (m) => out.push({ level: "ERROR", where: at, msg: m });
  const warn = (m) => out.push({ level: "WARN", where: at, msg: m });

  const title = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  if (!title) err("This page has no title. Google shows the title in search results.");
  else if (title.length < LIMITS.titleMin) warn(`The title is short (${title.length} letters). Aim for ${LIMITS.titleMin} to ${LIMITS.titleMax}.`);
  else if (title.length > LIMITS.titleMax) warn(`The title is long (${title.length} letters) and Google will cut it off. Aim for ${LIMITS.titleMin} to ${LIMITS.titleMax}.`);

  const desc = /<meta name="description" content="([^"]*)"/i.exec(html)?.[1]?.trim() ?? "";
  if (!desc) err("This page has no description. Write one or two sentences about the page.");
  else if (desc.length < LIMITS.descMin) warn(`The description is short (${desc.length} letters). Aim for ${LIMITS.descMin} to ${LIMITS.descMax}.`);
  else if (desc.length > LIMITS.descMax) warn(`The description is long (${desc.length} letters) and Google will cut it off. Aim for ${LIMITS.descMin} to ${LIMITS.descMax}.`);

  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) warn(`The page has ${h1s} main headings (h1). It should have exactly one.`);

  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const alt = attr(tag, "alt");
    const src = attr(tag, "src") ?? "";
    if (alt === undefined) err(`A picture (${src}) has no description (alt text). Screen readers and Google need one.`);
    else if (alt.trim() === "" && !/class="?decor/.test(tag) && !/logo/i.test(src)) warn(`A picture (${src}) has empty alt text. Describe what it shows.`);
  }

  if (slug === "") {
    const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i.exec(html)?.[1];
    if (!ld) err("The home page has no business data for Google (schema.org).");
    else {
      let data;
      try { data = JSON.parse(ld); } catch { data = null; }
      if (!data) err("The business data on the home page is broken.");
      else {
        if (!data["@type"]) err("The business data has no type (for example Restaurant or LocalBusiness).");
        if (!data.name) err("The business data has no name.");
        if (!data.address?.streetAddress) warn("Add your street address in content/site.json so Google can show you on the map.");
        if (!data.telephone) warn("Add your phone number in content/site.json.");
        if (!data.openingHoursSpecification) warn("Add your opening hours in content/site.json.");
        if (!data.url) warn('Set "url" in content/site.json to your real address (for example https://joesdiner.com) once you have it.');
      }
    }
    if (!/<link rel="canonical"/i.test(html)) warn('No canonical address yet. It appears when you set "url" in content/site.json.');
  }
  const sample = SAMPLE.exec(html);
  if (sample && slug !== "404") warn(`Still has sample text ("${sample[0]}"). Replace it with your own details.`);
  return out;
}

/** width of a PNG or JPEG from its header; null when unknown (WebP, GIF, SVG, damaged) */
export function imageWidth(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return buf.readUInt32BE(16);
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return buf.readUInt16BE(i + 7);
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

export function checkImages(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const ext = extname(f).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) continue;
    const p = join(dir, f);
    const size = statSync(p).size;
    const kb = Math.round(size / 1024);
    if (size > LIMITS.imageErrorBytes) out.push({ level: "ERROR", where: `images/${f}`, msg: `This photo is ${kb} KB, which will make your site slow on phones. Ask Claude to shrink it.` });
    else if (size > LIMITS.imageWarnBytes) out.push({ level: "WARN", where: `images/${f}`, msg: `This photo is ${kb} KB. Under ${LIMITS.imageWarnBytes / 1024} KB is best. Ask Claude to shrink it.` });
    const w = [".jpg", ".jpeg", ".png"].includes(ext) ? imageWidth(readFileSync(p)) : null;
    if (w && w > LIMITS.imageMaxWidth) out.push({ level: "WARN", where: `images/${f}`, msg: `This photo is ${w} pixels wide. Nobody needs more than ${LIMITS.imageMaxWidth}. Ask Claude to resize it.` });
  }
  return out;
}

export function runChecks() {
  const { site, pages, dist } = build({ quiet: true });
  const results = [];
  for (const p of pages) {
    const file = join(dist, p.slug, "index.html");
    results.push(...checkHtml(p.slug, readFileSync(file, "utf8"), site));
  }
  results.push(...checkImages(join(ROOT, "public", "images")));
  const wr = readFileSync(join(ROOT, "wrangler.jsonc"), "utf8");
  if (site.contactForm && !/^\s*"send_email"/m.test(wr)) results.push({ level: "WARN", where: "contact form", msg: "The contact form is on but not connected to your email yet. Ask Claude to \"turn on the contact form\"." });
  if (site.url && !existsSync(join(dist, "sitemap.xml"))) results.push({ level: "ERROR", where: "/sitemap.xml", msg: "No sitemap was made." });
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errorsOnly = process.argv.includes("--errors-only");
  const results = runChecks();
  const shown = errorsOnly ? results.filter((r) => r.level === "ERROR") : results;
  for (const r of shown) console.log(`${r.level.padEnd(5)} ${r.where}  ${r.msg}`);
  const errors = results.filter((r) => r.level === "ERROR").length;
  const warns = results.length - errors;
  console.log(errors ? `\n${errors} problem(s) to fix${errorsOnly ? "" : `, ${warns} suggestion(s)`}.` : `\nNo problems found${errorsOnly ? "" : `, ${warns} suggestion(s)`}.`);
  process.exit(errors ? 1 : 0);
}
