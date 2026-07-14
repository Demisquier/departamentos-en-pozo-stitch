import Link from "next/link";
import { getPosts, getCategories, featuredImage } from "../../lib/wp";

export const revalidate = 600;

// Placeholder branded para posts sin imagen destacada (evita la caja gris vacía).
function Ph({ label }) {
  return (
    <div className="w-full h-full bg-primary-container flex flex-col items-center justify-center gap-2 text-on-primary">
      <span className="material-symbols-outlined text-secondary-fixed text-4xl">apartment</span>
      {label ? <span className="font-label-caps text-label-caps text-secondary-fixed uppercase opacity-90">{label}</span> : null}
    </div>
  );
}

export const metadata = {
  title: "Guías y Novedades — Departamentos en Pozo",
  description:
    "Información estratégica y análisis profundo para el inversor sofisticado en el mercado de real estate premium.",
};

// Limpia tags HTML del excerpt de WP y recorta
function cleanExcerpt(html, max = 220) {
  const text = (html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\[&hellip;\]/g, "…")
    .replace(/&hellip;/g, "…")
    .replace(/&#8230;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr)
      .toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
      .toUpperCase();
  } catch {
    return "";
  }
}

// Categoría desde el _embedded
function categoria(post) {
  const terms = post?._embedded?.["wp:term"]?.[0];
  const cat = Array.isArray(terms) ? terms.find((t) => t.taxonomy === "category") : null;
  return cat?.name ? cat.name.toUpperCase() : null;
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
      <section
        className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto"
        id="guides-index"
      >
        <div className="mb-12 border-b border-outline-variant pb-8">
          <h1 className="font-headline-md text-headline-md text-primary mb-4">
            Guías y Actualidad Inmobiliaria
          </h1>
          <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl">
            Información estratégica y análisis profundo para el inversor sofisticado en el mercado de
            real estate premium.
          </p>
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-2.5 mt-6">
              {cats.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}/`}
                  className="px-3.5 py-1.5 border border-outline-variant rounded-full text-[13px] text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors"
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
                <article className="md:col-span-8 group">
                  <Link href={`/${featured.slug}/`} className="block cursor-pointer">
                    <div className="relative overflow-hidden aspect-[16/9] mb-6">
                      {featuredImage(featured) ? (
                        <img
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          src={featuredImage(featured)}
                          alt={title(featured)}
                        />
                      ) : (
                        <Ph />
                      )}
                      {categoria(featured) && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-secondary text-on-secondary px-3 py-1 font-label-caps text-label-caps tracking-widest">
                            {categoria(featured)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <time className="font-label-caps text-label-caps text-on-surface-variant mb-3 block">
                        {formatDate(featured.date)}
                      </time>
                      <h2
                        className="font-headline-md text-headline-md text-primary mb-4 group-hover:text-link-gold transition-colors"
                        dangerouslySetInnerHTML={{ __html: featured.title?.rendered || "" }}
                      />
                      <p className="text-on-surface-variant font-body-md text-body-md line-clamp-3">
                        {cleanExcerpt(featured.excerpt?.rendered)}
                      </p>
                    </div>
                  </Link>
                </article>
              )}

              {/* Sidebar Grid */}
              <div className="md:col-span-4 flex flex-col gap-gutter">
                {sidebar.map((post) => (
                  <article key={post.id} className="group">
                    <Link href={`/${post.slug}/`} className="block cursor-pointer">
                      <div className="aspect-[4/3] overflow-hidden mb-4">
                        {featuredImage(post) ? (
                          <img
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            src={featuredImage(post)}
                            alt={title(post)}
                          />
                        ) : (
                          <Ph />
                        )}
                      </div>
                      {categoria(post) && (
                        <span className="text-link-gold font-label-caps text-label-caps mb-2 block">
                          {categoria(post)}
                        </span>
                      )}
                      <h3
                        className="font-headline-sm text-headline-sm text-primary group-hover:text-link-gold transition-colors"
                        dangerouslySetInnerHTML={{ __html: post.title?.rendered || "" }}
                      />
                    </Link>
                  </article>
                ))}
              </div>

              {/* Regular Grid Rows */}
              {rest.map((post) => (
                <div key={post.id} className="md:col-span-4 group mt-8">
                  <Link href={`/${post.slug}/`} className="block cursor-pointer">
                    <div className="aspect-[4/3] overflow-hidden mb-4">
                      {featuredImage(post) ? (
                        <img
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={featuredImage(post)}
                          alt={title(post)}
                        />
                      ) : (
                        <Ph />
                      )}
                    </div>
                    <time className="font-label-caps text-label-caps text-on-surface-variant mb-2 block">
                      {formatDate(post.date)}
                    </time>
                    <h3
                      className="font-headline-sm text-headline-sm text-primary mb-2 group-hover:text-link-gold transition-colors"
                      dangerouslySetInnerHTML={{ __html: post.title?.rendered || "" }}
                    />
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
