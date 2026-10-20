/* =====================================================================
   FORM SPAM - is this contact-form message a sales pitch, not a customer?

   What it does: scores one submission and says whether it is LIKELY SPAM,
   with the reasons. The worker quietly skips emailing the owner about spam
   (the sender is told it worked, so bots do not adapt).

   Approach (adapted from the Bossreach platform's form filter; this is a
   small standalone copy, not a dependency). Each rule adds points; spam at
   THRESHOLD or more:
     - the hidden trap field is filled in ................ +10
     - each distinct sales phrase ("seo packages", "guest post", "backlinks",
       "first page of google" ...) .......................... +3 (max +9)
     - three or more links ................................. +2 (six or more +5)
     - a message that is mostly Cyrillic or CJK letters ..... +5
     - an email like "bestseorocketdigital@gmail.com" ....... +2
   One phrase alone (3) never blocks a real customer; two signals do.

   How to use: import { classify } from "./form-spam.js";
               const v = classify({ name, email, message, honeypot });
               if (v.spam) { skip the email }

   To tune it: change THRESHOLD or add phrases to PHRASES. Pure: no imports.
   ===================================================================== */

export const THRESHOLD = 5;

const PHRASES = [
  "1st page", "first page of google", "top of google", "google ranking", "seo package", "seo service", "seo expert", "seo company",
  "seo agency", "seo audit", "seo proposal", "price list", "rank your website", "rank higher", "improve your ranking", "boost your ranking",
  "backlink", "guest post", "link building", "sponsored post", "web design services", "website redesign", "web development services",
  "app development services", "lead generation", "generate leads", "increase your traffic", "more traffic to your", "drive traffic",
  "boost your sales", "digital marketing services", "social media marketing", "email marketing services", "special offer", "limited time offer",
  "free audit", "website audit", "search engine optimization", "visibility on google", "online presence", "grow your business online",
  "business loan", "crypto", "forex", "casino", "viagra",
];
const FREE_MAIL = new Set(["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "live.com", "aol.com", "icloud.com", "proton.me", "protonmail.com"]);
const COMPANYISH = /(seo|digital|marketing|agency|rocket|growth|leads|ranking|webservices|softwares?|technologies|consult(?:ing|ancy)|promotion|branding)/;

export function classify({ name = "", email = "", message = "", honeypot = "" } = {}) {
  const reasons = [];
  let score = 0;
  const add = (n, why) => { score += n; reasons.push(`${why} (+${n})`); };
  const text = `${name} ${message}`.slice(0, 20000).toLowerCase().replace(/\s+/g, " ");

  if (String(honeypot).trim()) add(10, "hidden trap field filled in");

  const hits = PHRASES.filter((p) => text.includes(p));
  if (hits.length) add(Math.min(9, hits.length * 3), `sales wording: ${hits.slice(0, 5).join(", ")}`);

  const links = (text.match(/https?:\/\/|www\./g) || []).length;
  if (links >= 6) add(5, "many links"); else if (links >= 3) add(2, "several links");

  const letters = (message.match(/\p{L}/gu) || []).length;
  const foreign = (message.match(/[Ѐ-ӿ぀-ヿ㐀-鿿가-힯]/g) || []).length;
  if (letters >= 10 && foreign / letters > 0.5) add(5, "mostly Cyrillic or CJK letters");

  const e = String(email).trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at > 0 && FREE_MAIL.has(e.slice(at + 1)) && COMPANYISH.test(e.slice(0, at).replace(/[^a-z]/g, ""))) add(2, "company-style words in a free-mail address");

  return { spam: score >= THRESHOLD, score, threshold: THRESHOLD, reasons };
}
