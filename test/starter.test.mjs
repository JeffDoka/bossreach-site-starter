/* Tests for the starter: the spam filter, the Markdown subset, hours, and a full build + check of every template.
   Run with `npm test` (Node's built-in test runner; no packages). */

import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { classify } from "../src/form-spam.js";
import { build, markdown, frontMatter, dayRuns, ROOT } from "../scripts/build.mjs";
import { checkHtml, imageWidth } from "../scripts/check.mjs";

test("spam: a normal customer message passes", () => {
  assert.equal(classify({ name: "Pat", email: "pat@gmail.com", message: "Do you have a table for six on Friday?" }).spam, false);
});
test("spam: one pitch phrase alone passes, two are blocked", () => {
  assert.equal(classify({ name: "A", email: "a@b.com", message: "Can I get your price list?" }).spam, false);
  assert.equal(classify({ name: "A", email: "a@b.com", message: "We sell seo packages and backlinks" }).spam, true);
});
test("spam: honeypot blocks", () => {
  assert.equal(classify({ name: "A", email: "a@b.com", message: "hi", honeypot: "x" }).spam, true);
});

test("markdown escapes html and renders the basics", () => {
  const html = markdown("## Hi\n\nSome **bold** <script>x</script> and [a link](/menu/).\n\n- one\n- two");
  assert.match(html, /<h2>Hi<\/h2>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /<a href="\/menu\/">a link<\/a>/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
});
test("front matter parses", () => {
  const { meta, body } = frontMatter("---\ntitle: Menu\norder: 10\nnav: false\n---\nHello");
  assert.deepEqual(meta, { title: "Menu", order: 10, nav: false });
  assert.equal(body, "Hello");
});
test("day runs group consecutive days", () => {
  assert.deepEqual(dayRuns(["Tuesday", "Wednesday", "Thursday", "Sunday"]), ["Tuesday to Thursday", "Sunday"]);
  assert.deepEqual(dayRuns(["Saturday"]), ["Saturday"]);
});

test("check: flags missing title, description and alt text", () => {
  const found = checkHtml("about", "<html><body><h1>x</h1><img src=\"/a.jpg\"></body></html>", {});
  const msgs = found.filter((f) => f.level === "ERROR").map((f) => f.msg).join("|");
  assert.match(msgs, /no title/);
  assert.match(msgs, /no description/);
  assert.match(msgs, /alt text/);
});
test("check: png width is read", () => {
  const b = Buffer.alloc(32); b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(3000, 16);
  assert.equal(imageWidth(b), 3000);
});

for (const name of readdirSync(join(ROOT, "templates"))) {
  test(`template "${name}" builds with no check errors`, () => {
    // build() always reads the real content/, so swap the template in and put the original back afterwards
    const tmp = mkdtempSync(join(tmpdir(), "starter-"));
    const real = join(ROOT, "content");
    cpSync(real, join(tmp, "content"), { recursive: true });
    try {
      rmSync(real, { recursive: true, force: true });
      cpSync(join(ROOT, "templates", name), real, { recursive: true });
      const { pages, dist } = build({ quiet: true });
      assert.ok(pages.length >= 1);
      const home = readFileSync(join(dist, "index.html"), "utf8");
      assert.match(home, /application\/ld\+json/);
      assert.deepEqual(checkHtml("", home, {}).filter((f) => f.level === "ERROR"), []);
    } finally {
      rmSync(real, { recursive: true, force: true });
      cpSync(join(tmp, "content"), real, { recursive: true });
      rmSync(tmp, { recursive: true, force: true });
      build({ quiet: true });
    }
  });
}
