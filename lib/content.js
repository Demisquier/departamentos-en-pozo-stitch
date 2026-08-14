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
  // Guias extra: posts-extra.json se concatena a posts (archivo aparte porque posts.json
  // ya pesa mas de 1MB y no se puede editar/subir entero por el editor web de GitHub).
  if (name === "posts") {
    try {
      const extra = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "posts-extra.json"), "utf8"));
      if (Array.isArray(extra) && extra.length) val = [...(Array.isArray(val) ? val : []), ...extra];
    } catch {}
    // Pillar "que es un departamento en pozo": archivo aparte (mismo motivo que posts-extra).
    try {
      const pillar = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "posts-pillar.json"), "utf8"));
      if (Array.isArray(pillar) && pillar.length) val = [...(Array.isArray(val) ? val : []), ...pillar];
    } catch {}
    // Imagen destacada por slug (post-images.json): fotos con licencia (Pexels/CC0) +
    // credito con link. Reemplaza la imagen de las guias sin foto y de las que tenian mal
    // aspecto. Se inyecta en _embedded (featuredImage la rutea por weserv) y en meta (credito).
    try {
      const pimg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "post-images.json"), "utf8"));
      if (Array.isArray(val)) {
        for (const p of val) {
          const ov = pimg[p && p.slug];
          if (ov && ov.url) {
            p._embedded = p._embedded || {};
            p._embedded["wp:featuredmedia"] = [{ source_url: ov.url }];
            p.meta = { ...(p.meta || {}), image_credit: ov.credit || "", image_credit_url: ov.credit_url || "" };
          }
        }
      }
    } catch {}
  }
  // Desarrollos extra: desarrollo-extra.json se concatena a "desarrollo" (archivo aparte
  // porque desarrollo.json ya pesa ~800KB y no se puede editar/subir entero por el editor web).
  if (name === "desarrollo") {
    try {
      const dx = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "desarrollo-extra.json"), "utf8"));
      if (Array.isArray(dx) && dx.length) val = [...(Array.isArray(val) ? val : []), ...dx];
    } catch {}
    // Overrides de enriquecimiento (render/desarrolladora/amenities/precio) para fichas viejas
    // sin tocar el desarrollo.json de 793KB. Keyed por id. Solo completa lo que está vacío.
    try {
      const ov = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "desarrollo-overrides.json"), "utf8"));
      if (ov && typeof ov === "object" && Array.isArray(val)) {
        for (const item of val) {
          const o = ov[item.id];
          if (!o) continue;
          item.acf = item.acf || {};
          if (o.render_url && !(item._embedded && item._embedded["wp:featuredmedia"])) {
            item._embedded = { "wp:featuredmedia": [{ source_url: o.render_url }] };
          }
          if (o.desarrolladora && !item.acf.desarrolladora) item.acf.desarrolladora = o.desarrolladora;
          if (o.amenities && !item.acf.amenities) item.acf.amenities = o.amenities;
          if (o.precio_desde && !item.acf.precio_desde) item.acf.precio_desde = o.precio_desde;
        }
      }
    } catch {}
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

// Quita los <script type="application/ld+json"> que el WordPress viejo (RankMath) dejó
// EMBEBIDOS en el HTML del contenido. En SSR esos scripts se sirven en el body y DUPLICABAN
// el schema limpio que ya emitimos en <head> (Article/BreadcrumbList/Organization con logo 404).
// Rescatamos sólo los tipos con valor de rich-result (FAQPage/Dataset/AboutPage) para
// re-emitirlos deduplicados y con @context.
const KEEP_SCHEMA = new Set(["FAQPage", "Dataset", "AboutPage"]);
export function stripEmbeddedSchema(html) {
  const keep = [];
  const cleaned = String(html || "").replace(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    (_m, body) => {
      try {
        const parsed = JSON.parse(String(body).trim());
        const arr = Array.isArray(parsed) ? parsed : (parsed && parsed["@graph"] ? parsed["@graph"] : [parsed]);
        for (const o of arr) {
          if (!o || typeof o !== "object") continue;
          let t = o["@type"];
          if (Array.isArray(t)) t = t.find((x) => KEEP_SCHEMA.has(x)) || t[0];
          if (KEEP_SCHEMA.has(t)) { if (!o["@context"]) o["@context"] = "https://schema.org"; keep.push(o); }
        }
      } catch {}
      return "";
    }
  );
  const seen = new Set();
  const uniq = keep.filter((o) => { const k = (o["@type"] || "") + "|" + (o.name || o.headline || ""); return seen.has(k) ? false : seen.add(k); });
  return { html: cleaned, keep: uniq };
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
export async function getDesarrollos(perPage = 1000) {
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

// Corralones y proveedores de materiales (data/corralon.json ya viene normalizado).
// Ordena: destacados primero, luego alfabetico. Fabricantes bajan al final por tipoKey.
export async function getCorralones() {
  const local = loadData("corralon");
  let out = Array.isArray(local) ? local.slice() : [];
  const rank = { corralon: 0, retail: 1, fabricante: 2 };
  out.sort((a, b) =>
    (b.destacada - a.destacada) ||
    ((rank[a.tipoKey] ?? 9) - (rank[b.tipoKey] ?? 9)) ||
    a.nombre.localeCompare(b.nombre, "es")
  );
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
  // Solo re-escribe a relativo el /wp-content DE NUESTRO dominio (imágenes locales en /public).
  // Los /wp-content de sitios de terceros (ej. bmaestudio.com.ar) NO se tocan → van por weserv.
  return url.replace(/^https?:\/\/(?:www\.|cms\.)?departamentosenpozo\.com\.ar(\/wp-(?:content|includes)\/)/, "$1");
}
export function fixImgs(html) {
  if (!html || typeof html !== "string") return html;
  return html.replace(
    /https?:\/\/(?:cms\.|www\.)?departamentosenpozo\.com\.ar(\/wp-(?:content|includes)\/)/g,
    "$1"
  );
}
export function featuredImage(node, fmt = "webp") {
  const rel = toRelativeMedia(node?._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null);
  // Las imágenes locales (/wp-content/...) se sirven directo. Las externas (renders de
  // fichas nuevas alojados en CDN de terceros con hotlink protection) se rutean por un
  // proxy de imágenes (weserv): las trae server-side sin nuestro Referer y las cachea.
  if (rel && /^https?:\/\//i.test(rel)) {
    // output=webp + q=80: WebP pesa ~30-50% menos que JPG y lo soporta el ~97% de los
    // navegadores. Optimiza el LCP de todas las imágenes destacadas (guías/novedades).
    return `https://images.weserv.nl/?url=${encodeURIComponent(rel.replace(/^https?:\/\//, ""))}&w=1200&output=${fmt}&q=80`;
  }
  return rel;
}

// Igual que featuredImage pero para una URL suelta (imágenes de galería de las fichas).
// Externas → proxy weserv (esquiva hotlink); locales → relativas directo. Devuelve null si vacío.
export function proxyImage(url, w = 1600) {
  const r = toRelativeMedia(url || null);
  if (!r) return null;
  if (/^https?:\/\//i.test(r)) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(r.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=80`;
  }
  return r;
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
