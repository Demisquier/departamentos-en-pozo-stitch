import Link from "next/link";
import { SITE } from "../../lib/wp";
import { NEARBY_CATALOGO, BARRIO_CATALOGO } from "../../lib/barrios";
import CatalogoFiltros from "../desarrollos-inmobiliarios/CatalogoFiltros";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import GuiasRelacionadas from "../_ui/GuiasRelacionadas";

// Landing de catálogo por barrio: el listado de proyectos en pozo pre-filtrado por barrio.
// Reusa CatalogoFiltros (con barrioFijo) y el mismo shape de items del catálogo general.
// `items` YA viene filtrado y mapeado por barrio desde app/[slug]/page.jsx.
export default function CatalogoBarrioView({ slug, label, items, intro, schema }) {
  const n = items.length;
  const conPrecio = items.filter((i) => i.precioDesde || i.precioM2).length;

  return (
    <>
      <JsonLd data={schema} />

      <Container as="main" className="py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-on-surface-variant mb-5 flex flex-wrap gap-1.5" aria-label="Ruta de navegación">
          <Link href="/" className="hover:text-secondary">Inicio</Link>
          <span>/</span>
          <Link href="/desarrollos-inmobiliarios/" className="hover:text-secondary">Departamentos en pozo</Link>
          <span>/</span>
          <span className="text-primary">{label}</span>
        </nav>

        <div className="mb-8">
          <h1 className="font-headline-md text-headline-md md:text-display-lg serif text-primary max-w-2xl leading-tight">
            Departamentos en pozo en {label}: {n} proyecto{n === 1 ? "" : "s"}
          </h1>
          {intro && (
            <div
              className="mt-4 text-on-surface-variant font-body-lg text-body-lg max-w-2xl space-y-3 [&_a]:text-secondary [&_a]:underline [&_a]:underline-offset-2"
              dangerouslySetInnerHTML={{ __html: intro }}
            />
          )}
        </div>

        <CatalogoFiltros items={items} barrioFijo={label} />

        {/* Cierre: variante de keyword (desarrollos inmobiliarios) + enlaces a las otras capas. */}
        <section className="mt-12 pt-8 border-t border-outline-variant text-[15px] text-on-surface-variant">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-3">Desarrollos inmobiliarios en pozo en {label}</h2>
          <p>
            Estás viendo los {n} desarrollos inmobiliarios en pozo de {label}
            {conPrecio ? ` (${conPrecio} con precio publicado)` : ""}. Si comprás en preventa, el
            riesgo de entrega depende de quién construye: revisá también las{" "}
            <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-secondary underline underline-offset-2">
              desarrolladoras de CABA
            </Link>{" "}
            y las{" "}
            <Link href="/mejores-inmobiliarias-caba/" className="text-secondary underline underline-offset-2">
              inmobiliarias con matrícula
            </Link>.
          </p>
        </section>

        {/* Barrios cercanos: interlinking hacia landings de barrios linderos. */}
        {(() => {
          const nearby = (NEARBY_CATALOGO[slug] || []).filter((k) => BARRIO_CATALOGO[k]);
          if (!nearby.length) return null;
          return (
            <section className="mt-10">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-3">Barrios cercanos</h2>
              <div className="flex flex-wrap gap-2.5">
                {nearby.map((k) => (
                  <Link key={k} href={`/desarrollos-inmobiliarios-en-${k}/`}
                    className="px-4 py-2 rounded-full border border-outline-variant text-primary text-[14px] hover:border-secondary hover:text-secondary transition-colors">
                    Desarrollos en pozo en {BARRIO_CATALOGO[k].label}
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Interlinking a las guías de decisión de compra. */}
        <GuiasRelacionadas />
      </Container>
    </>
  );
}
