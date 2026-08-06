// app/_ui/FilterChip.jsx — Chip de "filtro aplicado" canónico (Server Component).
// Antes este bloque ("Filtrando por barrio · [label ✕] · Ver todas") estaba duplicado idéntico
// en BarrioView (desarrolladoras) y InmobiliariasBarrioView. Un solo componente ahora → mismo
// look/altura/comportamiento en todas las páginas con filtro por zona.
//   - label:    valor del filtro activo (ej. "Palermo").
//   - backHref: URL para quitar el filtro (vuelve al hub sin filtrar).
//   - backLabel: texto del link "ver todas".
//   - kicker:   etiqueta chica en mayúsculas (default "Filtrando por barrio").
import Link from "next/link";

export default function FilterChip({ label, backHref, backLabel = "Ver todos", kicker = "Filtrando por barrio" }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-outline-variant">
      <span className="text-[12px] font-label-caps uppercase tracking-wider text-on-surface-variant">{kicker}</span>
      <span className="inline-flex items-center gap-2 bg-primary-container text-on-primary rounded-full pl-4 pr-1.5 py-1.5 text-[14px] font-medium">
        {label}
        <Link href={backHref} aria-label={backLabel} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/25 hover:bg-white/45 transition-colors leading-none">✕</Link>
      </span>
      <Link href={backHref} className="text-[14px] text-secondary underline hover:no-underline">{backLabel}</Link>
    </div>
  );
}
