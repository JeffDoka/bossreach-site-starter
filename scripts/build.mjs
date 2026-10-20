/* =====================================================================
   BUILD - turns the plain files in content/ into the finished site in dist/.

   What it does: reads content/site.json (the business's facts), content/menu.json
   (optional) and every content/pages/*.md, and writes one HTML page per Markdown
   file, plus styles.css, sitemap.xml, robots.txt, a favicon and a 404 page. Files
   in public/ (photos, a logo) are copied across untouched.

   How to use: `npm run build`. You rarely need to: `npm run dev` and
   `npm run deploy` run it for you (see "build" in wrangler.jsonc).

   Depends on: Node 20+ only. No packages. Also imported by scripts/check.mjs.
   ===================================================================== */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- Markdown: the small subset that is enough for a business site ---------- */

function inline(text) {
  let t = esc(text);
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async">');
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  return t;
}

export function markdown(src) {
  const out = [];
  let para = [];
  let list = null; // { tag, items }
  const flushPara = () => { if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`); para = []; };
  const flushList = () => { if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`); list = null; };
  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = /^(#{2,4})\s+(.*)$/.exec(line))) { flushPara(); flushList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    if (/^---+$/.test(line)) { flushPara(); flushList(); out.push("<hr>"); continue; }
    if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) { flushPara(); if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; } list.items.push(m[1]); continue; }
    if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) { flushPara(); if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; } list.items.push(m[1]); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return out.join("\n");
}

/** "---\nkey: value\n---\nbody" -> { meta, body } */
export function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["']|["']$/g, "");
    if (v === "true") v = true; else if (v === "false") v = false; else if (/^-?\d+$/.test(v)) v = Number(v);
    meta[kv[1]] = v;
  }
  return { meta, body: m[2] };
}

/* ---------- hours ---------- */

const time12 = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
};

export function dayRuns(days) {
  const idx = [...new Set(days.map((d) => DAYS.indexOf(d)).filter((i) => i >= 0))].sort((a, b) => a - b);
  const runs = [];
  for (const i of idx) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i); else runs.push([i]);
  }
  return runs.map((r) => (r.length >= 3 ? `${DAYS[r[0]]} to ${DAYS[r[r.length - 1]]}` : r.map((i) => DAYS[i]).join(" and ")));
}

function hoursHtml(hours = []) {
  if (!hours.length) return "";
  const rows = hours.map((h) => {
    const label = dayRuns(h.days || []).join(", ");
    const when = h.closed ? "Closed" : `${time12(h.opens)} to ${time12(h.closes)}`;
    return `<tr><th scope="row">${esc(label)}</th><td>${esc(when)}</td></tr>`;
  });
  return `<table class="hours"><tbody>${rows.join("")}</tbody></table>`;
}

/* ---------- schema.org ---------- */

function schemaOrg(site, origin, hasMenu) {
  const a = site.address || {};
  const data = {
    "@context": "https://schema.org",
    "@type": site.schemaType || "LocalBusiness",
    name: site.name,
    description: site.description,
  };
  if (origin) data.url = origin + "/";
  if (site.phone) data.telephone = site.phone;
  if (site.email) data.email = site.email;
  if (site.priceRange) data.priceRange = site.priceRange;
  if (site.cuisine) data.servesCuisine = site.cuisine;
  if (hasMenu && origin) data.hasMenu = origin + "/menu/";
  if (site.heroImage && origin) data.image = origin + site.heroImage;
  if (a.street) data.address = { "@type": "PostalAddress", streetAddress: a.street, addressLocality: a.city, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.country || "US" };
  const open = (site.hours || []).filter((h) => !h.closed && h.days?.length);
  if (open.length) data.openingHoursSpecification = open.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes }));
  if (site.social?.length) data.sameAs = site.social.map((s) => s.url);
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

/* ---------- pages ---------- */

function menuHtml(menu) {
  return (menu.sections || []).map((s) => `<section class="menu-section"><h2>${esc(s.title)}</h2>${s.note ? `<p class="note">${esc(s.note)}</p>` : ""}<ul class="menu">${(s.items || []).map((i) => `<li><div class="row"><span class="name">${esc(i.name)}</span>${i.price ? `<span class="price">${esc(i.price)}</span>` : ""}</div>${i.description ? `<p>${esc(i.description)}</p>` : ""}</li>`).join("")}</ul></section>`).join("\n");
}

