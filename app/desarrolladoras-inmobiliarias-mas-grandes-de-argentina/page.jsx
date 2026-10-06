// /desarrolladoras-inmobiliarias-mas-grandes-de-argentina/ — Ranking por ESCALA VERIFICABLE.
// GSC: "desarrolladoras inmobiliarias más grandes de argentina" (+variantes) suma 500+ impr/3m
// sin página dedicada. No hay ranking oficial por facturación: ordenamos por indicadores públicos
// (m² construidos/entregados, inversión de masterplans, trayectoria) declarados por cada empresa
// y relevados en nuestro directorio. Cada fila linkea a la landing de la desarrolladora.
import Link from "next/link";
import { getDesarrolladoras, getDesarrolladoraBySlug, SITE } from "../../lib/wp";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import AlertaCTA from "../_ui/AlertaCTA";
import GuiasRelacionadas from "../_ui/GuiasRelacionadas";

export const revalidate = 86400;
const PATH = "/desarrolladoras-inmobiliarias-mas-grandes-de-argentina/";
const ACTUALIZADO = "octubre 2026";

export const metadata = {
  title: "Las Desarrolladoras Inmobiliarias más Grandes de Argentina (2026): Ranking por Escala",
  description:
    "Cuáles son las desarrolladoras inmobiliarias más grandes de Argentina según m² construidos, inversión y trayectoria: Consultatio, IRSA, Aisenson, Argencons, GNV y más. Datos verificables, sin ranking pago.",
  alternates: { canonical: `${SITE}${PATH}` },
};

// Orden por escala declarada (m² construidos/entregados, inversión de masterplans, alcance).
// Los textos salen del directorio propio (campos de cada desarrolladora); "escala" resume el dato duro.
const RANKING = [
  { slug: "consultatio", escala: "Mayor desarrolladora urbanística del país (Nordelta, Catalinas Río 185.000 m²)" },
  { slug: "irsa", escala: "Mayor desarrolladora pública de Argentina (oficinas, retail y residencial)" },
  { slug: "aisenson", escala: "+4.000.000 m² construidos" },
  { slug: "bma-arquitectos", escala: "+1.500.000 m² proyectados" },
  { slug: "argencons-quartier", escala: "+1.000.000 m² entregados" },
  { slug: "gnv-group", escala: "Masterplan Madero Harbour (US$750M)" },
  { slug: "eidico-sur", escala: "+90 barrios privados · +18.000 familias" },
  { slug: "criba", escala: "Alvear Tower (235 m, el residencial más alto del país)" },
  { slug: "werthein", escala: "+500.000 m² construidos" },
  { slug: "grid-desarrollos", escala: "+500.000 m² construidos" },
  { slug: "abv-arquitectura", escala: "+300.000 m² construidos · alianza con Armani" },
  { slug: "vizora", escala: "Remeros Beach (US$200M) · The Link Towers" },
  { slug: "raghsa", escala: "Oficinas premium (Torres Catalinas Plaza)" },
  { slug: "dypsa-group", escala: "Torres Renoir I y II (72.000 m²)" },
  { slug: "nordelta-sa", escala: "Master developer de Nordelta (Tigre)" },
  { slug: "grupo-chomer-gch", escala: "Serie Aura (Olivos, Núñez) · +60 años" },
  { slug: "fernandez-prieto", escala: "The Link Towers (US$120M) · pionera en Puerto Madero" },
  { slug: "faena-group", escala: "Faena District (Puerto Madero)" },
  { slug: "estudio-kohon", escala: "28 edificios + 40.000 m² en obra · especialista en pozo" },
  { slug: "tglt-gcdi", escala: "Ex TGLT, hoy GCDI", alerta: "Según nuestro relevamiento declaró default y concurso preventivo en 2026: verificá la continuidad de obra antes de operar." },
];

