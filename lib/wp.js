/** lib/wp.js — Capa de datos "headless": Next lee el contenido desde tu WordPress por REST API.
 *  Vos seguís publicando en WordPress; Next renderiza el diseño Stitch con ese contenido.
 *  Todas las funciones son server-side (se ejecutan en build/SSG o en el server).
 */
const WP = (process.env.WP_HOST ? `https://${process.env.WP_HOST}` : "https://departamentosenpozo.com.ar") + "/wp-json/wp/v2";

// revalidate: ISR — regenera la página cada N segundos sin rebuild manual (contenido siempre fresco)
const REVALIDATE = 300;

// Resiliente: NUNCA tira error. Si WP no responde (o el entorno no tiene red a WP,
// ej. el sandbox de build), devuelve null y las funciones caen a vacío.
// En tu máquina o en Vercel (que sí llegan a WP) trae el contenido real.
async function wpGet(path) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
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
  const a = await wpGet(`/desarrollo?slug=${slug}&_embed=1`);
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
export function featuredImage(node) {
  return node?._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
}
export function acf(node, key) {
  return node?.acf?.[key] ?? node?.meta?.[key] ?? null;
}
export { rel };
