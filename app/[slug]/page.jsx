import { notFound } from "next/navigation";
import { getPageBySlug, getPostBySlug, getAllPages, getPosts, featuredImage, buildMeta, articleSchema, getRankMathSchema, fixImgs } from "../../lib/wp";

export const dynamicParams = !process.env.EXPORT;

// Slugs con ruta propia (NO los maneja este handler raíz)
const EXPLICIT = new Set([
  "",
  "contacto",
  "sobre-nosotros",
  "novedades",
  "desarrolladoras-inmobiliarias-en-capital-federal",
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

  // Schema JSON-LD de RankMath (FAQPage, ItemList, BreadcrumbList, etc.). Aditivo:
  // se suma al Article básico existente. Devuelve [] si el endpoint no responde.
  const rmSchema = await getRankMathSchema(`/${params.slug}/`);

  return (
    <article>
      {type === "post" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema(node, `/${params.slug}/`)) }}
        />
      )}
      {rmSchema.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      <header className="bg-primary-container text-on-primary">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-20">
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

      {img && (
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <img src={img} alt="" className="w-full aspect-[16/9] object-cover rounded shadow-xl -mt-8 relative z-10" />
        </div>
      )}

      <div
        className="wp-content max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-14"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
