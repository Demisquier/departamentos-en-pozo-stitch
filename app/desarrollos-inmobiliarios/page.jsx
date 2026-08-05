import Link from 'next/link';
import { getDesarrollos, SITE } from '../../lib/wp';
import { mapDesarrollos } from '../../lib/catalogo';
import { BARRIO_CATALOGO, matchBarrioCatalogo } from '../../lib/barrios';
import CatalogoFiltros from './CatalogoFiltros';
import Container from '../_ui/Container';
import JsonLd from '../_ui/JsonLd';

// ISR: la lista se regenera sola con los datos (además del revalidate del fetch).
export const revalidate = 600;

export const metadata = {
  title: 'Desarrollos inmobiliarios en pozo en CABA: catálogo 2026 | Departamentos en Pozo',
  description:
    'Catálogo de desarrollos inmobiliarios en pozo (preventa) en CABA: precio, financiación, desarrolladora, tipologías, avance de obra y entrega. Compará proyectos por barrio con análisis independiente.',
  alternates: { canonical: `${SITE}/desarrollos-inmobiliarios/` },
};

const FAQ = [
  ['¿Qué es un desarrollo inmobiliario?', 'Es un proyecto de construcción de viviendas —en general un edificio de departamentos— que una desarrolladora concibe, financia y ejecuta. Cuando se vende antes de terminarse se lo llama "en pozo" o preventa.'],
  ['¿Conviene comprar un desarrollo inmobiliario en pozo?', 'Comprar en pozo suele tener un precio de entrada menor que el usado terminado de la zona, a cambio del riesgo de obra. Esa brecha se paga con la espera y el avance de obra. Conviene analizar la trayectoria de la desarrolladora, la estructura legal (fideicomiso) y cómo se ajustan las cuotas.'],
  ['¿Cómo comparar desarrollos inmobiliarios en CABA?', 'Mirá el precio por m² frente al usado terminado del barrio, quién es la desarrolladora y su track record, la etapa de obra, la estructura de pago (anticipo + cuotas ajustadas por CAC) y la fecha de entrega. Este catálogo ordena esos datos por proyecto.'],
];

export default async function CatalogoPage() {
  const items = await getDesarrollos();
  const mapped = mapDesarrollos(items);

  // Barrios con >=3 proyectos -> links internos a las URLs LIMPIAS por barrio (long-tail SEO).
  const barrios = Object.keys(BARRIO_CATALOGO)
    .map((k) => ({ k, label: BARRIO_CATALOGO[k].label, n: mapped.filter((i) => matchBarrioCatalogo(i.barrio, k)).length }))
    .filter((b) => b.n >= 3)
    .sort((a, b) => b.n - a.n);

  const schema = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Desarrollos inmobiliarios en pozo en CABA',
      url: `${SITE}/desarrollos-inmobiliarios/`, description: 'Catálogo independiente de desarrollos inmobiliarios en pozo (preventa) en CABA.' },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Desarrollos inmobiliarios en pozo', item: `${SITE}/desarrollos-inmobiliarios/` },
    ]},
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Desarrollos inmobiliarios en pozo en CABA', numberOfItems: mapped.length,
      itemListElement: mapped.map((i, idx) => ({ '@type': 'ListItem', position: idx + 1, url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`, name: i.nombre })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14">
      <JsonLd data={schema} />

      <div className="mb-8">
        <h1 className="font-headline-md text-headline-md md:text-display-lg serif text-primary max-w-3xl leading-tight">
          Desarrollos inmobiliarios en pozo en CABA: {mapped.length} proyectos
        </h1>
        <div className="mt-4 text-on-surface-variant font-body-lg text-body-lg max-w-3xl space-y-3">
          <p>
            Catálogo independiente de <strong>desarrollos inmobiliarios en pozo</strong> (preventa) en la Ciudad de Buenos Aires. Un desarrollo inmobiliario es un edificio de departamentos que una desarrolladora concibe, financia y construye; comprarlo en pozo —antes de que esté terminado— suele tener un precio de entrada menor que el usado de la zona, a cambio del riesgo de obra.
          </p>
          <p>
            Cada ficha reúne precio, desarrolladora, tipologías, etapa de obra, estructura de pago y entrega, para que compares proyectos con criterio. Explorá el catálogo completo o filtrá por barrio más abajo.
          </p>
        </div>
      </div>

      <CatalogoFiltros items={mapped} />

      {barrios.length > 0 && (
        <section className="mt-12 pt-8 border-t border-outline-variant">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Desarrollos inmobiliarios por barrio</h2>
          <p className="text-on-surface-variant mb-4 text-[15px]">Explorá los desarrollos en pozo por barrio de CABA, con precio y desarrolladora:</p>
          <div className="flex flex-wrap gap-2.5">
            {barrios.map((b) => (
              <Link key={b.k} href={`/departamentos-en-pozo-en-${b.k}/`}
                className="px-4 py-2 rounded-full border border-outline-variant text-primary text-[14px] hover:border-secondary hover:text-secondary transition-colors">
                Desarrollos inmobiliarios en {b.label} ({b.n})
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Preguntas frecuentes sobre desarrollos inmobiliarios</h2>
        <div className="space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border border-outline-variant rounded-lg p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-primary">{q}<span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span></summary>
              <p className="mt-3 text-on-surface-variant leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </Container>
  );
}
