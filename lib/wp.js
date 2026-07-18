/** lib/wp.js — Capa de datos "headless": Next lee el contenido desde tu WordPress por REST API.
 *  Vos seguís publicando en WordPress; Next renderiza el diseño Stitch con ese contenido.
 *  Todas las funciones son server-side (se ejecutan en build/SSG o en el server).
 */
// OJO: el fallback apunta al CMS, NO al dominio público (que es este mismo front en Vercel).
// Si apuntara al front, todos los fetch caerían sobre Next y devolverían vacío en silencio.
const WP = (process.env.WP_HOST ? `https://${process.env.WP_HOST}` : "https://cms.departamentosenpozo.com.ar") + "/wp-json/wp/v2";

// revalidate: ISR — regenera la página cada N segundos sin rebuild manual (contenido siempre fresco)
const REVALIDATE = 300;

// Resiliente: NUNCA tira error. Si WP no responde (o el entorno no tiene red a WP,
// ej. el sandbox de build), devuelve null y las funciones caen a vacío.
// En tu máquina o en Vercel (que sí llegan a WP) trae el contenido real.
async function wpGet(path) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`${WP}${path}`, { next: { revalidate: REVALIDATE }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Igual que wpGet pero DISTINGUE "WP respondió que no hay nada" de "el fetch falló".
 *  Por qué importa: las fichas llaman notFound() cuando no reciben datos, y Next CACHEA
 *  ese 404. Con wpGet (que devuelve null en ambos casos), un timeout transitorio de WP
 *  dejaba la URL en 404 hasta el próximo build — fue exactamente lo que pasó con
 *  zeta-belgrano y haaus-ii-palermo-soho. Acá, si el transporte falla, TIRAMOS el error:
 *  Next no cachea un 404 falso, reintenta y mientras tanto sigue sirviendo la versión previa.
 *  Un array vacío (404 legítimo de WP) sí se devuelve normal.
 */
async function wpGetStrict(path, tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`${WP}${path}`, { next: { revalidate: REVALIDATE }, signal: ctrl.signal });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`WP ${res.status} en ${path}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 600));
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error(`WP inaccesible en ${path}: ${lastErr && lastErr.message}`);
}
// WP_HOST donde vive el WordPress (RankMath). Si no está seteado, cae al dominio público.
const WP_HOST = process.env.WP_HOST || "departamentosenpozo.com.ar";

/** Trae el schema JSON-LD que RankMath genera para una ruta pública, vía el mu-plugin
 *  `pozo-rankmath-head.php` (endpoint GET /wp-json/pozo/v1/head?url=...).
 *  Resiliente: try/catch + timeout, devuelve [] si algo falla o el endpoint no existe.
 *  `path` es la ruta pública canónica, ej. "/mi-slug/" o "/desarrolladoras-.../".
 */
export async function getRankMathSchema(path) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const publicUrl = `https://departamentosenpozo.com.ar${path || "/"}`;
    const endpoint = `https://${WP_HOST}/wp-json/pozo/v1/head?url=${encodeURIComponent(publicUrl)}`;
    const res = await fetch(endpoint, { next: { revalidate: REVALIDATE }, signal: ctrl.signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.schema) ? data.schema : [];
  } catch (e) {
    return [];
  } finally {
    clearTimeout(t);
  }
}

const EMPTY_NODE = { title: { rendered: "" }, content: { rendered: "" }, excerpt: { rendered: "" }, acf: {}, _embedded: {} };

const rel = (link) => (link || "").replace(/^https?:\/\/[^/]+/, "");

// ---- Páginas ----
export async function getPageBySlug(slug) {
  const a = await wpGet(`/pages?slug=${slug}&_embed=1`);
  return (a && a[0]) || { ...EMPTY_NODE, slug };
}
export async function getAllPages() {
  return (await wpGet(`/pages?per_page=100&_fields=id,slug,link,title,modified`)) || [];
}

