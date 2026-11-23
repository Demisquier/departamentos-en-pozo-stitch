// /invertir-en-ladrillo/ — N8 pillar: comparativa de formas de invertir en ladrillo (pozo, usado
// para alquilar, temporario, fideicomiso) con cifras citadas (fuente + mes) y dato propio del catálogo.
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE } from "../../lib/wp";
import { MERCADO as M } from "../../lib/mercadoExterno";
import { catalogoConSellos, statsGlobal, usd, mesAnio } from "../../lib/statsPozo";

export const revalidate = 86400;
const URL = `${SITE}/invertir-en-ladrillo/`;
const pct = (n) => `${String(n).replace(".", ",")}%`;

export const metadata = {
  title: { absolute: `Invertir en Ladrillo en ${new Date().getFullYear()}: Pozo, Alquiler o Fideicomiso (Datos)` },
  description: `Cuánto rinde invertir en ladrillo hoy: renta bruta del alquiler ${pct(M.rentaCaba)} en CABA, precio en pozo vs usado y cuándo conviene cada opción. Comparativa con fuentes y fecha.`,
  alternates: { canonical: URL },
};

export default async function LadrilloPage() {
  const g = statsGlobal(await catalogoConSellos());
  const mes = mesAnio();
  const FILAS = [
    ["Comprar en pozo", `Anticipo + cuotas (precio desde ${usd(g.minDesde)})`, "Sin renta hasta la entrega; luego alquiler", "24–48 meses de obra", "Baja hasta escriturar", "Desarrollador / obra"],
    ["Usado para alquilar", `Monoambiente medio USD ${M.monoUsd.toLocaleString("es-AR")}`, `${pct(M.rentaCaba)} bruta promedio CABA`, "Inmediato", "Media", "Vacancia, inquilino"],
    ["Alquiler temporario", "Similar al usado + equipamiento", "Mayor bruta, más costos y gestión", "Inmediato", "Media", "Regulación, ocupación"],
    ["Fideicomiso al costo", "Aportes durante la obra", "Ganancia por menor costo de entrada", "24–48 meses", "Baja", "Sobrecostos, aportes extra"],
  ];
  const faq = [
    ["¿Conviene invertir en ladrillo en 2026?", `La renta bruta del alquiler en CABA subió a ${pct(M.rentaCaba)} anual (${M.fuente}, ${M.mes}), con ${String(M.aniosRecupero).replace(".", ",")} años de recupero. El ladrillo sirve para preservar capital en dólares con renta moderada; no es una inversión líquida. Conviene si tu horizonte es de 5 años o más.`],
    ["¿Cuánto rinde un departamento en alquiler en CABA?", `${pct(M.rentaCaba)} bruto anual promedio. Va de ${pct(M.rentaMin[1])} en ${M.rentaMin[0]} a ${pct(M.rentaMax[1])} en ${M.rentaMax[0]}. La renta neta suele quedar 1 a 2 puntos por debajo.`],
    ["¿Qué es más rentable: pozo o usado?", `El pozo requiere menos capital inicial (anticipo + cuotas) y suele cotizar por debajo del a estrenar terminado de la misma zona, pero no renta hasta la entrega y tiene riesgo de desarrollador. El usado renta desde el día uno. Para renta inmediata, usado; para capitalización con pagos en cuotas, pozo.`],
    ["¿Cuánto necesito para invertir en ladrillo?", `En pozo se puede entrar con el anticipo (habitualmente 20% a 50%, según el proyecto) de unidades que arrancan en ${usd(g.minDesde)}. Un monoambiente usado medio cuesta USD ${M.monoUsd.toLocaleString("es-AR")} (${M.fuente}, ${M.mes}).`],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "Article", headline: `Invertir en ladrillo en ${new Date().getFullYear()}`, url: URL, dateModified: new Date().toISOString().slice(0, 10), author: { "@type": "Organization", name: "Departamentos en Pozo", url: SITE }, citation: M.url },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-5xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">Inversiones inmobiliarias · {mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Invertir en ladrillo en {new Date().getFullYear()}: pozo, usado para alquilar, temporario o fideicomiso</h1>
      <div id="respuesta" className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl">
        <p className="text-body-lg text-primary"><strong>Respuesta rápida:</strong> el alquiler en CABA rinde <strong>{pct(M.rentaCaba)} bruto anual</strong> ({M.fuente}, {M.mes}). Si buscás renta inmediata, conviene usado en zonas de mayor retorno ({M.topRenta.join(", ")}); si buscás capitalizar pagando en cuotas, el pozo te deja entrar con el anticipo y suele cotizar por debajo del a estrenar terminado, pero renta recién con la entrega{g.medM2 ? <> (mediana en pozo {usd(g.medM2)}/m²; usado medio de CABA USD {M.usadoM2.toLocaleString("es-AR")}/m², que incluye edificios antiguos)</> : null}.</p>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-10 mb-3">Comparativa: formas de invertir en ladrillo</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-[13.5px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["Opción", "Capital de entrada", "Renta", "Plazo", "Liquidez", "Riesgo principal"].map((h) => <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>{FILAS.map((f) => <tr key={f[0]} className="border-t border-outline-variant">{f.map((c, k) => <td key={k} className={`px-3 py-2 ${k ? "" : "font-medium text-primary whitespace-nowrap"}`}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="text-[12.5px] text-on-surface-variant mt-2">Fuentes: <a href={M.url} className="underline" target="_blank" rel="nofollow noopener">{M.fuente}, {M.mes}</a> (renta y usado); catálogo de Departamentos en Pozo, {mes} (pozo).</p>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-3">Cómo elegir según tu perfil</h2>
      <ul className="list-disc pl-5 space-y-2 text-body-md text-on-surface-variant">
        <li><strong className="text-primary">Tenés el capital completo y querés renta ya:</strong> usado para alquilar. Mirá la <Link href="/rentabilidad-alquiler-caba-por-barrio/" className="underline text-primary">rentabilidad por barrio</Link>.</li>
        <li><strong className="text-primary">Tenés el anticipo y ahorro mensual:</strong> pozo en cuotas. Ver <Link href="/departamentos-en-pozo-en-cuotas/" className="underline text-primary">proyectos con cuotas</Link> y <Link href="/monoambientes-en-pozo/" className="underline text-primary">monoambientes en pozo</Link>.</li>
        <li><strong className="text-primary">Perfil inversor con margen para imprevistos:</strong> <Link href="/fideicomiso-al-costo/" className="underline text-primary">fideicomiso al costo</Link>.</li>
        <li><strong className="text-primary">Comparás contra instrumentos financieros:</strong> <Link href="/pozo-vs-plazo-fijo-dolar-y-cedears-donde-rinde-mas-tu-ahorro/" className="underline text-primary">pozo vs plazo fijo, dólar y CEDEARs</Link>.</li>
      </ul>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-3">Errores comunes al invertir en ladrillo</h2>
      <ul className="list-disc pl-5 space-y-1 text-body-md text-on-surface-variant">
        <li>Calcular la renta sin descontar expensas, ABL, vacancia e impuestos.</li>
        <li>Comprar en pozo sin verificar <Link href="/ranking-desarrolladoras-confiables/" className="underline text-primary">quién construye</Link>.</li>
        <li>Pagar sobreprecio: compará el USD/m² con la <Link href="/precio-departamentos-en-pozo-caba/" className="underline text-primary">mediana del barrio en pozo</Link>.</li>
        <li>Ignorar el ajuste CAC de las cuotas en pesos (<Link href="/simulador-cuota-cac-pozo/" className="underline text-primary">simulador</Link>).</li>
      </ul>

      <div className="mt-10 rounded-xl border border-link-gold p-5">
        <p className="font-semibold text-primary">¿No sabés qué opción te conviene?</p>
        <p className="text-body-md text-on-surface-variant mt-1">Contanos tu capital, plazo y objetivo y te mostramos los proyectos que encajan.</p>
        <Link href="/asesor/" className="inline-block mt-3 rounded-full bg-primary text-on-primary px-5 py-2 text-[14px] font-medium">Armar mi perfil de inversor →</Link>
      </div>

      <Faq items={faq} title="Preguntas frecuentes sobre invertir en ladrillo" />
      <p className="text-[12px] text-on-surface-variant mt-6">Información orientativa, no constituye asesoramiento financiero.</p>
      <div className="mt-10"><AlertaCTA fuente="invertir-ladrillo" /></div>
    </Container>
  );
}
