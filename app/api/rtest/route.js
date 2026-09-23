import { sendMail } from "../../../lib/resend";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    const u = new URL(req.url);
    if (u.searchParams.get("k") !== "dpp-r-9021") return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
    const to = u.searchParams.get("to") || "dema2910@gmail.com";
    try {
          const r = await sendMail({ to, subject: "Prueba remitente contacto (Resend)", text: "prueba", html: "<p>Prueba: debe salir de contacto@ via Resend.</p>", fromName: "Departamentos en Pozo" });
          return Response.json({ ok: true, id: r.id || null });
        } catch (e) {
          return Response.json({ ok: false, error: String((e && e.message) || e) }, { status: 502 });
        }
  }
