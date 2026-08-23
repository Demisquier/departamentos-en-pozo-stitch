// Route Handler de leads del formulario de /contacto. Corre server-side en Vercel (sin CORS).
// Envía cada lead a DOS destinos, en paralelo y best-effort:
//   (1) Google Sheet "Leads - Departamentos en Pozo" (webhook Apps Script, cuenta dema2910).
//   (2) Email vía Formsubmit (a dema2910 + cc contacto@).
// (Antes apuntaba al WordPress que se dio de baja en la migración → estaba roto.)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHEET_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbyITcB1Ob6drt8Kfh_WnWbNeD02GxjH5pkBYJGFrfKwUOh_c158KXHGxyUk3rXmxvLy0w/exec";
const MAIL_URL = "https://formsubmit.co/ajax/dema2910@gmail.com";

export async function POST(req) {
  let data;
  try {
    data = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot anti-spam: si viene relleno, fingimos éxito y no guardamos nada.
  if (data && data._gotcha) return Response.json({ ok: true });

  const nombre = (data?.nombre || "").toString().trim();
  const apellido = (data?.apellido || "").toString().trim();
  const email = (data?.email || "").toString().trim();
  const whatsapp = (data?.whatsapp || data?.telefono || "").toString().trim();
  const mensaje = (data?.mensaje || "").toString().trim();
  const proyecto = (data?.proyecto || "").toString().trim();
  const origen = (data?.origen || "web").toString().trim();

  // Requerimos nombre + al menos un medio de contacto.
  if (!nombre || (!email && !whatsapp)) {
    return Response.json({ ok: false, error: "missing_fields" }, { status: 422 });
  }

  const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");

  // (1) Fila en el Google Sheet. Content-Type text/plain para que Apps Script no exija preflight.
  const sheetBody = JSON.stringify({
    origen,
    tipo: "Contacto (form)",
    nombre: nombreCompleto,
    email,
    whatsapp,
    proyecto,
    zonas: "",
    ambientes: "",
    presupuesto: "",
    mensaje,
  });

  // (2) Notificación por email (Formsubmit).
  const mailBody = JSON.stringify({
    _subject: proyecto ? `Nuevo contacto · ${proyecto}` : "Nuevo contacto (web)",
    _template: "table",
    _captcha: "false",
    _cc: "contacto@departamentosenpozo.com.ar",
    Nombre: nombreCompleto,
    Email: email || "—",
    WhatsApp: whatsapp || "—",
    Proyecto: proyecto || "—",
    Mensaje: mensaje || "—",
    Origen: origen,
  });

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const results = await Promise.allSettled([
      fetch(SHEET_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: sheetBody,
        signal: ctrl.signal,
      }),
      fetch(MAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: mailBody,
        signal: ctrl.signal,
      }),
    ]);
    clearTimeout(t);
    const anyOk = results.some((r) => r.status === "fulfilled");
    return Response.json({ ok: anyOk }, { status: anyOk ? 200 : 502 });
  } catch {
    return Response.json({ ok: false, error: "network" }, { status: 502 });
  }
}
