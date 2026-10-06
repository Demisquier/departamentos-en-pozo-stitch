// app/api/soy-inmobiliaria/route.js — Alta voluntaria de inmobiliarias ("recibí los leads directo").
// No rutea nada solo: la carga queda "pendiente" y te llega un mail con un link firmado para
// APROBARLA (evita que alguien se haga pasar por otra firma y se quede con sus leads).
import { sendMail, resendReady } from "../../../lib/resend";
import { sheetsReady, ensureTab, appendRow } from "../../../lib/googleSheets";
import { TAB_CONTACTOS, HEAD_CONTACTOS, CONTACTO } from "../../../lib/leadRouting";
import { linkCargarContacto } from "../../../lib/leadPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());

export async function POST(req) {
  let b; try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (b._gotcha) return Response.json({ ok: true });
  const firma = String(b.firma || "").trim().slice(0, 120);
  const email = String(b.email || "").trim().slice(0, 160);
  const wa = String(b.whatsapp || "").trim().slice(0, 40);
  const contacto = String(b.nombre || "").trim().slice(0, 120);
  const matricula = String(b.matricula || "").trim().slice(0, 40);
  const proyectos = String(b.proyectos || "").trim().slice(0, 1500);
  if (!firma || !isEmail(email)) return Response.json({ ok: false, error: "datos" }, { status: 422 });

  if (sheetsReady()) {
    try { await ensureTab(TAB_CONTACTOS, HEAD_CONTACTOS); await appendRow(TAB_CONTACTOS, [firma, email, wa, "pendiente", new Date().toISOString(), "soy-inmobiliaria · " + contacto + (matricula ? " · CUCICBA " + matricula : ""), proyectos]); }
    catch (e) { /* seguimos: el mail es suficiente para aprobar */ }
  }
  if (!resendReady()) return Response.json({ ok: false, error: "mail" }, { status: 503 });

  const aprobar = linkCargarContacto(firma, "") + "&e=" + encodeURIComponent(email) + "&w=" + encodeURIComponent(wa);
  const html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#1c2431;max-width:600px">' +
    "<p><b>Nueva inmobiliaria quiere recibir leads directo</b></p>" +
    "<p>Firma: <b>" + esc(firma) + "</b><br>Contacto: " + esc(contacto || "—") + "<br>Email: " + esc(email) + "<br>WhatsApp: " + esc(wa || "—") + "<br>Matrícula CUCICBA: " + esc(matricula || "—") + "</p>" +
    "<p>Proyectos que dice comercializar:<br>" + esc(proyectos || "—").replace(/\n/g, "<br>") + "</p>" +
    '<p style="background:#fff7e0;border:1px solid #e8c766;padding:10px;border-radius:8px">Verificá la matrícula en el padrón de CUCICBA y que el dominio del mail sea de la firma. ' +
    'Si está OK: <a href="' + aprobar + '"><b>Aprobar y activar el ruteo</b></a>.</p></div>';
  await sendMail({ to: CONTACTO, subject: "[Alta inmobiliaria] " + firma, html, replyTo: email }).catch(() => {});
  return Response.json({ ok: true });
}