function visitCard(site) {
  const a = site.address || {};
  const addr = [a.street, [a.city, a.region].filter(Boolean).join(", "), a.postalCode].filter(Boolean).join(" ");
  const maps = addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.name + " " + addr)}` : "";
  return `<section class="visit"><div><h2>Visit us</h2>${addr ? `<p>${esc(a.street || "")}<br>${esc([a.city, a.region].filter(Boolean).join(", "))} ${esc(a.postalCode || "")}</p>` : ""}${site.phone ? `<p><a href="tel:${esc(site.phone.replace(/[^\d+]/g, ""))}">${esc(site.phone)}</a></p>` : ""}${maps ? `<p><a href="${esc(maps)}">Get directions</a></p>` : ""}</div><div><h2>Hours</h2>${hoursHtml(site.hours)}</div></section>`;
}

function contactForm() {
  return `<section class="contact-form"><h2>Send us a message</h2><div id="form-note" data-note></div>
<form method="post" action="/api/contact">
<label>Your name<input name="name" autocomplete="name" required maxlength="120"></label>
<label>Your email<input name="email" type="email" autocomplete="email" required maxlength="200"></label>
<label>Phone (optional)<input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>
<label>Your message<textarea name="message" rows="5" required maxlength="4000"></textarea></label>
<div class="trap" aria-hidden="true"><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
<button type="submit" class="btn">Send message</button>
</form></section>`;
}

const FORM_NOTES = {
  sent: '<p class="notice ok" role="status">Thank you. Your message is on its way and we will get back to you soon.</p>',
  setup: '<p class="notice" role="status">The message form is not switched on yet. Please call us instead.</p>',
  error: '<p class="notice" role="alert">Sorry, that did not go through. Please check your email address and message, or call us.</p>',
};
const FORM_NOTE_SCRIPT = `<script>(function(){var m={sent:${JSON.stringify(FORM_NOTES.sent)},setup:${JSON.stringify(FORM_NOTES.setup)},error:${JSON.stringify(FORM_NOTES.error)}};var s=new URLSearchParams(location.search).get("form");var n=document.getElementById("form-note");if(n&&m[s])n.innerHTML=m[s];})();</script>`;

function puzzleBlock(site) {
  const p = site.puzzle;
  if (!p || !p.enabled || !p.url) return "";
  return `<section class="puzzle"><h2>${esc(p.title || "Take a break")}</h2><iframe src="${esc(p.url)}" title="${esc(p.title || "Puzzle")}" loading="lazy" width="100%" height="520" style="border:0;max-width:640px"></iframe><p class="note"><a href="https://bossfeed.fun/">More puzzles at bossfeed.fun</a></p></section>`;
}

function layout({ site, page, bodyHtml, nav, origin, css }) {
  const isHome = page.slug === "";
  const title = isHome ? `${site.name}${site.tagline ? " | " + site.tagline : ""}` : `${page.meta.title} | ${site.name}`;
  const desc = page.meta.description || site.description || "";
  const canonical = origin ? `${origin}${page.slug ? "/" + page.slug : ""}/` : "";
  const ogImage = site.heroImage && origin ? origin + site.heroImage : "";
  const navHtml = nav.map((n) => `<a href="${n.href}"${n.slug === page.slug ? ' aria-current="page"' : ""}>${esc(n.title)}</a>`).join("");
  const credit = site.showBuiltWith === false ? "" : ' <span class="credit">&middot; <a href="https://bossreach.io/websites">Built with Bossreach</a></span>';
  const social = (site.social || []).map((s) => `<a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a>`).join(" &middot; ");
  return `<!doctype html>
