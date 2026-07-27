import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageBySlug, getPostBySlug, getAllPages, getPosts, featuredImage, buildMeta, articleSchema, getRankMathSchema, fixImgs, getDesarrolladoras, addHeadingIds, readingTimeMinutes, primaryCategory, relatedPosts, breadcrumbSchema, stripHtml } from "../../lib/wp";
import DirectorioDevs from "../desarrolladoras-inmobiliarias-en-capital-federal/DirectorioDevs";

export const dynamicParams = !process.env.EXPORT;
// Revalidación ISR: las páginas servidas por este route (barrios, posts, páginas WP)
// se refrescan solos desde WordPress cada 10 min, sin depender de un deploy con código.
export const revalidate = 600;

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
  // Algunos barrios (template nuevo) no traen H1 en el contenido. Como sacamos el banner,
  // quedarían sin H1: en ese caso el componente renderiza uno con el título de la página.
  const contenidoTieneH1 = /<h1[\s>]/i.test(content);

  // Schema JSON-LD de RankMath (FAQPage, ItemList, BreadcrumbList, etc.). Aditivo:
  // se suma al Article básico existente. Devuelve [] si el endpoint no responde.
  const rmSchema = await getRankMathSchema(`/${params.slug}/`);

  // ── POST (guía) ─────────────────────────────────────────────────────────
  // Los posts viven en la raíz (/{slug}/). Les damos un layout editorial de blog:
  // header con categoría + bajada + meta (autor · fecha · tiempo de lectura),
  // imagen 16/9, índice (TOC) por H2, CTA a secciones money y relacionados.
  if (type === "post") {
    const { html: postHtml, toc } = addHeadingIds(content);
    const cat = primaryCategory(node);
    const minutes = readingTimeMinutes(content);
    const bajada = stripHtml(node.excerpt?.rendered || "");
    const fecha = node.date
      ? new Date(node.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
      : "";
    const tituloPlano = stripHtml(title);
    let related = [];
    try {
      const allPosts = await getPosts(100);
      related = relatedPosts(node, allPosts, 3);
    } catch (e) { related = []; }

    const crumbSchema = breadcrumbSchema([
      { name: "Inicio", url: "/" },
      { name: "Guías", url: "/novedades/" },
      { name: tituloPlano, url: `/${params.slug}/` },
    ]);

    const relTitle = (p) => (p?.title?.rendered || "").replace(/&amp;/g, "&");

    return (
      <article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(node, `/${params.slug}/`)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbSchema) }} />
        {[...rmSchema].map((s, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
        ))}

        {/* Header editorial (hero oscuro coherente con el resto del sitio) */}
        <header className="bg-primary-container text-on-primary">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-14 md:py-20">
            <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-1.5 text-[13px] text-on-primary-fixed-variant mb-6">
              <Link href="/" className="hover:text-link-gold">Inicio</Link>
              <span aria-hidden="true">›</span>
              <Link href="/novedades/" className="hover:text-link-gold">Guías</Link>
              <span aria-hidden="true">›</span>
              <span className="text-on-primary/70 line-clamp-1">{tituloPlano}</span>
            </nav>
            {cat && (
              <Link
                href={`/category/${cat.slug}/`}
                className="inline-block mb-5 bg-secondary text-on-secondary px-3 py-1 font-label-caps text-label-caps tracking-widest uppercase hover:brightness-110 transition"
              >
                {cat.name}
              </Link>
            )}
            <h1
              className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl"
              dangerouslySetInnerHTML={{ __html: title }}
            />
            {bajada && (
              <p className="mt-5 text-on-primary/80 font-body-lg text-body-lg max-w-2xl">{bajada}</p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-on-primary-fixed-variant">
              <span className="text-link-gold font-medium">Equipo Departamentos en Pozo</span>
              {fecha && (<><span aria-hidden="true">·</span><time dateTime={node.date}>{fecha}</time></>)}
              <span aria-hidden="true">·</span>
              <span>{minutes} min de lectura</span>
            </div>
          </div>
        </header>

        {img && (
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <img
              src={img}
              alt={tituloPlano}
              loading="eager"
              className="w-full aspect-[16/9] object-cover rounded shadow-xl -mt-8 relative z-10"
            />
            {node.meta?.image_credit && (
              <p className="relative z-10 mt-2 text-[12px] leading-snug text-on-surface-variant">
                {node.meta.image_credit_url ? (
                  <Link href={node.meta.image_credit_url} className="hover:text-secondary transition-colors">
                    {node.meta.image_credit}
                  </Link>
                ) : (
                  node.meta.image_credit
                )}
              </p>
            )}
          </div>
        )}

        {/* Cuerpo + índice (TOC). Desktop: rail izquierdo sticky + columna de lectura ~68ch. */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-14 lg:grid lg:grid-cols-[15rem_minmax(0,44rem)] lg:justify-center lg:gap-14">
          {/* TOC desktop (sticky) */}
          {toc.length > 1 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4">En esta guía</p>
                <nav className="flex flex-col gap-2.5 border-l border-outline-variant pl-4">
                  {toc.map((h) => (
                    <a key={h.id} href={`#${h.id}`} className="text-[14px] leading-snug text-on-surface-variant hover:text-secondary transition-colors">
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          <div className="min-w-0">
            {/* TOC mobile (colapsable nativo, sin JS) */}
            {toc.length > 1 && (
              <details className="lg:hidden mb-8 border border-outline-variant rounded-lg bg-surface-container-low">
                <summary className="cursor-pointer select-none px-4 py-3 font-label-caps text-label-caps uppercase text-primary">
                  Índice de la guía
                </summary>
                <nav className="flex flex-col gap-2.5 px-5 pb-4 pt-1">
                  {toc.map((h) => (
                    <a key={h.id} href={`#${h.id}`} className="text-[15px] text-on-surface-variant hover:text-secondary transition-colors">
                      {h.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}

            <div
              className="wp-content max-w-[68ch]"
              dangerouslySetInnerHTML={{ __html: postHtml }}
            />

            {/* CTA / interlinking hacia secciones money */}
            <section className="mt-14 border-t border-outline-variant pt-10">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Seguí explorando</h2>
              <p className="text-on-surface-variant mb-6 max-w-2xl">
                Pasá del análisis a la decisión con nuestras herramientas y directorios independientes.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["Desarrolladoras en Capital Federal", "Directorio de desarrolladoras activas en pozo, barrio por barrio.", "/desarrolladoras-inmobiliarias-en-capital-federal/"],
                  ["Mejores inmobiliarias de CABA", "Cómo elegir una inmobiliaria con matrícula verificada.", "/mejores-inmobiliarias-caba/"],
                  ["Proyectos en pozo", "Fichas de emprendimientos con precio, obra y ubicación.", "/desarrollos-inmobiliarios/"],
                  ["Guía para invertir en pozo", "El marco completo para comprar en preventa sin errores.", "/guia-invertir-departamentos-en-pozo-argentina/"],
                ].map(([t, d, href]) => (
                  <Link key={href} href={href} className="group block border border-outline-variant rounded-lg p-5 hover:border-secondary transition-colors">
                    <span className="font-headline-sm text-[19px] text-primary group-hover:text-secondary transition-colors flex items-center gap-2">
                      {t}
                      <span className="material-symbols-outlined text-[18px] opacity-60 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </span>
                    <span className="block mt-1.5 text-[14px] text-on-surface-variant">{d}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Posts relacionados */}
            {related.length > 0 && (
              <section className="mt-14 border-t border-outline-variant pt-10">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-6">Guías relacionadas</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {related.map((p) => (
                    <article key={p.id} className="group">
                      <Link href={`/${p.slug}/`} className="block">
                        <div className="aspect-[16/9] overflow-hidden rounded mb-3 bg-primary-container">
                          {featuredImage(p) ? (
                            <img src={featuredImage(p)} alt={relTitle(p)} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-on-primary">
                              <span className="material-symbols-outlined text-secondary-fixed text-3xl">apartment</span>
                            </div>
                          )}
                        </div>
                        {primaryCategory(p) && (
                          <span className="text-secondary font-label-caps text-label-caps mb-1.5 block uppercase">{primaryCategory(p).name}</span>
                        )}
                        <h3 className="font-headline-sm text-[18px] leading-snug text-primary group-hover:text-secondary transition-colors" dangerouslySetInnerHTML={{ __html: p.title?.rendered || "" }} />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Navegación de cierre */}
            <div className="mt-14 border-t border-outline-variant pt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Link href="/novedades/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver a Guías
              </Link>
              <Link href="/desarrollos-inmobiliarios/" className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-6 py-3 rounded font-label-caps text-label-caps tracking-widest hover:opacity-90 transition-all">
                Ver proyectos en pozo <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </article>
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
          {/* Header estilo hub + chip de filtro: la página de barrio se siente el mismo
              hub con un filtro aplicado, fácil de volver a "todas". */}
          {!contenidoTieneH1 && (
            <h1 className="font-headline-md text-[1.9rem] md:text-[2.5rem] leading-tight text-primary mb-4">
              Desarrolladoras en {BARRIO_NOMBRE[barrioSlug] || barrioSlug}
            </h1>
          )}
          {usaDirectorioBarrio && (
            <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-outline-variant">
              <span className="text-[12px] font-label-caps uppercase tracking-wider text-on-surface-variant">Filtrando por barrio</span>
              <span className="inline-flex items-center gap-2 bg-primary-container text-on-primary rounded-full pl-4 pr-1.5 py-1.5 text-[14px] font-medium">
                {BARRIO_NOMBRE[barrioSlug] || barrioSlug}
                <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" aria-label="Quitar filtro, ver todas las desarrolladoras" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/25 hover:bg-white/45 transition-colors leading-none">✕</Link>
              </span>
              <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-[14px] text-secondary underline hover:no-underline">Ver todas las desarrolladoras de CABA</Link>
            </div>
          )}
          {/* Directorio ARRIBA (igual que el hub): el listado filtrado va justo después
              del header/chip, y TODO el editorial del barrio queda debajo. Un solo cambio
              acá deja las 9 páginas de barrio "directory-first", sin salto respecto al hub. */}
          {usaDirectorioBarrio && (
            <DirectorioDevs devs={devsBarrio} barrioFijo={barrioKey} tituloBarrio={BARRIO_NOMBRE[barrioSlug] || barrioSlug} />
          )}
          <div
            className="wp-content prose max-w-none text-body-md text-on-surface-variant mt-8"
            dangerouslySetInnerHTML={{ __html: usaDirectorioBarrio ? (barrioBefore + barrioAfter) : content }}
          />
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
            <Link href="/novedades/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver a Guías
            </Link>
            <Link href="/desarrollos-inmobiliarios/" className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-6 py-3 rounded font-label-caps text-label-caps tracking-widest hover:opacity-90 transition-all">
              Ver proyectos en pozo <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
