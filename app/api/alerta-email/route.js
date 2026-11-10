// app/api/alerta-email/route.js — Arma el mail de ALERTA de lanzamientos (o DIGEST semanal) para UN
// suscriptor. El Apps Script lo llama por cada suscriptor y sólo envía si count > 0.
//
// GET params:
//   email      destinatario (para el link de baja firmado)
//   zonas      texto libre: barrios separados por coma ("Palermo, Núñez y Belgrano"), "zona norte",
//              o "abierto"/vacío = todo CABA
//   precioMax  USD (opcional): sólo proyectos con precio desde <= precioMax
//   ambientes  opcional: "2" | "2,3" | "4+" (match por tipologías)
//   desde      id: sólo proyectos con id > desde (lo que el suscriptor todavía no recibió)
//   excluir    slugs ya enviados (coma)
//   limit      default 5, máx 5
//   digest     "1" → subject de digest semanal (mismo html)
//
// Sólo proyectos CON imagen y CON precio. Orden: más nuevos primero (id desc).
// Respuesta: { count, total, slugs, subject, preheader, html, text, maxId, maxIdIncluidos, unsubscribe, ctaUrl }
//   count = cards incluidas (<= limit); total = matches totales; maxId = id más alto del catálogo
//   (para avanzar el cursor global); maxIdIncluidos = id más alto de lo incluido.
//   Si count = 0 → { count:0, total:0, slugs:[], maxId } sin html.
import { getDesarrollos } from "../../../lib/wp";
import { mapDesarrollos } from "../../../lib/catalogo";
import { ambientesLabel, entregaLabel } from "../../../lib/ia";
import { BARRIO_CATALOGO, matchBarrioCatalogo, zonaDeBarrio } from "../../../lib/barrios";
import { urlBaja } from "../../../lib/emailBaja";
import {
  SITE, CATALOGO_URL, INK, MUTE, esc, money, norm, withUtm, fichaUrl,
  landingBarrio, barrioLabel, emailCard, emailLayout, botonPrimario,
} from "../../../lib/emailTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREFS_URL = SITE + "/alertas-de-lanzamientos-en-pozo/";
const ABIERTO = /^(abierto|abierta|cualquiera|cualquier barrio|cualquier zona|todos|todas|todo|todo caba|caba|capital|capital federal|otro|otros|otro \/ no se|otro \/ no se todavia|no se|no se todavia|indistinto|sin definir|-)$/;
const ZONAS_GBA = {
  "zona norte": "GBA · Zona Norte", "gba norte": "GBA · Zona Norte",
  "zona oeste": "GBA · Zona Oeste", "gba oeste": "GBA · Zona Oeste",
  "zona sur": "GBA · Zona Sur", "gba sur": "GBA · Zona Sur",
  "la plata": "GBA · La Plata",
};

// Interpreta el texto libre de zonas → { abierto, slugs:Set(landing), zonas:Set(zona), libres:[norm] }.
function parseZonas(raw) {
  const out = { abierto: false, slugs: new Set(), zonas: new Set(), libres: [] };
  const txt = norm(raw).replace(/\s+/g, " ");
  if (!txt) { out.abierto = true; return out; }
  const tokens = txt.split(/\s*(?:,|;|\||\/|\+| y | o |\n)\s*/).map((t) => t.trim()).filter(Boolean);
  const porLabel = Object.entries(BARRIO_CATALOGO).map(([slug, c]) => ({ slug, keys: [norm(c.label), slug.replace(/-/g, " "), ...c.match.map(norm)] }));
  for (const tok of tokens) {
    if (ABIERTO.test(tok)) { out.abierto = true; continue; }
    if (ZONAS_GBA[tok]) { out.zonas.add(ZONAS_GBA[tok]); continue; }
    const hit = porLabel.find((b) => b.keys.includes(tok)) ||
                porLabel.find((b) => b.keys.some((k) => tok.startsWith(k + " ") || k.startsWith(tok + " ")));
    if (hit) out.slugs.add(hit.slug);
    else if (tok.length >= 4) out.libres.push(tok);
  }
  if (!out.slugs.size && !out.zonas.size && !out.libres.length) out.abierto = true;
  return out;
}

