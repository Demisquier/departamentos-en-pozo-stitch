// app/api/similares/route.js — Proyectos "similares" a uno dado + HTML del mail listo para enviar.
// Similar = parecido en barrio, precio, ambientes, entrega y financiación.
//
// GET params:
//   slug      slug del proyecto consultado (preferido)
//   nombre|q  nombre del proyecto si no hay slug (se resuelve el slug y se EXCLUYE igual)
//   lead      nombre del lead (para el saludo / subject)
//   email     email del destinatario → link de baja firmado en el footer + `unsubscribe` en el JSON
//   excluir   slugs separados por coma que NO se deben mostrar (ya enviados/vistos)
//   modo      "similares" (default) | "seguimiento"
//   limit     1..8 (default 4)
//
// Respuesta: { proyecto, similares:[card+porque], slugs:[...], modo, subject, preheader, html, text,
//   unsubscribe, ctaUrl, emailSubject, emailText, emailHtml (alias compat) }
import { loadCatalogo, cardFrom } from "../../../lib/ia";
import { NEARBY_CATALOGO, landingDeBarrio } from "../../../lib/barrios";
import { urlBaja } from "../../../lib/emailBaja";
import {
  SITE, CONTACTO, CATALOGO_URL, INK, MUTE, GOLD, NAVY, LINE,
  esc, money, norm, withUtm, fichaUrl, landingBarrio, emailCard, emailLayout, botonPrimario,
} from "../../../lib/emailTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const barrioBase = (b) => norm(b).split(/\s+/)[0] || ""; // "palermo hollywood" -> "palermo"

// Puntúa qué tan parecido es `c` al proyecto objetivo `t` (mismo criterio en todos los ejes).
function score(t, c) {
  let s = 0;
  const tb = barrioBase(t.barrio), cb = barrioBase(c.barrio);
  if (tb && cb) {
    if (norm(t.barrio) === norm(c.barrio)) s += 6;      // mismo barrio granular
    else if (tb === cb) s += 4;                          // misma base (Palermo Soho ~ Palermo Hollywood)
  }
  if (t.precioDesde && c.precioDesde) {
    const d = Math.abs(t.precioDesde - c.precioDesde) / t.precioDesde;
    if (d <= 0.15) s += 5; else if (d <= 0.3) s += 3; else if (d <= 0.5) s += 1; else s -= 1;
  }
  const ta = new Set((t.ambientesNums || []).map((x) => String(x).replace(/\D/g, "")));
  const ca = (c.ambientesNums || []).map((x) => String(x).replace(/\D/g, ""));
  if (ta.size && ca.some((x) => ta.has(x))) s += 3;
  if (t.entregaAnio && c.entregaAnio) {
    const dd = Math.abs(t.entregaAnio - c.entregaAnio);
    if (dd === 0) s += 2; else if (dd === 1) s += 1;
  }
  if (t.financiacion && c.financiacion) s += 1;
  if (c.imagen) s += 0.5;
  if (c.precioDesde) s += 0.3;
  return s;
}

const fmtN = (n) => Math.round(n).toLocaleString("es-AR");

