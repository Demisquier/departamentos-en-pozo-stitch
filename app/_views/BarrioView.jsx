// app/_views/BarrioView.jsx — Página de barrio (/desarrolladoras-inmobiliarias-en-{barrio}/).
// Extraído tal cual desde app/[slug]/page.jsx (rama barrio del segundo return): mismo
// layout que el hub (ancho, prose), header + chip de filtro + directorio pre-filtrado
// + contenido WP partido por el marcador <!--DIRECTORIO-->. Render idéntico.
import Link from "next/link";
import DirectorioDevs from "../desarrolladoras-inmobiliarias-en-capital-federal/DirectorioDevs";
import { BARRIO_NOMBRE } from "../../lib/barrios";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";

export default function BarrioView({
  content,
  barrioSlug,
  barrioKey,
  devsBarrio,
  usaDirectorioBarrio,
  contenidoTieneH1,
  barrioBefore,
  barrioAfter,
  schema,
}) {
  return (
    <article>
      <JsonLd data={schema} />
      {/* Página de barrio: MISMO layout que el hub (ancho, prose). Contenido antes del
          marcador → directorio pre-filtrado (cards del hub) → contenido después. Si no
          hay directorio (barrio sin devs) se muestra el contenido completo, igual de ancho. */}
      <Container as="main" className="py-10 md:py-14">
        {/* Header estilo hub + chip de filtro: la página de barrio se siente el mismo
            hub con un filtro aplicado, fácil de volver a "todas". */}
        {!contenidoTieneH1 && (
          <h1 className="font-headline-md text-[1.9rem] md:text-[2.5rem] leading-tight text-primary mb-4">
            Desarrolladoras en {BARRIO_NOMBRE[barrioSlug] || barrioSlug}
          </h1>
        )}
        {usaDirectorioBarrio && (
          <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-outline-variant">
            <span className="text-[12px] font-label-caps uppercase tracking-wider text-on-surface-variant">Filtrando por barrio</span>
            <span className="inline-flex items-center gap-2 bg-primary-container text-on-primary rounded-full pl-4 pr-1.5 py-1.5 text-[14px] font-medium">
              {BARRIO_NOMBRE[barrioSlug] || barrioSlug}
              <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" aria-label="Quitar filtro, ver todas las desarrolladoras" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/25 hover:bg-white/45 transition-colors leading-none">✕</Link>
            </span>
            <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-[14px] text-secondary underline hover:no-underline">Ver todas las desarrolladoras de CABA</Link>
          </div>
        )}
        {/* Directorio ARRIBA (igual que el hub): el listado filtrado va justo después
            del header/chip, y TODO el editorial del barrio queda debajo. Un solo cambio
            acá deja las 9 páginas de barrio "directory-first", sin salto respecto al hub. */}
        {usaDirectorioBarrio && (
          <DirectorioDevs devs={devsBarrio} barrioFijo={barrioKey} tituloBarrio={BARRIO_NOMBRE[barrioSlug] || barrioSlug} />
        )}
        <div
          className="wp-content prose max-w-none text-body-md text-on-surface-variant mt-8"
          dangerouslySetInnerHTML={{ __html: usaDirectorioBarrio ? (barrioBefore + barrioAfter) : content }}
        />
      </Container>
    </article>
  );
}
