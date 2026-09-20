// app/api/send/route.js — Endpoint interno para enviar mails DESDE contacto@ (SMTP DonWeb).
// Lo llama el Apps Script (server-to-server) en vez de usar el Gmail de dema2910, así el
// remitente real de todo pasa a ser contacto@. Protegido con un secreto compartido (MAIL_SECRET).
// Body: { secret, to, subject, html?, text?, replyTo?, bcc?, fromName? }
import { sendMail } from "../../../lib/mailer";

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

  try {
    const r = await sendMail({
      to,
      subject: b.subject || "",
      html: b.html || "",
      text: b.text || "",
      replyTo: b.replyTo,
      bcc: b.bcc,
      fromName: b.fromName,
    });
    return Response.json({ ok: true, id: r.id || null });
  } catch (e) {
    return Response.json({ ok: false, error: "send_failed", detail: String((e && e.message) || e) }, { status: 502 });
  }
}
