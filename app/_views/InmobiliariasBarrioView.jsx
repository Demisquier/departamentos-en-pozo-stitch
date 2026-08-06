// app/_views/InmobiliariasBarrioView.jsx — Página de inmobiliarias por barrio
// (/mejores-inmobiliarias-en-{barrio}/). Espejo de BarrioView de desarrolladoras:
// mismo layout/ancho, H1 34px, chip de filtro que vuelve al hub, y el directorio
// pre-filtrado por zona (DirectorioInmo con zonaFija). Misma lógica de URL/filtros.
import Link from "next/link";
import DirectorioInmo from "../mejores-inmobiliarias-caba/DirectorioInmo";
import { ZONA_INMO_LABEL } from "../../lib/barrios";
import { INMO_BARRIO_INTRO } from "../../lib/inmoBarrioIntros";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import FilterChip from "../_ui/FilterChip";

export default function InmobiliariasBarrioView({ zonaKey, items, schema }) {
  const label = ZONA_INMO_LABEL[zonaKey] || zonaKey;
  const intro = INMO_BARRIO_INTRO[zonaKey];
  return (
    <article>
      <JsonLd data={schema} />
      <Container as="main" className="py-10 md:py-14">
        {/* Breadcrumb (UX + refuerza el BreadcrumbList del schema) */}
        <nav aria-label="Ruta" className="text-[13px] text-on-surface-variant mb-4 flex flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-secondary">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link href="/mejores-inmobiliarias-caba/" className="hover:text-secondary">Inmobiliarias CABA</Link>
          <span aria-hidden="true">/</span>
          <span className="text-primary">{label}</span>
        </nav>

        <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-4">Inmobiliarias en {label}</h1>

        {intro && (
          <div className="wp-content prose max-w-none text-body-md text-on-surface-variant mb-6" dangerouslySetInnerHTML={{ __html: intro }} />
        )}

        <FilterChip
          label={label}
          backHref="/mejores-inmobiliarias-caba/"
          backLabel="Ver todas las inmobiliarias de CABA"
        />

        <DirectorioInmo items={items} zonaFija={zonaKey} />

        <p className="text-[13px] text-on-surface-variant mt-10 border-t border-outline-variant pt-6">
          Directorio de inmobiliarias con actividad en {label}, ordenado por matrícula CUCICBA verificable y criterios comprobables — no por opinión ni por pago. Si comprás en pozo, revisá primero la{" "}
          <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-secondary underline">desarrolladora que construye</Link>: de ella depende el riesgo de entrega.
        </p>
      </Container>
    </article>
  );
}
