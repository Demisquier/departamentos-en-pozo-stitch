// /fideicomiso-al-costo/ — N6: hub AR actualizado (definición, al costo vs precio cerrado, riesgos,
// checklist) + proyectos del catálogo que declaran estructura de fideicomiso al costo.
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE, getDesarrollos } from "../../lib/wp";
import { catalogoConSellos, usd, mesAnio } from "../../lib/statsPozo";

export const revalidate = 86400;
const URL = `${SITE}/fideicomiso-al-costo/`;
// Solo proyectos que DECLARAN la estructura (no los que sugieren "verificá si es fideicomiso o precio cerrado").
const RE = /(bajo|trabaja bajo|se ofrece bajo|mediante|en) fideicomiso al costo|fideicomiso al costo [A-ZÁÉÍÓÚ]/;

async function proyectos() {
  try {
    const raw = await getDesarrollos(5000);
    const slugs = new Set(raw.filter((n) => RE.test(JSON.stringify(n).replace(/\\u00/g, ""))).map((n) => n.slug));
    return (await catalogoConSellos()).filter((i) => slugs.has(i.slug));
  } catch (e) { return []; }
}

export const metadata = {
  title: { absolute: `Fideicomiso al Costo: Qué Es, Riesgos y Proyectos en CABA (${new Date().getFullYear()})` },
  description: "Qué es un fideicomiso al costo, diferencias con precio cerrado, 5 riesgos reales (aportes extra, demoras, fiduciario) y checklist para verificar antes de entrar. Con proyectos en CABA.",
  alternates: { canonical: URL },
};

const TABLA = [
  ["Precio", "Se paga el costo real de obra + honorarios; puede subir", "Fijo en USD o con ajuste pactado (CAC)"],
  ["Quién asume el riesgo de costos", "El inversor (fiduciante)", "La desarrolladora"],
  ["Precio de entrada", "Suele ser 15–30% menor", "Mayor: incluye margen y riesgo del desarrollador"],
  ["Aportes extraordinarios", "Posibles si el presupuesto no alcanza", "No (salvo cláusulas de ajuste)"],
  ["Control", "Asamblea de fiduciantes, rendición de cuentas del fiduciario", "Contractual (boleto)"],
  ["Para quién", "Perfil inversor con caja para aportes extra", "Quien necesita certeza del monto total"],
];

