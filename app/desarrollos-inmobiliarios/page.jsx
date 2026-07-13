import { getDesarrollos, featuredImage, acf } from '../../lib/wp';
import CatalogoFiltros from './CatalogoFiltros';

export const metadata = {
  title: 'Departamentos en pozo en CABA: proyectos | Departamentos en Pozo',
  description:
    'Descubra oportunidades exclusivas de inversión inmobiliaria en las zonas más prestigiosas de la Ciudad Autónoma de Buenos Aires.',
};

// Normaliza el precio a número (para poder filtrar por rango).
function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

export default async function CatalogoPage() {
  const items = await getDesarrollos();

  // Mapeo WP -> forma consumida por el grid de cards.
  const mapped = (items || []).map((node) => {
    const precioNum = toNumber(acf(node, 'precio_desde'));
    const barrio = acf(node, 'barrio') || '';
    // 'direccion' preferido; si no hay, usa el barrio como fallback.
    const direccion = acf(node, 'direccion') || barrio || '';
    return {
      slug: node.slug,
      nombre: node.title?.rendered || 'Proyecto',
      direccion,
      barrio,
      precio: precioNum,
      precioLabel: precioNum ? `Desde USD ${precioNum.toLocaleString('es-AR')}` : 'Consultar',
      // 'estado_obra' es la taxonomía; si viene como ACF la usamos, si no default en el card.
      etapa: acf(node, 'estado_obra') || acf(node, 'obra') || 'En pozo',
      imagen: featuredImage(node),
    };
  });

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
      {/* Hero Header */}
      <div className="mb-12">
        <h1 className="font-headline-md text-headline-md md:text-display-lg serif text-primary max-w-2xl leading-tight">
          Departamentos en pozo en CABA: {mapped.length} proyectos
        </h1>
        <p className="mt-4 text-on-surface-variant font-body-lg text-body-lg max-w-xl">
          Descubra oportunidades exclusivas de inversión inmobiliaria en las zonas más prestigiosas de la Ciudad
          Autónoma de Buenos Aires.
        </p>
      </div>

      {/* Filtros + grid (client) */}
      <CatalogoFiltros items={mapped} />
    </main>
  );
}
