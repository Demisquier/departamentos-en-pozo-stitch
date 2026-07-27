import { notFound } from "next/navigation";
import { getPageBySlug, getPostBySlug, getAllPages, getPosts, featuredImage, buildMeta, getRankMathSchema, fixImgs, getDesarrolladoras } from "../../lib/wp";
import { BARRIO_CPT } from "../../lib/barrios";
import PostView from "../_views/PostView";
import BarrioView from "../_views/BarrioView";
import PageView from "../_views/PageView";

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
  const [pages, posts] = await Promise.all([getAllPages(), getPosts(100)]);
  const slugs = new Set();
  for (const p of pages || []) if (p.slug && !EXPLICIT.has(p.slug)) slugs.add(p.slug);
  for (const p of posts || []) if (p.slug && !EXPLICIT.has(p.slug)) slugs.add(p.slug);
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
  const r = await resolve(params.slug);
  if (!r) return { title: "No encontrado", robots: { index: false, follow: false } };
  return buildMeta(r.node, `/${params.slug}/`, r.type === "post" ? "article" : "website");
}

export default async function SinglePage({ params }) {
  const r = await resolve(params.slug);
  if (!r) notFound();
  const { node, type } = r;
  const img = featuredImage(node);
  const title = node.title?.rendered || "";
  const content = fixImgs(node.content?.rendered || "");

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
  const rmSchema = await getRankMathSchema(`/${params.slug}/`);

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