function matchZona(p, z) {
  if (z.abierto && zonaDeBarrio(p.barrio) === "Capital Federal") return true;
  for (const s of z.slugs) {
    if (matchBarrioCatalogo(p.barrio, s)) return true;
    // Fallback acento-insensible (ej. "Nuñez" cargado sin tilde).
    const nb = norm(p.barrio);
    if (BARRIO_CATALOGO[s].match.some((m) => { const nm = norm(m); return nb === nm || nb.startsWith(nm + " ") || nb.startsWith(nm + ","); })) return true;
  }
  if (z.zonas.size && z.zonas.has(zonaDeBarrio(p.barrio))) return true;
  if (z.libres.length) {
    const nb = norm(p.barrio);
    if (z.libres.some((l) => new RegExp("(^|[^a-z])" + l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z]|$)").test(nb))) return true;
  }
  return false;
}

function parseAmbientes(raw) {
  const s = String(raw || "").toLowerCase();
  if (!s.trim() || /indistinto|cualquier|sin definir/.test(s)) return null;
  const nums = (s.match(/\d+\+?/g) || []).map((x) => ({ n: parseInt(x, 10), plus: x.endsWith("+") }));
  return nums.length ? nums : null;
}
function matchAmbientes(p, want) {
  if (!want) return true;
  const have = (p.ambientesNums || []).map((x) => ({ n: parseInt(String(x), 10), plus: /\+/.test(String(x)) })).filter((x) => !isNaN(x.n));
  if (!have.length) return false; // sin dato de tipologías no podemos afirmar que matchea
  return want.some((w) => have.some((h) => (w.plus ? h.n >= w.n || (h.plus && h.n + 1 >= w.n) : h.n === w.n || (h.plus && w.n >= h.n))));
}

function parseUSD(raw) {
  const s = String(raw || "").toLowerCase().replace(/usd|u\$s|us\$|\$/g, "").trim();
  if (!s) return null;
  const m = s.match(/(\d+(?:[.,]\d+)*)\s*(k|mil|m|millon(?:es)?)?/);
  if (!m) return null;
  let n = Number(m[1].replace(/[.,](?=\d{3}(\D|$))/g, "").replace(",", "."));
  if (m[2] === "k" || m[2] === "mil") n *= 1000;
  else if (m[2] && m[2].startsWith("m")) n *= 1e6;
  return n > 1000 ? Math.round(n) : null;
}

export async function GET(req) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const email = (sp.get("email") || "").trim();
  const zonasRaw = sp.get("zonas") || "";
  const precioMax = parseUSD(sp.get("precioMax"));
  const ambientes = parseAmbientes(sp.get("ambientes"));
  const desde = parseInt(sp.get("desde") || "0", 10) || 0;
  const excluir = new Set(String(sp.get("excluir") || "").split(/[,\s]+/).map((s) => s.trim().toLowerCase()).filter(Boolean));
  const limit = Math.min(Math.max(parseInt(sp.get("limit") || "5", 10) || 5, 1), 5);
  const digest = /^(1|true|si|sí)$/i.test(sp.get("digest") || "");
  const H = { "Cache-Control": "no-store" };

  let raw = [];
  try { raw = (await getDesarrollos(2000)) || []; } catch { raw = []; }
  const idPorSlug = new Map(raw.map((d) => [d.slug, Number(d.id) || 0]));
  const cat = mapDesarrollos(raw).map((p) => ({ ...p, id: idPorSlug.get(p.slug) || 0 }));
  const maxId = cat.reduce((m, p) => Math.max(m, p.id), desde);

  const z = parseZonas(zonasRaw);
  const matches = cat
    .filter((p) => p.slug && p.id > desde && p.imagen && p.precioDesde)
    .filter((p) => !excluir.has(String(p.slug).toLowerCase()))
    .filter((p) => matchZona(p, z))
    .filter((p) => (precioMax ? p.precioDesde <= precioMax : true))
    .filter((p) => matchAmbientes(p, ambientes))
    .sort((a, b) => b.id - a.id);

  const items = matches.slice(0, limit);
  const count = items.length;
  if (!count) return Response.json({ count: 0, total: 0, slugs: [], maxId, maxIdIncluidos: null }, { headers: H });
  const total = matches.length;

  // Barrio para subject/CTA: si todo lo incluido cae en UN barrio canónico → ese; si el usuario
  // pidió un único barrio → ese; si no, "tus barrios".
  const labels = [...new Set(items.map((p) => barrioLabel(p.barrio)).filter(Boolean))];
  const pedidoUnico = z.slugs.size === 1 && !z.abierto && !z.zonas.size && !z.libres.length ? BARRIO_CATALOGO[[...z.slugs][0]].label : "";
  const barrioUnico = labels.length === 1 ? labels[0] : (pedidoUnico || "");
  const minPrecio = Math.min(...matches.map((p) => p.precioDesde)); // "desde" = mínimo de todo lo que matchea
  const campaign = digest ? "digest" : "alertas";
  const utm = (content) => ({ medium: "alertas", campaign, content });

  let subject;
  if (digest) subject = "Esta semana en pozo: " + total + (total === 1 ? " novedad" : " novedades") + " en tus barrios";
  else if (count === 1 && total === 1) subject = "Nuevo en " + barrioLabel(items[0].barrio) + ": " + items[0].nombre + " desde " + money(items[0].precioDesde);
  else subject = total + " proyectos nuevos en " + (barrioUnico || "tus barrios") + " desde " + money(minPrecio);

  const p0 = items[0];
  const anio0 = p0.entregaAnio ? "Entrega " + p0.entregaAnio : "";
  const dev0 = p0.desarrolladoraNombre || "";
  const preheader = count === 1 && total === 1
    ? [anio0, dev0, p0.financiacion ? "con financiación" : ""].filter(Boolean).join(" · ") + (anio0 || dev0 ? ". " : "") + "Lo viste primero acá."
    : "Seleccionados según tu búsqueda" + (barrioUnico ? ": " + barrioUnico : "") + (precioMax ? ", hasta " + money(precioMax) : "") + ". Sin repetir lo que ya te mandamos.";

  // CTA → landing de barrio (si existe) o catálogo.
  const landing = barrioUnico ? landingBarrio(items.find((p) => barrioLabel(p.barrio) === barrioUnico)?.barrio || barrioUnico, cat) : null;
  const ctaUrl = withUtm(landing ? landing.url : CATALOGO_URL, utm("cta"));
  const ctaLabel = landing ? "Ver todos los proyectos en " + landing.label : "Ver todos los proyectos en pozo";
  const bajaUrl = email ? urlBaja(email) : "";
  const prefsUrl = withUtm(PREFS_URL, utm("preferencias"));

  const motivoBusqueda = [
    z.abierto && !z.slugs.size ? "CABA" : [...z.slugs].map((s) => BARRIO_CATALOGO[s].label).concat([...z.zonas]).concat(z.libres).join(", "),
    precioMax ? "hasta " + money(precioMax) : "",
    ambientes ? ambientes.map((a) => a.n + (a.plus ? "+" : "")).join(" o ") + " amb." : "",
  ].filter(Boolean).join(" · ");

  const titulo = digest ? "Tu semana en pozo" : (count === 1 && total === 1 ? "Nuevo proyecto en " + barrioLabel(p0.barrio) : "Nuevos proyectos en " + (barrioUnico || "tus barrios"));
  const introHtml =
    '<p style="margin:0;font-size:15px;line-height:1.6;color:' + INK + '">Hola, ' + (digest ? "estas son las novedades de la semana" : (total === 1 ? "entró un proyecto nuevo" : "entraron " + total + " proyectos nuevos")) + ' que encajan con tu alerta.</p>' +
    (motivoBusqueda ? '<p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:' + MUTE + '">Tu búsqueda: <b>' + esc(motivoBusqueda) + '</b> · <a href="' + esc(prefsUrl) + '" style="color:' + MUTE + ';text-decoration:underline">Editar</a></p>' : "");

  const cardsHtml = items.map((p) => {
    const porque = [p.precioM2 ? "USD " + Math.round(p.precioM2).toLocaleString("es-AR") + "/m²" : "", p.entregaAnio ? "entrega " + p.entregaAnio : "", p.financiacion ? "con financiación" : ""].filter(Boolean).join(" · ");
    return emailCard(
      { slug: p.slug, nombre: p.nombre, barrio: p.barrio, precioDesde: p.precioDesde, imagen: p.imagen, ambientesLabel: ambientesLabel(p.ambientes, p.ambientesNums), entregaLabel: entregaLabel(p.entrega) },
      { href: withUtm(fichaUrl(p.slug), utm("card")), porque: porque ? porque.charAt(0).toUpperCase() + porque.slice(1) : "" }
    );
  }).join("");
  const mas = total > count
    ? '<p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:' + INK + '">Y ' + (total - count) + (total - count === 1 ? " proyecto más" : " proyectos más") + ' que encajan con tu búsqueda.</p>'
    : "";
  const ctaHtml = mas + botonPrimario(ctaUrl, ctaLabel);

  const html = emailLayout({
    titulo, preheader, introHtml, cardsHtml, ctaHtml,
    motivo: "Te llega porque activaste una alerta de lanzamientos en Departamentos en Pozo.",
    bajaUrl, prefsUrl,
  });
  const text =
    titulo + "\n\n" +
    items.map((p) => "- " + p.nombre + (p.barrio ? " (" + p.barrio + ")" : "") + " desde " + money(p.precioDesde) + "\n  " + withUtm(fichaUrl(p.slug), utm("card"))).join("\n") +
    (total > count ? "\n\nY " + (total - count) + " más." : "") +
    "\n\n" + ctaLabel + ": " + ctaUrl +
    "\nCambiar mis preferencias: " + prefsUrl +
    (bajaUrl ? "\nDarme de baja: " + bajaUrl : "\nPara dejar de recibir, respondé BAJA.");

  return Response.json({
    count, total,
    slugs: items.map((p) => p.slug),
    ids: items.map((p) => p.id),
    subject, preheader, html, text,
    maxId,
    maxIdIncluidos: Math.max(...items.map((p) => p.id)),
    unsubscribe: bajaUrl || null,
    ctaUrl,
  }, { headers: H });
}
