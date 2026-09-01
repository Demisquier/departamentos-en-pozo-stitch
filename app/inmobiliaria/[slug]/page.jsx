import { notFound } from "next/navigation";
import Link from "next/link";
import { getInmobiliariaBySlug, getInmobiliarias, getInmobiliariasExtra, featuredImage, acf } from "../../../lib/wp";
import Container from "../../_ui/Container";
import Breadcrumb from "../../_ui/Breadcrumb";
import LogoAvatar from "../../_ui/LogoAvatar";
import JsonLd from "../../_ui/JsonLd";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

// Padrón público de matriculados de CUCICBA (verificación gratuita de matrícula).
const CUCICBA_URL = "https://colegioinmobiliario.org.ar/servicios/guia-de-matriculados";

// Solo pre-generamos las inmobiliarias con proyectos comercializados cargados (evita thin content).
export async function generateStaticParams() {
  const [inmo, extra] = await Promise.all([getInmobiliarias(), getInmobiliariasExtra()]);
  const dir = (inmo || []).filter((d) => d.slug && d.landeable).map((d) => ({ slug: d.slug }));
  const ext = (extra || []).filter((d) => d.slug && d.landeable).map((d) => ({ slug: d.slug }));
  return [...dir, ...ext];
}

export async function generateMetadata({ params }) {
  const r = await getInmobiliariaBySlug(params.slug);
  const nombre = r?.inmo?.nombre || "Inmobiliaria";
  const n = r?.proyectos?.length || 0;
  return {
    title: `${nombre} — inmobiliaria en CABA con proyectos en pozo | Departamentos en Pozo`,
    description: `${nombre}: ${n > 0 ? `${n} proyecto${n === 1 ? "" : "s"} en pozo que comercializa en Capital Federal, con precio por m², forma de pago y avance de obra. ` : ""}Matrícula CUCICBA verificable. Análisis independiente, sin pauta.`,
    robots: (r?.inmo?.sintetica && (r?.proyectos?.length || 0) < 2) ? { index: false, follow: true } : undefined,
    alternates: { canonical: `/inmobiliaria/${params.slug}/` },
  };
}

function anioEntrega(p) {
  const fe = String(acf(p, "fecha_entrega") || "");
  return /^\d{6,8}$/.test(fe) ? Number(fe.slice(0, 4)) : null;
}

