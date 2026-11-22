// /departamentos-en-pozo-zona-norte/ — Hub GBA Norte (N4): agrupa las landings de localidad
// con datos propios (n, USD/m², precio desde) + sección casas/dúplex. Ataca "pozo zona norte" y "casas en pozo".
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import ProjectCard from "../_ui/ProjectCard";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE } from "../../lib/wp";
import { zonaDeBarrio, BARRIO_CATALOGO } from "../../lib/barrios";
import { catalogoConSellos, statsPorBarrio, statsGlobal, usd, mesAnio } from "../../lib/statsPozo";

export const revalidate = 86400;
const URL = `${SITE}/departamentos-en-pozo-zona-norte/`;
const ZN = "GBA · Zona Norte";
const esCasa = (i) => /\bcasas?\b|d[uú]plex|townhouse|\bhaus\b/i.test(`${i.nombre} ${i.ambientes}`);

async function datos() {
  const items = (await catalogoConSellos()).filter((i) => zonaDeBarrio(i.barrio) === ZN);
  const g = statsGlobal(items);
  const locs = statsPorBarrio(items, 1).filter((f) => zonaDeBarrio(BARRIO_CATALOGO[f.slug].label) === ZN).sort((a, b) => b.n - a.n);
  // Localidades crudas (incluye las que no tienen landing propia: Tigre, Escobar, Martínez…)
  const crudas = Object.entries(items.reduce((a, i) => ((a[i.barrio.split(/[,(]/)[0].trim()] = (a[i.barrio.split(/[,(]/)[0].trim()] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
  return { items, g, locs, crudas };
}

export async function generateMetadata() {
  const { items, g } = await datos();
  return {
    title: { absolute: `Departamentos en Pozo en Zona Norte: ${items.length} Proyectos (${new Date().getFullYear()})` },
    description: `${items.length} proyectos en pozo en Zona Norte (GBA): Vicente López, Olivos, San Isidro, Tigre, Nordelta y Pilar. Precio desde ${usd(g.minDesde)}, entrega y contacto directo.`,
    alternates: { canonical: URL },
  };
}

export default async function ZonaNortePage() {
  const { items, g, locs, crudas } = await datos();
  const mes = mesAnio();
  const top = [...items].sort((a, b) => (Number(!!(b.sellos && b.sellos.length)) - Number(!!(a.sellos && a.sellos.length))) || (Number(!!b.imagen) - Number(!!a.imagen))).slice(0, 18);
  const casas = items.filter(esCasa);
  const faq = [
    ["¿Dónde conviene comprar en pozo en Zona Norte?", `Depende del objetivo. Vicente López y Olivos concentran proyectos de departamentos cerca de CABA y con mejor reventa; Tigre, Nordelta y Pilar ofrecen más m² y amenities por el mismo dinero, con más dependencia del auto. Hoy relevamos ${items.length} proyectos en la zona.`],
    ["¿Cuánto cuesta un departamento en pozo en Zona Norte?", `En ${mes} el precio desde más bajo publicado es ${usd(g.minDesde)}${g.medM2 ? ` y la mediana del USD/m² es ${usd(g.medM2)}` : ""}. Varía mucho entre Vicente López (más caro) y localidades como Benavídez o Escobar.`],
    ["¿Hay proyectos en pozo con financiación en Zona Norte?", `Sí: ${g.conCuotas} de los ${items.length} proyectos publican plan de cuotas (anticipo + cuotas durante la obra).`],
    ["¿Nordelta o Vicente López para invertir?", "Vicente López suele tener mejor liquidez y demanda de alquiler tradicional por cercanía a CABA. Nordelta compite por calidad de vida y m²; la renta depende más del alquiler a familias y del temporario. Compará USD/m² y expensas antes de decidir."],
    ["¿Hay casas en pozo en Zona Norte?", casas.length ? `Sí, hay proyectos de casas, dúplex o townhouses en pozo (${casas.length} en el catálogo hoy). La mayor parte de la oferta en pozo sigue siendo de departamentos.` : "La oferta en pozo de la zona es casi toda de departamentos; las casas suelen venderse en barrios cerrados con lote + proyecto."],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "ItemList", name: "Departamentos en pozo en Zona Norte", numberOfItems: items.length,
      itemListElement: top.slice(0, 20).map((i, k) => ({ "@type": "ListItem", position: k + 1, url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`, name: i.nombre })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-6xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">GBA Norte · {mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Departamentos en pozo en Zona Norte: {items.length} proyectos en Vicente López, San Isidro, Tigre, Nordelta y Pilar</h1>

      <div className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl max-w-4xl">
        <p className="text-body-lg text-primary">
          <strong>Respuesta rápida:</strong> hoy hay <strong>{items.length} proyectos en pozo o en construcción</strong> en Zona Norte del GBA, desde <strong>{usd(g.minDesde)}</strong>{g.medM2 ? <> (mediana {usd(g.medM2)}/m²)</> : null}. {g.conCuotas} tienen plan de cuotas. Las localidades con más oferta: {crudas.slice(0, 4).map(([b, n]) => `${b} (${n})`).join(", ")}.
        </p>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-10 mb-3">Zona Norte por localidad</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl max-w-4xl">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["Localidad", "Proyectos", "Precio desde", "Mediana USD/m²", "Con cuotas"].map((h) => <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {locs.map((f) => (
              <tr key={f.slug} className="border-t border-outline-variant">
                <td className="px-3 py-2"><Link href={`/desarrollos-inmobiliarios-en-${f.slug}/`} className="text-primary font-medium hover:underline">Pozo en {f.label}</Link></td>
                <td className="px-3 py-2">{f.n}</td><td className="px-3 py-2 whitespace-nowrap">{usd(f.minDesde)}</td><td className="px-3 py-2 whitespace-nowrap">{usd(f.medM2)}</td><td className="px-3 py-2">{f.conCuotas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12.5px] text-on-surface-variant mt-2">Fuente: fichas activas de Departamentos en Pozo. Actualizado {mes}.</p>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-4">Proyectos en pozo destacados en Zona Norte</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {top.map((i) => (
          <ProjectCard key={i.slug} slug={i.slug} nombre={i.nombre} barrio={i.barrio} direccion={i.direccion} precioDesde={i.precioDesde} precioM2={i.precioM2} img={i.imagen} etapa={i.etapa} ambientes={i.ambientes} entrega={i.entrega} desarrolladora={i.desarrolladora} sellos={i.sellos} destacado={!!(i.sellos && i.sellos.length)} />
        ))}
      </div>
      <p className="mt-4"><Link href="/desarrollos-inmobiliarios/" className="text-secondary font-medium hover:underline">Ver el catálogo completo y filtrar por localidad →</Link></p>

      <section id="casas-en-pozo" className="mt-12 max-w-4xl">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Casas, dúplex y townhouses en pozo</h2>
        <p className="text-body-md text-on-surface-variant">La oferta en pozo de Zona Norte es mayormente de departamentos, pero también hay proyectos de casas y dúplex, sobre todo en Tigre, Benavídez, Escobar y Pilar. Al comprar una casa en pozo, además de la desarrolladora, verificá la situación del lote, el reglamento del barrio y las expensas del complejo.</p>
        {casas.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-body-md">
            {casas.map((i) => <li key={i.slug}><Link href={`/desarrollos-inmobiliarios/${i.slug}/`} className="text-primary underline">{i.nombre}</Link> · {i.barrio}{i.precioDesde ? ` · desde ${usd(i.precioDesde)}` : ""}</li>)}
          </ul>
        )}
      </section>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {[["Precio m² en pozo por barrio", "/precio-departamentos-en-pozo-caba/"], ["Departamentos en pozo en cuotas", "/departamentos-en-pozo-en-cuotas/"], ["Todos los desarrollos inmobiliarios", "/desarrollos-inmobiliarios/"]].map(([t, h]) => (
          <Link key={h} href={h} className="block rounded-xl border border-outline-variant p-4 hover:border-link-gold font-semibold text-primary">{t} →</Link>
        ))}
      </div>
      <Faq items={faq} title="Preguntas frecuentes sobre comprar en pozo en Zona Norte" />
      <div className="mt-12"><AlertaCTA titulo="Avisame de nuevos proyectos en Zona Norte" fuente="pozo-zona-norte" /></div>
    </Container>
  );
}