export default async function FideicomisoPage() {
  const lista = await proyectos();
  const mes = mesAnio();
  const faq = [
    ["¿Qué es un fideicomiso al costo?", "Es una estructura en la que un grupo de inversores (fiduciantes) aporta dinero a un fideicomiso administrado por un fiduciario para construir un edificio. Cada uno paga el costo real de obra de su unidad más honorarios, en lugar de un precio cerrado, y recibe la unidad terminada (beneficiario)."],
    ["¿Qué pasa si sube el costo de la obra?", "En un fideicomiso al costo el aumento lo pagan los fiduciantes: las cuotas se ajustan (habitualmente por índice CAC) y, si el presupuesto queda corto, el fiduciario puede pedir aportes extraordinarios."],
    ["¿Es seguro invertir en un fideicomiso al costo?", "El fideicomiso protege los bienes (el terreno y la obra quedan fuera del patrimonio del desarrollador y del fiduciario), pero no elimina el riesgo de demoras o sobrecostos. La seguridad depende de quién es el fiduciario, la trayectoria del desarrollador y que el terreno esté escriturado a nombre del fideicomiso."],
    ["¿Cómo verifico al fiduciario y al desarrollador?", "Pedí el contrato de fideicomiso y el CUIT del fideicomiso, verificá la titularidad del terreno (informe de dominio), consultá la Central de Deudores del BCRA del desarrollador y del fiduciario, y visitá obras entregadas. Si el fideicomiso hace oferta pública, debe estar registrado en la CNV."],
    ["¿Conviene más fideicomiso al costo o precio cerrado?", "Al costo suele entrar más barato pero con monto final incierto; el precio cerrado da certeza a cambio de pagar más. Si no tenés margen para aportes extra, el precio cerrado (o fideicomiso con precio fijo) es más prudente."],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "DefinedTerm", name: "Fideicomiso al costo", description: faq[0][1] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-4xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">Guía · {mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Fideicomiso al costo: qué es, riesgos y proyectos en CABA ({new Date().getFullYear()})</h1>
      <div id="respuesta" className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl">
        <p className="text-body-lg text-primary"><strong>Respuesta rápida:</strong> en un fideicomiso al costo pagás el <strong>costo real de obra</strong> de tu unidad (más honorarios), no un precio cerrado. Entrás más barato, pero si la obra se encarece, la diferencia la ponen los inversores con cuotas ajustadas o aportes extra. Antes de entrar, verificá fiduciario, terreno a nombre del fideicomiso y obras entregadas del desarrollador.</p>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-10 mb-3">Fideicomiso al costo vs precio cerrado</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["", "Fideicomiso al costo", "Precio cerrado"].map((h) => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{TABLA.map(([a, b, c]) => <tr key={a} className="border-t border-outline-variant"><td className="px-3 py-2 font-medium text-primary">{a}</td><td className="px-3 py-2">{b}</td><td className="px-3 py-2">{c}</td></tr>)}</tbody>
        </table>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-3">5 riesgos del fideicomiso al costo</h2>
      <ol className="list-decimal pl-5 space-y-2 text-body-md text-on-surface-variant">
        <li><strong className="text-primary">Aportes extraordinarios:</strong> si el presupuesto queda corto, se reparten entre los fiduciantes.</li>
        <li><strong className="text-primary">Ajuste por CAC:</strong> las cuotas en pesos siguen el costo de construcción, que puede subir más que tus ingresos o que el dólar.</li>
        <li><strong className="text-primary">Demoras de obra:</strong> sin precio cerrado no hay multa típica por atraso; revisá qué prevé el contrato.</li>
        <li><strong className="text-primary">Fiduciario débil:</strong> si administra mal o no rinde cuentas, el control recae en la asamblea.</li>
        <li><strong className="text-primary">Incumplimiento de otros fiduciantes:</strong> si otros dejan de pagar, la obra se frena hasta reemplazarlos.</li>
      </ol>

      <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-3">Checklist antes de entrar</h2>
      <ul className="list-disc pl-5 space-y-1 text-body-md text-on-surface-variant">
        <li>Contrato de fideicomiso completo, CUIT del fideicomiso y quién es el fiduciario.</li>
        <li>Informe de dominio: terreno escriturado a nombre del fideicomiso.</li>
        <li>Permiso de obra y presupuesto detallado con su índice de ajuste.</li>
        <li>Obras entregadas del desarrollador: <Link href="/ranking-desarrolladoras-confiables/" className="underline text-primary">ranking de desarrolladoras confiables</Link>.</li>
        <li>Situación en la Central de Deudores del BCRA del desarrollador y del fiduciario.</li>
        <li>Más detalle: <Link href="/fideicomiso-al-costo-vs-llave-en-mano-departamentos-en-pozo/" className="underline text-primary">fideicomiso al costo vs llave en mano</Link>.</li>
      </ul>

      {lista.length > 0 && (<>
        <h2 className="font-headline-sm text-headline-sm text-primary mt-12 mb-3">Proyectos que declaran fideicomiso al costo</h2>
        <ul className="divide-y divide-outline-variant border border-outline-variant rounded-xl">
          {lista.map((i) => (
            <li key={i.slug} className="px-4 py-3 flex flex-wrap justify-between gap-2">
              <Link href={`/desarrollos-inmobiliarios/${i.slug}/`} className="text-primary font-medium hover:underline">{i.nombre} · {i.barrio}</Link>
              <span className="text-[13px] text-on-surface-variant">{i.desarrolladoraNombre || ""}{i.precioDesde ? ` · desde ${usd(i.precioDesde)}` : ""}{i.entrega ? ` · entrega ${i.entrega}` : ""}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12.5px] text-on-surface-variant mt-2">Estructura informada por la desarrolladora o comercializadora en cada ficha. Confirmala en el contrato.</p>
      </>)}

      <Faq items={faq} title="Preguntas frecuentes sobre fideicomiso al costo" />
      <p className="text-[12px] text-on-surface-variant mt-6">Información general, no constituye asesoramiento legal ni financiero.</p>
      <div className="mt-10"><AlertaCTA fuente="fideicomiso" /></div>
    </Container>
  );
}
