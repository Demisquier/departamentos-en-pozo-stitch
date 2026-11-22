// /precio-departamentos-en-pozo-caba/ — Índice propio de precio por m² EN POZO por barrio.
// GEO: respuesta corta con dato fechado + tabla + metodología + Dataset/FAQPage schema.
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE } from "../../lib/wp";
import { catalogoConSellos, statsPorBarrio, statsGlobal, usd, mesAnio } from "../../lib/statsPozo";

export const revalidate = 86400;
const URL = `${SITE}/precio-departamentos-en-pozo-caba/`;

export async function generateMetadata() {
  const g = statsGlobal(await catalogoConSellos());
  return {
    title: { absolute: `Precio m² en Pozo en CABA por Barrio (${new Date().getFullYear()})` },
    description: `Cuánto cuesta un departamento en pozo en CABA: mediana ${usd(g.medM2)}/m² sobre ${g.nM2} proyectos reales, con tabla por barrio, rango y precio desde. Actualizado ${mesAnio()}.`,
    alternates: { canonical: URL },
  };
}

export default async function PrecioPozoPage() {
  const items = await catalogoConSellos();
  const g = statsGlobal(items);
  const filas = statsPorBarrio(items).filter((f) => f.medM2 || f.minDesde).sort((a, b) => (a.medM2 || 9e9) - (b.medM2 || 9e9) || (a.minDesde || 9e9) - (b.minDesde || 9e9));
  const conM2 = filas.filter((f) => f.medM2);
  const barato = conM2[0], caro = conM2[conM2.length - 1];
  const mes = mesAnio();

  const faq = [
    ["¿Cuánto cuesta un departamento en pozo en CABA?", `En ${mes}, la mediana del precio de lista en pozo es ${usd(g.medM2)} por m² (rango intercuartil ${usd(g.p25)}–${usd(g.p75)}), calculada sobre ${g.nM2} proyectos con precio publicado. El "precio desde" mediano es ${usd(g.medDesde)}.`],
    ["¿Cuál es el barrio más barato para comprar en pozo?", barato ? `Entre los barrios con al menos 3 proyectos con precio, el más accesible es ${barato.label} (mediana ${usd(barato.medM2)}/m²) y el más caro ${caro.label} (${usd(caro.medM2)}/m²).` : "Depende del mes; mirá la tabla actualizada."],
    ["¿El pozo es más barato que un usado o un a estrenar?", "En general el pozo cotiza por debajo del a estrenar terminado de la misma zona, como compensación por el riesgo y el plazo de obra. La diferencia varía por barrio y por desarrolladora: compará siempre el USD/m² del proyecto contra la mediana de su barrio."],
    ["¿Cómo se calcula este índice?", "Tomamos el precio por m² y el 'precio desde' publicados por la desarrolladora o la comercializadora en cada ficha activa del catálogo, agrupamos por barrio y usamos la mediana (no el promedio) para que un proyecto de lujo no distorsione el dato. Mostramos solo barrios con 3 o más proyectos con precio."],
  ];

  const schema = [
    {
      "@context": "https://schema.org", "@type": "Dataset",
      name: "Precio por m² de departamentos en pozo por barrio — CABA y GBA",
      description: `Mediana de USD/m² de lista en proyectos en pozo por barrio, calculada sobre ${g.nM2} proyectos del catálogo de Departamentos en Pozo.`,
      url: URL, creator: { "@type": "Organization", name: "Departamentos en Pozo", url: SITE },
      dateModified: new Date().toISOString().slice(0, 10), spatialCoverage: "Ciudad Autónoma de Buenos Aires, Argentina",
      variableMeasured: "Precio por m² en USD (mediana)", isAccessibleForFree: true,
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-5xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">Índice propio · {mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Precio de departamentos en pozo en CABA por barrio</h1>

      <div id="respuesta" className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl">
        <p className="text-body-lg text-primary">
          <strong>Respuesta rápida:</strong> en {mes} un departamento en pozo en CABA y GBA cotiza una mediana de <strong>{usd(g.medM2)}/m²</strong> (la mitad de los proyectos entre {usd(g.p25)} y {usd(g.p75)}). El "precio desde" mediano es <strong>{usd(g.medDesde)}</strong>. Base: {g.nM2} proyectos con precio publicado.
        </p>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-10 mb-3">USD por m² en pozo, por barrio</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>{["Barrio", "Mediana USD/m²", "Rango (P25–P75)", "Precio desde", "Proyectos", "Con cuotas"].map((h) => <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.slug} id={f.slug} className="border-t border-outline-variant">
                <td className="px-3 py-2"><Link href={`/desarrollos-inmobiliarios-en-${f.slug}/`} className="text-primary font-medium hover:underline">Departamentos en pozo en {f.label}</Link></td>
                <td className="px-3 py-2 font-semibold text-primary whitespace-nowrap">{usd(f.medM2)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-on-surface-variant">{f.p25 ? `${usd(f.p25)} – ${usd(f.p75)}` : "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{usd(f.minDesde)}</td>
                <td className="px-3 py-2">{f.n}</td>
                <td className="px-3 py-2">{f.conCuotas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12.5px] text-on-surface-variant mt-2">Fuente: fichas activas de Departamentos en Pozo (precios de lista publicados por cada desarrolladora o comercializadora). Actualizado {mes}.</p>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {[
          ["Ver todos los proyectos", "/desarrollos-inmobiliarios/", "Filtrá por barrio, precio y entrega"],
          ["Departamentos en pozo en cuotas", "/departamentos-en-pozo-en-cuotas/", "Anticipo + cuotas durante la obra"],
          ["¿Conviene comprar en pozo en 2026?", "/conviene-invertir-en-pozo-2026-roi-riesgos-y-como-decidir/", "Números, riesgos y cómo decidir"],
        ].map(([t, h, d]) => (
          <Link key={h} href={h} className="block rounded-xl border border-outline-variant p-4 hover:border-link-gold">
            <p className="font-semibold text-primary">{t} →</p><p className="text-[13px] text-on-surface-variant mt-1">{d}</p>
          </Link>
        ))}
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-2">Metodología</h2>
      <p className="text-body-md text-on-surface-variant">Usamos la <strong>mediana</strong> del USD/m² de lista de cada proyecto activo en pozo o en construcción, agrupado por barrio. Solo mostramos barrios con 3 o más proyectos. No incluye descuentos negociados, cocheras ni ajustes por CAC posteriores. El índice se recalcula todos los días a partir del catálogo.</p>

      <Faq items={faq} title="Preguntas frecuentes" />
      <div className="mt-12"><AlertaCTA fuente="precio-pozo" /></div>
    </Container>
  );
}
