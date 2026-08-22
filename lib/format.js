// lib/format.js — Helpers de formato / normalización PUROS.
// Sin `node:fs` ni dependencias de servidor: seguros de importar tanto en componentes
// "use client" como en Server Components. Unifica las copias que vivían dispersas.

// Quita acentos y pasa a minúsculas (para búsquedas/comparaciones).
export const deaccent = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Expande la abreviatura "com." (= comercializa) del campo desarrolladora, que se leía
// confusa en la ficha y en las cards (ej. "Situar (com. RE/MAX)" → "Situar (comercializa RE/MAX)").
export function expandComercializa(s) {
  if (!s) return s;
  const out = String(s).replace(/\bcom\.\s*/gi, "comercializa ");
  return out.replace(/^comercializa\b/, "Comercializa");
}

// Normaliza a número: passthrough si ya es number; si es string, extrae los dígitos.
export function toNumber(v) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

// Limpia HTML y entidades comunes de WP a texto plano.
export function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&#039;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&hellip;/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

// Genera un id de ancla estable a partir del texto de un heading.
export const slugifyHeading = (s) =>
  (stripHtml(s) || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "seccion";

// Fecha larga en MAYÚSCULAS ("15 DE MAYO DE 2026" → "15 MAYO 2026" upper, es-AR).
export function formatDate(dateStr) {
  try {
    return new Date(dateStr)
      .toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
      .toUpperCase();
  } catch {
    return "";
  }
}

// Limpia tags/entidades del excerpt de WP y recorta a `max` caracteres.
export function cleanExcerpt(html, max = 220) {
  const text = (html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\[&hellip;\]/g, "…")
    .replace(/&hellip;/g, "…")
    .replace(/&#8230;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

// Categoría principal (nombre en MAYÚSCULAS) desde el _embedded del post, o null.
export function categoria(post) {
  const terms = post?._embedded?.["wp:term"]?.[0];
  const cat = Array.isArray(terms) ? terms.find((t) => t.taxonomy === "category") : null;
  return cat?.name ? cat.name.toUpperCase() : null;
}
