import { getDesarrollos, SITE } from '../../lib/wp';
import { mapDesarrollos } from '../../lib/catalogo';
import CatalogoFiltros from './CatalogoFiltros';
import Container from '../_ui/Container';
import JsonLd from '../_ui/JsonLd';

// ISR: la lista se regenera sola con los datos de WP (además del revalidate del fetch).
export const revalidate = 600;

export const metadata = {
  title: 'Departamentos en pozo en CABA: catálogo de proyectos | Departamentos en Pozo',
  description:
    'Catálogo de departamentos en pozo (preventa) en CABA: precio, financiación, desarrolladora, tipologías, avance y entrega. Compará proyectos por barrio con análisis independiente.',
  alternates: { canonical: `${SITE}/desarrollos-inmobiliarios/` },
};

export default async function CatalogoPage() {
  const items = await getDesarrollos();
  const mapped = mapDesarrollos(items);

  // Schema ItemList (SEO): lista de todos los proyectos con URL, imagen y precio si existe.
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Departamentos en pozo en CABA',
    numberOfItems: mapped.length,
    itemListElement: mapped.map((i, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`,
      name: i.nombre,
    })),
  };

  return (
    <Container as="main" className="py-10 md:py-14">
      <JsonLd data={itemListSchema} />

      <div className="mb-8">
        <h1 className="font-headline-md text-headline-md md:text-display-lg serif text-primary max-w-2xl leading-tight">
          Departamentos en pozo en CABA: {mapped.length} proyectos
        </h1>
        <p className="mt-4 text-on-surface-variant font-body-lg text-body-lg max-w-2xl">
          Catálogo con análisis independiente: precio, financiación, desarrolladora, tipologías, avance y entrega.
          Compará proyectos barrio por barrio antes de invertir.
        </p>
      </div>

      <CatalogoFiltros items={mapped} />
    </Container>
  );
}
