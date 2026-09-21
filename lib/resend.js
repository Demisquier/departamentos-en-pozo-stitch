// lib/resend.js - Envio de correo saliente DESDE contacto@ via Resend (HTTP API).
// La API key va en Vercel como RESEND_API_KEY (nunca hardcodeada en el repo).
const FROM_ADDR = "contacto@departamentosenpozo.com.ar";
const API = "https://api.resend.com/emails";

export function resendReady() {
    return !!process.env.RESEND_API_KEY;
  }

export async function sendMail({ to, subject, html, text, replyTo, bcc, cc, fromName }) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY no configurada");
    const addr = process.env.MAIL_FROM || FROM_ADDR;
    const from = (fromName || "Departamentos en Pozo") + " <" + addr + ">";
    const payload = {
          from,
          to: Array.isArray(to) ? to : [to],
          subject: subject || "",
          reply_to: replyTo || FROM_ADDR,
          headers: { "List-Unsubscribe": "<mailto:" + FROM_ADDR + "?subject=BAJA>" },
        };
    if (html) payload.html = html;
    if (text) payload.text = text;
    if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc];
    if (cc) payload.cc = Array.isArray(cc) ? cc : [cc];
    const r = await fetch(API, {
          method: "POST",
          headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("Resend " + r.status + ": " + ((j && (j.message || j.name)) || "error"));
    return { ok: true, id: j && j.id };
  }
