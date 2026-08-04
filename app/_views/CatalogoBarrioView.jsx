import Link from "next/link";
import { SITE } from "../../lib/wp";
import CatalogoFiltros from "../desarrollos-inmobiliarios/CatalogoFiltros";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";

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

        {/* Cierre: enlaces a las otras capas del barrio (empresas), sin canibalizar. */}
        <section className="mt-12 pt-8 border-t border-outline-variant text-[15px] text-on-surface-variant">
          <p>
            Estás viendo los {n} proyectos en pozo de {label}
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
      </Container>
    </>
  );
}
