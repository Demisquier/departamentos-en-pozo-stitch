import Link from 'next/link';
import { getDesarrollos, SITE } from '../../lib/wp';
import { mapDesarrollos } from '../../lib/catalogo';
import { BARRIO_CATALOGO, matchBarrioCatalogo } from '../../lib/barrios';
import BuscadorModo from '../_ui/BuscadorModo';
import Container from '../_ui/Container';
import JsonLd from '../_ui/JsonLd';
import Faq from '../_ui/Faq';
import AlertaCTA from '../_ui/AlertaCTA';
import GuiasRelacionadas from '../_ui/GuiasRelacionadas';

// ISR: la lista se regenera sola con los datos (además del revalidate del fetch).
export const revalidate = 600;

export const metadata = {
  title: 'Desarrollos inmobiliarios en pozo en CABA: catálogo 2026 con precio y financiación | Departamentos en Pozo',
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
  // Stats para el bloque answer-first (dato real, citeable por IA).
  const nBarrios = new Set(mapped.map((i) => i.barrio).filter(Boolean)).size;
  const conFin = mapped.filter((i) => i.financiacion).length;
  const m2s = mapped.map((i) => i.precioM2).filter(Boolean).sort((a, b) => a - b);
  const minM2 = m2s[0] || null;
  const anios = mapped.map((i) => i.entregaAnio).filter(Boolean).sort((a, b) => a - b);
  const aMin = anios[0] || null, aMax = anios[anios.length - 1] || null;

  // Barrios con >=3 proyectos -> links internos a las URLs LIMPIAS por barrio (long-tail SEO).
  const barrios = Object.keys(BARRIO_CATALOGO)
    .map((k) => ({ k, label: BARRIO_CATALOGO[k].label, n: mapped.filter((i) => matchBarrioCatalogo(i.barrio, k)).length }))
    .filter((b) => b.n >= 3)
    .sort((a, b) => b.n - a.n);

  const schema = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Desarrollos inmobiliarios en pozo en CABA',
      url: `${SITE}/desarrollos-inmobiliarios/`, description: 'Catálogo independiente de desarrollos inmobiliarios en pozo (preventa) en CABA.', speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '#catalogo-bajada'] } },
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

      <div className="mb-5 md:mb-8">
        <h1 className="font-headline-sm text-headline-sm md:font-display-lg md:text-display-lg serif text-primary max-w-3xl leading-tight">
          Desarrollos inmobiliarios en pozo en CABA: {mapped.length} proyectos
        </h1>
        <p id="catalogo-bajada" className="mt-2 md:mt-4 text-on-surface-variant text-body-md md:text-body-lg max-w-3xl leading-relaxed">
          Catálogo independiente de <strong>desarrollos inmobiliarios en pozo</strong> (preventa): hay <strong>{mapped.length} proyectos</strong> relevados en CABA y GBA{nBarrios ? <> en <strong>{nBarrios} barrios</strong></> : null}{minM2 ? <>, desde <strong>USD {minM2.toLocaleString('es-AR')}/m²</strong></> : null}.{conFin > 0 ? <> <strong>{conFin}</strong> con financiación en cuotas durante la obra.</> : null}{aMin ? <> Entregas estimadas entre {aMin} y {aMax}.</> : null}{' '}
          <Link href="/buscar/" className="text-secondary font-medium hover:underline whitespace-nowrap">Buscá hablando →</Link>
        </p>
      </div>

      <BuscadorModo items={mapped} />

      {/* Bloque semántico: DEBAJO del directorio (H1 → bajada → grid → contexto). */}
      <section className="mt-12 pt-8 border-t border-outline-variant max-w-3xl text-on-surface-variant font-body-lg text-body-lg space-y-3">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Qué es un desarrollo inmobiliario en pozo</h2>
        <p>
          Un desarrollo inmobiliario es el emprendimiento completo —en general un edificio de departamentos— que una desarrolladora concibe, financia y construye. El <strong>departamento en pozo</strong> es una unidad de ese desarrollo comprada antes de que esté terminado: es la parte, no el todo.
        </p>
        <p>
          Comprar en pozo suele tener un precio de entrada menor que el usado de la zona, a cambio del riesgo de obra. Cada ficha reúne precio, desarrolladora, tipologías, etapa de obra, estructura de pago y entrega, para que compares proyectos con criterio. Detrás de cada desarrollo hay una desarrolladora: antes de decidir, revisá el <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-secondary underline underline-offset-2">directorio de desarrolladoras de CABA</Link>.
        </p>
      </section>

      {barrios.length > 0 && (
        <section className="mt-12 pt-8 border-t border-outline-variant">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Desarrollos inmobiliarios por barrio</h2>
          <p className="text-on-surface-variant mb-4 text-[15px]">Explorá los desarrollos en pozo por barrio de CABA, con precio y desarrolladora:</p>
          <div className="flex flex-wrap gap-2.5">
            {barrios.map((b) => (
              <Link key={b.k} href={`/desarrollos-inmobiliarios-en-${b.k}/`}
                className="px-4 py-2 rounded-full border border-outline-variant text-primary text-[14px] hover:border-secondary hover:text-secondary transition-colors">
                Desarrollos inmobiliarios en {b.label} ({b.n})
              </Link>
            ))}
          </div>
        </section>
      )}

      <AlertaCTA
        titulo="No te pierdas los próximos lanzamientos en pozo"
        texto="Dejá tu email y te avisamos cuando aparezca un proyecto nuevo en tu barrio y presupuesto, antes de que salga a los portales."
        cta="Crear alerta gratis" />

      <Faq items={FAQ} title="Preguntas frecuentes sobre desarrollos inmobiliarios" />

      {/* Interlinking a las guías de decisión de compra. */}
      <GuiasRelacionadas />
    </Container>
  );
}
