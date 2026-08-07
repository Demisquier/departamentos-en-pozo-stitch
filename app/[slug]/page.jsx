import { notFound } from "next/navigation";
import { getPageBySlug, getPostBySlug, getAllPages, getPosts, featuredImage, buildMeta, getRankMathSchema, fixImgs, stripEmbeddedSchema, getDesarrolladoras, getInmobiliarias, getDesarrollos, SITE } from "../../lib/wp";
import { BARRIO_CPT, ZONA_INMO_LABEL, BARRIO_CATALOGO, matchBarrioCatalogo } from "../../lib/barrios";
import { mapDesarrollos } from "../../lib/catalogo";
import { CATALOGO_BARRIO_INTRO } from "../../lib/catalogoBarrioIntros";
import PostView from "../_views/PostView";
import BarrioView from "../_views/BarrioView";
import PageView from "../_views/PageView";
import InmobiliariasBarrioView from "../_views/InmobiliariasBarrioView";
import CatalogoBarrioView from "../_views/CatalogoBarrioView";

// Zonas con ≥3 inmobiliarias → páginas /mejores-inmobiliarias-en-{barrio}/ (mismo patrón que devs).
async function inmoBarrioSlugs() {
  try {
    const inmo = await getInmobiliarias();
    const count = {};
    for (const d of inmo || []) for (const k of String(d.zonasKey || "").split(/\s+/).filter(Boolean)) count[k] = (count[k] || 0) + 1;
    return Object.keys(count).filter((k) => count[k] >= 3 && ZONA_INMO_LABEL[k]).map((k) => `mejores-inmobiliarias-en-${k}`);
  } catch { return []; }
}

// Landings de catálogo por barrio (/desarrollos-inmobiliarios-en-{barrio}/): solo barrios de
// BARRIO_CATALOGO con al menos 3 proyectos reales (evita páginas thin).
// (URL renombrada desde /departamentos-en-pozo-en-{barrio}/ → 301 en next.config.js).
async function catalogoBarrioSlugs() {
  try {
    const items = mapDesarrollos(await getDesarrollos());
    return Object.keys(BARRIO_CATALOGO)
      .filter((k) => items.filter((i) => matchBarrioCatalogo(i.barrio, k)).length >= 3)
      .map((k) => `desarrollos-inmobiliarios-en-${k}`);
  } catch { return []; }
}

export const dynamicParams = !process.env.EXPORT;
// Revalidación ISR: las páginas servidas por este route (barrios, posts, páginas WP)
// se refrescan solos desde WordPress cada 10 min, sin depender de un deploy con código.
export const revalidate = 600;

// Páginas de barrio (/desarrolladoras-inmobiliarias-en-{barrio}/): Next NO soporta rutas
// dinámicas con prefijo (en-[barrio]), así que estas URLs las sirve ESTE handler [slug].
// Para los barrios con desarrolladoras cargadas mostramos el directorio del hub
// pre-filtrado (misma card, misma fuente) en vez del contenido WP viejo.
// BARRIO_CPT / BARRIO_NOMBRE viven en lib/barrios (fuente única).

// Slugs con ruta propia (NO los maneja este handler raíz)
const EXPLICIT = new Set([
  "",
  "contacto",
  "sobre-nosotros",
  "novedades",
  "desarrolladoras-inmobiliarias-en-capital-federal",
  "mejores-inmobiliarias-caba",
  "guia-invertir-departamentos-en-pozo-argentina",
  "indice-precios-pozo-caballito-2026",
  "desarrollos-inmobiliarios",
  "category",
]);

