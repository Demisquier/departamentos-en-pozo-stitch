import { getAllPages, getPosts, getDesarrollos, getCategories, getDesarrolladoras, getInmobiliarias, getInmobiliariasExtra, rel } from "../lib/wp";
import { SITE as BASE } from "../lib/constants";
import { ZONA_INMO_LABEL, BARRIO_CATALOGO, matchBarrioCatalogo } from "../lib/barrios";
import { mapDesarrollos } from "../lib/catalogo";

/* Sitemap dinámico: mantiene TODAS las URLs indexadas (preservación SEO).
 * Resiliente: si WP no responde, al menos devuelve las rutas fijas. */
export default async function sitemap() {
  const fixed = ["/", "/desarrollos-inmobiliarios/", "/buscar/", "/contacto/", "/sobre-nosotros/", "/novedades/", "/simulador-cuota-cac-pozo/", "/alertas-de-lanzamientos-en-pozo/", "/invertir-desde-el-exterior/", "/corralones-y-materiales-de-construccion-en-caba/", "/videos-de-emprendimientos-en-pozo/", "/desarrolladoras-inmobiliarias-mas-grandes-de-argentina/", "/ranking-desarrolladoras-confiables/", "/desarrolladoras-con-obras-entregadas/", "/desarrolladoras-premiadas/", "/metodologia-sellos-desarrolladoras/", "/ranking-inmobiliarias-confiables/", "/proyectos-en-pozo-de-desarrolladoras-confiables/", "/politica-de-privacidad/", "/creditos-y-fuentes/", "/soy-inmobiliaria/", "/precio-departamentos-en-pozo-caba/", "/departamentos-en-pozo-en-cuotas/", "/inmobiliarias-que-venden-proyectos-en-pozo/", "/departamentos-en-pozo-zona-norte/", "/monoambientes-en-pozo/", "/fideicomiso-al-costo/", "/invertir-en-ladrillo/", "/rentabilidad-alquiler-caba-por-barrio/", "/departamentos-en-construccion/"].map((u) => ({
    url: BASE + u,
    lastModified: new Date(),
  }));

  const out = [...fixed];
  try {
    const [pages, posts, desa, cats, devs, inmo, inmoExtra] = await Promise.all([getAllPages(), getPosts(5000), getDesarrollos(5000), getCategories(), getDesarrolladoras(), getInmobiliarias(), getInmobiliariasExtra()]);
    // Páginas de inmobiliarias por barrio (sintéticas, no son páginas WP): zonas con ≥3 inmobiliarias.
    const zonaCount = {};
    for (const d of inmo || []) for (const k of String(d.zonasKey || "").split(/\s+/).filter(Boolean)) zonaCount[k] = (zonaCount[k] || 0) + 1;
    for (const k of Object.keys(zonaCount)) if (zonaCount[k] >= 3 && ZONA_INMO_LABEL[k]) out.push({ url: BASE + `/mejores-inmobiliarias-en-${k}/`, lastModified: new Date() });
    // Landings de catálogo por barrio (/desarrollos-inmobiliarios-en-{barrio}/): ≥3 proyectos.
    const mappedCat = mapDesarrollos(desa || []);
    for (const k of Object.keys(BARRIO_CATALOGO)) if (mappedCat.filter((i) => matchBarrioCatalogo(i.barrio, k)).length >= 3) out.push({ url: BASE + `/desarrollos-inmobiliarios-en-${k}/`, lastModified: new Date() });
    for (const p of pages || []) out.push({ url: BASE + rel(p.link), lastModified: new Date() });
    // Guías fusionadas con 301 (next.config.js): no van al sitemap.
    const REDIR = new Set(["contrato-de-pozo-en-argentina-clausulas-clave-que-deberias-entender-antes-de-firmar", "precios-de-departamentos-en-pozo-por-barrio-en-caba-2026", "indice-precios-pozo-caba-por-barrio", "8-desarrolladoras-de-departamentos-en-pozo-en-caba-con-proyectos-entregados", "desarrolladoras-de-departamentos-en-pozo-como-evaluarlas-y-reducir-riesgos-al-invertir", "como-elegir-escribano-para-comprar-en-pozo", "mejores-barrios-para-invertir-en-pozo-en-caba-como-elegir-zona-sin-equivocarte", "tendencias-en-departamentos-en-pozo-tipologias-amenities-y-que-se-vende-mas-facil", "estrategia-alquiler-en-pozo-que-tipologia-comprar-y-como-asegurar-demanda", "estrategia-reventa-en-pozo-cuando-entrar-cuando-salir-y-como-maximizar-ganancia", "como-elegir-un-emprendimiento-en-pozo-guia-completa-para-reducir-riesgo"]);
    for (const p of (posts || []).filter((x) => !REDIR.has(x.slug))) out.push({ url: BASE + `/${p.slug}/`, lastModified: new Date(p.modified || Date.now()) });
    for (const d of desa || []) out.push({ url: BASE + `/desarrollos-inmobiliarios/${d.slug}/`, lastModified: new Date(d.modified || Date.now()) });
    for (const c of cats || []) if (c.slug && c.slug !== "uncategorized" && (c.count || 0) > 0) out.push({ url: BASE + `/category/${c.slug}/`, lastModified: new Date() });
    // Landings de desarrolladora: TODAS (cada dev tiene su perfil, con o sin proyectos cargados).
    for (const d of devs || []) if (d.slug) out.push({ url: BASE + `/desarrolladoras/${d.slug}/`, lastModified: new Date() });
    // Landings de inmobiliaria: solo las que tienen proyectos comercializados cargados (evita thin content).
    // Se valida con la misma función que usa la página: si sus proyectos quedaron ocultos (bajas, <6 fotos)
    // la landing da 404 y no debe ir al sitemap (QA nov-2026: 6 URLs 404 en el sitemap).
    const candInmo = [...(inmo || []).filter((d) => d.slug && d.landeable), ...(inmoExtra || []).filter((d) => d.slug && d.landeable && (d.proyectosSlug || []).length >= 2)];
    const vistos = new Set();
    const publicados = new Set((desa || []).map((x) => x.slug));
    for (const d of candInmo) {
      if (vistos.has(d.slug)) continue; vistos.add(d.slug);
      const ok = (d.proyectosSlug || []).some((s) => publicados.has(s));
      if (ok) out.push({ url: BASE + `/inmobiliaria/${d.slug}/`, lastModified: new Date() });
    }
  } catch (e) {
    // WP no disponible en build: devolvemos al menos las rutas fijas
  }
  // dedupe por url
  const seen = new Set();
  return out.filter((x) => (seen.has(x.url) ? false : seen.add(x.url)));
}
