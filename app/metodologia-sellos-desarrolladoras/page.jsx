import Link from "next/link";
import Container from "../_ui/Container";
import Breadcrumb from "../_ui/Breadcrumb";
import JsonLd from "../_ui/JsonLd";
import { SELLOS_DEF, todasConSellos, fechaLarga } from "../../lib/sellos";
import { SITE, CONTACT_EMAIL } from "../../lib/constants";

export const revalidate = 86400;
const PATH = "/metodologia-sellos-desarrolladoras/";

export const metadata = {
  title: "Cómo verificamos a las desarrolladoras: metodología de los sellos de confianza",
  description: "Criterios, fuentes y frecuencia de actualización de los sellos de confianza de Departamentos en Pozo: trayectoria comprobada, premios verificados y situación en el BCRA. Independiente y sin pauta.",
  alternates: { canonical: `${SITE}${PATH}` },
};

const FAQ = [
  ["¿Los sellos se pueden comprar?", "No. Los sellos no se venden ni dependen de ninguna relación comercial con Departamentos en Pozo. Se otorgan exclusivamente con evidencia pública verificable."],
  ["¿Qué significa que una desarrolladora no tenga sello?", "Nada negativo: solo que todavía no pudimos verificar sus datos con fuentes independientes. Muchas empresas serias operan con fideicomisos o no publican información; por eso no mostramos ninguna marca de 'sin sello'."],
  ["¿Cada cuánto se actualizan?", "Cada 6 meses revalidamos cada sello. Si un dato ya no se puede confirmar o deja de cumplirse un criterio, el sello deja de mostrarse."],
  ["Soy de una desarrolladora, ¿cómo pido ser evaluado o corregir un dato?", `Escribinos a ${CONTACT_EMAIL} con la razón social, el CUIT y las fuentes públicas de tus obras entregadas o premios. Revisamos todo pedido, pero solo publicamos lo que podemos verificar de forma independiente.`],
];

export default function Page() {
  const n = todasConSellos().length;
  const schema = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Ranking de desarrolladoras confiables", item: `${SITE}/ranking-desarrolladoras-confiables/` },
      { "@type": "ListItem", position: 3, name: "Metodología", item: `${SITE}${PATH}` },
    ] },
  ];
  return (
    <Container as="main" className="py-10 md:py-14 max-w-3xl">
      <JsonLd data={schema} />
      <Breadcrumb tone="light" sep="/" className="mb-6"
        items={[{ name: "Inicio", href: "/" }, { name: "Ranking de desarrolladoras", href: "/ranking-desarrolladoras-confiables/" }, { name: "Metodología" }]} />
      <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-4">Cómo verificamos a las desarrolladoras</h1>
      <div className="text-body-lg text-on-surface-variant space-y-4">
        <p>Departamentos en Pozo es un portal independiente. Para ayudarte a decidir con confianza, otorgamos <strong>sellos</strong> a las desarrolladoras que pueden demostrar con fuentes públicas lo que dicen. Hoy hay <strong>{n} desarrolladoras</strong> con al menos un sello vigente.</p>
        <p>Tres principios: <strong>solo publicamos lo verificado</strong>, <strong>citamos la fuente de cada dato</strong> y <strong>no hablamos mal de nadie</strong> (no existe un "sello negativo" ni una lista de excluidas).</p>
      </div>

      <h2 className="font-headline-md text-headline-md text-primary mt-10 mb-4">Los sellos y sus criterios</h2>
      <div className="space-y-4">
        {Object.entries(SELLOS_DEF).map(([k, d]) => (
          <div key={k} className="rounded-xl border border-outline-variant p-5">
            <p className="font-medium text-primary flex items-center gap-2"><span className="material-symbols-outlined text-green-800">{d.icon}</span>{d.label}</p>
            <p className="text-on-surface-variant mt-1.5">{d.criterio}</p>
            <Link href={d.url} className="inline-block mt-2 text-[14px] text-secondary underline">Ver desarrolladoras con este sello</Link>
          </div>
        ))}
      </div>

      <h2 className="font-headline-md text-headline-md text-primary mt-10 mb-4">Fuentes que usamos</h2>
      <ul className="list-disc ml-6 space-y-2 text-on-surface-variant">
        <li><strong>Sitios oficiales</strong> de cada empresa (punto de partida, nunca única fuente para un sello).</li>
        <li><strong>Prensa económica e inmobiliaria</strong> y <strong>publicaciones de arquitectura</strong> que documentan obras terminadas.</li>
        <li><strong>Sitios de los organizadores</strong> de cada premio.</li>
        <li><strong>Central de Deudores del BCRA</strong> (situación crediticia por CUIT), <strong>Boletín Oficial</strong> y <strong>CNV</strong> para identificar la sociedad.</li>
      </ul>
      <p className="text-on-surface-variant mt-4">No usamos como fuente independiente a portales de avisos que replican la información de la propia empresa.</p>

      <h2 className="font-headline-md text-headline-md text-primary mt-10 mb-4">Actualización</h2>
      <p className="text-on-surface-variant">Cada sello indica su fecha de verificación y se revalida cada 6 meses. Última revisión general: {fechaLarga("2026-11-13")}. Los sellos vencidos dejan de mostrarse automáticamente hasta su revalidación.</p>

      <h2 className="font-headline-md text-headline-md text-primary mt-10 mb-4">Preguntas frecuentes</h2>
      <div className="divide-y divide-outline-variant border-y border-outline-variant">
        {FAQ.map(([q, a]) => (
          <details key={q} className="py-4"><summary className="cursor-pointer font-medium text-primary">{q}</summary><p className="mt-2 text-on-surface-variant">{a}</p></details>
        ))}
      </div>
      <p className="text-[12px] text-on-surface-variant mt-8">Los sellos son información, no una recomendación de inversión. Antes de comprar en pozo, revisá el contrato y la documentación del proyecto con un profesional.</p>
    </Container>
  );
}
