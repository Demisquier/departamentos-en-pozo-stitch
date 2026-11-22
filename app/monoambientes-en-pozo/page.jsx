// /monoambientes-en-pozo/ — N7: proyectos en pozo con unidades de 1 ambiente (tipología de inversión).
// Dato propio (catálogo) + dato externo citado con fuente y mes (Zonaprop Index).
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import ProjectCard from "../_ui/ProjectCard";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE } from "../../lib/wp";
import { catalogoConSellos, statsPorBarrio, usd, mesAnio } from "../../lib/statsPozo";
import { MERCADO } from "../../lib/mercadoExterno";

export const revalidate = 86400;
const URL = `${SITE}/monoambientes-en-pozo/`;
const esMono = (i) => (i.ambientesNums || []).some((x) => x === "1" || /mono/i.test(String(x)));
const pct = (n) => `${String(n).replace(".", ",")}%`;
const desdeOk = (v) => v && v >= 35000 && v < 2000000;

async function datos() {
  const items = (await catalogoConSellos()).filter(esMono);
  const desdes = items.map((i) => i.precioDesde).filter(desdeOk).sort((a, b) => a - b);
  return { items, desdes, min: desdes[0] || null, med: desdes.length ? desdes[Math.floor(desdes.length / 2)] : null };
}

export async function generateMetadata() {
  const { items, min } = await datos();
  return {
    title: { absolute: `Monoambientes en Pozo en CABA: ${items.length} Proyectos desde ${usd(min)}` },
    description: `${items.length} proyectos en pozo con monoambientes en CABA y GBA, desde ${usd(min)}. Precio, entrega, cuotas y cuánto renta un monoambiente hoy. Consultá directo a la desarrolladora.`,
    alternates: { canonical: URL },
  };
}