// ---- Posts (Novedades) ----
export async function getPosts(perPage = 100) {
  return (await wpGet(`/posts?per_page=${perPage}&_embed=1`)) || [];
}
export async function getPostBySlug(slug) {
  const a = await wpGet(`/posts?slug=${slug}&_embed=1`);
  return (a && a[0]) || null;
}

// ---- Desarrollos (CPT — fichas de proyecto) ----
export async function getDesarrollos(perPage = 100) {
  return (await wpGet(`/desarrollo?per_page=${perPage}&_embed=1`)) || [];
}
export async function getDesarrolloBySlug(slug) {
  // strict: si WP no responde preferimos fallar (y que Next reintente) antes que
  // cachear un 404 falso sobre una ficha que sí existe.
  const a = await wpGetStrict(`/desarrollo?slug=${slug}&_embed=1`);
  return (a && a[0]) || null;
}
// Destacados para la home (IDs usados en el snippet 23 de WP)
export async function getDestacados() {
  const ids = [9660, 9659, 9661, 9657, 9658, 9652];
  return (await wpGet(`/desarrollo?include=${ids.join(",")}&_embed=1&orderby=include`)) || [];
}

// ---- Categorías ----
export async function getCategories() {
  return (await wpGet(`/categories?per_page=100&_fields=id,slug,name,count`)) || [];
}
export async function getCategoryBySlug(slug) {
  const a = await wpGet(`/categories?slug=${slug}&_fields=id,slug,name`);
  return (a && a[0]) || null;
}
export async function getPostsByCategory(catId, perPage = 100) {
  return (await wpGet(`/posts?categories=${catId}&per_page=${perPage}&_embed=1`)) || [];
}

// ---- Helpers de presentación ----
// El hosting bloquea la carga directa de imágenes desde cms.* (hotlink/WAF).
// Solución: servir SIEMPRE las imágenes de WP por el proxy same-origin /wp-content
// (rewrite en next.config → Vercel las trae server-side, sin referer del browser).
// Convierte cualquier URL absoluta de /wp-content|/wp-includes a ruta relativa.
export function toRelativeMedia(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/^https?:\/\/[^/]+(\/wp-(?:content|includes)\/)/, "$1");
}
// Reescribe las imágenes inline dentro del HTML de WP (content.rendered) a relativas.
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

// ---- Helpers SEO ----
const SITE = "https://departamentosenpozo.com.ar";
const BRAND = "Departamentos en Pozo";

// Quita HTML/entidades y colapsa espacios
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

// Meta description: usa excerpt; si no hay, primer tramo del contenido. ~155 chars.
export function metaDescription(node) {
  let d = stripHtml(node?.excerpt?.rendered) || stripHtml(node?.content?.rendered);
  if (!d) return "";
  if (d.length > 158) d = d.slice(0, 155).replace(/\s+\S*$/, "") + "…";
  return d;
}

/** Construye el objeto metadata de Next (title, description, canonical, OG, Twitter, robots).
 *  path = ruta pública canónica, ej. "/mi-slug/". type = "article" | "website".
 */
export function buildMeta(node, path, type = "website") {
  const rawTitle = stripHtml(node?.title?.rendered);
  const title = rawTitle ? `${rawTitle} | ${BRAND}` : `${BRAND} | Inversiones Inmobiliarias en Buenos Aires`;
  const description = metaDescription(node) ||
    "Análisis independiente de inversión en departamentos en pozo (preventa) en CABA y GBA.";
  const url = SITE + (path || "/");
  const img = featuredImage(node);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: type === "article" ? "article" : "website",
      title,
      description,
      url,
      siteName: BRAND,
      locale: "es_AR",
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: img ? "summary_large_image" : "summary",
      title,
      description,
      images: img ? [img] : undefined,
    },
  };
}

/** JSON-LD BlogPosting para posts (schema Article básico). Devuelve objeto para <script>. */
export function articleSchema(node, path) {
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
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE + (path || "/") },
    author: { "@type": "Organization", name: BRAND },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: SITE + "/logo.png" },
    },
  };
}

export { rel, SITE, BRAND };
