/** lib/seo.js — Helpers de SEO / metadata (Next Metadata + JSON-LD).
 *  buildMeta arma el objeto `metadata` (title/description/canonical/OG/twitter);
 *  articleSchema y breadcrumbSchema emiten JSON-LD schema.org. Formas de salida
 *  idénticas a las que vivían en lib/wp.js → sin cambios de SEO.
 */
import { SITE, BRAND, LOGO_URL } from "./constants";
import { stripHtml } from "./format";
import { featuredImage } from "./content";

export function metaDescription(node) {
  let d = stripHtml(node?.excerpt?.rendered) || stripHtml(node?.content?.rendered);
  if (!d) return "";
  if (d.length > 158) d = d.slice(0, 155).replace(/\s+\S*$/, "") + "…";
  return d;
}
export function buildMeta(node, pathq, type = "website") {
  const rawTitle = stripHtml(node?.title?.rendered);
  const title = rawTitle ? `${rawTitle} | ${BRAND}` : `${BRAND} | Inversiones Inmobiliarias en Buenos Aires`;
  const description = metaDescription(node) ||
    "Análisis independiente de inversión en departamentos en pozo (preventa) en CABA y GBA.";
  const url = SITE + (pathq || "/");
  const img = featuredImage(node, "jpg"); // OG/schema en JPG: máxima compatibilidad (WhatsApp)
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: type === "article" ? "article" : "website",
      title, description, url, siteName: BRAND, locale: "es_AR",
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: img ? "summary_large_image" : "summary",
      title, description, images: img ? [img] : undefined,
    },
  };
}
export function articleSchema(node, pathq) {
  const headline = stripHtml(node?.title?.rendered);
  const img = featuredImage(node, "jpg"); // OG/schema en JPG: máxima compatibilidad (WhatsApp)
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description: metaDescription(node),
    datePublished: node?.date,
    dateModified: node?.modified || node?.date,
    image: img ? [img] : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": SITE + (pathq || "/") },
    // E-E-A-T: autor identificable (equipo liderado por Demian Squiersky) con perfil
    // verificable. Vincula el contenido → autor → credenciales (LinkedIn + /sobre-nosotros/).
    author: {
      "@type": "Person",
      name: "Demian Squiersky",
      jobTitle: "Líder de producto · Análisis de real estate",
      description: "Más de 10 años en real estate digital. Lideró producto en los portales inmobiliarios líderes de Latinoamérica.",
      url: `${SITE}/sobre-nosotros/`,
      sameAs: ["https://ar.linkedin.com/in/demiansquiersky"],
      worksFor: { "@type": "Organization", name: BRAND, url: `${SITE}/` },
    },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
  };
}

// BreadcrumbList JSON-LD (Inicio › Guías › {título}).
export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url ? SITE + it.url : undefined,
    })),
  };
}
