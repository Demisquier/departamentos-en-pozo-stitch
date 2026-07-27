import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getPostsByCategory, featuredImage } from "../../../lib/wp";

export const dynamicParams = !process.env.EXPORT;

export async function generateStaticParams() {
  const cats = await getCategories();
  return (cats || []).filter((c) => c.slug && c.slug !== "uncategorized").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const cat = await getCategoryBySlug(params.slug);
  return { title: cat ? `${cat.name} | Departamentos en Pozo` : "Categoría", alternates: { canonical: `https://departamentosenpozo.com.ar/category/${params.slug}/` } };
}

function clean(html) {
  return (html || "").replace(/<[^>]+>/g, "").trim();
}

export default async function CategoryPage({ params }) {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();
  const posts = await getPostsByCategory(cat.id);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: "https://departamentosenpozo.com.ar/" },
          { "@type": "ListItem", position: 2, name: "Guías", item: "https://departamentosenpozo.com.ar/novedades/" },
          { "@type": "ListItem", position: 3, name: cat.name, item: `https://departamentosenpozo.com.ar/category/${cat.slug}/` },
        ],
      }) }} />
      <header className="bg-primary-container text-on-primary">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-20">
          <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-on-primary-fixed-variant mb-6">
            <Link href="/" className="hover:text-link-gold">Inicio</Link><span>/</span>
            <Link href="/novedades/" className="hover:text-link-gold">Guías</Link><span>/</span>
            <span className="text-on-primary" dangerouslySetInnerHTML={{ __html: cat.name }} />
          </nav>
          <p className="text-link-gold font-label-caps text-label-caps uppercase mb-4">Categoría</p>
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg" dangerouslySetInnerHTML={{ __html: cat.name }} />
          {cat.description && (
            <p className="text-on-primary-fixed-variant text-body-lg max-w-2xl mt-5 leading-relaxed">{cat.description}</p>
          )}
        </div>
      </header>

      <section className="py-16 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        {posts.length === 0 ? (
          <p className="text-on-surface-variant">No hay publicaciones en esta categoría por ahora.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {posts.map((p) => {
              const img = featuredImage(p);
              return (
                <Link key={p.id} href={`/${p.slug}/`} className="group block space-y-4">
                  <div className="aspect-video bg-surface-container overflow-hidden rounded">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-surface-container" />
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-secondary uppercase tracking-widest font-label-caps">
                    {new Date(p.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <h3 className="font-headline-sm text-headline-sm text-primary group-hover:text-secondary transition-colors" dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
                  <p className="text-on-surface-variant text-body-md">{clean(p.excerpt?.rendered).slice(0, 140)}…</p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
