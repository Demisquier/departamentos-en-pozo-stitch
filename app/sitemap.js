import { getAllPages, getPosts, getDesarrollos, getCategories, getDesarrolladoras, rel } from "../lib/wp";

const BASE = "https://departamentosenpozo.com.ar";

/* Sitemap dinámico: mantiene TODAS las URLs indexadas (preservación SEO).
 * Resiliente: si WP no responde, al menos devuelve las rutas fijas. */
export default async function sitemap() {
  const fixed = ["/", "/desarrollos-inmobiliarios/", "/contacto/", "/sobre-nosotros/", "/novedades/"].map((u) => ({
    url: BASE + u,
    lastModified: new Date(),
  }));

  const out = [...fixed];
  try {
    const [pages, posts, desa, cats, devs] = await Promise.all([getAllPages(), getPosts(100), getDesarrollos(100), getCategories(), getDesarrolladoras()]);
    for (const p of pages || []) out.push({ url: BASE + rel(p.link), lastModified: new Date() });
    for (const p of posts || []) out.push({ url: BASE + `/${p.slug}/`, lastModified: new Date(p.modified || Date.now()) });
    for (const d of desa || []) out.push({ url: BASE + `/desarrollos-inmobiliarios/${d.slug}/`, lastModified: new Date(d.modified || Date.now()) });
    for (const c of cats || []) if (c.slug && c.slug !== "uncategorized" && (c.count || 0) > 0) out.push({ url: BASE + `/category/${c.slug}/`, lastModified: new Date() });
    // Landings de desarrolladora: solo las que tienen proyectos (las vacías serían thin).
    for (const d of devs || []) if (d.slug && d.proyectosSlug && d.proyectosSlug.length > 0) out.push({ url: BASE + `/desarrolladoras/${d.slug}/`, lastModified: new Date() });
  } catch (e) {
    // WP no disponible en build: devolvemos al menos las rutas fijas
  }
  // dedupe por url
  const seen = new Set();
  return out.filter((x) => (seen.has(x.url) ? false : seen.add(x.url)));
}
