// app/_views/InmobiliariasBarrioView.jsx — Página de inmobiliarias por barrio
// (/mejores-inmobiliarias-en-{barrio}/). Espejo de BarrioView de desarrolladoras:
// mismo layout/ancho, H1 34px, chip de filtro que vuelve al hub, y el directorio
// pre-filtrado por zona (DirectorioInmo con zonaFija). Misma lógica de URL/filtros.
import Link from "next/link";
import DirectorioInmo from "../mejores-inmobiliarias-caba/DirectorioInmo";
import { ZONA_INMO_LABEL } from "../../lib/barrios";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";

export default function InmobiliariasBarrioView({ zonaKey, items, schema }) {
  const label = ZONA_INMO_LABEL[zonaKey] || zonaKey;
  return (
    <article>
      <JsonLd data={schema} />
      <Container as="main" className="py-10 md:py-14">
        <h1 className="text-[34px] leading-[1.2] text-primary mb-4">Inmobiliarias en {label}</h1>

        <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-outline-variant">
          <span className="text-[12px] font-label-caps uppercase tracking-wider text-on-surface-variant">Filtrando por barrio</span>
          <span className="inline-flex items-center gap-2 bg-primary-container text-on-primary rounded-full pl-4 pr-1.5 py-1.5 text-[14px] font-medium">
            {label}
            <Link href="/mejores-inmobiliarias-caba/" aria-label="Quitar filtro, ver todas las inmobiliarias" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/25 hover:bg-white/45 transition-colors leading-none">✕</Link>
          </span>
          <Link href="/mejores-inmobiliarias-caba/" className="text-[14px] text-secondary underline hover:no-underline">Ver todas las inmobiliarias de CABA</Link>
        </div>

        <DirectorioInmo items={items} zonaFija={zonaKey} />

        <p className="text-[13px] text-on-surface-variant mt-10 border-t border-outline-variant pt-6">
          Directorio de inmobiliarias con actividad en {label}, ordenado por matrícula CUCICBA verificable y criterios comprobables — no por opinión ni por pago. Si comprás en pozo, revisá primero la{" "}
          <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-secondary underline">desarrolladora que construye</Link>: de ella depende el riesgo de entrega.
        </p>
      </Container>
    </article>
  );
}
