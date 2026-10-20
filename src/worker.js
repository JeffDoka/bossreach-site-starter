/* =====================================================================
   WORKER - serves the site and handles the contact form.

   What it does: every page is a plain file in dist/ that Cloudflare serves
   directly. This Worker only runs for /api/contact: it checks the message,
   drops spam, and emails the owner through the owner's own Cloudflare
   Email Routing. Nothing passes through anyone else.

   Switching the form on needs three things (the "turn-on-contact-form"
   skill walks through them): the send_email block and the CONTACT_* values
   in wrangler.jsonc, and Email Routing turned on for your domain with your
   own address verified. Until then the form says it is not switched on.

   Depends on: ./form-spam.js and Cloudflare's built-in "cloudflare:email".
   ===================================================================== */

import { EmailMessage } from "cloudflare:email";
import { classify } from "./form-spam.js";

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/** header values may never contain a line break (that is how mail headers get injected) */
const oneLine = (s) => String(s ?? "").replace(/[\r\n]+/g, " ").trim();
const toBase64 = (s) => {
  let bin = "";
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
};

function buildMail({ from, to, siteName, name, email, phone, message }) {
  const domain = from.split("@")[1];
  const subject = `New message from ${oneLine(name).slice(0, 80)} (${oneLine(siteName)})`;
  const body = `Name: ${oneLine(name)}\nEmail: ${oneLine(email)}\nPhone: ${oneLine(phone) || "(not given)"}\n\n${message}\n\nSent from the contact form on your website. Reply to this email to answer them.`;
  return [
    `From: ${oneLine(siteName).replace(/[<>"]/g, "")} website <${from}>`,
    `To: ${to}`,
    `Reply-To: ${oneLine(email)}`,
    `Subject: =?UTF-8?B?${toBase64(subject)}?=`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    toBase64(body).replace(/.{1,76}/g, "$&\r\n"),
  ].join("\r\n");
}

async function handleContact(request, env) {
  const back = (state) => Response.redirect(new URL(`${env.CONTACT_PAGE || "/contact/"}?form=${state}`, request.url).toString(), 303);
  if ((Number(request.headers.get("content-length")) || 0) > 20000) return back("error");
  let form;
  try { form = await request.formData(); } catch { return back("error"); }
  const get = (k, max) => String(form.get(k) ?? "").slice(0, max).trim();
  const name = get("name", 120), email = get("email", 200), phone = get("phone", 40), message = get("message", 4000), honeypot = get("website", 200);

  if (honeypot) return back("sent"); // a bot: tell it that it worked
  if (!name || !message || !EMAIL_RE.test(email)) return back("error");
  if (classify({ name, email, message, honeypot }).spam) return back("sent"); // spam: skip the email, say nothing

  if (!env.MAIL || !env.CONTACT_TO || !env.CONTACT_FROM) return back("setup");
  try {
    const raw = buildMail({ from: env.CONTACT_FROM, to: env.CONTACT_TO, siteName: env.SITE_NAME || "Your", name, email, phone, message });
    await env.MAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
  } catch (err) {
    console.error("contact form send failed:", err && err.message);
    return back("error");
  }
  return back("sent");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return new Response("Use the form on the contact page.", { status: 405, headers: { allow: "POST" } });
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
