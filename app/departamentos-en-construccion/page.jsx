// /departamentos-en-construccion/ — Proyectos con obra en marcha + próximos a entregar (N11).
// Ataca "departamentos en construcción caba", "emprendimientos en construcción", "próximos a entregar":
// el comprador que quiere menos riesgo de obra que el pozo puro.
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import ProjectCard from "../_ui/ProjectCard";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE } from "../../lib/wp";
import { catalogoConSellos, statsPorBarrio, usd, mesAnio } from "../../lib/statsPozo";

export const revalidate = 86400;
const URL = `${SITE}/departamentos-en-construccion/`;
const anioHoy = () => new Date().getFullYear();

async function datos() {
  const all = await catalogoConSellos();
  const enObra = all.filter((i) => i.etapa === "En construcción");
  const proximos = all.filter((i) => i.entregaAnio && i.entregaAnio <= anioHoy() + 1).sort((a, b) => (a.entregaAnio - b.entregaAnio));
  return { all, enObra, proximos };
}

export async function generateMetadata() {
  const { enObra, proximos } = await datos();
  return {
    title: { absolute: `Departamentos en Construcción en CABA: ${enObra.length} Proyectos (${anioHoy()})` },
    description: `${enObra.length} edificios con obra en marcha y ${proximos.length} con entrega ${anioHoy()}–${anioHoy() + 1} en CABA y GBA. Menos riesgo que el pozo: precio, avance, desarrolladora y contacto directo.`,
    alternates: { canonical: URL },
  };
}

export default async function EnConstruccionPage() {
  const { enObra, proximos } = await datos();
  const mes = mesAnio();
  const orden = (arr) => [...arr].sort((a, b) => (Number(!!(b.sellos && b.sellos.length)) - Number(!!(a.sellos && a.sellos.length))) || (Number(!!b.imagen) - Number(!!a.imagen)));
  const topObra = orden(enObra).filter((i) => i.imagen).slice(0, 12);
  const topProx = proximos.filter((i) => i.imagen && !topObra.includes(i)).slice(0, 9);
  const porBarrio = statsPorBarrio(enObra, 2).sort((a, b) => b.n - a.n).slice(0, 15);
  const Card = (i) => <ProjectCard key={i.slug} slug={i.slug} nombre={i.nombre} barrio={i.barrio} direccion={i.direccion} precioDesde={i.precioDesde} precioM2={i.precioM2} img={i.imagen} etapa={i.etapa} ambientes={i.ambientes} entrega={i.entrega} desarrolladora={i.desarrolladora} sellos={i.sellos} destacado={!!(i.sellos && i.sellos.length)} />;
  const faq = [
    ["¿Qué diferencia hay entre comprar en pozo y en construcción?", "En pozo la obra no empezó o está en excavación: el precio es el más bajo, pero el plazo y el riesgo de obra son máximos. En construcción la estructura ya avanza: pagás algo más, con menos incertidumbre y menos tiempo hasta la posesión."],
    ["¿Conviene comprar un departamento próximo a entregar?", `Conviene si querés mudarte o alquilar pronto y bajar el riesgo de obra. Hoy hay ${proximos.length} proyectos con entrega estimada ${anioHoy()}–${anioHoy() + 1}. La contra: el anticipo suele ser mayor y quedan menos cuotas para financiar el saldo.`],
    ["¿Cómo verifico el avance real de una obra?", "Visitala, pedí el último informe de avance firmado por la dirección de obra, comparalo con el cronograma del boleto y consultá el permiso de obra. Si el avance se atrasa frente a lo cobrado, es una señal de alerta."],
    ["¿Se puede financiar un departamento en construcción?", "Sí, aunque con menos cuotas que en pozo porque la obra está más cerca de terminar. Algunas desarrolladoras aceptan crédito hipotecario para el saldo a la entrega."],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "ItemList", name: "Departamentos en construcción en CABA", numberOfItems: enObra.length,
      itemListElement: topObra.map((i, k) => ({ "@type": "ListItem", position: k + 1, url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`, name: i.nombre })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-6xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">Obra en marcha · {mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Departamentos en construcción en CABA y GBA: {enObra.length} proyectos con obra en marcha</h1>
      <div className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl max-w-4xl">
        <p className="text-body-lg text-primary"><strong>Respuesta rápida:</strong> hoy relevamos <strong>{enObra.length} edificios en construcción</strong> y <strong>{proximos.length} con entrega estimada {anioHoy()}–{anioHoy() + 1}</strong>. Comprar con la obra avanzada cuesta algo más que el pozo puro, pero baja el riesgo y acorta el tiempo hasta la posesión o la renta.</p>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-10 mb-4">Edificios en construcción destacados</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{topObra.map(Card)}</div>
      <p className="mt-4"><Link href="/desarrollos-inmobiliarios/?etapa=en%20construcci%C3%B3n" className="text-secondary font-medium hover:underline">Ver los {enObra.length} proyectos en construcción →</Link></p>

      {topProx.length > 0 && (<section id="proximos-a-entregar">
        <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-4">Próximos a entregar ({anioHoy()}–{anioHoy() + 1})</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{topProx.map(Card)}</div>
      </section>)}

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-3">En construcción por barrio</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl max-w-4xl">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["Barrio", "En construcción", "Precio desde", "Mediana USD/m²"].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{porBarrio.map((f) => (
            <tr key={f.slug} className="border-t border-outline-variant">
              <td className="px-3 py-2"><Link href={`/desarrollos-inmobiliarios-en-${f.slug}/`} className="text-primary font-medium hover:underline">{f.label}</Link></td>
              <td className="px-3 py-2">{f.n}</td><td className="px-3 py-2">{usd(f.minDesde)}</td><td className="px-3 py-2">{usd(f.medM2)}</td>
            </tr>))}</tbody>
        </table>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {[["Inmobiliarias que venden proyectos en construcción", "/inmobiliarias-que-venden-proyectos-en-pozo/"], ["Ranking de desarrolladoras confiables", "/ranking-desarrolladoras-confiables/"], ["Precio m² en pozo por barrio", "/precio-departamentos-en-pozo-caba/"]].map(([t, h]) => (
          <Link key={h} href={h} className="block rounded-xl border border-outline-variant p-4 hover:border-link-gold font-semibold text-primary">{t} →</Link>
        ))}
      </div>
      <Faq items={faq} title="Preguntas frecuentes sobre departamentos en construcción" />
      <div className="mt-10"><AlertaCTA titulo="Avisame de proyectos próximos a entregar" fuente="en-construccion" /></div>
    </Container>
  );
}