// "Por qué" de cada card, SÓLO con datos reales (si falta el dato, no se dice nada).
function porQue(t, c) {
  const partes = [];
  const tl = landingDeBarrio(t.barrio), cl = landingDeBarrio(c.barrio);
  if ((tl && cl && tl === cl) || (t.barrio && norm(t.barrio) === norm(c.barrio))) partes.push("Mismo barrio");
  else if (tl && cl && (NEARBY_CATALOGO[tl] || []).includes(cl)) partes.push("Barrio cercano");
  // Precio: primero por m² (comparación justa), si no por precio de entrada.
  if (t.precioM2 && c.precioM2) {
    const d = c.precioM2 - t.precioM2;
    if (d <= -50) partes.push("USD " + fmtN(-d) + "/m² menos");
    else if (Math.abs(d) < 50) partes.push("mismo precio por m²");
  } else if (t.precioDesde && c.precioDesde) {
    const d = c.precioDesde - t.precioDesde;
    if (d <= -5000) partes.push("USD " + fmtN(-d) + " menos de entrada");
    else if (Math.abs(d) / t.precioDesde <= 0.1) partes.push("precio de entrada similar");
  }
  if (c.entregaAnio) {
    if (t.entregaAnio && c.entregaAnio < t.entregaAnio) partes.push("entrega antes (" + c.entregaAnio + ")");
    else partes.push("entrega " + c.entregaAnio);
  }
  if (c.financiacion && !t.financiacion && partes.length < 3) partes.push("con financiación");
  if (!partes.length) return "";
  const s = partes.slice(0, 3).join(" · ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseSlugs(v) {
  return String(v || "").split(/[,\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export async function GET(req) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  const q = (url.searchParams.get("nombre") || url.searchParams.get("q") || "").trim();
  const nombreLead = (url.searchParams.get("lead") || "").trim();
  const email = (url.searchParams.get("email") || "").trim();
  const modo = (url.searchParams.get("modo") || "").trim().toLowerCase() === "seguimiento" ? "seguimiento" : "similares";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "4", 10) || 4, 1), 8);
  const excluir = new Set(parseSlugs(url.searchParams.get("excluir")));
  const H = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" };

  const cat = await loadCatalogo();
  // Proyecto objetivo por slug; si no hay, por nombre (match exacto y, si no, por inclusión).
  let target = slug ? cat.find((x) => x.slug === slug) : null;
  if (!target && q) {
    const nq = norm(q);
    target = cat.find((x) => norm(x.nombre) === nq) ||
             cat.find((x) => { const n = norm(x.nombre); return n && nq && (n.includes(nq) || nq.includes(n)); });
  }
  if (!target) {
    return Response.json({ error: "not_found", slug, nombre: q, similares: [], slugs: [] }, { status: 200, headers: H });
  }
  // FIX: siempre excluir el proyecto consultado (antes, con `nombre` sin slug se comparaba contra "").
  excluir.add(target.slug);
  if (slug) excluir.add(slug.toLowerCase());

  const ranked = cat
    .filter((x) => x.slug && !excluir.has(String(x.slug).toLowerCase()) && norm(x.nombre) !== norm(target.nombre))
    .map((c) => ({ c, s: score(target, c) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => ({ ...cardFrom(x.c), porque: porQue(target, x.c) }));

  const proyecto = {
    slug: target.slug, nombre: target.nombre, barrio: target.barrio || "",
    precioDesde: target.precioDesde || null, url: fichaUrl(target.slug),
  };
  const saludo = nombreLead ? nombreLead.split(/\s+/)[0] : "";
  const bajaUrl = email ? urlBaja(email) : "";

  // CTA principal: NO volver a la ficha ya vista → landing del barrio (si existe) o catálogo.
  const landing = landingBarrio(target.barrio, cat);
  const utm = (content) => ({ medium: modo, campaign: modo, content });
  const ctaUrl = withUtm(landing ? landing.url : CATALOGO_URL, utm("cta"));
  const ctaLabel = landing ? "Ver todos los proyectos en " + landing.label : "Ver más proyectos en pozo";

  const n = ranked.length;
  const pNombre = target.nombre || "el proyecto que viste";
  const minPrecio = ranked.map((r) => r.precioDesde).filter(Boolean).sort((a, b) => a - b)[0] || null;
  const minEntrega = ranked.map((r) => {
    const m = String(r.entregaLabel || "").match(/(20\d\d)/); return m ? Number(m[1]) : null;
  }).filter(Boolean).sort((a, b) => a - b)[0] || null;

  let subject, preheader, titulo, introHtml, despuesCardsHtml = "";
  if (modo === "seguimiento") {
    subject = (saludo ? saludo + ", " : "") + n + (n === 1 ? " opción nueva parecida a " : " opciones nuevas parecidas a ") + pNombre;
    if (!saludo) subject = subject.charAt(0).toUpperCase() + subject.slice(1);
    preheader = "¿Ya te contactaron por " + pNombre + "? Si no, avisanos. Y " + n + (n === 1 ? " alternativa" : " alternativas") + " que no viste" + (minPrecio ? ", desde " + money(minPrecio) : "") + ".";
    titulo = "¿Cómo vas con " + pNombre + "?";
    introHtml =
      '<p style="margin:0;font-size:15px;line-height:1.6;color:' + INK + '">' + (saludo ? "Hola " + esc(saludo) + "," : "Hola,") + ' hace unos días consultaste por <b>' + esc(pNombre) + '</b>. ¿Ya te contactaron?</p>' +
      '<p style="margin:10px 0 0 0;font-size:15px;line-height:1.6;color:' + MUTE + '">Mientras tanto, te dejamos ' + (n === 1 ? "una opción parecida" : n + " opciones parecidas") + ' que todavía no te mostramos:</p>';
    const asunto = "No me contactaron por " + pNombre;
    const mailto = "mailto:" + CONTACTO + "?subject=" + encodeURIComponent(asunto);
    despuesCardsHtml =
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf7ee;border:1px solid #ecdcb4;border-radius:12px"><tr><td style="padding:16px 18px">' +
      '<div style="font-size:16px;font-weight:bold;color:' + NAVY + '">¿No te contactaron todavía?</div>' +
      '<p style="margin:6px 0 12px 0;font-size:14px;line-height:1.55;color:' + INK + '">Avisanos con un clic y le volvemos a pasar tu consulta a la desarrolladora o comercializadora de ' + esc(pNombre) + '.</p>' +
      '<a href="' + esc(mailto) + '" style="display:inline-block;background:' + NAVY + ';color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:11px 18px;border-radius:8px">No me contactaron</a>' +
      '</td></tr></table><div style="height:14px;line-height:14px">&nbsp;</div>';
  } else {
    subject = n + (n === 1 ? " opción" : " opciones") + " en pozo parecidas a " + pNombre + (target.barrio ? " en " + target.barrio : "");
    preheader = "Mismo barrio y rango de precio" + (minPrecio ? ". El más accesible arranca en " + money(minPrecio) : "") + (minEntrega ? " y entrega " + minEntrega : "") + ".";
    titulo = "Proyectos similares a " + pNombre;
    introHtml =
      '<p style="margin:0;font-size:15px;line-height:1.6;color:' + INK + '">' + (saludo ? "Hola " + esc(saludo) + "," : "Hola,") + ' viste <b>' + esc(pNombre) + '</b>.</p>' +
      '<p style="margin:10px 0 0 0;font-size:15px;line-height:1.6;color:' + MUTE + '">Seleccionamos estos proyectos en pozo, parecidos en <b>barrio, precio, ambientes y entrega</b>, que también pueden encajar con lo que buscás:</p>';
  }

  const cardsHtml = ranked.map((r) => emailCard(
    { ...r, ambientesLabel: r.ambientes },
    { href: withUtm(r.url, utm("card")), porque: r.porque }
  )).join("");
  const ctaHtml = botonPrimario(ctaUrl, ctaLabel) +
    '<p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:' + MUTE + '">Comparamos precio por m&sup2;, entrega y desarrolladora de cada proyecto para que decidas con datos.</p>';

  const html = n ? emailLayout({
    titulo, preheader, introHtml, cardsHtml, despuesCardsHtml, ctaHtml,
    motivo: "Te escribimos porque consultaste por " + pNombre + " en Departamentos en Pozo.",
    bajaUrl,
  }) : "";

  const text = n ? (
    titulo + "\n\n" +
    ranked.map((s) => "- " + s.nombre + (s.barrio ? " (" + s.barrio + ")" : "") +
      (s.precioDesde ? " desde " + money(s.precioDesde) : "") + (s.porque ? " — " + s.porque : "") +
      "\n  " + withUtm(s.url, utm("card"))).join("\n") +
    (modo === "seguimiento" ? "\n\n¿No te contactaron todavía? Escribinos a " + CONTACTO + " con el asunto \"No me contactaron por " + pNombre + "\"." : "") +
    "\n\n" + ctaLabel + ": " + ctaUrl +
    "\n\nDepartamentos en Pozo — análisis independiente de proyectos en pozo en CABA y GBA." +
    (bajaUrl ? "\nDarme de baja: " + bajaUrl : "\nPara dejar de recibir, respondé BAJA.")
  ) : "";

  return Response.json({
    proyecto,
    similares: ranked,
    slugs: ranked.map((r) => r.slug),
    modo,
    site: SITE,
    subject: n ? subject : "",
    preheader: n ? preheader : "",
    html,
    text,
    unsubscribe: bajaUrl || null,
    ctaUrl,
    // Alias compat (Apps Script enviarSimilares / leadPipeline actuales).
    emailSubject: n ? subject : "",
    emailText: text,
    emailHtml: html,
  }, { status: 200, headers: H });
}
