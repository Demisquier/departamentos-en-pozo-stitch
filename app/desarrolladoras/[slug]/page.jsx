import { notFound } from "next/navigation";
import Link from "next/link";
import { getDesarrolladoraBySlug, getDesarrolladoras, featuredImage, acf } from "../../../lib/wp";
import Container from "../../_ui/Container";
import Breadcrumb from "../../_ui/Breadcrumb";
import LogoAvatar from "../../_ui/LogoAvatar";
import JsonLd from "../../_ui/JsonLd";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

// Pre-generamos la landing de TODAS las desarrolladoras (con o sin proyectos cargados).
export async function generateStaticParams() {
  const devs = await getDesarrolladoras();
  return (devs || []).filter((d) => d.slug).map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }) {
  const r = await getDesarrolladoraBySlug(params.slug);
  const nombre = r?.dev?.nombre || "Desarrolladora";
  const n = r?.proyectos?.length || 0;
  return {
    title: `${nombre} — proyectos en pozo en CABA | Departamentos en Pozo`,
    description: `${nombre}: ${n > 0 ? `${n} proyecto${n === 1 ? "" : "s"} en pozo en Capital Federal con precio por m², estructura de pago y avance de obra. ` : ""}Análisis independiente, sin pauta.`,
    alternates: { canonical: `/desarrolladoras/${params.slug}/` },
  };
}

// Año de entrega desde fecha_entrega "20270901" -> 2027.
function anioEntrega(p) {
  const fe = String(acf(p, "fecha_entrega") || "");
  return /^\d{6,8}$/.test(fe) ? Number(fe.slice(0, 4)) : null;
}