async function cargar() {
  let devs = [];
  try { devs = await getDesarrolladoras(); } catch { devs = []; }
  const out = [];
  for (const r of RANKING) {
    const d = devs.find((x) => x.slug === r.slug);
    if (!d) continue;
    let n = 0;
    try { n = ((await getDesarrolladoraBySlug(r.slug))?.proyectos || []).length; } catch { n = 0; }
    out.push({ ...r, nombre: d.nombre.replace(/\s*\(.*?\)\s*$/, "") || d.nombre, trayectoria: d.anios || "", insignia: d.proyecto || "", estructura: d.estructura || "", desc: d.desc || "", web: d.web || "", n });
  }
  return out;
}

export default async function RankingDesarrolladoras() {
  const lista = await cargar();
  const top = lista.slice(0, 6).map((x) => x.nombre);
  const conPozo = lista.filter((x) => x.n > 0);
  const topTxt = top.slice(0, -1).join(", ") + " y " + top[top.length - 1];

  const FAQ = [
    ["¿Cuál es la desarrolladora inmobiliaria más grande de Argentina?",
      `No existe un ranking oficial por facturación. Por escala de obra y proyectos, las de mayor tamaño son ${topTxt}. Consultatio se presenta como la mayor desarrolladora urbanística del país e IRSA como la mayor desarrolladora pública (cotiza en bolsa).`],
    ["¿Cómo se mide qué desarrolladora es más grande?",
      "Con indicadores verificables: metros cuadrados construidos o entregados, inversión de sus masterplans, cantidad de emprendimientos y años de trayectoria. La facturación de la mayoría no es pública, por eso no la usamos."],
    ["¿Conviene comprar en pozo a una desarrolladora grande?",
      "Una desarrolladora grande suele tener más espalda financiera y obras entregadas para mostrar, pero el tamaño no garantiza nada por sí solo. Lo decisivo es el contrato: fideicomiso con fiduciario identificado, índice de ajuste, plazos con penalidades y el avance real de obra."],
    ["¿Qué desarrolladoras grandes tienen proyectos en pozo hoy?",
      conPozo.length
        ? `En nuestro catálogo, ${conPozo.map((x) => x.nombre).slice(0, 8).join(", ")} tienen proyectos en pozo relevados. Entrá a cada una para ver precio, financiación y entrega.`
        : "Revisá el catálogo de desarrollos en pozo para ver qué proyectos tiene hoy cada desarrolladora."],
    ["¿Cómo verifico la trayectoria de una desarrolladora antes de comprar?",
      "Pedí la lista de obras entregadas con fecha prometida y fecha real de posesión, la razón social y el CUIT, y quién es el fiduciario. Visitá un edificio ya habitado de la misma empresa: es la señal más fuerte."],
  ];

  const schema = [
    { "@context": "https://schema.org", "@type": "Article", headline: "Las desarrolladoras inmobiliarias más grandes de Argentina (2026)",
      dateModified: new Date().toISOString().slice(0, 10), author: { "@type": "Organization", name: "Departamentos en Pozo" },
      publisher: { "@type": "Organization", name: "Departamentos en Pozo", url: SITE }, mainEntityOfPage: `${SITE}${PATH}` },
    { "@context": "https://schema.org", "@type": "ItemList", name: "Desarrolladoras inmobiliarias más grandes de Argentina", numberOfItems: lista.length,
      itemListElement: lista.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.nombre, url: `${SITE}/desarrolladoras/${x.slug}/` })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Desarrolladoras", item: `${SITE}/desarrolladoras-inmobiliarias-en-capital-federal/` },
      { "@type": "ListItem", position: 3, name: "Más grandes de Argentina", item: `${SITE}${PATH}` } ] },
  ];

  return (
    <Container as="main" className="py-10 md:py-14">
      <JsonLd data={schema} />
      <nav className="text-[13px] text-on-surface-variant mb-5 flex flex-wrap gap-1.5" aria-label="Ruta de navegación">
        <Link href="/" className="hover:text-secondary">Inicio</Link><span>/</span>
        <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="hover:text-secondary">Desarrolladoras</Link><span>/</span>
        <span className="text-primary">Más grandes de Argentina</span>
      </nav>

      <h1 className="font-headline-md text-headline-md md:text-[30px] serif text-primary leading-tight">
        Las desarrolladoras inmobiliarias más grandes de Argentina (2026)
      </h1>
      <p id="ranking-resumen" className="mt-3 text-on-surface-variant text-body-md md:text-body-lg max-w-3xl">
        Por escala de obra, las desarrolladoras más grandes de Argentina son <strong>{topTxt}</strong>. Las ordenamos por
        indicadores verificables —m² construidos o entregados, inversión de sus masterplans y trayectoria—, no por
        facturación (no es pública) ni por pauta. Actualizado {ACTUALIZADO}.
      </p>

      <ol className="mt-8 space-y-3">
        {lista.map((x, i) => (
          <li key={x.slug} className="border border-outline-variant rounded-xl p-4 md:p-5 flex gap-4">
            <span className="font-headline-sm text-headline-sm text-link-gold w-8 shrink-0">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-headline-sm text-[19px] text-primary">
                  <Link href={`/desarrolladoras/${x.slug}/`} className="hover:text-secondary">{x.nombre}</Link>
                </h2>
                {x.trayectoria && <span className="text-[13px] text-on-surface-variant">{x.trayectoria}</span>}
              </div>
              <p className="text-[14px] text-primary font-medium mt-1">{x.escala}</p>
              {x.desc && <p className="text-[14px] text-on-surface-variant mt-1">{x.desc}</p>}
              {x.alerta && <p className="text-[13px] text-red-700 mt-1">⚠ {x.alerta}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                {x.insignia && <span className="text-on-surface-variant">Insignia: {x.insignia}</span>}
                {x.estructura && <span className="text-on-surface-variant">Estructura: {x.estructura}</span>}
                <Link href={`/desarrolladoras/${x.slug}/`} className="text-secondary underline underline-offset-2">
                  {x.n > 0 ? `Ver sus ${x.n} proyecto${x.n === 1 ? "" : "s"} en pozo →` : "Ver ficha de la desarrolladora →"}
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-12 pt-8 border-t border-outline-variant max-w-3xl text-on-surface-variant text-[15px] space-y-3">
        <h2 className="font-headline-sm text-headline-sm text-primary">Más grande no siempre es mejor para comprar en pozo</h2>
        <p>
          El tamaño da espalda financiera y obras entregadas para mostrar, pero en una compra en pozo el riesgo se define en el
          contrato: quién es el fiduciario, cómo se ajustan las cuotas (CAC o dólar), qué penalidades hay si se atrasa la entrega
          y cuánto avanzó la obra real. Antes de decidir, revisá{" "}
          <Link href="/como-evaluar-una-desarrolladora-de-pozo-senales-de-confianza-y-red-flags/" className="text-secondary underline underline-offset-2">cómo evaluar una desarrolladora de pozo</Link>{" "}
          y compará opciones en el{" "}
          <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-secondary underline underline-offset-2">directorio completo de desarrolladoras</Link>{" "}
          o en el <Link href="/desarrollos-inmobiliarios/" className="text-secondary underline underline-offset-2">catálogo de proyectos en pozo</Link>.
        </p>
        <h2 className="font-headline-sm text-headline-sm text-primary pt-2">Cómo armamos este ranking</h2>
        <p>
          Usamos los datos que cada empresa publica (m² construidos o entregados, inversión de sus proyectos insignia, años en el
          mercado) y los que relevamos en nuestro directorio de 190 desarrolladoras. No cobramos por aparecer ni por la posición. Si
          sos una de estas empresas y un dato cambió, escribinos y lo actualizamos.
        </p>
      </section>

      <Faq items={FAQ} title="Preguntas frecuentes sobre las desarrolladoras más grandes" />

      <AlertaCTA titulo="Enterate cuando una desarrolladora grande lance un proyecto en pozo"
        texto="Dejá tu email y te avisamos de los lanzamientos nuevos en tu barrio y presupuesto, antes de que salgan a los portales."
        cta="Crear alerta gratis" />

      <p className="text-[12px] text-on-surface-variant mt-8">
        Contenido informativo. No constituye asesoramiento financiero ni recomendación de inversión. Datos declarados por cada
        empresa y relevamiento propio; pueden variar.
      </p>
      <GuiasRelacionadas />
    </Container>
  );
}
