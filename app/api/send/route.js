// app/api/send/route.js — Endpoint interno para enviar mails DESDE contacto@ (Resend).
// Lo llama el Apps Script (server-to-server). Protegido con un secreto compartido (MAIL_SECRET).
// Body: { secret, to, subject, html?, text?, replyTo?, bcc?, fromName?, unsubscribe? }
//   unsubscribe (opcional):
//     • "https://…/api/email/baja/?e=…&t=…" → se usa tal cual.
//     • true → el server arma el link firmado para `to` (urlBaja(to)).
//   Con unsubscribe: headers List-Unsubscribe: <url>, <mailto:contacto@…?subject=BAJA> y
//   List-Unsubscribe-Post: List-Unsubscribe=One-Click (RFC 8058). Sin él: comportamiento histórico.
import { sendMail } from "../../../lib/resend";
import { urlBaja } from "../../../lib/emailBaja";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  // Auth: solo quien tenga el secreto (el Apps Script) puede disparar envíos.
  if (!process.env.MAIL_SECRET || b.secret !== process.env.MAIL_SECRET) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const to = (b.to || "").toString().trim();
  if (!to || to.indexOf("@") < 0) return Response.json({ ok: false, error: "no_to" }, { status: 422 });

  let unsubscribe = "";
  if (b.unsubscribe === true || b.unsubscribe === "true" || b.unsubscribe === 1) unsubscribe = urlBaja(to);
  else if (typeof b.unsubscribe === "string" && /^https:\/\//i.test(b.unsubscribe.trim())) unsubscribe = b.unsubscribe.trim();

  try {
    const r = await sendMail({
      to,
      subject: b.subject || "",
      html: b.html || "",
      text: b.text || "",
      replyTo: b.replyTo,
      bcc: b.bcc,
      fromName: b.fromName,
      unsubscribe: unsubscribe || undefined,
    });
    return Response.json({ ok: true, id: r.id || null, unsubscribe: unsubscribe || null });
  } catch (e) {
    return Response.json({ ok: false, error: "send_failed", detail: String((e && e.message) || e) }, { status: 502 });
  }
}
