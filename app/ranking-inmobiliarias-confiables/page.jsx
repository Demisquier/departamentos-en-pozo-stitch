import Link from "next/link";
import Container from "../_ui/Container";
import Breadcrumb from "../_ui/Breadcrumb";
import JsonLd from "../_ui/JsonLd";
import LogoAvatar from "../_ui/LogoAvatar";
import { SellosChips, SellosDetalle } from "../_ui/SellosDev";
import { inmoConSellos, METODOLOGIA_URL, fechaLarga } from "../../lib/sellos";
import { inmobiliariaSlugPorNombre } from "../../lib/content";
import { SITE } from "../../lib/constants";

export const revalidate = 86400;
const PATH = "/ranking-inmobiliarias-confiables/";
const H1 = "Inmobiliarias confiables en CABA: ranking con datos verificados (2026)";

export const metadata = {
  title: "Inmobiliarias Confiables en CABA 2026: Matrícula Verificada y Ranking",
  description: "Inmobiliarias de Capital Federal con matrícula CUCICBA verificada en el padrón oficial, reconocimientos del sector y situación normal en el BCRA. Fuentes citadas, sin pauta.",
  alternates: { canonical: `${SITE}${PATH}` },
};

const FAQ = [
  ["¿Cómo sé si una inmobiliaria es confiable en CABA?", "El primer chequeo es la matrícula: en CABA solo un corredor inmobiliario matriculado en CUCICBA puede intermediar. Podés verificarla gratis en la guía de matriculados del colegio. Después, mirá su trayectoria, reconocimientos independientes y pedí todo por escrito antes de señar."],
  ["¿Qué significa el sello de matrícula verificada?", "Que encontramos la matrícula del corredor responsable vigente en el padrón oficial del colegio y que pudimos vincularla con la inmobiliaria por nombre, nombre comercial o domicilio."],
  ["¿Por qué una inmobiliaria conocida no está en el ranking?", "Porque todavía no pudimos verificar sus datos con fuentes oficiales o independientes. No figurar no significa nada negativo."],
  ["¿Las inmobiliarias pagan por aparecer?", "No. Los sellos no se venden. Se otorgan solo con evidencia pública y se revalidan cada 6 meses."],
];

export default async function Page() {
  const base = inmoConSellos();
  const lista = await Promise.all(base.map(async (d) => {
    let slug = null;
    try { slug = await inmobiliariaSlugPorNombre(d.nombre); } catch (e) { slug = null; }
    return { ...d, href: slug ? `/inmobiliaria/${slug}/` : null };
  }));
  const schema = [
    {
      "@context": "https://schema.org", "@type": "ItemList", name: H1, url: `${SITE}${PATH}`, numberOfItems: lista.length,
      itemListElement: lista.map((d, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "RealEstateAgent", name: d.nombre, ...(d.href ? { url: `${SITE}${d.href}` } : {}), ...(d.web ? { sameAs: [d.web] } : {}), areaServed: "Ciudad Autónoma de Buenos Aires" } })),
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Inmobiliarias en CABA", item: `${SITE}/mejores-inmobiliarias-caba/` },
      { "@type": "ListItem", position: 3, name: H1, item: `${SITE}${PATH}` },
    ] },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-5xl">
      <JsonLd data={schema} />
      <Breadcrumb tone="light" sep="/" className="mb-6" items={[{ name: "Inicio", href: "/" }, { name: "Inmobiliarias en CABA", href: "/mejores-inmobiliarias-caba/" }, { name: "Ranking verificado" }]} />
      <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-3">{H1}</h1>
      <p className="text-[13px] text-on-surface-variant mb-5">Actualizado: {fechaLarga("2026-11-14")} · revisión cada 6 meses · {lista.length} inmobiliarias con datos verificados</p>
      <div className="text-body-lg text-on-surface-variant max-w-3xl space-y-3 mb-8">
        <p>Al comprar en pozo, la inmobiliaria es quien te presenta el proyecto, te pasa la información y acompaña la operación. Este ranking reúne a las inmobiliarias que pudimos verificar con fuentes oficiales: <strong>matrícula vigente en el padrón del colegio</strong>, <strong>reconocimientos independientes del sector</strong> y <strong>situación normal en el BCRA</strong>.</p>
      </div>
      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-[14px] text-on-surface-variant mb-10">
        <strong className="text-primary">Cómo leer este ranking:</strong> solo incluimos lo que pudimos verificar y citamos cada fuente. No es pago ni de opinión, y que una inmobiliaria no figure no significa nada negativo. <Link href={METODOLOGIA_URL} className="underline text-secondary">Ver metodología</Link>.
      </div>
      <ol className="space-y-6">
        {lista.map((d, i) => (
          <li key={d.nombre} className="rounded-xl border border-outline-variant p-5 md:p-6">
            <div className="flex items-start gap-4 mb-4">
              <span className="font-headline-md text-headline-md text-link-gold leading-none w-8 shrink-0">{i + 1}</span>
              <LogoAvatar web={d.web} iniciales={d.nombre.slice(0, 2).toUpperCase()} size={48} />
              <div className="flex-1">
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  {d.href ? <Link href={d.href} className="hover:underline">{d.nombre}</Link> : d.nombre}
                </h2>
                <SellosChips data={d} className="mt-2" />
              </div>
            </div>
            <SellosDetalle data={d} titulo={false} />
            {d.href && <Link href={d.href} className="inline-block mt-4 text-[14px] text-secondary font-medium hover:underline">Ver proyectos en pozo que comercializa {d.nombre} →</Link>}
          </li>
        ))}
      </ol>
      <section className="mt-14">
        <h2 className="font-headline-md text-headline-md text-primary mb-5">Preguntas frecuentes</h2>
        <div className="divide-y divide-outline-variant border-y border-outline-variant">
          {FAQ.map(([q, a]) => (<details key={q} className="py-4"><summary className="cursor-pointer font-medium text-primary">{q}</summary><p className="mt-2 text-on-surface-variant">{a}</p></details>))}
        </div>
      </section>
      <nav className="mt-12 pt-8 border-t border-outline-variant flex flex-wrap gap-2.5" aria-label="Relacionados">
        {[["/mejores-inmobiliarias-caba/", "Directorio de inmobiliarias de CABA"], ["/ranking-desarrolladoras-confiables/", "Ranking de desarrolladoras confiables"], [METODOLOGIA_URL, "Metodología de los sellos"]].map(([h, t]) => (
          <Link key={h} href={h} className="px-4 py-2 rounded-full border border-outline-variant text-primary text-[14px] hover:border-secondary hover:text-secondary">{t}</Link>
        ))}
      </nav>
    </Container>
  );
}
