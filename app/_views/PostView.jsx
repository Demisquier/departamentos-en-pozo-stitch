// app/_views/PostView.jsx — Layout editorial de guía (post que vive en la raíz /{slug}/).
// Extraído tal cual desde app/[slug]/page.jsx (rama `type === "post"`): mismo render,
// mismos schemas, mismas clases. El catch-all sólo resuelve el tipo y delega acá.
import Link from "next/link";
import { articleSchema, breadcrumbSchema, getPosts, addHeadingIds, readingTimeMinutes, primaryCategory, relatedPosts, stripHtml, featuredImage } from "../../lib/wp";
import { MONEY_LINKS } from "../../lib/constants";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Breadcrumb from "../_ui/Breadcrumb";
import Button from "../_ui/Button";
import PageHeader from "../_ui/PageHeader";

export default async function PostView({ node, slug, content, img, title, rmSchema }) {
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
    { name: tituloPlano, url: `/${slug}/` },
  ]);

  const relTitle = (p) => (p?.title?.rendered || "").replace(/&amp;/g, "&");

  return (
    <article>
      <JsonLd data={[articleSchema(node, `/${slug}/`), crumbSchema, ...rmSchema]} />

      {/* Header editorial (hero oscuro coherente con el resto del sitio) */}
      <PageHeader py="py-14 md:py-20">
        <Breadcrumb
          tone="dark"
          sep="›"
          ariaLabel="Migas de pan"
          className="mb-6"
          currentClassName="text-on-primary/70 line-clamp-1"
          items={[
            { name: "Inicio", href: "/" },
            { name: "Guías", href: "/novedades/" },
            { name: tituloPlano },
          ]}
        />
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
      </PageHeader>

      {img && (
        <Container>
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
        </Container>
      )}

      {/* Cuerpo + índice (TOC). Desktop: rail izquierdo sticky + columna de lectura ~68ch. */}
      <Container className="py-12 md:py-14 lg:grid lg:grid-cols-[15rem_minmax(0,44rem)] lg:justify-center lg:gap-14">
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
              {MONEY_LINKS.map(([t, d, href]) => (
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
            <Button as={Link} variant="primary" href="/desarrollos-inmobiliarios/" className="inline-flex items-center gap-2 px-6 py-3 font-label-caps text-label-caps tracking-widest">
              Ver proyectos en pozo <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Button>
          </div>
        </div>
      </Container>
    </article>
  );
}