export default async function InmobiliariaLanding({ params }) {
  const r = await getInmobiliariaBySlug(params.slug);
  // La landing solo existe si aporta valor único (≥1 proyecto comercializado).
  if (!r || !r.inmo || !r.proyectos.length) notFound();
  const { inmo, proyectos } = r;

  const zonas = (inmo.zonas || "").split(",").map((s) => s.trim()).filter(Boolean);
  const matNum = inmo.matricula && !/no\s*public/i.test(inmo.matricula) ? inmo.matricula : "";

  const barriosProyectos = [...new Set(proyectos.map((p) => (acf(p, "barrio") || "").trim()).filter(Boolean))];
  const barriosMostrar = barriosProyectos.length ? barriosProyectos : zonas;
  const anios = proyectos.map(anioEntrega).filter(Boolean).sort((a, b) => a - b);
  const anioMin = anios[0] || null;
  const anioMax = anios[anios.length - 1] || null;
  const n = proyectos.length;
  const barriosTxt = barriosMostrar.length
    ? (barriosMostrar.length === 1 ? barriosMostrar[0] : barriosMostrar.slice(0, -1).join(", ") + " y " + barriosMostrar[barriosMostrar.length - 1])
    : "Capital Federal";

  const faq = [
    {
      q: `¿Qué proyectos en pozo comercializa ${inmo.nombre}?`,
      a: `Listamos ${n} proyecto${n === 1 ? "" : "s"} en pozo que ${inmo.nombre} comercializa${barriosMostrar.length ? ` en ${barriosTxt}` : ""}. Cada ficha muestra precio por m², forma de pago y avance de obra, con análisis independiente. La comercialización puede cambiar; conviene confirmarla con la firma.`,
    },
    matNum && {
      q: `¿${inmo.nombre} tiene matrícula CUCICBA?`,
      a: `Según nuestro relevamiento, ${inmo.nombre} figura con matrícula ${matNum}. Podés verificarla gratis en el padrón público de CUCICBA antes de operar.`,
    },
    barriosMostrar.length > 0 && {
      q: `¿En qué barrios de CABA opera ${inmo.nombre}?`,
      a: `Los proyectos en pozo que releva ${inmo.nombre} están en ${barriosTxt}. Podés ver el detalle de cada uno más arriba o compararlos con otros desarrollos del mismo barrio.`,
    },
    {
      q: `¿Cómo pido información de un proyecto de ${inmo.nombre}?`,
      a: `Entrá a la ficha del proyecto que te interese y usá "Quiero más info": te pasamos precios, disponibilidad y forma de pago directo de la comercializadora, sin costo.`,
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

  const inmoSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: inmo.nombre,
    areaServed: barriosMostrar.length ? barriosTxt : "Ciudad Autónoma de Buenos Aires",
    ...(inmo.web ? { url: inmo.web.startsWith("http") ? inmo.web : `https://${inmo.web}` } : {}),
  };

  return (
    <Container as="main" className="py-10 md:py-14">
      <JsonLd data={[inmoSchema, faqSchema]} />
      <Breadcrumb
        tone="light"
        sep="/"
        sepAriaHidden={false}
        className="mb-6"
        items={[
          { name: "Inicio", href: "/" },
          { name: "Inmobiliarias en CABA", href: "/mejores-inmobiliarias-caba/" },
          { name: inmo.nombre },
        ]}
      />

      {/* Cabecera inmobiliaria */}
      <header className="flex items-start gap-5 border-b border-outline-variant pb-8 mb-8">
        <LogoAvatar web={inmo.web} iniciales={inmo.iniciales} size={64} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight">{inmo.nombre}</h1>
            {inmo.badge ? <span className="text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-secondary px-2.5 py-1 rounded-lg">{inmo.badge}</span> : null}
          </div>
          <p className="text-on-surface-variant mt-1 text-[14px]">
            {matNum
              ? <a href={CUCICBA_URL} target="_blank" rel="nofollow noopener" className="inline-flex items-center gap-1 text-secondary hover:underline" title="Verificar en el padrón público de CUCICBA"><span aria-hidden="true">✓</span> Matrícula CUCICBA {matNum}</a>
              : <a href={CUCICBA_URL} target="_blank" rel="nofollow noopener" className="text-on-surface-variant hover:text-secondary hover:underline">Matrícula no publicada — verificala en CUCICBA ↗</a>}
          </p>
          {zonas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {zonas.slice(0, 8).map((b) => <span key={b} className="text-[12px] bg-surface-container text-primary rounded-lg px-2.5 py-1">{b}</span>)}
            </div>
          )}
          {inmo.espec && <p className="text-body-md text-on-surface-variant mt-4 max-w-2xl leading-relaxed"><strong className="text-primary">Especialidad:</strong> {inmo.espec}</p>}
          {inmo.web && (
            <a href={inmo.web.startsWith("http") ? inmo.web : `https://${inmo.web}`} target="_blank" rel="nofollow noopener" className="inline-block mt-4 text-[14px] text-secondary hover:underline">Sitio oficial ↗</a>
          )}
        </div>
      </header>

      {/* Stats verificables */}
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

      <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Proyectos en pozo que comercializa {inmo.nombre}</h2>
      <p className="text-[13px] text-on-surface-variant mb-6 max-w-2xl">La comercialización de un proyecto puede cambiar con el tiempo; confirmá la vigencia con la firma antes de operar.</p>

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

      {/* Contexto (independencia editorial) */}
      <div className="mt-12 max-w-3xl">
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {inmo.nombre} figura en nuestro directorio de inmobiliarias de CABA comercializando obra en pozo en {barriosTxt}. Departamentos en Pozo es un sitio de análisis independiente: ordenamos y comparamos los proyectos por criterios comprobables, no por pauta. El dato de precio y avance sale de las fichas; lo que falta, lo pedís y te lo conseguimos.
        </p>
      </div>

      {/* FAQ con schema */}
      <section className="mt-12 max-w-3xl">
        <h2 className="font-headline-sm text-headline-sm text-primary mb-5">Preguntas frecuentes sobre {inmo.nombre}</h2>
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
        <h2 className="font-headline-sm text-[16px] text-primary mb-2">Cómo analizamos las inmobiliarias</h2>
        <p className="text-[13px] text-on-surface-variant leading-relaxed">
          Relevamos la matrícula en el padrón público de CUCICBA y la cartera de proyectos en pozo de fuentes públicas y de las propias comercializadoras, y la mostramos con criterio editorial propio — sin cobrar por posición. No publicamos afirmaciones que no podamos verificar y marcamos cuando un dato falta. Análisis a cargo del equipo de Departamentos en Pozo (Demian).
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-[13px]">
          <Link href="/que-revisar-antes-de-comprar-en-pozo-checklist-due-diligence/" className="text-secondary hover:underline">Checklist antes de comprar →</Link>
          <Link href="/mejores-inmobiliarias-caba/" className="text-secondary hover:underline">Todas las inmobiliarias de CABA →</Link>
          <Link href="/desarrollos-inmobiliarios/" className="text-secondary hover:underline">Ver todos los proyectos en pozo →</Link>
        </div>
      </section>
    </Container>
  );
}
