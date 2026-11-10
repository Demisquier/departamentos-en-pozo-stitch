// lib/emailTemplate.js — Piezas compartidas de los mails a compradores (similares, seguimiento,
// alertas, digest). Mismo look que el mail premium de similares: navy + oro, cards con foto.
// HTML de tablas + estilos inline (compatible Gmail/Outlook/Apple Mail).
import { BARRIO_CATALOGO, matchBarrioCatalogo, landingDeBarrio } from "./barrios";

export const SITE = "https://departamentosenpozo.com.ar";
export const CONTACTO = "contacto@departamentosenpozo.com.ar";

// Paleta de marca (navy + oro) — consistente con el sitio.
export const NAVY = "#0f1f3d", NAVY2 = "#16294d", GOLD = "#c19a3e", INK = "#1c2431", MUTE = "#6b7480", LINE = "#e8ebf0", BG = "#eef1f6";

export const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const money = (n) => { try { return "USD " + Math.round(Number(n)).toLocaleString("es-AR"); } catch (e) { return "USD " + n; } };
export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// UTMs estándar: utm_source=email&utm_medium={medium}&utm_campaign={campaign}&utm_content={content}
export function withUtm(u, { medium, campaign, content } = {}) {
  if (!u) return u;
  const [base, hash] = String(u).split("#");
  const sep = base.includes("?") ? "&" : "?";
  const q = "utm_source=email&utm_medium=" + encodeURIComponent(medium || "email") +
    "&utm_campaign=" + encodeURIComponent(campaign || medium || "email") +
    (content ? "&utm_content=" + encodeURIComponent(content) : "");
  return base + sep + q + (hash ? "#" + hash : "");
}

