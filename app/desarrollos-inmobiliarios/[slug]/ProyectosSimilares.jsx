'use client';

import { useRef } from 'react';
import ProjectCard from '../../_ui/ProjectCard';

// Carrusel horizontal de proyectos similares (mismo barrio / precio cercano).
// Scroll con snap + botones prev/next en desktop. Los items ya vienen puntuados/ordenados.
export default function ProyectosSimilares({ items = [], barrio }) {
  const ref = useRef(null);
  if (!items.length) return null;

  const scroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: 'smooth' });
  };

  return (
    <section className="mt-12 pt-8 border-t border-outline-variant">
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary">Proyectos similares</h2>
          {barrio && (
            <p className="text-on-surface-variant text-[14px] mt-1">Otros desarrollos en pozo parecidos por zona y precio.</p>
          )}
        </div>
        <div className="hidden md:flex gap-2 shrink-0">
          <button type="button" onClick={() => scroll(-1)} aria-label="Anterior"
            className="p-2 border border-outline-variant rounded-full text-primary hover:border-secondary hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Siguiente"
            className="p-2 border border-outline-variant rounded-full text-primary hover:border-secondary hover:text-secondary transition-colors">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div ref={ref} className="flex gap-gutter overflow-x-auto snap-x scroll-smooth pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((i) => (
          <div key={i.slug} className="snap-start shrink-0 w-[270px] sm:w-[300px]">
            <ProjectCard
              slug={i.slug}
              nombre={i.nombre}
              barrio={i.barrio}
              direccion={i.direccion}
              precioDesde={i.precioDesde}
              precioM2={i.precioM2}
              img={i.imagen}
              etapa={i.etapa}
              ambientes={i.ambientes}
              entrega={i.entrega}
              desarrolladora={i.desarrolladora}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
