// app/_views/BarrioView.jsx — Página de barrio (/desarrolladoras-inmobiliarias-en-{barrio}/).
// Extraído tal cual desde app/[slug]/page.jsx (rama barrio del segundo return): mismo
// layout que el hub (ancho, prose), header + chip de filtro + directorio pre-filtrado
// + contenido WP partido por el marcador <!--DIRECTORIO-->. Render idéntico.
import DirectorioDevs from "../desarrolladoras-inmobiliarias-en-capital-federal/DirectorioDevs";
import { BARRIO_NOMBRE } from "../../lib/barrios";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import FilterChip from "../_ui/FilterChip";

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
          <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-4">
            Desarrolladoras en {BARRIO_NOMBRE[barrioSlug] || barrioSlug}
          </h1>
        )}
        {usaDirectorioBarrio && (
          <FilterChip
            label={BARRIO_NOMBRE[barrioSlug] || barrioSlug}
            backHref="/desarrolladoras-inmobiliarias-en-capital-federal/"
            backLabel="Ver todas las desarrolladoras de CABA"
          />
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