export default async function DesarrolladoraLanding({ params }) {
  const r = await getDesarrolladoraBySlug(params.slug);
  if (!r || !r.dev) notFound();
  const { dev, proyectos } = r;
  const barrios = (dev.barrios || "").split(",").map((s) => s.trim()).filter(Boolean);

  // --- Stats verificables desde los proyectos cargados (nada inventado) ---
  const barriosProyectos = [...new Set(proyectos.map((p) => (acf(p, "barrio") || "").trim()).filter(Boolean))];
  const barriosMostrar = barriosProyectos.length ? barriosProyectos : barrios;
  const anios = proyectos.map(anioEntrega).filter(Boolean).sort((a, b) => a - b);
  const anioMin = anios[0] || null;
  const anioMax = anios[anios.length - 1] || null;
  const n = proyectos.length;
  const barriosTxt = barriosMostrar.length
    ? (barriosMostrar.length === 1 ? barriosMostrar[0] : barriosMostrar.slice(0, -1).join(", ") + " y " + barriosMostrar[barriosMostrar.length - 1])
    : "Capital Federal";

  // --- FAQ (con schema FAQPage) — respuestas honestas, plantilladas por dato real ---
  const faq = [
    n > 0 && {
      q: `¿Qué proyectos en pozo tiene ${dev.nombre}?`,
      a: `Listamos ${n} proyecto${n === 1 ? "" : "s"} en pozo de ${dev.nombre}${barriosMostrar.length ? ` en ${barriosTxt}` : ""}. Cada ficha muestra precio por m², forma de pago y avance de obra, con análisis independiente.`,
    },
    barriosMostrar.length > 0 && {
      q: `¿En qué barrios de CABA desarrolla ${dev.nombre}?`,
      a: `Según nuestro relevamiento, ${dev.nombre} tiene obra en pozo en ${barriosTxt}. Podés ver el detalle de cada proyecto más arriba o comparar con otros desarrollos del mismo barrio.`,
    },
    {
      q: `¿Es seguro comprar en pozo con ${dev.nombre}?`,
      a: `La seguridad al comprar en pozo depende del contrato y de la trayectoria del desarrollador, no del método. Antes de firmar, verificá que exista fideicomiso con el terreno a su nombre, revisá el boleto (precio, índice de ajuste, entrega y penalidades) y pedí obras anteriores entregadas. Es nuestra recomendación general para cualquier desarrollo, incluidos los de ${dev.nombre}.`,
    },
    {
      q: `¿Cómo pido información de un proyecto de ${dev.nombre}?`,
      a: `Entrá a la ficha del proyecto que te interese y usá "Quiero más info": te pasamos precios, disponibilidad y forma de pago directo de la desarrolladora, sin costo.`,
    },
  ].filter(Boolean);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <Container as="main" className="py-10 md:py-14">
      <JsonLd data={[faqSchema]} />
      <Breadcrumb
        tone="light"
        sep="/"
        sepAriaHidden={false}
        className="mb-6"
        items={[
          { name: "Inicio", href: "/" },
          { name: "Desarrolladoras", href: "/desarrolladoras-inmobiliarias-en-capital-federal/" },
          { name: dev.nombre },
        ]}
      />

      {/* Cabecera desarrolladora */}
      <header className="flex items-start gap-5 border-b border-outline-variant pb-8 mb-8">
        <LogoAvatar web={dev.web} iniciales={dev.iniciales} size={64} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight">{dev.nombre}</h1>
            {dev.badge ? <span className="text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-secondary px-2.5 py-1 rounded-lg">{dev.badge}</span> : null}
          </div>
          {dev.anios ? <p className="text-on-surface-variant mt-1">{dev.anios}</p> : null}
          {barrios.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {barrios.map((b) => <span key={b} className="text-[12px] bg-surface-container text-primary rounded-lg px-2.5 py-1">{b}</span>)}
            </div>
          )}
          {dev.desc && <p className="text-body-md text-on-surface-variant mt-4 max-w-2xl leading-relaxed">{dev.desc}</p>}
          {(dev.estructura || dev.volumen) && (
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-[14px]">
              {dev.estructura && <span><strong className="text-primary">Estructura:</strong> <span className="text-on-surface-variant">{dev.estructura}</span></span>}
              {dev.volumen && <span><strong className="text-primary">Volumen:</strong> <span className="text-on-surface-variant">{dev.volumen}</span></span>}
            </div>
          )}
          {dev.web && (
            <a href={dev.web.startsWith("http") ? dev.web : `https://${dev.web}`} target="_blank" rel="nofollow noopener" className="inline-block mt-4 text-[14px] text-secondary hover:underline">Sitio oficial ↗</a>
          )}
        </div>
      </header>

      {/* Stats verificables (solo si hay proyectos cargados) */}
      {n > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            [n, `proyecto${n === 1 ? "" : "s"} en pozo`],
            [barriosMostrar.length || "—", barriosMostrar.length === 1 ? "barrio" : "barrios"],
            [anioMin ? (anioMin === anioMax ? anioMin : `${anioMin}–${anioMax}`) : "—", "entregas estimadas"],
            ["Sin pauta", "orden y análisis propios"],
          ].map(([v, l], i) => (
            <div key={i} className="rounded-xl border border-outline-variant p-4">
              <div className="font-headline-md text-headline-md text-primary leading-none">{v}</div>
              <div className="text-[12px] text-on-surface-variant mt-1">{l}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-headline-sm text-headline-sm text-primary mb-6">
        {n > 0 ? `Proyectos de ${dev.nombre} en pozo` : "Proyectos"}
      </h2>

      {n > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {proyectos.map((p) => {
            const img = featuredImage(p);
            const nombre = p.title?.rendered || "";
            const barrio = acf(p, "barrio") || acf(p, "direccion") || "";
            const precio = acf(p, "precio_m2");
            const fe = String(acf(p, "fecha_entrega") || "");
            const entrega = /^\d{6}$/.test(fe) ? `${fe.slice(4, 6)}/${fe.slice(0, 4)}` : (/^\d{8}$/.test(fe) ? `${fe.slice(4, 6)}/${fe.slice(0, 4)}` : fe);
            return (
              <Link key={p.slug} href={`/desarrollos-inmobiliarios/${p.slug}/`} className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
                  {img ? <img src={img} alt={nombre} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline-variant text-4xl">image</span></div>}
                  <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">EN POZO</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-headline-sm text-headline-sm text-primary leading-tight" dangerouslySetInnerHTML={{ __html: nombre }} />
                  {barrio && <p className="text-on-surface-variant text-[13px] mt-1">{barrio}</p>}
                  <div className="mt-4 pt-4 border-t border-outline-variant flex items-end justify-between">
                    <div>
                      <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant block">DESDE</span>
                      {precio ? <span className="text-primary font-headline-sm text-headline-sm">USD {String(precio).replace(/[^\d]/g, "")}<span className="text-[13px] text-on-surface-variant"> /m²</span></span> : <span className="text-on-surface-variant font-headline-sm text-headline-sm">Consultar</span>}
                    </div>
                    {entrega && <span className="text-[12px] text-on-surface-variant">Entrega {entrega}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border border-outline-variant rounded-xl p-8 text-center">
          <p className="text-on-surface-variant">Todavía no cargamos proyectos en pozo de esta desarrolladora. Estamos sumando su cartera.</p>
          <Link href="/desarrollos-inmobiliarios/" className="inline-block mt-4 text-secondary hover:underline">Ver todos los proyectos en pozo →</Link>
        </div>
      )}

      {/* Contexto (independencia editorial) */}
      <div className="mt-12 max-w-3xl">
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {dev.nombre} {n > 0 ? `figura en nuestro catálogo con obra en pozo en ${barriosTxt}. ` : "todavía no tiene proyectos en pozo cargados en nuestro catálogo. "}
          Departamentos en Pozo es un sitio de análisis independiente: ordenamos y comparamos los proyectos por criterios comprobables, no por pauta. El dato de precio y avance sale de las fichas; lo que falta, lo pedís y te lo conseguimos.
        </p>
      </div>

      {/* FAQ con schema */}
      <section className="mt-12 max-w-3xl">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-5">Preguntas frecuentes sobre {dev.nombre}</h2>
        <div className="divide-y divide-outline-variant border-y border-outline-variant">
          {faq.map((f, i) => (
            <div key={i} className="py-4">
              <h3 className="font-medium text-primary text-[15px]">{f.q}</h3>
              <p className="text-on-surface-variant text-[14px] leading-relaxed mt-1.5">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Metodología / E-E-A-T + interlinks */}
      <section className="mt-10 max-w-3xl rounded-xl bg-surface-container-low border border-outline-variant p-6">
        <h2 className="font-headline-sm text-[16px] text-primary mb-2">Cómo analizamos las desarrolladoras</h2>
        <p className="text-[13px] text-on-surface-variant leading-relaxed">
          Relevamos proyectos de fuentes públicas y de las propias comercializadoras, y los mostramos con criterio editorial propio — sin cobrar por posición. No publicamos afirmaciones que no podamos verificar y marcamos cuando un dato falta. Análisis a cargo del equipo de Departamentos en Pozo (Demian).
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-[13px]">
          <Link href="/que-revisar-antes-de-comprar-en-pozo-checklist-due-diligence/" className="text-secondary hover:underline">Checklist antes de comprar →</Link>
          <Link href="/fideicomiso-al-costo-vs-sociedad-anonima-en-pozo/" className="text-secondary hover:underline">Fideicomiso vs. SA →</Link>
          <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-secondary hover:underline">Todas las desarrolladoras →</Link>
        </div>
      </section>
    </Container>
  );
}
