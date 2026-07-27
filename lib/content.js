/** lib/content.js — Capa de datos (lectura local del repo).
 *  El contenido vive 100% en /data/*.json dentro del repo (congelado desde WordPress
 *  con export_wp.py). WordPress fue ELIMINADO: no queda ningún camino de red. Cada
 *  getter LEE LOCAL y devuelve la misma forma de salida que antes → páginas/URLs/SEO 1:1.
 *
 *  Este módulo agrupa: lectura+cache de data/*.json, los getters de contenido
 *  (posts/páginas/desarrollos/desarrolladoras/inmobiliarias/categorías), la
 *  normalización de entidades (mapDev/mapInmo) y los helpers de presentación de
 *  contenido (imágenes locales, TOC, tiempo de lectura, relacionados, breadcrumb).
 */
import fs from "node:fs";
import path from "node:path";
import { DESTACADOS_IDS } from "./constants";
import { stripHtml, slugifyHeading } from "./format";

// ---- Lectura local (repo/data/*.json) con cache ----
const _cache = {};
function loadData(name) {
  if (name in _cache) return _cache[name];
  let val = null;
  try {
    const p = path.join(process.cwd(), "data", `${name}.json`);
    const raw = fs.readFileSync(p, "utf8");
    val = JSON.parse(raw);
  } catch (e) {
    val = null; // el data file no existe todavía → devolvemos vacío
  }
  _cache[name] = val;
  return val;
}
const hasLocal = (v) => (Array.isArray(v) ? v.length > 0 : (v && Object.keys(v).length > 0));

/** Schema JSON-LD (RankMath) por ruta pública, leído de data/schemas.json.
 *  Hoy schemas.json está vacío → devuelve []. Firma estable (varias páginas lo llaman). */
export async function getRankMathSchema(pubPath) {
  const schemas = loadData("schemas");
  if (schemas && typeof schemas === "object") {
    const s = schemas[pubPath || "/"];
    return Array.isArray(s) ? s : [];
  }
  return [];
}

const EMPTY_NODE = { title: { rendered: "" }, content: { rendered: "" }, excerpt: { rendered: "" }, acf: {}, _embedded: {} };
const rel = (link) => (link || "").replace(/^https?:\/\/[^/]+/, "");

// ---- Páginas ----
export async function getPageBySlug(slug) {
  const local = loadData("pages");
  if (hasLocal(local)) {
    const found = local.find((p) => p.slug === slug);
    return found || { ...EMPTY_NODE, slug };
  }
  return { ...EMPTY_NODE, slug };
}
export async function getAllPages() {
  const local = loadData("pages");
  if (hasLocal(local)) return local.map((p) => ({ id: p.id, slug: p.slug, link: p.link, title: p.title, modified: p.modified }));
  return [];
}

// ---- Posts (Novedades) ----
export async function getPosts(perPage = 100) {
  const local = loadData("posts");
  if (hasLocal(local)) return local.slice(0, perPage);
  return [];
}
export async function getPostBySlug(slug) {
  const local = loadData("posts");
  if (hasLocal(local)) return local.find((p) => p.slug === slug) || null;
  return null;
}

// ---- Desarrollos (CPT — fichas de proyecto) ----
export async function getDesarrollos(perPage = 100) {
  const local = loadData("desarrollo");
  if (hasLocal(local)) return local.slice(0, perPage);
  return [];
}
export async function getDesarrolloBySlug(slug) {
  const local = loadData("desarrollo");
  if (hasLocal(local)) return local.find((p) => p.slug === slug) || null;
  return null;
}

// ---- Directorio de desarrolladoras (CPT `desarrolladora`) ----
function mapDev(d) {
  const m = d.meta || {};
  const slugs = (m.dev_proyectos_slug || "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    id: d.id,
    slug: d.slug || "",
    nombre: (d.title && (d.title.rendered || d.title.raw)) || "",
    web: m.dev_web || "",
    desc: m.dev_desc || "",
    destacada: !!m.dev_destacada,
    iniciales: m.dev_iniciales || "",
    badge: m.dev_badge || "",
    anios: m.dev_anios || "",
    volumen: m.dev_volumen || "",
    barrios: m.dev_barrios || "",
    barriosKey: m.dev_barrios_key || "",
    proyecto: m.dev_proyecto || "",
    estructura: m.dev_estructura || "",
    proyectosSlug: slugs,
  };
}

export async function getDesarrolladoras() {
  const local = loadData("desarrolladora");
  let out = [];
  if (hasLocal(local)) out = local.map(mapDev);
  out.sort((a, b) => (b.destacada - a.destacada) || a.nombre.localeCompare(b.nombre, "es"));
  return out;
}