// Pre-genera todas las páginas (barrios y otras) + posts que viven en la raíz (paridad con WordPress)
export async function generateStaticParams() {
  const [pages, posts, inmoSlugs, catSlugs] = await Promise.all([getAllPages(), getPosts(100), inmoBarrioSlugs(), catalogoBarrioSlugs()]);
  const slugs = new Set();
  for (const p of pages || []) if (p.slug && !EXPLICIT.has(p.slug)) slugs.add(p.slug);
  for (const p of posts || []) if (p.slug && !EXPLICIT.has(p.slug)) slugs.add(p.slug);
  for (const s of inmoSlugs) slugs.add(s);
  for (const s of catSlugs) slugs.add(s);
  return [...slugs].map((slug) => ({ slug }));
}

async function resolve(slug) {
  const page = await getPageBySlug(slug);
  if (page && page.title && page.title.rendered) return { node: page, type: "page" };
  const post = await getPostBySlug(slug);
  if (post) return { node: post, type: "post" };
  return null;
}

export async function generateMetadata({ params }) {
  // Página de inmobiliarias por barrio (/mejores-inmobiliarias-en-{barrio}/).
  const im = params.slug.match(/^mejores-inmobiliarias-en-(.+)$/);
  if (im && ZONA_INMO_LABEL[im[1]]) {
    const label = ZONA_INMO_LABEL[im[1]];
    return {
      title: `Mejores inmobiliarias en ${label} 2026 | Departamentos en Pozo`,
      description: `Directorio de inmobiliarias con actividad en ${label}, CABA, ordenado por matrícula CUCICBA verificable. Análisis independiente, sin ranking pago.`,
      alternates: { canonical: `${SITE}/${params.slug}/` },
    };
  }
  // Landing de catálogo por barrio (/desarrollos-inmobiliarios-en-{barrio}/).
  const cm = params.slug.match(/^desarrollos-inmobiliarios-en-(.+)$/);
  if (cm && BARRIO_CATALOGO[cm[1]]) {
    const label = BARRIO_CATALOGO[cm[1]].label;
    return {
      title: `Desarrollos inmobiliarios en pozo en ${label}: proyectos y precios 2026 | Departamentos en Pozo`,
      description: `Desarrollos inmobiliarios en pozo (preventa) en ${label}, CABA: precio desde, financiación, desarrolladora, tipologías y entrega. Compará departamentos en pozo por proyecto con análisis independiente.`,
      alternates: { canonical: `${SITE}/${params.slug}/` },
    };
  }
  const r = await resolve(params.slug);
  if (!r) return { title: "No encontrado", robots: { index: false, follow: false } };
  return buildMeta(r.node, `/${params.slug}/`, r.type === "post" ? "article" : "website");
}

