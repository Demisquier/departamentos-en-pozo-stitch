import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts, getPostBySlug, featuredImage } from "../../../lib/wp";

export const dynamicParams = !process.env.EXPORT;

// Pre-genera las rutas de cada post publicado
export async function generateStaticParams() {
  let posts = [];
  try {
    posts = await getPosts();
  } catch (e) {
    posts = [];
  }
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Novedad no encontrada" };
  const clean = (post.title?.rendered || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&");
  return {
    title: `${clean} — Departamentos en Pozo`,
  };
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

function categoria(post) {
  const terms = post?._embedded?.["wp:term"]?.[0];
  const cat = Array.isArray(terms) ? terms.find((t) => t.taxonomy === "category") : null;
  return cat?.name ? cat.name.toUpperCase() : null;
}

// TODO confirmar permalink de posts (WP puede usar /?p= o una estructura distinta a /novedades/)
export default async function NovedadPage({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const img = featuredImage(post);
  const cat = categoria(post);

  return (
    <main className="min-h-screen bg-surface-container-lowest">
      {/* Hero editorial */}
      <section className="pt-16 md:pt-24 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link
              href="/novedades/"
              className="inline-flex items-center gap-2 text-on-surface-variant hover:text-link-gold transition-colors font-label-md text-label-md"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Volver a Novedades
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-6">
            {cat && (
              <span className="border border-secondary text-secondary px-3 py-1 font-label-caps text-label-caps tracking-widest">
                {cat}
              </span>
            )}
            <time className="text-on-surface-variant font-label-caps text-label-caps">
              {formatDate(post.date)}
            </time>
          </div>

          <h1
            className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-10 leading-tight"
            dangerouslySetInnerHTML={{ __html: post.title?.rendered || "" }}
          />
        </div>
      </section>

      {/* Imagen destacada */}
      {img && (
        <div className="max-w-4xl mx-auto px-margin-mobile md:px-0 mb-12 md:mb-16">
          <div className="aspect-[16/9] overflow-hidden editorial-shadow">
            <img
              className="w-full h-full object-cover"
              src={img}
              alt={(post.title?.rendered || "").replace(/<[^>]*>/g, "")}
            />
          </div>
        </div>
      )}

      {/* Contenido */}
      <article className="px-margin-mobile md:px-margin-desktop pb-20 md:pb-28">
        <div
          className="max-w-3xl mx-auto prose prose-lg max-w-3xl
            text-on-surface-variant leading-relaxed
            prose-headings:font-headline-md prose-headings:text-primary
            prose-h2:text-headline-md prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-headline-sm prose-h3:mt-8 prose-h3:mb-3
            prose-p:font-body-lg prose-p:text-body-lg prose-p:mb-6
            prose-a:text-link-gold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-primary
            prose-img:my-8
            prose-blockquote:border-l-4 prose-blockquote:border-secondary-fixed
            prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-primary
            prose-li:font-body-md prose-li:text-body-md"
          dangerouslySetInnerHTML={{ __html: post.content?.rendered || "" }}
        />
      </article>
    </main>
  );
}
