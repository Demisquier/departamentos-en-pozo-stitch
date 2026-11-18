// Chequeo diario: ¿a cada ficha publicada le llega el lead a alguien? (Vercel Cron, ver vercel.json)
// Regla del sitio: ningún lead puede quedar solo en contacto@. Para cada ficha resolvemos el
// destino real (inmobiliaria > desarrolladora) con la MISMA lógica que el envío de leads y
// verificamos que el dominio del mail exista y reciba correo (registro MX).
// Si todo está bien: no manda nada. Si hay problemas: un solo mail a contacto@ con la lista.
import dns from "dns/promises";
import { getDesarrollos } from "../../../../lib/wp";
import { resolverDestino } from "../../../../lib/leadRouting";
import { sendMail } from "../../../../lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CONTACTO = "contacto@departamentosenpozo.com.ar";
const SITE = "https://departamentosenpozo.com.ar";

function autorizado(req) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (process.env.MAIL_SECRET && url.searchParams.get("secret") === process.env.MAIL_SECRET) return true;
  if (!process.env.CRON_SECRET && /vercel-cron/i.test(req.headers.get("user-agent") || "")) return true;
  return false;
}

const mxCache = new Map();
async function dominioRecibe(email) {
  const dom = String(email).split("@")[1];
  if (!dom) return false;
  if (mxCache.has(dom)) return mxCache.get(dom);
  let ok = false;
  try { ok = (await dns.resolveMx(dom)).length > 0; } catch (e) { ok = e && e.code === "ETIMEOUT" ? true : false; }
  mxCache.set(dom, ok);
  return ok;
}

export async function GET(req) {
  if (!autorizado(req)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const forzarMail = url.searchParams.get("mail") === "1";
  let items = [];
  try { items = await getDesarrollos(5000); } catch (e) { return Response.json({ ok: false, error: "catalogo: " + e.message }, { status: 500 }); }

  const sinDestino = [], dominioMuerto = [];
  for (const d of items) {
    const titulo = ((d.title && d.title.rendered) || d.slug).replace(/&amp;/g, "&");
    let dest;
    try { dest = await resolverDestino({ proyectoSlug: d.slug }); } catch (e) { continue; }
    if (!dest || dest.tipo === "contacto") { sinDestino.push({ slug: d.slug, titulo, firma: (dest && dest.comercializadora) || "" }); continue; }
    if (!(await dominioRecibe(dest.to))) dominioMuerto.push({ slug: d.slug, titulo, to: dest.to, firma: dest.nombre });
  }

  const problemas = sinDestino.length + dominioMuerto.length;
  if (problemas || forzarMail) {
    const li = (r, extra) => `<li><a href="${SITE}/desarrollos-inmobiliarios/${r.slug}/">${r.titulo}</a>${extra ? " — " + extra : ""}</li>`;
    const html = `<p>Chequeo diario de destino de leads (${items.length} fichas publicadas).</p>` +
      (sinDestino.length ? `<p><b>${sinDestino.length} ficha(s) sin email de desarrolladora/inmobiliaria</b> (sus leads quedarían solo en contacto@). Hay que cargar el email o darlas de baja:</p><ul>${sinDestino.map((r) => li(r, r.firma)).join("")}</ul>` : "") +
      (dominioMuerto.length ? `<p><b>${dominioMuerto.length} ficha(s) con email cuyo dominio no recibe correo</b> (va a rebotar):</p><ul>${dominioMuerto.map((r) => li(r, `${r.firma} &lt;${r.to}&gt;`)).join("")}</ul>` : "") +
      (!problemas ? "<p>Todo OK: todas las fichas tienen un destino válido.</p>" : "<p>Pedile a Claude: “arreglá las fichas del chequeo de leads”.</p>");
    try {
      await sendMail({ to: CONTACTO, subject: problemas ? `⚠ Leads sin destino: ${problemas} ficha(s) para revisar` : "Chequeo de leads: todo OK", html });
    } catch (e) { /* el JSON igual informa */ }
  }
  return Response.json({ ok: true, fichas: items.length, sinDestino, dominioMuerto });
}
