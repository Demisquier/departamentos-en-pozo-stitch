/** lib/wp.js — Capa de datos.
 *  MIGRACIÓN A REPO: ahora el contenido vive en /data/*.json dentro del repo
 *  (congelado desde WordPress con export_wp.py). Cada función LEE LOCAL primero
 *  y, sólo si el dato local todavía no existe, CAE a WordPress por REST (red de
 *  seguridad durante la transición). Cuando el export está cargado, WP no se toca.
 *  Mismas firmas y mismas formas de salida que antes → páginas/URLs/SEO 1:1.
 */
import fs from "node:fs";
import path from "node:path";

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
    val = null; // no existe todavía → caeremos a WP
  }
  _cache[name] = val;
  return val;
}
const hasLocal = (v) => Array.isArray(v) ? v.length > 0 : (v && Object.keys(v).length > 0);

// ---- WordPress ELIMINADO ----
// El contenido vive 100% en data/*.json. wpGet queda neutralizado (devuelve null):
// ya no existe ningún camino de red a WordPress. Si algún día faltara un data file,
// la función cae a vacío en vez de intentar WP (que ya no existe).
async function wpGet() {
  return null;
}

/** Schema JSON-LD de RankMath por ruta pública. Local primero (data/schemas.json),
 *  luego el endpoint del mu-plugin. Devuelve [] si no hay. */
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
  const a = await wpGet(`/pages?slug=${slug}&_embed=1`);
  return (a && a[0]) || { ...EMPTY_NODE, slug };
}
export async function getAllPages() {
  const local = loadData("pages");
  if (hasLocal(local)) return local.map((p) => ({ id: p.id, slug: p.slug, link: p.link, title: p.title, modified: p.modified }));
  return (await wpGet(`/pages?per_page=100&_fields=id,slug,link,title,modified`)) || [];
}

// ---- Posts (Novedades) ----
export async function getPosts(perPage = 100) {
  const local = loadData("posts");
  if (hasLocal(local)) return local.slice(0, perPage);
  return (await wpGet(`/posts?per_page=${perPage}&_embed=1`)) || [];
}
export async function getPostBySlug(slug) {
  const local = loadData("posts");
  if (hasLocal(local)) return local.find((p) => p.slug === slug) || null;
  const a = await wpGet(`/posts?slug=${slug}&_embed=1`);
  return (a && a[0]) || null;
}

// ---- Desarrollos (CPT — fichas de proyecto) ----
export async function getDesarrollos(perPage = 100) {
  const local = loadData("desarrollo");
  if (hasLocal(local)) return local.slice(0, perPage);
  return (await wpGet(`/desarrollo?per_page=${perPage}&_embed=1`)) || [];
}
export async function getDesarrolloBySlug(slug) {
  const local = loadData("desarrollo");
  if (hasLocal(local)) return local.find((p) => p.slug === slug) || null;
  const a = await wpGet(`/desarrollo?slug=${slug}&_embed=1`);
  return (a && a[0]) || null;
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
  if (hasLocal(local)) {
    out = local.map(mapDev);
  } else {
    for (let page = 1; page <= 5; page++) {
      const batch = await wpGet(`/desarrolladora?per_page=100&page=${page}&_fields=id,slug,title,meta`);
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const d of batch) out.push(mapDev(d));
      if (batch.length < 100) break;
    }
  }
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
  if (hasLocal(local)) {
    out = local.map(mapInmo);
  } else {
    for (let page = 1; page <= 3; page++) {
      const batch = await wpGet(`/inmobiliaria?per_page=100&page=${page}&_fields=id,slug,title,meta`);
      if (!Array.isArray(batch) || batch.length === 0) break;
      for (const d of batch) out.push(mapInmo(d));
      if (batch.length < 100) break;
    }
  }
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
  const ids = [9660, 9659, 9661, 9657, 9658, 9652];
  const local = loadData("desarrollo");
  if (hasLocal(local)) {
    const byId = new Map(local.map((d) => [d.id, d]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }
  return (await wpGet(`/desarrollo?include=${ids.join(",")}&_embed=1&orderby=include`)) || [];
}

// ---- Categorías ----
export async function getCategories() {
  const local = loadData("categories");
  if (hasLocal(local)) return local.map((c) => ({ id: c.id, slug: c.slug, name: c.name, count: c.count }));
  return (await wpGet(`/categories?per_page=100&_fields=id,slug,name,count`)) || [];
}
export async function getCategoryBySlug(slug) {
  const local = loadData("categories");
  if (hasLocal(local)) return local.find((c) => c.slug === slug) || null;
  const a = await wpGet(`/categories?slug=${slug}&_fields=id,slug,name,description`);
  return (a && a[0]) || null;
}
export async function getPostsByCategory(catId, perPage = 100) {
  const local = loadData("posts");
  if (hasLocal(local)) {
    return local.filter((p) => Array.isArray(p.categories) && p.categories.includes(catId)).slice(0, perPage);
  }
  return (await wpGet(`/posts?categories=${catId}&per_page=${perPage}&_embed=1`)) || [];
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

// ---- Helpers SEO (idénticos) ----
const SITE = "https://departamentosenpozo.com.ar";
const BRAND = "Departamentos en Pozo";

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
export function metaDescription(node) {
  let d = stripHtml(node?.excerpt?.rendered) || stripHtml(node?.content?.rendered);
  if (!d) return "";
  if (d.length > 158) d = d.slice(0, 155).replace(/\s+\S*$/, "") + "…";
  return d;
}
export function buildMeta(node, pathq, type = "website") {
  const rawTitle = stripHtml(node?.title?.rendered);
  const title = rawTitle ? `${rawTitle} | ${BRAND}` : `${BRAND} | Inversiones Inmobiliarias en Buenos Aires`;
  const description = metaDescription(node) ||
    "Análisis independiente de inversión en departamentos en pozo (preventa) en CABA y GBA.";
  const url = SITE + (pathq || "/");
  const img = featuredImage(node);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: type === "article" ? "article" : "website",
      title, description, url, siteName: BRAND, locale: "es_AR",
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: img ? "summary_large_image" : "summary",
      title, description, images: img ? [img] : undefined,
    },
  };
}
export function articleSchema(node, pathq) {
  const headline = stripHtml(node?.title?.rendered);
  const img = featuredImage(node);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description: metaDescription(node),
    datePublished: node?.date,
    dateModified: node?.modified || node?.date,
    image: img ? [img] : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE + (pathq || "/") },
    author: { "@type": "Organization", name: BRAND },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: SITE + "/logo.png" },
    },
  };
}

export { rel, SITE, BRAND };
