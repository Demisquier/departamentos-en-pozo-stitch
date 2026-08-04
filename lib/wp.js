/** lib/wp.js — Barrel de compatibilidad (histórico).
 *  WordPress fue ELIMINADO: el contenido vive 100% en /data/*.json. Este archivo ya
 *  no contiene lógica; sólo RE-EXPORTA la capa de datos (lib/content.js) y los helpers
 *  de SEO (lib/seo.js) para no romper los ~30 imports existentes `from ".../lib/wp"`.
 *  Formas de salida y firmas idénticas a antes → páginas/URLs/SEO 1:1.
 *
 *  Módulos reales:
 *    - lib/content.js → getters de datos + normalización + presentación de contenido.
 *    - lib/seo.js     → buildMeta, articleSchema, breadcrumbSchema, metaDescription.
 *    - lib/format.js  → stripHtml, slugifyHeading, deaccent, toNumber, formatDate…
 *    - lib/constants.js → SITE, BRAND, …
 */
export {
  // datos
  getRankMathSchema,
  getPageBySlug,
  getAllPages,
  getPosts,
  getPostBySlug,
  getDesarrollos,
  getDesarrolloBySlug,
  getDesarrolladoras,
  getInmobiliarias,
  getCorralones,
  getDesarrolladoraBySlug,
  getDestacados,
  getCategories,
  getCategoryBySlug,
  getPostsByCategory,
  // presentación de contenido
  toRelativeMedia,
  fixImgs,
  featuredImage,
  acf,
  readingTimeMinutes,
  addHeadingIds,
  primaryCategory,
  relatedPosts,
  rel,
} from "./content";

export {
  metaDescription,
  buildMeta,
  articleSchema,
  breadcrumbSchema,
} from "./seo";

export { SITE, BRAND } from "./constants";
export { stripHtml } from "./format";
