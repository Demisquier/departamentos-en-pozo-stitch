// app/api/lead/route.js — Proxy server-side ÚNICO para todos los leads del sitio.
// Antes AlertaCTA / AsesorChat / IntakeChat pegaban DIRECTO (desde el navegador) al
// webhook de Apps Script y a Formsubmit → la URL /exec quedaba expuesta en el bundle y
// cualquiera podía spamear la planilla y disparar mails a las desarrolladoras.
// Ahora el cliente postea acá (mismo origen, sin CORS) y el server reenvía. Suma honeypot
// + rate-limit best-effort. Recibe { sheet?, mail? } y reenvía cada uno tal cual.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHEET_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbyITcB1Ob6drt8Kfh_WnWbNeD02GxjH5pkBYJGFrfKwUOh_c158KXHGxyUk3rXmxvLy0w/exec";
const MAIL_URL = "https://formsubmit.co/ajax/dema2910@gmail.com";

// Rate-limit best-effort en memoria (por instancia serverless). No es infalible (las
// instancias son efímeras) pero corta ráfagas de spam sin infra extra.
const HITS = new Map();
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 8;
function limited(ip) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 5000) HITS.clear();
  return arr.length > MAX_PER_WINDOW;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: si viene relleno (bot), fingimos éxito y no hacemos nada.
  if (body && (body._gotcha || (body.sheet && body.sheet._gotcha))) {
    return Response.json({ ok: true });
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "0";
  if (limited(ip)) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const sheet = body && typeof body.sheet === "object" ? body.sheet : null;
  const mail = body && typeof body.mail === "object" ? body.mail : null;
  if (!sheet && !mail) return Response.json({ ok: false, error: "empty" }, { status: 422 });

  // Validación mínima: un lead de contacto necesita al menos email o whatsapp.
  const email = ((sheet && sheet.email) || (mail && (mail.Email || mail._replyto)) || "").toString().trim();
  const whatsapp = ((sheet && sheet.whatsapp) || (mail && mail.WhatsApp) || "").toString().trim();
  const isIntake = sheet && sheet.tipo === "intake"; // dev cargando proyecto: no exige contacto de comprador
  if (!isIntake && !email && !whatsapp) {
    return Response.json({ ok: false, error: "missing_contact" }, { status: 422 });
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  const tasks = [];
  if (sheet) {
    tasks.push(
      fetch(SHEET_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(sheet),
        signal: ctrl.signal,
      })
    );
  }
  if (mail) {
    tasks.push(
      fetch(MAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(mail),
        signal: ctrl.signal,
      })
    );
  }

  try {
    const results = await Promise.allSettled(tasks);
    clearTimeout(t);
    const anyOk = results.some((r) => r.status === "fulfilled");
    return Response.json({ ok: anyOk }, { status: anyOk ? 200 : 502 });
  } catch {
    clearTimeout(t);
    return Response.json({ ok: false, error: "network" }, { status: 502 });
  }
}
