import Link from 'next/link';
import { getDesarrollos, SITE } from '../../lib/wp';
import { mapDesarrollos } from '../../lib/catalogo';
import { conSellos, METODOLOGIA_URL } from '../../lib/sellos';
import CatalogoFiltros from '../desarrollos-inmobiliarios/CatalogoFiltros';
import Container from '../_ui/Container';
import JsonLd from '../_ui/JsonLd';
import Faq from '../_ui/Faq';

// Faceta SEO del filtro "Con sello de confianza": URL limpia e indexable (en vez de ?confianza=1),
// apunta a "proyectos en pozo de desarrolladoras confiables" / "departamentos en pozo seguros".
export const revalidate = 3600;
const PATH = '/proyectos-en-pozo-de-desarrolladoras-confiables/';

export const metadata = {
  title: 'Departamentos en Pozo de Desarrolladoras Confiables (Verificadas) 2026',
  description: 'Proyectos en pozo en CABA y GBA cuya desarrolladora o inmobiliaria tiene sello de confianza verificado: obras entregadas, premios, matrícula o BCRA. Con fuentes, sin pauta.',
  alternates: { canonical: `${SITE}${PATH}` },
};

const FAQ = [
  ['¿Qué es un departamento en pozo "de desarrolladora confiable"?', 'Es un proyecto cuya desarrolladora o inmobiliaria tiene al menos un sello verificado por nosotros con fuentes públicas: obras entregadas confirmadas, premios a obra construida, matrícula vigente en el padrón oficial o situación normal en el BCRA.'],
  ['¿Comprar en pozo con una desarrolladora con sello elimina el riesgo?', 'No. Lo reduce, porque hay evidencia de trayectoria o solidez, pero siempre conviene revisar el boleto, el fideicomiso y el plan de pagos de cada proyecto antes de firmar.'],
  ['¿Por qué hay pocos proyectos en este listado?', 'Porque solo incluimos lo que pudimos verificar. Que un proyecto no figure no significa nada negativo: puede que su desarrolladora todavía no haya sido evaluada.'],
];

export default async function Page() {
  const todos = conSellos(mapDesarrollos(await getDesarrollos()));
  const items = todos.filter((i) => i.sellos && i.sellos.length);
  const schema = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Departamentos en pozo de desarrolladoras confiables', url: `${SITE}${PATH}` },
    { '@context': 'https://schema.org', '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.map((i, idx) => ({ '@type': 'ListItem', position: idx + 1, url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`, name: i.nombre })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Desarrollos inmobiliarios en pozo', item: `${SITE}/desarrollos-inmobiliarios/` },
      { '@type': 'ListItem', position: 3, name: 'De desarrolladoras confiables', item: `${SITE}${PATH}` },
    ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  return (
    <Container as="main" className="py-10 md:py-14">
      <JsonLd data={schema} />
      <nav className="text-[13px] text-on-surface-variant mb-5 flex flex-wrap gap-1.5" aria-label="Ruta de navegación">
        <Link href="/" className="hover:text-secondary">Inicio</Link><span>/</span>
        <Link href="/desarrollos-inmobiliarios/" className="hover:text-secondary">Desarrollos inmobiliarios</Link><span>/</span>
        <span className="text-primary">De desarrolladoras confiables</span>
      </nav>
      <h1 className="font-headline-md text-headline-md md:text-[30px] serif text-primary leading-tight">
        {items.length} departamentos en pozo de desarrolladoras e inmobiliarias confiables
      </h1>
      <p className="mt-3 mb-6 text-on-surface-variant max-w-3xl">
        Proyectos cuya desarrolladora o inmobiliaria tiene <strong>sello de confianza verificado</strong> con fuentes públicas.
        Mirá el <Link href="/ranking-desarrolladoras-confiables/" className="underline text-secondary">ranking de desarrolladoras</Link>, el de{' '}
        <Link href="/ranking-inmobiliarias-confiables/" className="underline text-secondary">inmobiliarias</Link> y{' '}
        <Link href={METODOLOGIA_URL} className="underline text-secondary">cómo verificamos</Link>.
      </p>
      <CatalogoFiltros items={items} />
      <Faq items={FAQ} title="Preguntas frecuentes" />
    </Container>
  );
}