// ---- Directorio de inmobiliarias (CPT `inmobiliaria`) ----
function mapInmo(d) {
  const m = d.meta || {};
  return {
    id: d.id,
    slug: d.slug || "",
    nombre: (d.title && (d.title.rendered || d.title.raw)) || "",
    web: m.inm_web || "",
    iniciales: m.inm_iniciales || "",
    badge: m.inm_badge || "",
    matricula: m.inm_matricula || "",
    espec: m.inm_espec || "",
    avisos: m.inm_avisos || "",
    sucursales: m.inm_sucursales || "",
    zonas: m.inm_zonas || "",
    zonasKey: m.inm_zonas_key || "",
    destacada: !!m.inm_destacada,
  };
}
export async function getInmobiliarias() {
  const local = loadData("inmobiliaria");
  let out = [];
  if (hasLocal(local)) out = local.map(mapInmo);
  out.sort((a, b) => (b.destacada - a.destacada) || a.nombre.localeCompare(b.nombre, "es"));
  return out;
}

// Una desarrolladora por slug (para su landing) + sus proyectos resueltos.
export async function getDesarrolladoraBySlug(slug) {
  const all = await getDesarrolladoras();
  const dev = all.find((d) => d.slug === slug) || null;
  if (!dev) return null;
  let proyectos = [];
  if (dev.proyectosSlug.length) {
    const allP = await getDesarrollos();
    proyectos = (allP || []).filter((p) => dev.proyectosSlug.includes(p.slug));
  }
  return { dev, proyectos };
}

// Destacados para la home (IDs del snippet 23 de WP)
export async function getDestacados() {
  const ids = DESTACADOS_IDS;
  const local = loadData("desarrollo");
  if (hasLocal(local)) {
    const byId = new Map(local.map((d) => [d.id, d]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }
  return [];
}

// ---- Categorías ----
export async function getCategories() {
  const local = loadData("categories");
  if (hasLocal(local)) return local.map((c) => ({ id: c.id, slug: c.slug, name: c.name, count: c.count }));
  return [];
}
export async function getCategoryBySlug(slug) {
  const local = loadData("categories");
  if (hasLocal(local)) return local.find((c) => c.slug === slug) || null;
  return null;
}
export async function getPostsByCategory(catId, perPage = 100) {
  const local = loadData("posts");
  if (hasLocal(local)) {
    return local.filter((p) => Array.isArray(p.categories) && p.categories.includes(catId)).slice(0, perPage);
  }
  return [];
}

// ---- Helpers de presentación (imágenes ahora locales en /public) ----
export function toRelativeMedia(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/^https?:\/\/[^/]+(\/wp-(?:content|includes)\/)/, "$1");
}
export function fixImgs(html) {
  if (!html || typeof html !== "string") return html;
  return html.replace(
    /https?:\/\/(?:cms\.|www\.)?departamentosenpozo\.com\.ar(\/wp-(?:content|includes)\/)/g,
    "$1"
  );
}
export function featuredImage(node) {
  return toRelativeMedia(node?._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null);
}
export function acf(node, key) {
  return node?.acf?.[key] ?? node?.meta?.[key] ?? null;
}

// ---- Helpers de blog (TOC, tiempo de lectura, categoría, relacionados) ----

// Tiempo de lectura estimado en minutos (~200 palabras/min de lectura en español).
export function readingTimeMinutes(html) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Inyecta un id en cada <h2> del contenido (para anclas del índice) y devuelve
// { html, toc: [{id,text}] }. Reutiliza el id si el h2 ya trae uno.
export function addHeadingIds(html) {
  if (!html || typeof html !== "string") return { html: html || "", toc: [] };
  const toc = [];
  const used = new Set();
  const out = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    const text = stripHtml(inner);
    if (!text) return m;
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    let id;
    if (idMatch) {
      id = idMatch[1];
    } else {
      id = slugifyHeading(text);
      const base = id;
      let n = 2;
      while (used.has(id)) id = `${base}-${n++}`;
    }
    used.add(id);
    toc.push({ id, text });
    const newAttrs = idMatch ? attrs : `${attrs} id="${id}"`;
    return `<h2${newAttrs}>${inner}</h2>`;
  });
  return { html: out, toc };
}

// Categoría principal desde el _embedded (para el chip/link del artículo).
export function primaryCategory(node) {
  const terms = node?._embedded?.["wp:term"]?.[0];
  const cat = Array.isArray(terms) ? terms.find((t) => t.taxonomy === "category") : null;
  return cat && cat.name ? { name: cat.name, slug: cat.slug } : null;
}

// Posts relacionados: comparten al menos una categoría con el post actual.
export function relatedPosts(node, all, limit = 3) {
  const cats = new Set(node?.categories || []);
  if (!cats.size) return (all || []).filter((p) => p.id !== node.id).slice(0, limit);
  const shared = (all || [])
    .filter((p) => p.id !== node.id && Array.isArray(p.categories) && p.categories.some((c) => cats.has(c)));
  if (shared.length >= limit) return shared.slice(0, limit);
  // Completar con recientes si faltan.
  const extra = (all || []).filter((p) => p.id !== node.id && !shared.includes(p));
  return [...shared, ...extra].slice(0, limit);
}

export { rel };