export default async function MonoPage() {
  const { items, min, med } = await datos();
  const mes = mesAnio();
  const M = MERCADO;
  const baratos = [...items].filter((i) => desdeOk(i.precioDesde) && i.imagen).sort((a, b) => a.precioDesde - b.precioDesde).slice(0, 12);
  const sellados = items.filter((i) => i.sellos && i.sellos.length && i.imagen && !baratos.includes(i)).slice(0, 6);
  const porBarrio = statsPorBarrio(items, 3).sort((a, b) => b.n - a.n).slice(0, 15);
  const faq = [
    ["¿Conviene comprar un monoambiente en pozo para alquilar?", `Es la tipología con mejor relación alquiler/precio: según el ${M.fuente} (${M.mes}), un monoambiente usado medio de 40 m² vale USD ${M.monoUsd.toLocaleString("es-AR")} y se alquila por $${M.monoAlq.toLocaleString("es-AR")} al mes. En pozo se entra con anticipo y cuotas, pero la renta empieza recién con la entrega: sumá el plazo de obra al cálculo.`],
    ["¿Cuánto cuesta un monoambiente en pozo en CABA?", `En ${mes}, los proyectos del catálogo con monoambientes publican precios desde ${usd(min)}; la mediana del "precio desde" es ${usd(med)}. El precio final depende de m², piso y orientación.`],
    ["¿Cuánto renta un monoambiente en CABA?", `La rentabilidad bruta promedio del alquiler en CABA es ${pct(M.rentaCaba)} anual (${M.fuente}, ${M.mes}). Restando expensas a cargo del propietario, vacancia e impuestos, la renta neta suele quedar 1 a 2 puntos por debajo.`],
    ["¿Monoambiente o 2 ambientes para invertir?", "El monoambiente tiene menor ticket y mayor renta bruta por m²; el 2 ambientes tiene más demanda de inquilinos de largo plazo y mejor reventa. Si el objetivo es alquiler temporario, el monoambiente bien ubicado suele rendir más."],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "ItemList", name: "Monoambientes en pozo", numberOfItems: items.length,
      itemListElement: baratos.map((i, k) => ({ "@type": "ListItem", position: k + 1, url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`, name: i.nombre })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  const Card = (i) => <ProjectCard key={i.slug} slug={i.slug} nombre={i.nombre} barrio={i.barrio} direccion={i.direccion} precioDesde={i.precioDesde} precioM2={i.precioM2} img={i.imagen} etapa={i.etapa} ambientes={i.ambientes} entrega={i.entrega} desarrolladora={i.desarrolladora} sellos={i.sellos} destacado={!!(i.sellos && i.sellos.length)} />;

  return (
    <Container as="main" className="py-10 md:py-14 max-w-6xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">Inversión · {mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Monoambientes en pozo para invertir: {items.length} proyectos desde {usd(min)}</h1>
      <div className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl max-w-4xl">
        <p className="text-body-lg text-primary">
          <strong>Respuesta rápida:</strong> {items.length} proyectos en pozo de CABA y GBA ofrecen monoambientes, con precios desde <strong>{usd(min)}</strong> (mediana {usd(med)}). Como referencia, un monoambiente usado de 40 m² vale USD {M.monoUsd.toLocaleString("es-AR")} y la renta bruta promedio de CABA es <strong>{pct(M.rentaCaba)} anual</strong> ({M.fuente}, {M.mes}).
        </p>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-10 mb-4">Monoambientes en pozo más accesibles</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{baratos.map(Card)}</div>
      {sellados.length > 0 && (<>
        <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-4">De desarrolladoras con trayectoria verificada</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{sellados.map(Card)}</div>
      </>)}
      <p className="mt-4"><Link href="/desarrollos-inmobiliarios/?amb=1" className="text-secondary font-medium hover:underline">Ver los {items.length} proyectos con monoambientes →</Link></p>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-3">Monoambientes en pozo por barrio</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl max-w-4xl">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["Barrio", "Proyectos con mono", "Precio desde", "Mediana USD/m²"].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{porBarrio.map((f) => (
            <tr key={f.slug} className="border-t border-outline-variant">
              <td className="px-3 py-2"><Link href={`/desarrollos-inmobiliarios-en-${f.slug}/`} className="text-primary font-medium hover:underline">{f.label}</Link></td>
              <td className="px-3 py-2">{f.n}</td><td className="px-3 py-2">{usd(f.minDesde)}</td><td className="px-3 py-2">{usd(f.medM2)}</td>
            </tr>))}</tbody>
        </table>
      </div>

      <section className="mt-12 max-w-4xl">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Cómo evaluar un monoambiente en pozo como inversión</h2>
        <ul className="list-disc pl-5 text-body-md text-on-surface-variant space-y-1">
          <li>Compará el USD/m² del proyecto con la <Link href="/precio-departamentos-en-pozo-caba/" className="underline text-primary">mediana de su barrio</Link>.</li>
          <li>Calculá la renta sobre el precio total (incluí cochera si la hay) y descontá expensas y vacancia. Ver <Link href="/rentabilidad-alquiler-caba-por-barrio/" className="underline text-primary">rentabilidad por barrio</Link>.</li>
          <li>Verificá quién construye: <Link href="/ranking-desarrolladoras-confiables/" className="underline text-primary">ranking de desarrolladoras confiables</Link>.</li>
          <li>Si pensás en temporario, revisá el reglamento de copropiedad antes de reservar.</li>
        </ul>
      </section>

      <Faq items={faq} title="Preguntas frecuentes sobre monoambientes en pozo" />
      <p className="text-[12px] text-on-surface-variant mt-6">Datos de mercado: <a href={M.url} className="underline" rel="nofollow noopener" target="_blank">{M.fuente}, {M.mes}</a>. Precios de proyectos: fichas activas del catálogo. Información orientativa, no es asesoramiento financiero.</p>
      <div className="mt-10"><AlertaCTA titulo="Avisame de monoambientes nuevos en pozo" fuente="pozo-mono" /></div>
    </Container>
  );
}