// Las imágenes locales vienen relativas (/wp-content/...): en un mail tienen que ser absolutas.
export function absImg(src) {
  const s = String(src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return "https:" + s;
  return SITE + (s.startsWith("/") ? s : "/" + s);
}

export const fichaUrl = (slug) => SITE + "/desarrollos-inmobiliarios/" + slug + "/";
export const CATALOGO_URL = SITE + "/desarrollos-inmobiliarios/";

// Landing de catálogo del barrio (/desarrollos-inmobiliarios-en-{slug}/) SÓLO si existe: el sitio
// genera la landing para barrios de BARRIO_CATALOGO con >= 3 proyectos (ver app/[slug]/page.jsx).
export function landingBarrio(barrio, catalogo) {
  const slug = landingDeBarrio(barrio);
  if (!slug) return null;
  const n = (catalogo || []).filter((i) => matchBarrioCatalogo(i.barrio, slug)).length;
  if (n < 3) return null;
  return { slug, label: BARRIO_CATALOGO[slug].label, url: SITE + "/desarrollos-inmobiliarios-en-" + slug + "/" };
}

// Label canónico de un barrio crudo ("Palermo Hollywood" → "Palermo" si hay landing; si no, tal cual).
export function barrioLabel(barrio) {
  const slug = landingDeBarrio(barrio);
  return slug ? BARRIO_CATALOGO[slug].label : String(barrio || "").trim();
}

// Card de proyecto: foto, nombre, chips (barrio · ambientes · entrega), precio desde y "por qué".
export function emailCard(c, { href, porque } = {}) {
  const precio = c.precioDesde ? money(c.precioDesde) : "Consultar precio";
  const chips = [c.barrio, c.ambientesLabel, c.entregaLabel].filter(Boolean).map(esc);
  const meta = chips.length
    ? '<tr><td style="padding-top:6px">' + chips.map((x) =>
        '<span style="display:inline-block;background:#f2f4f8;color:' + MUTE + ';font-size:12px;line-height:1;padding:6px 9px;border-radius:20px;margin:0 6px 6px 0">' + x + '</span>'
      ).join("") + '</td></tr>'
    : "";
  const link = esc(href || fichaUrl(c.slug));
  const src = absImg(c.imagen);
  const img = src
    ? '<a href="' + link + '" style="text-decoration:none"><img src="' + esc(src) + '" width="600" alt="' + esc(c.nombre) + '" style="display:block;width:100%;max-width:600px;height:auto;border-radius:14px 14px 0 0;object-fit:cover"></a>'
    : '<div style="height:8px;border-radius:14px 14px 0 0;background:' + NAVY + '"></div>';
  const why = porque
    ? '<tr><td style="padding-top:8px;font-size:13px;line-height:1.45;color:' + INK + '"><span style="color:' + GOLD + ';font-weight:bold">&#9679;</span> ' + esc(porque) + '</td></tr>'
    : "";
  return (
    '<tr><td style="padding:0 0 18px 0">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid ' + LINE + ';border-radius:14px;overflow:hidden">' +
    '<tr><td>' + img + '</td></tr>' +
    '<tr><td style="padding:16px 18px 18px 18px;font-family:Arial,Helvetica,sans-serif">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '<tr><td><a href="' + link + '" style="color:' + NAVY + ';font-size:17px;font-weight:bold;text-decoration:none;line-height:1.25">' + esc(c.nombre) + '</a></td></tr>' +
    meta +
    '<tr><td style="padding-top:10px;font-size:15px;color:' + GOLD + ';font-weight:bold">desde ' + esc(precio) + '</td></tr>' +
    why +
    '<tr><td style="padding-top:12px">' +
    '<a href="' + link + '" style="display:inline-block;background:' + NAVY + ';color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;padding:9px 16px;border-radius:8px">Ver ficha &rarr;</a>' +
    '</td></tr></table></td></tr></table></td></tr>'
  );
}

export function botonPrimario(href, label) {
  return '<a href="' + esc(href) + '" style="display:inline-block;background:' + GOLD + ';color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 26px;border-radius:10px">' + esc(label) + '</a>';
}

// Layout completo. Bloques opcionales: intro, cards, despuesCards (ej. "¿No te contactaron?"),
// cta (botón + nota), footer con motivo + baja + preferencias.
export function emailLayout({ titulo, preheader, introHtml = "", cardsHtml = "", despuesCardsHtml = "", ctaHtml = "", motivo = "", bajaUrl = "", prefsUrl = "" }) {
  const baja = bajaUrl
    ? '<p style="margin:8px 0 0 0;font-size:11px;line-height:1.6;color:#7c88a3">' + (motivo ? esc(motivo) + ' ' : '') +
      '<a href="' + esc(bajaUrl) + '" style="color:#c9d1e3;text-decoration:underline">Darme de baja</a>' +
      (prefsUrl ? ' &middot; <a href="' + esc(prefsUrl) + '" style="color:#c9d1e3;text-decoration:underline">Cambiar mis preferencias</a>' : '') + '</p>'
    : '<p style="margin:8px 0 0 0;font-size:11px;line-height:1.6;color:#7c88a3">' + (motivo ? esc(motivo) + ' ' : '') +
      'Si no quer&eacute;s recibir estos correos, respond&eacute; <b>BAJA</b>.' +
      (prefsUrl ? ' <a href="' + esc(prefsUrl) + '" style="color:#c9d1e3;text-decoration:underline">Cambiar mis preferencias</a>' : '') + '</p>';
  return (
'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<meta name="x-apple-disable-message-reformatting"><title>' + esc(titulo) + '</title></head>' +
'<body style="margin:0;padding:0;background:' + BG + '">' +
// Preheader oculto (+ relleno para que el cliente no muestre texto del cuerpo a continuación).
'<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:' + BG + ';font-size:1px;line-height:1px">' + esc(preheader || "") + '&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + BG + '"><tr><td align="center" style="padding:24px 12px">' +
'<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">' +
// Header
'<tr><td style="background:' + NAVY + ';background-image:linear-gradient(135deg,' + NAVY + ',' + NAVY2 + ');border-radius:16px 16px 0 0;padding:26px 24px">' +
'<div style="font-family:Arial,Helvetica,sans-serif;color:' + GOLD + ';font-size:12px;letter-spacing:2px;font-weight:bold">DEPARTAMENTOS EN POZO</div>' +
'<div style="font-family:Georgia,\'Times New Roman\',serif;color:#ffffff;font-size:23px;line-height:1.25;margin-top:8px">' + esc(titulo) + '</div>' +
'</td></tr>' +
// Intro
(introHtml ? '<tr><td style="background:#ffffff;padding:22px 24px 6px 24px;font-family:Arial,Helvetica,sans-serif">' + introHtml + '</td></tr>' : '') +
// Cards
(cardsHtml ? '<tr><td style="background:#ffffff;padding:18px 24px 4px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + cardsHtml + '</table></td></tr>' : '') +
(despuesCardsHtml ? '<tr><td style="background:#ffffff;padding:0 24px 8px 24px;font-family:Arial,Helvetica,sans-serif">' + despuesCardsHtml + '</td></tr>' : '') +
// CTA
(ctaHtml ? '<tr><td style="background:#ffffff;padding:6px 24px 26px 24px" align="center">' + ctaHtml + '</td></tr>' : '<tr><td style="background:#ffffff;height:12px"></td></tr>') +
// Footer
'<tr><td style="background:#0b1730;border-radius:0 0 16px 16px;padding:20px 24px;font-family:Arial,Helvetica,sans-serif">' +
'<div style="color:' + GOLD + ';font-size:11px;letter-spacing:1.5px;font-weight:bold">DEPARTAMENTOS EN POZO</div>' +
'<p style="margin:8px 0 0 0;font-size:11px;line-height:1.6;color:#98a4bd">Portal de an&aacute;lisis independiente de departamentos en pozo en CABA y GBA. No somos la desarrolladora ni la comercializadora de estos proyectos.</p>' +
baja +
'</td></tr>' +
'</table></td></tr></table></body></html>'
  );
}
