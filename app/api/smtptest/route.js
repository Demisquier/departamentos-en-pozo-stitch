import { sendMail } from "../../../lib/mailer";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    const u = new URL(req.url);
    if (u.searchParams.get("k") !== "dpp-smtp-check-9021") return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    const to = u.searchParams.get("to") || "dema2910@gmail.com";
    try {
          const r = await sendMail({ to, subject: "Prueba remitente contacto", text: "Prueba SMTP", html: "<p>Prueba de remitente: debe salir de contacto.</p>" });
          return Response.json({ ok: true, id: r.id || null, host: process.env.SMTP_HOST || null, user: process.env.SMTP_USER || null });
        } catch (e) {
          return Response.json({ ok: false, error: String((e && e.message) || e), host: process.env.SMTP_HOST || null, user: process.env.SMTP_USER || null }, { status: 502 });
        }
  }
