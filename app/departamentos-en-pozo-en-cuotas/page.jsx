// /departamentos-en-pozo-en-cuotas/ — Proyectos con plan de pagos (anticipo + cuotas durante la obra).
// Ataca "departamentos en pozo en cuotas / financiados / en pesos" con inventario real.
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import ProjectCard from "../_ui/ProjectCard";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE } from "../../lib/wp";
import { catalogoConSellos, statsPorBarrio, usd, mesAnio } from "../../lib/statsPozo";

export const revalidate = 86400;
const URL = `${SITE}/departamentos-en-pozo-en-cuotas/`;

export async function generateMetadata() {
  const n = (await catalogoConSellos()).filter((i) => i.financiacion).length;
  return {
    title: { absolute: `Departamentos en Pozo en Cuotas: ${n} Proyectos (${new Date().getFullYear()})` },
    description: `${n} departamentos en pozo con plan de cuotas en CABA y GBA: anticipo, cuotas en pesos ajustadas por CAC o en dólares y entrega. Compará y consultá directo.`,
    alternates: { canonical: URL },
  };
}

export default async function CuotasPage() {
  const items = await catalogoConSellos();
  const conCuotas = items.filter((i) => i.financiacion);
  const orden = [...conCuotas].sort((a, b) => (Number(!!(b.sellos && b.sellos.length)) - Number(!!(a.sellos && a.sellos.length))) || (Number(!!b.imagen) - Number(!!a.imagen)) || ((a.precioDesde || 9e9) - (b.precioDesde || 9e9)));
  const top = orden.filter((i) => i.imagen).slice(0, 24);
  const porBarrio = statsPorBarrio(conCuotas, 2).sort((a, b) => b.n - a.n);
  const desdes = conCuotas.map((i) => i.precioDesde).filter((v) => v && v > 15000).sort((a, b) => a - b);
  const mes = mesAnio();

  const faq = [
    ["¿Se puede comprar un departamento en pozo en cuotas?", `Sí. ${conCuotas.length} de los proyectos del catálogo publican un plan de pagos: un anticipo al firmar y el saldo en cuotas durante la obra, con un pago final contra entrega o escritura.`],
    ["¿Las cuotas son en pesos o en dólares?", "Las dos modalidades existen. En pesos, la cuota suele ajustarse mes a mes por el índice CAC (Cámara Argentina de la Construcción); en dólares, la cuota es fija en USD. Algunas desarrolladoras ofrecen cuotas fijas en pesos por un tramo corto."],
    ["¿Cuánto anticipo piden?", "Lo más habitual en CABA va del 30% al 50% del precio; hay planes con anticipos menores a cambio de más cuotas o de un saldo mayor a la entrega. Cada ficha detalla el esquema que publica la desarrolladora."],
    ["¿Qué riesgo tienen las cuotas ajustadas por CAC?", "Si el costo de la construcción sube más que tus ingresos o que el dólar, la cuota en pesos crece en términos reales. Por eso conviene simular el ajuste antes de firmar."],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "ItemList", name: "Departamentos en pozo en cuotas", numberOfItems: conCuotas.length,
      itemListElement: top.slice(0, 20).map((i, k) => ({ "@type": "ListItem", position: k + 1, url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`, name: i.nombre })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-6xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">Financiación · {mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Departamentos en pozo en cuotas: {conCuotas.length} proyectos financiados en CABA y GBA</h1>

      <div className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl max-w-4xl">
        <p className="text-body-lg text-primary">
          <strong>Respuesta rápida:</strong> {conCuotas.length} proyectos publican plan de pagos. El esquema típico es <strong>anticipo + cuotas durante la obra + saldo a la entrega</strong>, con cuotas en pesos ajustadas por CAC o fijas en dólares. Se consiguen desde <strong>{usd(desdes[0])}</strong> (precio desde más bajo con cuotas).
        </p>
        <p className="text-[13.5px] text-on-surface-variant mt-2">¿Cuánto te va a quedar la cuota? Probá el <Link href="/simulador-cuota-cac-pozo/" className="underline text-primary">simulador de cuota CAC</Link>.</p>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-10 mb-4">Proyectos en pozo con cuotas</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {top.map((i) => (
          <ProjectCard key={i.slug} slug={i.slug} nombre={i.nombre} barrio={i.barrio} direccion={i.direccion} precioDesde={i.precioDesde} precioM2={i.precioM2} img={i.imagen} etapa={i.etapa} ambientes={i.ambientes} entrega={i.entrega} desarrolladora={i.desarrolladora} sellos={i.sellos} destacado={!!(i.sellos && i.sellos.length)} />
        ))}
      </div>
      <p className="mt-4"><Link href="/desarrollos-inmobiliarios/?fin=1" className="text-secondary font-medium hover:underline">Ver los {conCuotas.length} proyectos con financiación y filtrar por barrio →</Link></p>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-3">Cuotas por barrio</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl max-w-4xl">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["Barrio", "Proyectos con cuotas", "Precio desde", "Mediana USD/m²"].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>
            {porBarrio.map((f) => (
              <tr key={f.slug} className="border-t border-outline-variant">
                <td className="px-3 py-2"><Link href={`/desarrollos-inmobiliarios-en-${f.slug}/`} className="text-primary font-medium hover:underline">{f.label}</Link></td>
                <td className="px-3 py-2">{f.n}</td><td className="px-3 py-2">{usd(f.minDesde)}</td><td className="px-3 py-2">{usd(f.medM2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section id="en-pesos" className="mt-12 max-w-4xl">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Departamentos en pozo en pesos (cuotas ajustadas por CAC)</h2>
        <p className="text-body-md text-on-surface-variant">Muchas desarrolladoras toman el anticipo en dólares y financian el saldo en pesos, ajustando cada cuota por el índice CAC. Es la forma más común de comprar en pozo sin crédito hipotecario. Leé <Link href="/cuotas-fijas-en-pesos-vs-ajuste-cac-en-pozo-que-conviene/" className="underline text-primary">cuotas fijas en pesos vs ajuste CAC</Link> y <Link href="/como-financiar-un-departamento-en-pozo-cuotas-ajustes-y-estrategias-para-no-ahogarte/" className="underline text-primary">cómo financiar un pozo sin crédito</Link>.</p>
      </section>
      <section id="en-dolares" className="mt-8 max-w-4xl">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Departamentos en pozo en cuotas en dólares</h2>
        <p className="text-body-md text-on-surface-variant">Otras propuestas fijan la cuota en USD: no hay ajuste por inflación de costos, pero necesitás ingresos o ahorro en dólares. Comparar el costo total de ambas modalidades (anticipo + cuotas + saldo) es clave antes de decidir.</p>
      </section>

      <Faq items={faq} title="Preguntas frecuentes sobre comprar en pozo en cuotas" />
      <div className="mt-12"><AlertaCTA titulo="Avisame de nuevos proyectos con cuotas" fuente="pozo-cuotas" /></div>
    </Container>
  );
}
