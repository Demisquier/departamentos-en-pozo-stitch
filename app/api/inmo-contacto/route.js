// app/api/inmo-contacto/route.js — "Cargá el contacto de esta inmobiliaria una sola vez".
// El link llega en tu copia interna del lead, firmado con HMAC (MAIL_SECRET): sólo quien tiene
// el mail puede usarlo. Guarda en la pestaña ContactosInmo (Estado = aprobado) y desde ese
// momento todos los leads de esa inmobiliaria se rutean directo.
import { sheetsReady, ensureTab, appendRow } from "../../../lib/googleSheets";
import { TAB_CONTACTOS, HEAD_CONTACTOS, invalidateLearned } from "../../../lib/leadRouting";
import { firmar } from "../../../lib/leadPipeline";
import { sendMail, resendReady } from "../../../lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const page = (body) => new Response(
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
  '<title>Cargar contacto</title><body style="font-family:Arial,sans-serif;max-width:460px;margin:40px auto;padding:0 16px;color:#1c2431">' + body + "</body>",
  { headers: { "Content-Type": "text/html; charset=utf-8" } });

function valido(n, t) { return n && t && t === firmar(n); }

export async function GET(req) {
  const u = new URL(req.url);
  const n = u.searchParams.get("n") || "", t = u.searchParams.get("t") || "", p = u.searchParams.get("p") || "";
  const e0 = u.searchParams.get("e") || "", w0 = u.searchParams.get("w") || ""; // prefill (alta desde "Soy inmobiliaria")
  if (!valido(n, t)) return page("<p>Link inválido o vencido.</p>");
  return page(
    "<h2 style=\"color:#0f1f3d\">Contacto de " + esc(n) + "</h2>" +
    "<p style=\"color:#5b6675;font-size:14px\">Lo cargás una vez y todos los leads de sus proyectos le llegan directo" + (p ? " (empezando por " + esc(p) + ")" : "") + ".</p>" +
    '<form method="post" style="display:grid;gap:10px">' +
    '<input type="hidden" name="n" value="' + esc(n) + '"><input type="hidden" name="t" value="' + esc(t) + '"><input type="hidden" name="p" value="' + esc(p) + '">' +
    '<label>Email comercial<br><input name="email" type="email" required value="' + esc(e0) + '" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px"></label>' +
    '<label>WhatsApp (opcional)<br><input name="whatsapp" value="' + esc(w0) + '" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px"></label>' +
    '<button style="padding:12px;background:#0f1f3d;color:#fff;border:0;border-radius:6px;font-weight:bold">Guardar</button></form>');
}

export async function POST(req) {
  const f = await req.formData().catch(() => null);
  if (!f) return page("<p>Error.</p>");
  const n = String(f.get("n") || ""), t = String(f.get("t") || ""), p = String(f.get("p") || "");
  const email = String(f.get("email") || "").trim(), wa = String(f.get("whatsapp") || "").trim();
  if (!valido(n, t)) return page("<p>Link inválido o vencido.</p>");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return page("<p>Email inválido. Volvé atrás y corregilo.</p>");
  if (!sheetsReady()) {
    // Sin planilla conectada: te llega por mail y se incorpora al directorio de contactos.
    if (resendReady()) await sendMail({ to: "contacto@departamentosenpozo.com.ar", subject: "[Contacto inmobiliaria cargado] " + n,
      html: "<p>Cargaste el contacto de <b>" + esc(n) + "</b>: " + esc(email) + (wa ? " · WhatsApp " + esc(wa) : "") + (p ? "<br>Proyecto: " + esc(p) : "") + "</p><p>Se incorpora al ruteo en la próxima actualización del directorio.</p>" }).catch(() => {});
    return page("<h2 style=\"color:#0f1f3d\">Recibido ✓</h2><p>Guardamos el contacto de <b>" + esc(n) + "</b> (" + esc(email) + "). Se activa en la próxima actualización del ruteo.</p>");
  }
  await ensureTab(TAB_CONTACTOS, HEAD_CONTACTOS);
  await appendRow(TAB_CONTACTOS, [n, email, wa, "aprobado", new Date().toISOString(), "link copia lead", p]);
  invalidateLearned();
  return page("<h2 style=\"color:#0f1f3d\">Listo ✓</h2><p>Desde ahora los leads de <b>" + esc(n) + "</b> le llegan a " + esc(email) + ".</p>");
}
