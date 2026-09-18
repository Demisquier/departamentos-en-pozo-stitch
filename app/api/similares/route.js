// app/api/similares/route.js — Proyectos "similares" a uno dado (para el mail de
// recomendación automatizado) + arma el HTML del email premium listo para enviar.
// Similar = parecido en TODO: barrio, precio, ambientes, entrega y financiación.
// GET ?slug=<slug>&limit=4  → { proyecto, similares:[cards], emailSubject, emailText, emailHtml }.
// El HTML del mail vive acá (repo, fácil de editar) y el Apps Script sólo lo envía.
import { loadCatalogo, cardFrom, fichaUrl } from "../../../lib/ia";
import { SITE } from "../../../lib/wp";

export const runtime = "nodejs";
export const revalidate = 3600;

const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const barrioBase = (b) => norm(b).split(/\s+/)[0] || ""; // "palermo hollywood" -> "palermo"

// Puntúa qué tan parecido es `c` al proyecto objetivo `t` (mismo criterio en todos los ejes).
function score(t, c) {
  let s = 0;
  const tb = barrioBase(t.barrio), cb = barrioBase(c.barrio);
  if (tb && cb) {
    if (norm(t.barrio) === norm(c.barrio)) s += 6;      // mismo barrio granular
    else if (tb === cb) s += 4;                          // misma base (Palermo Soho ~ Palermo Hollywood)
  }
  // Precio "desde": cuanto más cerca, más puntos.
  if (t.precioDesde && c.precioDesde) {
    const d = Math.abs(t.precioDesde - c.precioDesde) / t.precioDesde;
    if (d <= 0.15) s += 5; else if (d <= 0.3) s += 3; else if (d <= 0.5) s += 1; else s -= 1;
  }
  // Ambientes: solapamiento de tipologías.
  const ta = new Set((t.ambientesNums || []).map((x) => String(x).replace(/\D/g, "")));
  const ca = (c.ambientesNums || []).map((x) => String(x).replace(/\D/g, ""));
  if (ta.size && ca.some((x) => ta.has(x))) s += 3;
  // Entrega: mismo año (o ±1).
  if (t.entregaAnio && c.entregaAnio) {
    const dd = Math.abs(t.entregaAnio - c.entregaAnio);
    if (dd === 0) s += 2; else if (dd === 1) s += 1;
  }
  // Financiación: mismo esquema.
  if (t.financiacion && c.financiacion) s += 1;
  // Pequeño bonus por tener imagen/precio (mejor card).
  if (c.imagen) s += 0.5;
  if (c.precioDesde) s += 0.3;
  return s;
}

// ---------- Email premium ----------
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n) => { try { return "USD " + Number(n).toLocaleString("es-AR"); } catch (e) { return "USD " + n; } };

// Paleta de marca (navy + oro) — consistente con el sitio.
const NAVY = "#0f1f3d", NAVY2 = "#16294d", GOLD = "#c19a3e", INK = "#1c2431", MUTE = "#6b7480", LINE = "#e8ebf0", BG = "#eef1f6";

function emailCard(s) {
  const precio = s.precioDesde ? money(s.precioDesde) : "Consultar precio";
  const chips = [s.barrio, s.ambientes, s.entregaLabel].filter(Boolean).map(esc);
  const meta = chips.length
    ? '<tr><td style="padding-top:6px">' + chips.map((c) =>
        '<span style="display:inline-block;background:#f2f4f8;color:' + MUTE + ';font-size:12px;line-height:1;padding:6px 9px;border-radius:20px;margin:0 6px 6px 0">' + c + '</span>'
      ).join("") + '</td></tr>'
    : "";
  const img = s.imagen
    ? '<a href="' + esc(s.url) + '" style="text-decoration:none"><img src="' + esc(s.imagen) + '" width="600" alt="' + esc(s.nombre) + '" style="display:block;width:100%;max-width:600px;height:auto;border-radius:14px 14px 0 0;object-fit:cover"></a>'
    : '<div style="height:8px;border-radius:14px 14px 0 0;background:' + NAVY + '"></div>';
  return (
    '<tr><td style="padding:0 0 18px 0">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid ' + LINE + ';border-radius:14px;overflow:hidden">' +
    '<tr><td>' + img + '</td></tr>' +
    '<tr><td style="padding:16px 18px 18px 18px;font-family:Arial,Helvetica,sans-serif">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '<tr><td><a href="' + esc(s.url) + '" style="color:' + NAVY + ';font-size:17px;font-weight:bold;text-decoration:none;line-height:1.25">' + esc(s.nombre) + '</a></td></tr>' +
    meta +
    '<tr><td style="padding-top:10px;font-size:15px;color:' + GOLD + ';font-weight:bold">desde ' + esc(precio) + '</td></tr>' +
    '<tr><td style="padding-top:12px">' +
    '<a href="' + esc(s.url) + '" style="display:inline-block;background:' + NAVY + ';color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;padding:9px 16px;border-radius:8px">Ver ficha &rarr;</a>' +
    '</td></tr></table></td></tr></table></td></tr>'
  );
}