<html lang="${esc(site.language || "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="${esc(site.colours?.primary || "#1f3a5f")}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ""}${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ""}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${css}</style>
${isHome ? schemaOrg(site, origin, nav.some((n) => n.slug === "menu")) : ""}
</head>
<body class="t-${esc(site.template || "blank")}">
<a class="skip" href="#main">Skip to content</a>
<header class="top"><a class="brand" href="/">${site.logo ? `<img src="${esc(site.logo)}" alt="" width="40" height="40">` : ""}<span>${esc(site.name)}</span></a><nav aria-label="Main">${navHtml}</nav></header>
<main id="main">
${bodyHtml}
</main>
<footer class="foot"><p>&copy; ${new Date().getFullYear()} ${esc(site.name)}${credit}</p>${social ? `<p>${social}</p>` : ""}</footer>
${page.meta.layout === "contact" && site.contactForm ? FORM_NOTE_SCRIPT : ""}
</body>
</html>
`;
}

export function build({ quiet = false } = {}) {
  const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
  const site = read("content/site.json");
  const menu = existsSync(join(ROOT, "content/menu.json")) ? read("content/menu.json") : null;
  const origin = site.url ? String(site.url).replace(/\/+$/, "") : "";
  const dist = join(ROOT, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  if (existsSync(join(ROOT, "public"))) cpSync(join(ROOT, "public"), dist, { recursive: true });

  const t = site.template || "blank";
  const themeDir = join(ROOT, "theme");
  const themeFile = join(themeDir, `${t}.css`);
  const c = { primary: "#1f3a5f", accent: "#c8553d", background: "#fffdf8", text: "#222222", ...(site.colours || {}) };
  const vars = `:root{--primary:${c.primary};--accent:${c.accent};--bg:${c.background};--text:${c.text}}`;
  const css = (vars + readFileSync(join(themeDir, "base.css"), "utf8") + (existsSync(themeFile) ? readFileSync(themeFile, "utf8") : ""))
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*\n\s*/g, "").replace(/\s*([{};:,])\s*/g, "$1");
  writeFileSync(join(dist, "styles.css"), css);
  const inlineCss = css; // inlined into each page: one request, no render blocking

  const pagesDir = join(ROOT, "content/pages");
  const pages = readdirSync(pagesDir).filter((f) => f.endsWith(".md")).map((f) => {
    const { meta, body } = frontMatter(readFileSync(join(pagesDir, f), "utf8"));
    const base = f.replace(/\.md$/, "");
    const slug = base === "index" ? "" : (meta.slug || base);
    return { slug, meta: { title: meta.title || base, nav: meta.nav !== false, order: Number(meta.order ?? 50), layout: meta.layout || "default", ...meta }, body };
  }).sort((a, b) => a.meta.order - b.meta.order);
  const nav = pages.filter((p) => p.meta.nav && p.slug !== "").map((p) => ({ slug: p.slug, title: p.meta.navTitle || p.meta.title, href: `/${p.slug}/` }));
  nav.unshift({ slug: "", title: "Home", href: "/" });

  const urls = [];
  for (const page of pages) {
    const intro = markdown(page.body);
    let bodyHtml;
    if (page.slug === "") {
      const hero = `<section class="hero">${site.heroImage ? `<img src="${esc(site.heroImage)}" alt="${esc(site.heroAlt || site.name)}" fetchpriority="high">` : ""}<div class="hero-text"><h1>${esc(site.name)}</h1>${site.tagline ? `<p class="tagline">${esc(site.tagline)}</p>` : ""}<p class="actions">${site.primaryButton ? `<a class="btn" href="${esc(site.primaryButton.url)}">${esc(site.primaryButton.label)}</a>` : ""}${site.phone ? `<a class="btn ghost" href="tel:${esc(site.phone.replace(/[^\d+]/g, ""))}">Call ${esc(site.phone)}</a>` : ""}</p></div></section>`;
      const cards = site.highlights?.length ? `<section class="cards">${site.highlights.map((h) => `<article><h2>${esc(h.title)}</h2><p>${esc(h.text)}</p></article>`).join("")}</section>` : "";
      bodyHtml = `${hero}<div class="wrap">${intro}</div>${cards}<div class="wrap">${visitCard(site)}${puzzleBlock(site)}</div>`;
    } else if (page.meta.layout === "menu" && menu) {
      bodyHtml = `<div class="wrap"><h1>${esc(page.meta.title)}</h1>${intro}${menuHtml(menu)}</div>`;
    } else if (page.meta.layout === "contact") {
      bodyHtml = `<div class="wrap"><h1>${esc(page.meta.title)}</h1>${intro}${visitCard(site)}${site.contactForm ? contactForm() : ""}</div>`;
    } else {
      bodyHtml = `<div class="wrap"><h1>${esc(page.meta.title)}</h1>${intro}</div>`;
    }
    const html = layout({ site, page, bodyHtml, nav, origin, css: inlineCss });
    const outDir = page.slug ? join(dist, page.slug) : dist;
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    urls.push(`${origin}${page.slug ? "/" + page.slug : ""}/`);
  }

  writeFileSync(join(dist, "404.html"), layout({ site, page: { slug: "404", meta: { title: "Page not found", description: "That page does not exist." } }, bodyHtml: '<div class="wrap"><h1>Page not found</h1><p>Sorry, we could not find that page. <a href="/">Go to the home page</a>.</p></div>', nav, origin, css: inlineCss }));
  if (!existsSync(join(dist, "favicon.svg"))) {
    const letter = esc((site.name || "S").trim().charAt(0).toUpperCase());
    writeFileSync(join(dist, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${esc(c.primary)}"/><text x="32" y="44" font-family="Georgia,serif" font-size="36" text-anchor="middle" fill="#fff">${letter}</text></svg>`);
  }
  if (origin) {
    writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(u)}</loc></url>`).join("\n")}\n</urlset>\n`);
    writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  } else {
    writeFileSync(join(dist, "robots.txt"), "User-agent: *\nAllow: /\n");
  }
  writeFileSync(join(dist, "_headers"), "/images/*\n  Cache-Control: public, max-age=86400\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n");
  if (!quiet) console.log(`Built ${pages.length} page(s) into dist/`);
  return { site, pages, dist };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) build();
