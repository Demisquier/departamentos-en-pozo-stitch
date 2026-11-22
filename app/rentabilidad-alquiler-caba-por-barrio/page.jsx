// /rentabilidad-alquiler-caba-por-barrio/ — N9 (GEO): renta bruta por región/barrio con fuente y mes,
// + puente a conversión: proyectos en pozo en las zonas de mayor renta.
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE } from "../../lib/wp";
import { MERCADO as M } from "../../lib/mercadoExterno";
import { catalogoConSellos, statsPorBarrio, usd, mesAnio } from "../../lib/statsPozo";

export const revalidate = 86400;
const URL = `${SITE}/rentabilidad-alquiler-caba-por-barrio/`;
const pct = (n) => `${String(n).replace(".", ",")}%`;

export const metadata = {
  title: { absolute: `Rentabilidad del Alquiler en CABA por Barrio (${M.mes.replace(/^\w/, (c) => c.toUpperCase())})` },
  description: `Renta bruta del alquiler en CABA: ${pct(M.rentaCaba)} anual promedio, ${M.rentaMax[0]} ${pct(M.rentaMax[1])} y ${M.rentaMin[0]} ${pct(M.rentaMin[1])}. Tabla por zona con fuente y proyectos en pozo para invertir.`,
  alternates: { canonical: URL },
};

