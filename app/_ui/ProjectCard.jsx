// app/_ui/ProjectCard.jsx — Card de proyecto / desarrollo en pozo (Server Component).
// UNA sola versión de la card que estaba reescrita a mano en la home (destacados) y en el
// catálogo (CatalogoFiltros). Render byte-idéntico a ambas; los campos opcionales (ambientes,
// entrega, desarrolladora) sólo aparecen si vienen — igual que en el markup original.
//   Props: { slug, nombre, barrio, direccion?, precio?(number), img?, etapa?, ambientes?, entrega?, desarrolladora? }
// Nota: las cards de /desarrolladoras/[slug] y de la página de barrio NO usan este componente
// (tienen estructura/estilos propios: bg-white, h-56, formato de precio distinto) → siguen inline.
import Link from "next/link";

export default function ProjectCard({
  slug,
  nombre,
  barrio,
  direccion,
  precio,
  img,
  etapa,
  ambientes,
  entrega,
  desarrolladora,
}) {
  return (
    <Link
      href={`/desarrollos-inmobiliarios/${slug}/`}
      className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
        {img ? (
          <img src={img} alt={`${nombre} — ${barrio}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline-variant text-4xl">image</span></div>
        )}
        <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">{(etapa || "EN POZO").toUpperCase()}</span>
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
            <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant block">DESDE</span>
            {precio ? (
              <span className="text-primary font-headline-sm text-headline-sm">USD {precio.toLocaleString("es-AR")}<span className="text-[13px] text-on-surface-variant"> /m²</span></span>
            ) : (
              <span className="text-on-surface-variant font-headline-sm text-headline-sm">Consultar</span>
            )}
          </div>
          <span className="text-secondary font-label-caps text-[11px] tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">VER <span className="material-symbols-outlined text-[16px]">arrow_forward</span></span>
        </div>
        {desarrolladora && (<p className="text-[11px] text-on-surface-variant mt-2 truncate">Desarrolla: {desarrolladora}</p>)}
      </div>
    </Link>
  );
}
