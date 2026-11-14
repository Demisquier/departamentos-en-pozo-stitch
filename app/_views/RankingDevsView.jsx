import Link from "next/link";
import Container from "../_ui/Container";
import Breadcrumb from "../_ui/Breadcrumb";
import JsonLd from "../_ui/JsonLd";
import LogoAvatar from "../_ui/LogoAvatar";
import { SellosChips, SellosDetalle } from "../_ui/SellosDev";
import { ranking, SELLOS_DEF, METODOLOGIA_URL, fechaLarga } from "../../lib/sellos";
import { SITE } from "../../lib/constants";

const OTROS = [
  ["/ranking-desarrolladoras-confiables/", "Ranking de desarrolladoras confiables"],
  ["/desarrolladoras-con-obras-entregadas/", "Desarrolladoras con obras entregadas"],
  ["/desarrolladoras-premiadas/", "Desarrolladoras premiadas"],
  ["/desarrolladoras-inmobiliarias-en-capital-federal/", "Directorio completo de desarrolladoras en CABA"],
  [METODOLOGIA_URL, "Metodología de los sellos"],
];

// Vista común de los rankings. tipo = null (todos los sellos) | "trayectoria" | "premiada".
export default function RankingDevsView({ tipo = null, path, h1, intro, faq = [] }) {
  const lista = ranking(tipo);
  const verif = lista.reduce((m, d) => (d.verificado > m ? d.verificado : m), "");
  const url = `${SITE}${path}`;

  const schema = [
    {
      "@context": "https://schema.org", "@type": "ItemList", name: h1, url, numberOfItems: lista.length,
      itemListElement: lista.map((d, i) => ({
        "@type": "ListItem", position: i + 1,
        item: {
          "@type": "Organization", name: d.nombre, url: `${SITE}/desarrolladoras/${d.slug}/`,
          ...(d.web ? { sameAs: [d.web] } : {}),
          ...(d.sellos.some((s) => s.tipo === "premiada")
            ? { award: d.sellos.filter((s) => s.tipo === "premiada").flatMap((s) => s.evidencia.map((e) => e.texto)) }
            : {}),
        },
      })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Desarrolladoras", item: `${SITE}/desarrolladoras-inmobiliarias-en-capital-federal/` },
        { "@type": "ListItem", position: 3, name: h1, item: url },
      ],
    },
    ...(faq.length ? [{
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    }] : []),
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-5xl">
      <JsonLd data={schema} />
      <Breadcrumb tone="light" sep="/" className="mb-6"
        items={[{ name: "Inicio", href: "/" }, { name: "Desarrolladoras", href: "/desarrolladoras-inmobiliarias-en-capital-federal/" }, { name: h1 }]} />

      <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-3">{h1}</h1>
      <p className="text-[13px] text-on-surface-variant mb-5">
        Actualizado: {fechaLarga(verif || "2026-11-13")} · Próxima revisión cada 6 meses · {lista.length} desarrolladora{lista.length === 1 ? "" : "s"} con datos verificados
      </p>
      <div className="text-body-lg text-on-surface-variant max-w-3xl space-y-3 mb-8">{intro}</div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-[14px] text-on-surface-variant mb-10">
        <strong className="text-primary">Cómo leer este ranking:</strong> solo incluimos desarrolladoras cuyos datos pudimos verificar con fuentes públicas e independientes, citadas abajo.
        No es un ranking pago ni de opinión, y que una empresa no figure no significa nada negativo: puede que todavía no hayamos podido verificarla.{" "}
        <Link href={METODOLOGIA_URL} className="underline text-secondary">Ver metodología</Link>.
      </div>

      <ol className="space-y-6">
        {lista.map((d, i) => (
          <li key={d.slug} className="rounded-xl border border-outline-variant p-5 md:p-6">
            <div className="flex items-start gap-4 mb-4">
              <span className="font-headline-md text-headline-md text-link-gold leading-none w-8 shrink-0">{i + 1}</span>
              <LogoAvatar web={d.web} iniciales={d.nombre.slice(0, 2).toUpperCase()} size={48} />
              <div className="flex-1">
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  <Link href={`/desarrolladoras/${d.slug}/`} className="hover:underline">{d.nombre}</Link>
                </h2>
                <SellosChips data={d} className="mt-2" />
              </div>
            </div>
            <SellosDetalle data={tipo ? { ...d, sellos: d.sellos.filter((s) => s.tipo === tipo) } : d} titulo={false} />
            <Link href={`/desarrolladoras/${d.slug}/`} className="inline-block mt-4 text-[14px] text-secondary font-medium hover:underline">
              Ver proyectos en pozo de {d.nombre} →
            </Link>
          </li>
        ))}
      </ol>

      {faq.length > 0 && (
        <section className="mt-14">
          <h2 className="font-headline-md text-headline-md text-primary mb-5">Preguntas frecuentes</h2>
          <div className="divide-y divide-outline-variant border-y border-outline-variant">
            {faq.map(([q, a]) => (
              <details key={q} className="py-4">
                <summary className="cursor-pointer font-medium text-primary">{q}</summary>
                <p className="mt-2 text-on-surface-variant">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <nav className="mt-12 pt-8 border-t border-outline-variant" aria-label="Rankings relacionados">
        <p className="font-label-caps text-label-caps text-on-surface-variant mb-3">TAMBIÉN TE PUEDE SERVIR</p>
        <div className="flex flex-wrap gap-2.5">
          {OTROS.filter(([h]) => h !== path).map(([h, t]) => (
            <Link key={h} href={h} className="px-4 py-2 rounded-full border border-outline-variant text-primary text-[14px] hover:border-secondary hover:text-secondary">{t}</Link>
          ))}
        </div>
      </nav>
    </Container>
  );
}

export { SELLOS_DEF };
