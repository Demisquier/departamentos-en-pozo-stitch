import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageBySlug, getPostBySlug, getAllPages, getPosts, featuredImage, buildMeta, articleSchema, getRankMathSchema, fixImgs, getDesarrolladoras } from "../../lib/wp";
import DirectorioDevs from "../desarrolladoras-inmobiliarias-en-capital-federal/DirectorioDevs";

export const dynamicParams = !process.env.EXPORT;

// Páginas de barrio (/desarrolladoras-inmobiliarias-en-{barrio}/): Next NO soporta rutas
// dinámicas con prefijo (en-[barrio]), así que estas URLs las sirve ESTE handler [slug].
// Para los barrios con desarrolladoras cargadas mostramos el directorio del hub
// pre-filtrado (misma card, misma fuente) en vez del contenido WP viejo.
const BARRIO_CPT = {
  palermo: "palermo", belgrano: "belgrano", caballito: "caballito", nunez: "nunez",
  "puerto-madero": "puerto-madero", recoleta: "recoleta", "villa-urquiza": "villa-urquiza",
  "colegiales-chacarita": "colegiales", "saavedra-coghlan": "saavedra",
};
const BARRIO_NOMBRE = {
  palermo: "Palermo", belgrano: "Belgrano", caballito: "Caballito", nunez: "Núñez",
  "puerto-madero": "Puerto Madero", recoleta: "Recoleta", "villa-urquiza": "Villa Urquiza",
  "colegiales-chacarita": "Colegiales y Chacarita", "saavedra-coghlan": "Saavedra y Coghlan",
};

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

  // Schema JSON-LD de RankMath (FAQPage, ItemList, BreadcrumbList, etc.). Aditivo:
  // se suma al Article básico existente. Devuelve [] si el endpoint no responde.
  const rmSchema = await getRankMathSchema(`/${params.slug}/`);

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

  return (
    <article>
      {type === "post" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(node, `/${params.slug}/`)) }}
        />
      )}
      {[...rmSchema, ...extraSchema].map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      {/* Banner oscuro sólo para posts y páginas comunes. Las páginas de barrio traen
          su propio hero en el contenido WP y se renderizan como el hub (sin banner). */}
      {!barrioSlug && (
        <header className="bg-primary-container text-on-primary">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-20">
            {type === "post" && (
              <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-on-primary-fixed-variant mb-6">
                <Link href="/" className="hover:text-link-gold">Inicio</Link>
                <span>/</span>
                <Link href="/novedades/" className="hover:text-link-gold">Guías</Link>
              </nav>
            )}
            {type === "post" && node.date && (
              <p className="text-link-gold font-label-caps text-label-caps uppercase mb-4">
                {new Date(node.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            <h1
              className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          </div>
        </header>
      )}

      {img && !barrioSlug && (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <img src={img} alt="" className="w-full aspect-[16/9] object-cover rounded shadow-xl -mt-8 relative z-10" />
        </div>
      )}

      {barrioSlug ? (
        // Página de barrio: MISMO layout que el hub (ancho, prose). Contenido antes del
        // marcador → directorio pre-filtrado (cards del hub) → contenido después. Si no
        // hay directorio (barrio sin devs) se muestra el contenido completo, igual de ancho.
        <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
          <div
            className="wp-content prose max-w-none text-body-md text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: usaDirectorioBarrio ? barrioBefore : content }}
          />
          {usaDirectorioBarrio && (
            <DirectorioDevs devs={devsBarrio} barrioFijo={barrioKey} tituloBarrio={BARRIO_NOMBRE[barrioSlug] || barrioSlug} />
          )}
          {usaDirectorioBarrio && barrioAfter && (
            <div
              className="wp-content prose max-w-none text-body-md text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: barrioAfter }}
            />
          )}
        </main>
      ) : (
        <div
          className="wp-content max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-14"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {type === "post" && (
        <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop pb-16">
          <div className="border-t border-outline-variant pt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Link href="/novedades/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-link-gold transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver a Guías
            </Link>
            <Link href="/desarrollos-inmobiliarios/" className="inline-flex items-center gap-2 bg-link-gold text-primary-container px-6 py-3 rounded font-label-caps text-label-caps tracking-widest hover:brightness-110 transition-all">
              Ver proyectos en pozo <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