export default async function SinglePage({ params }) {
  // Página de inmobiliarias por barrio: se resuelve ANTES del lookup de página/post
  // (no existe como página WP; se arma sintética con el directorio filtrado por zona).
  const im = params.slug.match(/^mejores-inmobiliarias-en-(.+)$/);
  if (im && ZONA_INMO_LABEL[im[1]]) {
    const zonaKey = im[1];
    const label = ZONA_INMO_LABEL[zonaKey];
    let inmo = [];
    try { inmo = await getInmobiliarias(); } catch (e) { inmo = []; }
    const enZona = inmo.filter((d) => String(d.zonasKey || "").split(/\s+/).includes(zonaKey));
    const rm = await getRankMathSchema(`/mejores-inmobiliarias-en-${zonaKey}/`);
    // Schema propio de la página de barrio: BreadcrumbList + ItemList de las inmobiliarias de la zona.
    const schema = [
      ...rm,
      {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Inmobiliarias en CABA", item: `${SITE}/mejores-inmobiliarias-caba/` },
          { "@type": "ListItem", position: 3, name: `Inmobiliarias en ${label}`, item: `${SITE}/mejores-inmobiliarias-en-${zonaKey}/` },
        ],
      },
      {
        "@context": "https://schema.org", "@type": "ItemList", name: `Inmobiliarias en ${label}`,
        itemListElement: enZona.map((d, i) => ({
          "@type": "ListItem", position: i + 1,
          item: { "@type": "RealEstateAgent", name: d.nombre, areaServed: label, ...(d.web ? { url: d.web.startsWith("http") ? d.web : `https://${d.web}` } : {}) },
        })),
      },
    ];
    return <InmobiliariasBarrioView zonaKey={zonaKey} items={inmo} schema={schema} />;
  }

  // Landing de CATÁLOGO por barrio (/desarrollos-inmobiliarios-en-{barrio}/): el listado de
  // PROYECTOS pre-filtrado por barrio. Se resuelve ANTES del lookup de página/post.
  const cm = params.slug.match(/^desarrollos-inmobiliarios-en-(.+)$/);
  if (cm && BARRIO_CATALOGO[cm[1]]) {
    const barrioSlugCat = cm[1];
    const { label } = BARRIO_CATALOGO[barrioSlugCat];
    let mapped = [];
    try { mapped = mapDesarrollos(await getDesarrollos()); } catch (e) { mapped = []; }
    const items = mapped.filter((i) => matchBarrioCatalogo(i.barrio, barrioSlugCat));
    const schema = [
      {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Desarrollos inmobiliarios en pozo en CABA", item: `${SITE}/desarrollos-inmobiliarios/` },
          { "@type": "ListItem", position: 3, name: `Desarrollos inmobiliarios en pozo en ${label}`, item: `${SITE}/desarrollos-inmobiliarios-en-${barrioSlugCat}/` },
        ],
      },
      {
        "@context": "https://schema.org", "@type": "ItemList", name: `Departamentos en pozo en ${label}`,
        numberOfItems: items.length,
        itemListElement: items.map((i, idx) => ({
          "@type": "ListItem", position: idx + 1,
          url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`, name: i.nombre,
        })),
      },
    ];
    return <CatalogoBarrioView slug={barrioSlugCat} label={label} items={items} intro={CATALOGO_BARRIO_INTRO[barrioSlugCat]} schema={schema} />;
  }

  const r = await resolve(params.slug);
  if (!r) notFound();
  const { node, type } = r;
  const img = featuredImage(node);
  const title = node.title?.rendered || "";
  // Saneamos el HTML: sacamos los <script ld+json> embebidos del WP viejo (duplicaban el
  // schema del <head>) y rescatamos FAQPage/Dataset/AboutPage para re-emitirlos limpios.
  const { html: content, keep: keepSchema } = stripEmbeddedSchema(fixImgs(node.content?.rendered || ""));

  // ¿Es una página de barrio con desarrolladoras cargadas? Si sí, mostramos el directorio
  // pre-filtrado en vez del contenido WP viejo. Si no (o barrio sin devs), contenido normal.
  const barrioMatch = params.slug.match(/^desarrolladoras-inmobiliarias-en-(.+)$/);
  const barrioSlug = barrioMatch && barrioMatch[1] !== "capital-federal" ? barrioMatch[1] : null;
  let devsBarrio = [];
  let barrioKey = null;
  if (barrioSlug) {
    barrioKey = BARRIO_CPT[barrioSlug] || barrioSlug.split("-")[0];
    try {
      const all = await getDesarrolladoras();
      devsBarrio = (all || []).filter((d) => (d.barriosKey || "").split(/\s+/).includes(barrioKey));
    } catch (e) { devsBarrio = []; }
  }
  const usaDirectorioBarrio = devsBarrio.length > 0;

  // Igual que el hub: el contenido WP trae el marcador <!--DIRECTORIO--> donde antes
  // estaba la lista vieja de desarrolladoras. Lo partimos y montamos el directorio
  // pre-filtrado en el medio, con el MISMO layout ancho que el hub (sin banner oscuro).
  const MARKER_BARRIO = "<!--DIRECTORIO-->";
  const conMarcador = content.includes(MARKER_BARRIO);
  const [barrioBefore, barrioAfter] = conMarcador ? content.split(MARKER_BARRIO) : [content, ""];
  // Algunos barrios (template nuevo) no traen H1 en el contenido. Como sacamos el banner,
  // quedarían sin H1: en ese caso el componente renderiza uno con el título de la página.
  const contenidoTieneH1 = /<h1[\s>]/i.test(content);

  // Schema JSON-LD de RankMath (FAQPage, ItemList, BreadcrumbList, etc.). Aditivo:
  // se suma al Article básico existente. Devuelve [] si el endpoint no responde.
  const rmSchema = [...(await getRankMathSchema(`/${params.slug}/`)), ...keepSchema];

  // ── POST (guía) ─────────────────────────────────────────────────────────
  // Los posts viven en la raíz (/{slug}/). Layout editorial de blog (ver PostView).
  if (type === "post") {
    return (
      <PostView node={node} slug={params.slug} content={content} img={img} title={title} rmSchema={rmSchema} />
    );
  }

  // Schema propio para /mejores-inmobiliarias-caba/: las FAQ del contenido son <h3>
  // plano (RankMath no las detecta) y el JSON-LD embebido en WP lo strippea React,
  // así que lo declaramos acá. Si cambian las firmas o las FAQ, actualizar acá.
  const extraSchema = params.slug === "mejores-inmobiliarias-caba" ? [
    {
      "@context": "https://schema.org", "@type": "ItemList",
      name: "Inmobiliarias en Capital Federal",
      itemListElement: [
        "Interwin","Izrastzoff","Covello Propiedades","Fabián Achával","RE/MAX Premium",
        "Predial","Home54","Toribio Achával","Tizado Propiedades","MEL Propiedades",
        "Capital Brokers","Soldati","Miranda Bosch Real Estate & Art",
      ].map((n, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "RealEstateAgent", name: n, areaServed: "Ciudad Autónoma de Buenos Aires" } })),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: [
        ["¿Cuáles son las mejores inmobiliarias de CABA?", "No hay una respuesta objetiva porque no existe información pública sobre operaciones cerradas ni satisfacción de clientes. Lo verificable es la matrícula CUCICBA vigente, la experiencia comprobable y la transparencia de datos."],
        ["¿Es obligatorio que una inmobiliaria tenga matrícula en CABA?", "El ejercicio del corretaje inmobiliario en la Ciudad de Buenos Aires está regulado y requiere matrícula de CUCICBA, verificable gratis en el padrón público del colegio."],
        ["¿Qué diferencia hay entre una inmobiliaria y una desarrolladora?", "La inmobiliaria intermedia la venta; la desarrolladora concibe, financia y construye el emprendimiento. En una compra en pozo, el riesgo de entrega depende de la desarrolladora."],
        ["¿Conviene comprar en pozo por una inmobiliaria o directo a la desarrolladora?", "El precio suele ser el mismo. La ventaja de operar con una inmobiliaria es comparar varios proyectos; la de ir directo, el trato con quien construye. Lo clave es revisar la estructura legal antes de firmar."],
        ["¿Cobran por aparecer en este listado?", "No. No cobramos por aparecer, no vendemos posiciones y no recibimos comisión por derivar consultas."],
      ].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ] : [];

  // ── BARRIO (/desarrolladoras-inmobiliarias-en-{barrio}/) ─────────────────
  if (barrioSlug) {
    return (
      <BarrioView
        content={content}
        barrioSlug={barrioSlug}
        barrioKey={barrioKey}
        devsBarrio={devsBarrio}
        usaDirectorioBarrio={usaDirectorioBarrio}
        contenidoTieneH1={contenidoTieneH1}
        barrioBefore={barrioBefore}
        barrioAfter={barrioAfter}
        schema={[...rmSchema, ...extraSchema]}
      />
    );
  }

  // ── PÁGINA genérica ──────────────────────────────────────────────────────
  return (
    <PageView node={node} type={type} title={title} img={img} content={content} schema={[...rmSchema, ...extraSchema]} />
  );
}
