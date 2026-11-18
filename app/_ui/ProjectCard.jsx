// app/_ui/ProjectCard.jsx — Card de proyecto / desarrollo en pozo (Server Component).
// UNA sola versión de la card que estaba reescrita a mano en la home (destacados) y en el
// catálogo (CatalogoFiltros). Render byte-idéntico a ambas; los campos opcionales (ambientes,
// entrega, desarrolladora) sólo aparecen si vienen — igual que en el markup original.
//   Props: { slug, nombre, barrio, direccion?, precio?(number), img?, etapa?, ambientes?, entrega?, desarrolladora? }
// Nota: las cards de /desarrolladoras/[slug] y de la página de barrio NO usan este componente
// (tienen estructura/estilos propios: bg-white, h-56, formato de precio distinto) → siguen inline.
import Link from "next/link";
import GuardarBtn from "../_auth/GuardarBtn";

function devLine(desarrolladora) {
  const d = String(desarrolladora || "").trim();
  if (!d) return null;
  // "Dev (\u2026 comercializa X)" / "Dev (com. X)" \u2192 separa desarrolladora y comercializadora.
  // Acepta "com", "com." y "comercializa", con o sin ":" y un prefijo opcional "\u2026; ".
  const m = d.match(/^(.*?)\s*\(\s*(?:[^)]*?;\s*)?com(?:ercializa|\.)?\s*:?\s*(.+?)\)\s*$/i);
  if (m) {
    const dev = m[1].trim(); const com = m[2].trim();
    if (!dev || /^a\s*confirmar$/i.test(dev)) return com ? "Comercializa: " + com : null;
    return "Desarrolla: " + dev + " \u00b7 Comercializa: " + com;
  }
  // "Comercializa X" suelto (sin desarrolladora) \u2192 es la inmobiliaria, no el dev.
  const mc = d.match(/^com(?:ercializa|\.)?\s*:?\s*(.+)$/i);
  if (mc) return "Comercializa: " + mc[1].trim();
  if (/^a\s*confirmar$/i.test(d)) return null;
  return "Desarrolla: " + d;
}

export default function ProjectCard({
  slug,
  nombre,
  barrio,
  direccion,
  precio,        // legacy: valor /m² (se sigue aceptando; equivale a precioM2)
  precioDesde,   // precio TOTAL "desde" (héroe cuando existe)
  precioM2,      // valor de referencia por m²
  img,
  etapa,
  ambientes,
  entrega,
  desarrolladora,
  destacado,     // slot destacado (monetizable) → badge + prioridad de orden
  sellos,        // tipos de sello verificados de la desarrolladora/inmobiliaria (opcional)
  nuevaPestana,  // abrir en pestaña nueva (se usa desde el catálogo filtrado para no perder los filtros)
}) {
  const m2 = precioM2 ?? precio;  // compat con llamadas viejas
  // Dato denormalizado que guarda el botón favorito (lo consume /mi-seleccion sin releer catálogo).
  const card = { slug, nombre, barrio, direccion, precio, precioDesde, precioM2, img, etapa, ambientes, entrega, desarrolladora };
  return (
    <Link
      href={`/desarrollos-inmobiliarios/${slug}/`}
      data-imp-slug={slug}
      {...(nuevaPestana ? { target: "_blank", rel: "noopener" } : {})}
      className={`group relative flex flex-col bg-surface rounded-xl overflow-hidden transition-all duration-300 ${destacado ? 'border-2 border-link-gold ring-1 ring-link-gold/40 shadow-lg hover:shadow-xl' : 'border border-outline-variant hover:shadow-lg'}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
        {img ? (
          <img src={img} alt={`${nombre} — ${barrio}`} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary-container to-primary text-on-primary">
            <span className="material-symbols-outlined text-3xl opacity-80">apartment</span>
            <span className="font-label-caps text-[10px] tracking-widest opacity-80">{barrio || "En pozo"}</span>
            <span className="text-[10px] opacity-60">Render en preparación</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">EN POZO</span>
        {destacado && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-link-gold text-white px-3 py-1.5 rounded-md font-label-caps text-[11px] tracking-widest shadow-md">★ DESTACADO</span>}
        <GuardarBtn card={card} />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="serif text-headline-sm text-primary leading-tight">{nombre}</h3>
        <p className="text-on-surface-variant text-[13px] flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>{barrio || direccion}
        </p>
        {(ambientes || entrega) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[12.5px] text-on-surface-variant">
            {ambientes && (<span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">apartment</span>{ambientes}</span>)}
            {entrega && (<span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">event_available</span>Entrega {entrega}</span>)}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-outline-variant flex items-end justify-between">
          <div>
            {precioDesde ? (
              <>
                <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant block">DESDE</span>
                <span className="text-primary font-headline-sm text-headline-sm">USD {precioDesde.toLocaleString("es-AR")}</span>
              </>
            ) : m2 ? (
              <>
                <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant block">REFERENCIA</span>
                <span className="text-primary font-headline-sm text-headline-sm">USD {m2.toLocaleString("es-AR")}<span className="text-[13px] text-on-surface-variant"> /m²</span></span>
              </>
            ) : (
              <>
                <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant block">PRECIO</span>
                <span className="text-on-surface-variant font-headline-sm text-headline-sm">Consultar</span>
              </>
            )}
          </div>
          <span className="text-secondary font-label-caps text-[11px] tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">VER <span className="material-symbols-outlined text-[16px]">arrow_forward</span></span>
        </div>
        {devLine(desarrolladora) && (<p className="text-[11px] text-on-surface-variant mt-2 truncate">{devLine(desarrolladora)}</p>)}
        {sellos && sellos.length > 0 && (
          <p className="relative group/sello mt-1.5 inline-flex items-center gap-1 text-[10px] font-label-caps uppercase tracking-wider text-green-800 bg-green-700/10 rounded px-2 py-0.5 cursor-help"
            title="Sello de confianza: verificamos con fuentes públicas a quien desarrolla o comercializa este proyecto (obras entregadas, premios, situación en el BCRA o matrícula). Detalle y fuentes en la ficha.">
            <span className="material-symbols-outlined text-[13px]" aria-hidden="true">verified</span>Sello de confianza
            <span className="material-symbols-outlined text-[13px] opacity-70" aria-hidden="true">info</span>
            <span role="tooltip" className="pointer-events-none absolute left-0 bottom-full mb-2 z-20 w-64 normal-case tracking-normal font-body-md text-[12px] leading-snug text-white bg-primary rounded-lg px-3 py-2 shadow-xl opacity-0 group-hover/sello:opacity-100 transition-opacity">
              Verificamos con fuentes públicas a quien desarrolla o comercializa este proyecto: obras entregadas, premios, situación en el BCRA o matrícula. Entrá a la ficha para ver el detalle y las fuentes.
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