export default async function RentabilidadPage() {
  const items = await catalogoConSellos();
  const pozo = statsPorBarrio(items).filter((f) => f.medM2).sort((a, b) => a.medM2 - b.medM2);
  const mes = mesAnio();
  const faq = [
    ["¿Cuál es la rentabilidad promedio del alquiler en CABA?", `${pct(M.rentaCaba)} bruta anual según el ${M.fuente} de ${M.mes}: se necesitan ${String(M.aniosRecupero).replace(".", ",")} años de alquiler para recuperar la inversión.`],
    ["¿Qué barrio de CABA da más renta?", `${M.rentaMax[0]} lidera con ${pct(M.rentaMax[1])} bruto anual; ${M.topRenta.join(" y ")} son los mejores barrios para renta según el mismo informe. El menor retorno es ${M.rentaMin[0]} (${pct(M.rentaMin[1])}). Por zona, el Sur rinde ${pct(M.rentaRegion[0][1])} y el Corredor Norte ${pct(M.rentaRegion[M.rentaRegion.length - 1][1])}.`],
    ["¿Qué diferencia hay entre renta bruta y neta?", "La bruta es alquiler anual / precio de compra. La neta descuenta expensas no trasladables, ABL, vacancia, impuestos (Ganancias, Bienes Personales) y mantenimiento; en CABA suele quedar 1 a 2 puntos por debajo de la bruta."],
    ["¿Rinde más comprar en pozo para alquilar?", "En pozo el precio de entrada suele ser menor que el de un a estrenar terminado, lo que mejora la renta sobre el capital invertido, pero el alquiler empieza recién con la entrega. Compará el USD/m² del proyecto con el usado medio de la zona y sumá el plazo de obra al cálculo."],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "Dataset", name: "Rentabilidad bruta del alquiler en CABA por zona", url: URL,
      description: `Retorno bruto anual del alquiler por región de CABA (${M.fuente}, ${M.mes}) y precio por m² en pozo por barrio (catálogo propio).`,
      creator: { "@type": "Organization", name: "Departamentos en Pozo", url: SITE }, isBasedOn: M.url, dateModified: new Date().toISOString().slice(0, 10), isAccessibleForFree: true },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-5xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">Inversión · datos {M.mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Rentabilidad del alquiler en CABA por barrio ({M.mes})</h1>
      <div id="respuesta" className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl">
        <p className="text-body-lg text-primary"><strong>Respuesta rápida:</strong> la renta bruta del alquiler en CABA es <strong>{pct(M.rentaCaba)} anual</strong> ({String(M.aniosRecupero).replace(".", ",")} años para recuperar la inversión). Los barrios que más rinden son {M.topRenta.join(" y ")} ({M.rentaMax[0]}: {pct(M.rentaMax[1])}) y el que menos, {M.rentaMin[0]} ({pct(M.rentaMin[1])}). Fuente: {M.fuente}, {M.mes}.</p>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-10 mb-3">Renta bruta anual por zona de la ciudad</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["Zona", "Renta bruta anual", "Fuente"].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>
            {M.rentaRegion.map(([z, r]) => (
              <tr key={z} className="border-t border-outline-variant"><td className="px-3 py-2 text-primary font-medium">{z}</td><td className="px-3 py-2 font-semibold">{pct(r)}</td><td className="px-3 py-2 text-on-surface-variant">{M.fuente}, {M.mes}</td></tr>
            ))}
            <tr className="border-t border-outline-variant bg-surface-container-low"><td className="px-3 py-2 font-semibold">Promedio CABA</td><td className="px-3 py-2 font-semibold">{pct(M.rentaCaba)}</td><td className="px-3 py-2 text-on-surface-variant">{M.fuente}, {M.mes}</td></tr>
            <tr className="border-t border-outline-variant"><td className="px-3 py-2">Máximo: {M.rentaMax[0]}</td><td className="px-3 py-2">{pct(M.rentaMax[1])}</td><td className="px-3 py-2 text-on-surface-variant">{M.fuente}, {M.mes}</td></tr>
            <tr className="border-t border-outline-variant"><td className="px-3 py-2">Mínimo: {M.rentaMin[0]}</td><td className="px-3 py-2">{pct(M.rentaMin[1])}</td><td className="px-3 py-2 text-on-surface-variant">{M.fuente}, {M.mes}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-[12.5px] text-on-surface-variant mt-2">Renta bruta = alquiler anual / precio de venta, sobre avisos de departamentos usados. <a href={M.url} className="underline" target="_blank" rel="nofollow noopener">Ver informe original</a>.</p>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-2">¿Y si comprás en pozo? Precio de entrada por barrio</h2>
      <p className="text-body-md text-on-surface-variant mb-3">La renta depende del precio de compra. Como referencia, el usado medio en CABA cotiza USD {M.usadoM2.toLocaleString("es-AR")}/m² ({M.fuente}, {M.mes}). Esta es la mediana del USD/m² de lista en pozo por barrio en nuestro catálogo ({mes}):</p>
      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["Barrio", "Mediana pozo USD/m²", "Precio desde", "Proyectos"].map((h) => <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>{pozo.map((f) => (
            <tr key={f.slug} className="border-t border-outline-variant">
              <td className="px-3 py-2"><Link href={`/desarrollos-inmobiliarios-en-${f.slug}/`} className="text-primary font-medium hover:underline">{f.label}</Link></td>
              <td className="px-3 py-2 font-semibold whitespace-nowrap">{usd(f.medM2)}</td><td className="px-3 py-2 whitespace-nowrap">{usd(f.minDesde)}</td><td className="px-3 py-2">{f.n}</td>
            </tr>))}</tbody>
        </table>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {[["Monoambientes en pozo para invertir", "/monoambientes-en-pozo/"], ["Invertir en ladrillo en 2026", "/invertir-en-ladrillo/"], ["Precio m² en pozo por barrio", "/precio-departamentos-en-pozo-caba/"]].map(([t, h]) => (
          <Link key={h} href={h} className="block rounded-xl border border-outline-variant p-4 hover:border-link-gold font-semibold text-primary">{t} →</Link>
        ))}
      </div>
      <Faq items={faq} title="Preguntas frecuentes sobre rentabilidad del alquiler" />
      <p className="text-[12px] text-on-surface-variant mt-6">Información orientativa, no constituye asesoramiento financiero.</p>
      <div className="mt-10"><AlertaCTA fuente="rentabilidad" /></div>
    </Container>
  );
}