function buildEmail(proy, cards, saludo) {
  const proyNombre = esc(proy.nombre || "el proyecto que viste");
  const hola = saludo ? "Hola " + esc(saludo) + "," : "Hola,";
  const cardsHtml = cards.map(emailCard).join("");
  const cta = esc(proy.url || SITE);
  const pre = "Elegimos " + cards.length + " proyectos en pozo parecidos a " + (proy.nombre || "") + " en barrio, precio, ambientes y entrega.";

  const html =
'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<meta name="x-apple-disable-message-reformatting"><title>Proyectos similares</title></head>' +
'<body style="margin:0;padding:0;background:' + BG + '">' +
'<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:' + BG + ';font-size:1px;line-height:1px">' + esc(pre) + '</div>' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + BG + '"><tr><td align="center" style="padding:24px 12px">' +
'<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">' +
// Header
'<tr><td style="background:' + NAVY + ';background-image:linear-gradient(135deg,' + NAVY + ',' + NAVY2 + ');border-radius:16px 16px 0 0;padding:26px 24px">' +
'<div style="font-family:Arial,Helvetica,sans-serif;color:' + GOLD + ';font-size:12px;letter-spacing:2px;font-weight:bold">DEPARTAMENTOS EN POZO</div>' +
'<div style="font-family:Georgia,\'Times New Roman\',serif;color:#ffffff;font-size:23px;line-height:1.25;margin-top:8px">Proyectos similares a ' + proyNombre + '</div>' +
'</td></tr>' +
// Intro
'<tr><td style="background:#ffffff;padding:22px 24px 6px 24px;font-family:Arial,Helvetica,sans-serif">' +
'<p style="margin:0;font-size:15px;line-height:1.6;color:' + INK + '">' + hola + ' viste <b>' + proyNombre + '</b>.</p>' +
'<p style="margin:10px 0 0 0;font-size:15px;line-height:1.6;color:' + MUTE + '">Seleccionamos estos proyectos en pozo, parecidos en <b>barrio, precio, ambientes y entrega</b>, que también pueden encajar con lo que buscás:</p>' +
'</td></tr>' +
// Cards
'<tr><td style="background:#ffffff;padding:18px 24px 4px 24px">' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + cardsHtml + '</table></td></tr>' +
// CTA
'<tr><td style="background:#ffffff;padding:6px 24px 26px 24px" align="center">' +
'<a href="' + cta + '" style="display:inline-block;background:' + GOLD + ';color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 26px;border-radius:10px">Ver más proyectos en pozo</a>' +
'<p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:' + MUTE + '">Comparamos precio por m&sup2;, entrega y desarrolladora de cada proyecto para que decidas con datos.</p>' +
'</td></tr>' +
// Footer
'<tr><td style="background:#0b1730;border-radius:0 0 16px 16px;padding:20px 24px;font-family:Arial,Helvetica,sans-serif">' +
'<div style="color:' + GOLD + ';font-size:11px;letter-spacing:1.5px;font-weight:bold">DEPARTAMENTOS EN POZO</div>' +
'<p style="margin:8px 0 0 0;font-size:11px;line-height:1.6;color:#98a4bd">Portal de an&aacute;lisis independiente de departamentos en pozo en CABA y GBA. No somos la desarrolladora ni la comercializadora de estos proyectos.</p>' +
'<p style="margin:8px 0 0 0;font-size:11px;line-height:1.6;color:#7c88a3">Si no quer&eacute;s recibir estas recomendaciones, respond&eacute; <b>BAJA</b> a este correo.</p>' +
'</td></tr>' +
'</table></td></tr></table></body></html>';

  const text =
    "Proyectos similares a " + (proy.nombre || "") + "\n\n" +
    cards.map((s) => "- " + s.nombre + (s.barrio ? " (" + s.barrio + ")" : "") +
      (s.precioDesde ? " desde " + money(s.precioDesde) : "") + "\n  " + s.url).join("\n") +
    "\n\nVer más: " + (proy.url || SITE) +
    "\n\nDepartamentos en Pozo — análisis independiente de proyectos en pozo en CABA y GBA. Para dejar de recibir, respondé BAJA.";

  return {
    emailSubject: "Proyectos similares a " + (proy.nombre || "el que viste") + " | Departamentos en Pozo",
    emailText: text,
    emailHtml: html,
  };
}

export async function GET(req) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  const q = (url.searchParams.get("nombre") || url.searchParams.get("q") || "").trim();
  const nombreLead = (url.searchParams.get("lead") || "").trim(); // nombre del lead p/ saludo
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "4", 10) || 4, 1), 8);
  const cat = await loadCatalogo();
  // Resuelve el proyecto objetivo por slug; si no hay, por nombre (para leads que traen el
  // nombre pero no el slug). Match exacto y, si no, por inclusión normalizada.
  let target = slug ? cat.find((x) => x.slug === slug) : null;
  if (!target && q) {
    const nq = norm(q);
    target = cat.find((x) => norm(x.nombre) === nq) ||
             cat.find((x) => { const n = norm(x.nombre); return n && (n.includes(nq) || nq.includes(n)); });
  }
  if (!target) {
    return Response.json({ error: "not_found", slug, nombre: q, similares: [] }, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
  }
  const ranked = cat
    .filter((x) => x.slug && x.slug !== slug)
    .map((c) => ({ c, s: score(target, c) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => cardFrom(x.c));

  const proyecto = {
    slug: target.slug, nombre: target.nombre, barrio: target.barrio || "",
    precioDesde: target.precioDesde || null, url: fichaUrl(target.slug),
  };
  const saludo = nombreLead ? nombreLead.split(/\s+/)[0] : "";
  const email = ranked.length ? buildEmail(proyecto, ranked, saludo) : { emailSubject: "", emailText: "", emailHtml: "" };

  const out = {
    proyecto,
    similares: ranked,
    site: SITE,
    emailSubject: email.emailSubject,
    emailText: email.emailText,
    emailHtml: email.emailHtml,
  };
  return Response.json(out, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
}
