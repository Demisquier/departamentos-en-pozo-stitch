// app/_views/PageView.jsx — Render de página genérica (páginas WP servidas por el
// catch-all /{slug}/ que no son post ni barrio). Extraído tal cual desde
// app/[slug]/page.jsx (segundo return, rama no-barrio). Se conservan verbatim los
// guardas `type === "post"` (inalcanzables para páginas) para no alterar la salida.
import Link from "next/link";
import { articleSchema } from "../../lib/wp";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Breadcrumb from "../_ui/Breadcrumb";
import Button from "../_ui/Button";
import PageHeader from "../_ui/PageHeader";

export default function PageView({ node, type, title, img, content, schema }) {
  return (
    <article>
      {type === "post" && (
        <JsonLd data={articleSchema(node, `/${node?.slug}/`)} />
      )}
      <JsonLd data={schema} />
      {/* Banner oscuro sólo para posts y páginas comunes. Las páginas de barrio traen
          su propio hero en el contenido WP y se renderizan como el hub (sin banner). */}
      <PageHeader>
        {type === "post" && (
          <Breadcrumb
            tone="dark"
            sep="/"
            sepAriaHidden={false}
            className="mb-6"
            items={[
              { name: "Inicio", href: "/" },
              { name: "Guías", href: "/novedades/" },
            ]}
          />
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
      </PageHeader>

      {img && (
        <Container>
          <img src={img} alt="" className="w-full aspect-[16/9] object-cover rounded shadow-xl -mt-8 relative z-10" />
        </Container>
      )}

      <div
        className="wp-content max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-14"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {type === "post" && (
        <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop pb-16">
          <div className="border-t border-outline-variant pt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Link href="/novedades/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span> Volver a Guías
            </Link>
            <Button as={Link} variant="primary" href="/desarrollos-inmobiliarios/" className="inline-flex items-center gap-2 px-6 py-3 font-label-caps text-label-caps tracking-widest">
              Ver proyectos en pozo <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
