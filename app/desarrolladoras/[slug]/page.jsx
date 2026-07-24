import { notFound } from "next/navigation";
import Link from "next/link";
import { getDesarrolladoraBySlug, featuredImage, acf } from "../../../lib/wp";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

export async function generateMetadata({ params }) {
  const r = await getDesarrolladoraBySlug(params.slug);
  const nombre = r?.dev?.nombre || "Desarrolladora";
  return {
    title: `${nombre} — proyectos en pozo en CABA | Departamentos en Pozo`,
    description: `Proyectos en pozo de ${nombre} en Capital Federal: fichas con precio por m², estructura de pago y avance de obra. Análisis independiente.`,
    alternates: { canonical: `/desarrolladoras/${params.slug}/` },
  };
}

export default async function DesarrolladoraLanding({ params }) {
  const r = await getDesarrolladoraBySlug(params.slug);
  if (!r || !r.dev) notFound();
  const { dev, proyectos } = r;
  const barrios = (dev.barrios || "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
      <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-on-surface-variant mb-6">
        <Link href="/" className="hover:text-link-gold">Inicio</Link><span>/</span>
        <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="hover:text-link-gold">Desarrolladoras</Link>
        <span>/</span><span className="text-primary">{dev.nombre}</span>
      </nav>

      {/* Cabecera desarrolladora */}
      <header className="flex items-start gap-5 border-b border-outline-variant pb-8 mb-8">
        {dev.iniciales ? (
          <span className="shrink-0 w-16 h-16 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-headline-sm text-[22px]">{dev.iniciales}</span>
        ) : null}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-md text-headline-md text-primary">{dev.nombre}</h1>
            {dev.badge ? <span className="text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-link-gold px-2.5 py-1 rounded-lg">{dev.badge}</span> : null}
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
            <a href={dev.web.startsWith("http") ? dev.web : `https://${dev.web}`} target="_blank" rel="nofollow noopener" className="inline-block mt-4 text-[14px] text-link-gold hover:underline">Sitio oficial ↗</a>
          )}
        </div>
      </header>

      <h2 className="font-headline-sm text-headline-sm text-primary mb-6">
        {proyectos.length > 0 ? `Proyectos de ${dev.nombre} en pozo` : "Proyectos"}
      </h2>

      {proyectos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {proyectos.map((p) => {
            const img = featuredImage(p);
            const nombre = p.title?.rendered || "";
            const barrio = acf(p, "barrio") || acf(p, "direccion") || "";
            const precio = acf(p, "precio_m2");
            const entrega = acf(p, "fecha_entrega");
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
          <Link href="/desarrollos-inmobiliarios/" className="inline-block mt-4 text-link-gold hover:underline">Ver todos los proyectos en pozo →</Link>
        </div>
      )}
    </main>
  );
}
