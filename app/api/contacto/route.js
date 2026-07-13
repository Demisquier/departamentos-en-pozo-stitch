// Route Handler de leads: recibe el POST del form de /contacto y lo reenvía a
// WordPress (endpoint del mu-plugin) que lo guarda en el CPT `lead` + notifica por email.
// Corre server-side en Vercel → llama a cms.* server-to-server (sin CORS).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WP_HOST = process.env.WP_HOST || "cms.departamentosenpozo.com.ar";
const LEAD_URL = `https://${WP_HOST}/wp-json/pozo/v1/lead`;

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
  const email = (data?.email || "").toString().trim();
  const whatsapp = (data?.whatsapp || data?.telefono || "").toString().trim();

  // Requerimos nombre + al menos un medio de contacto.
  if (!nombre || (!email && !whatsapp)) {
    return Response.json({ ok: false, error: "missing_fields" }, { status: 422 });
  }

  const payload = {
    nombre,
    apellido: (data?.apellido || "").toString().trim(),
    email,
    whatsapp,
    mensaje: (data?.mensaje || "").toString().trim(),
    proyecto: (data?.proyecto || "").toString().trim(),
    origen: (data?.origen || "web").toString().trim(),
  };

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(LEAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pozo-Secret": process.env.POZO_LEAD_SECRET || "",
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      return Response.json({ ok: false, error: "wp_error" }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "network" }, { status: 502 });
  }
}
