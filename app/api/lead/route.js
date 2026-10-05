// app/api/lead/route.js — Proxy server-side ÚNICO para todos los leads del sitio.
// Antes AlertaCTA / AsesorChat / IntakeChat pegaban DIRECTO (desde el navegador) al
// webhook de Apps Script y a Formsubmit → la URL /exec quedaba expuesta en el bundle y
// cualquiera podía spamear la planilla y disparar mails a las desarrolladoras.
// Ahora el cliente postea acá (mismo origen, sin CORS) y el server reenvía. Suma honeypot
// + rate-limit best-effort. Recibe { sheet?, mail? } y reenvía cada uno tal cual.
import { inmobiliariaDelProyecto } from "../../../lib/inmobiliarias";
import { sendMail, resendReady } from "../../../lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// #6 — Ruteo del lead a la INMOBILIARIA que comercializa el proyecto (en vez de la
// desarrolladora). Resuelve proyectoSlug -> comercializadora -> contacto verificado.
// Gateado por INMO_NOTIFY=1: sin la env var el comportamiento es idéntico al actual
// (el Apps Script sigue ruteando/mandando). Con la flag, además le llega a la inmobiliaria.
// NOTA: hasta redeployar el Apps Script, con la flag ON los proyectos mapeados generan
// doble aviso (inmobiliaria vía este endpoint + dev/contacto@ vía Apps Script).
const INMO_NOTIFY = process.env.INMO_NOTIFY === "1";

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
// Arma el mail del lead para la inmobiliaria a partir del payload sheet.
function leadMailInmo(sheet, inmo) {
  const rows = [
    ["Nombre", sheet.nombre],
    ["WhatsApp", sheet.whatsapp],
    ["Email", sheet.email],
    ["Proyecto", sheet.proyecto],
    ["Interés", sheet.interes],
    ["Origen", sheet.origen],
    ["Mensaje", sheet.mensaje],
  ].filter(([, v]) => v);
  const html =
    '<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;color:#1a1a1a">' +
    "<p>Nuevo lead para <strong>" + esc(sheet.proyecto || "tu proyecto") + "</strong> (lo comercializa " + esc(inmo.nombre) + ").</p>" +
    '<table style="border-collapse:collapse;margin-top:8px">' +
    rows.map(([k, v]) => '<tr><td style="padding:3px 10px 3px 0;color:#666">' + esc(k) + '</td><td style="padding:3px 0"><strong>' + esc(v) + "</strong></td></tr>").join("") +
    "</table>" +
    '<p style="margin-top:12px;color:#666;font-size:13px">Respondé a este mail para contactar al interesado (queda en copia departamentosenpozo.com.ar).</p>' +
    "</div>";
  const text = rows.map(([k, v]) => k + ": " + v).join("\n");
  return { html, text };
}

const SHEET_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbxQYPNfcKOdHuATx7f7XvXKFPJ7eVvmD7EJwJmSqN4C6PXZIauk59dOgwQE3nMlYvZf0Q/exec";
const MAIL_URL = "https://formsubmit.co/ajax/contacto@departamentosenpozo.com.ar";

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
  // #6 — Si el proyecto lo comercializa una inmobiliaria con contacto verificado y la flag
  // INMO_NOTIFY está activa, le mandamos el lead a la inmobiliaria (reply-to = comprador,
  // Bcc a contacto@). Fallback silencioso: si no hay inmobiliaria mapeada/sin email, no hace nada.
  if (INMO_NOTIFY && sheet && resendReady()) {
    const inmo = inmobiliariaDelProyecto(sheet.proyectoSlug);
    if (inmo && inmo.email) {
      const { html, text } = leadMailInmo(sheet, inmo);
      tasks.push(
        sendMail({
          to: inmo.email,
          bcc: "contacto@departamentosenpozo.com.ar",
          replyTo: (sheet.email || "").trim() || undefined,
          subject: "Nuevo lead — " + (sheet.proyecto || "tu proyecto"),
          html,
          text,
          fromName: "Departamentos en Pozo",
        })
      );
    }
  }

  if (false) { // FormSubmit desactivado: el Apps Script (webhook) ya manda 1 solo mail al dev con Bcc a contacto@ (o a contacto@ si el proyecto no está mapeado).
    tasks.push(
      fetch(MAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Referer: "https://departamentosenpozo.com.ar/", Origin: "https://departamentosenpozo.com.ar" },
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
