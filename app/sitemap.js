import { getAllPages, getPosts, getDesarrollos, getCategories, getDesarrolladoras, getInmobiliarias, getInmobiliariasExtra, rel } from "../lib/wp";
import { SITE as BASE } from "../lib/constants";
import { ZONA_INMO_LABEL, BARRIO_CATALOGO, matchBarrioCatalogo } from "../lib/barrios";
import { mapDesarrollos } from "../lib/catalogo";

/* Sitemap dinámico: mantiene TODAS las URLs indexadas (preservación SEO).
 * Resiliente: si WP no responde, al menos devuelve las rutas fijas. */
export default async function sitemap() {
  const fixed = ["/", "/desarrollos-inmobiliarios/", "/buscar/", "/contacto/", "/sobre-nosotros/", "/novedades/", "/simulador-cuota-cac-pozo/", "/alertas-de-lanzamientos-en-pozo/", "/invertir-desde-el-exterior/", "/corralones-y-materiales-de-construccion-en-caba/", "/videos-de-emprendimientos-en-pozo/"].map((u) => ({
    url: BASE + u,
    lastModified: new Date(),
  }));

  const out = [...fixed];
  try {
    const [pages, posts, desa, cats, devs, inmo, inmoExtra] = await Promise.all([getAllPages(), getPosts(100), getDesarrollos(1000), getCategories(), getDesarrolladoras(), getInmobiliarias(), getInmobiliariasExtra()]);
    // Páginas de inmobiliarias por barrio (sintéticas, no son páginas WP): zonas con ≥3 inmobiliarias.
    const zonaCount = {};
    for (const d of inmo || []) for (const k of String(d.zonasKey || "").split(/\s+/).filter(Boolean)) zonaCount[k] = (zonaCount[k] || 0) + 1;
    for (const k of Object.keys(zonaCount)) if (zonaCount[k] >= 3 && ZONA_INMO_LABEL[k]) out.push({ url: BASE + `/mejores-inmobiliarias-en-${k}/`, lastModified: new Date() });
    // Landings de catálogo por barrio (/desarrollos-inmobiliarios-en-{barrio}/): ≥3 proyectos.
    const mappedCat = mapDesarrollos(desa || []);
    for (const k of Object.keys(BARRIO_CATALOGO)) if (mappedCat.filter((i) => matchBarrioCatalogo(i.barrio, k)).length >= 3) out.push({ url: BASE + `/desarrollos-inmobiliarios-en-${k}/`, lastModified: new Date() });
    for (const p of pages || []) out.push({ url: BASE + rel(p.link), lastModified: new Date() });
    for (const p of posts || []) out.push({ url: BASE + `/${p.slug}/`, lastModified: new Date(p.modified || Date.now()) });
    for (const d of desa || []) out.push({ url: BASE + `/desarrollos-inmobiliarios/${d.slug}/`, lastModified: new Date(d.modified || Date.now()) });
    for (const c of cats || []) if (c.slug && c.slug !== "uncategorized" && (c.count || 0) > 0) out.push({ url: BASE + `/category/${c.slug}/`, lastModified: new Date() });
    // Landings de desarrolladora: TODAS (cada dev tiene su perfil, con o sin proyectos cargados).
    for (const d of devs || []) if (d.slug) out.push({ url: BASE + `/desarrolladoras/${d.slug}/`, lastModified: new Date() });
    // Landings de inmobiliaria: solo las que tienen proyectos comercializados cargados (evita thin content).
    for (const d of inmo || []) if (d.slug && d.landeable) out.push({ url: BASE + `/inmobiliaria/${d.slug}/`, lastModified: new Date() });
    for (const d of inmoExtra || []) if (d.slug && d.landeable && (d.proyectosSlug || []).length >= 2) out.push({ url: BASE + `/inmobiliaria/${d.slug}/`, lastModified: new Date() });
  } catch (e) {
    // WP no disponible en build: devolvemos al menos las rutas fijas
  }
  // dedupe por url
  const seen = new Set();
  return out.filter((x) => (seen.has(x.url) ? false : seen.add(x.url)));
}
