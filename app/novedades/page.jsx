import Link from "next/link";
import { getPosts, getCategories, featuredImage, readingTimeMinutes } from "../../lib/wp";
import { cleanExcerpt, formatDate, categoria } from "../../lib/format";
import { BARRIOS_PAGINA } from "../../lib/barrios";
import { SITE } from "../../lib/constants";
import Container from "../_ui/Container";
import PostCard from "../_ui/PostCard";

export const revalidate = 600;

export const metadata = {
  title: "Guías y Novedades — Departamentos en Pozo",
  alternates: { canonical: `${SITE}/novedades/` },
  description:
    "Información estratégica y análisis profundo para el inversor sofisticado en el mercado de real estate premium.",
};

// cleanExcerpt, formatDate y categoria viven en lib/format.

// Tiempo de lectura del post (min), calculado por longitud del texto.
function minutos(post) {
  try {
    return readingTimeMinutes(post?.content?.rendered || post?.excerpt?.rendered || "");
  } catch {
    return null;
  }
}

export default async function NovedadesPage() {
  let posts = [];
  try {
    posts = await getPosts();
  } catch (e) {
    posts = [];
  }
  let cats = [];
  try {
    cats = (await getCategories()).filter((c) => c.count > 0 && c.slug !== "uncategorized" && c.slug !== "sin-categoria");
  } catch (e) {
    cats = [];
  }

  const featured = posts[0] || null;
  const sidebar = posts.slice(1, 3);
  const rest = posts.slice(3);

  const title = (node) => (node?.title?.rendered || "").replace(/&amp;/g, "&");

  return (
    <main className="min-h-screen">
      {/* Index View: Editorial Grid */}
      <Container as="section" className="py-16 md:py-24" id="guides-index">
        <div className="mb-12 border-b border-outline-variant pb-8">
          <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-4">
            Guías y Actualidad Inmobiliaria
          </h1>
          <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl">
            Información estratégica y análisis profundo para el inversor sofisticado en el mercado de
            real estate premium.
          </p>
          {cats.length > 0 && (
            <div className="flex md:flex-wrap gap-2.5 mt-6 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {cats.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}/`}
                  className="shrink-0 whitespace-nowrap px-3.5 py-1.5 border border-outline-variant rounded-full text-[13px] text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors"
                >
                  {c.name} <span className="opacity-60">({c.count})</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {posts.length === 0 ? (
          <p className="text-on-surface-variant font-body-lg text-body-lg">
            No hay novedades disponibles por el momento.
          </p>
        ) : (
          <>
            {/* Bento/Grid Mix */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
              {/* Main Featured Card */}
              {featured && (
                <PostCard
                  variant="featured"
                  as="article"
                  className="md:col-span-8"
                  href={`/${featured.slug}/`}
                  img={featuredImage(featured)}
                  imgAlt={title(featured)}
                  category={categoria(featured)}
                  titleHtml={featured.title?.rendered || ""}
                  date={formatDate(featured.date)}
                  minutes={minutos(featured)}
                  excerpt={cleanExcerpt(featured.excerpt?.rendered)}
                />
              )}

              {/* Sidebar Grid */}
              <div className="md:col-span-4 flex flex-col gap-gutter">
                {sidebar.map((post) => (
                  <PostCard
                    key={post.id}
                    variant="standard"
                    as="article"
                    href={`/${post.slug}/`}
                    img={featuredImage(post)}
                    imgAlt={title(post)}
                    category={categoria(post)}
                    titleHtml={post.title?.rendered || ""}
                    date={formatDate(post.date)}
                    minutes={minutos(post)}
                  />
                ))}
              </div>

              {/* Regular Grid Rows */}
              {rest.map((post) => (
                <PostCard
                  key={post.id}
                  variant="compact"
                  as="div"
                  className="md:col-span-4 mt-8"
                  href={`/${post.slug}/`}
                  img={featuredImage(post)}
                  imgAlt={title(post)}
                  category={categoria(post)}
                  titleHtml={post.title?.rendered || ""}
                  date={formatDate(post.date)}
                  minutes={minutos(post)}
                  excerpt={cleanExcerpt(post.excerpt?.rendered, 140)}
                />
              ))}
            </div>
          </>
        )}

        {/* Explorá por barrio: da hogar navegable a las 9 páginas de barrio
            (además del footer) y refuerza el interlinking hacia esos directorios. */}
        <div className="mt-16 pt-10 border-t border-outline-variant">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Explorá desarrolladoras por barrio</h2>
          <p className="text-on-surface-variant mb-6 max-w-2xl">
            Análisis de las desarrolladoras activas en pozo, barrio por barrio de CABA.
          </p>
          <div className="flex flex-wrap gap-3">
            {BARRIOS_PAGINA.map(([label, slug]) => (
              <Link
                key={slug}
                href={`/desarrolladoras-inmobiliarias-en-${slug}/`}
                className="px-4 py-2 rounded-full border border-outline-variant text-[14px] text-primary hover:border-secondary hover:text-secondary transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
