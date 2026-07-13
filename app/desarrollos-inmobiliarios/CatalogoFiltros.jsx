'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Client component: recibe los items ya mapeados desde WP (server) y filtra en cliente.
// Cada item: { slug, nombre, direccion, precio, precioLabel, barrio, etapa, imagen }
export default function CatalogoFiltros({ items }) {
  const [barrio, setBarrio] = useState('');       // '' = todos
  const [precio, setPrecio] = useState('todos');  // 'todos' | 'hasta150' | '150a300' | 'mas300'
  const [etapa, setEtapa] = useState('');         // '' = todas | 'en pozo' | 'en construcción'
  const [barrioOpen, setBarrioOpen] = useState(false);

  // Lista única de barrios presentes en los datos
  const barrios = useMemo(() => {
    const set = new Set(items.map((i) => i.barrio).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (barrio && i.barrio !== barrio) return false;

      if (precio !== 'todos') {
        const p = i.precio; // number | null
        if (p == null) return false;
        if (precio === 'hasta150' && !(p <= 150000)) return false;
        if (precio === '150a300' && !(p > 150000 && p <= 300000)) return false;
        if (precio === 'mas300' && !(p > 300000)) return false;
      }

      if (etapa) {
        const e = (i.etapa || '').toLowerCase();
        if (!e.includes(etapa)) return false;
      }

      return true;
    });
  }, [items, barrio, precio, etapa]);

  const chip = (active) =>
    `filter-chip px-4 py-2 border border-outline-variant rounded-full text-body-md font-body-md transition-all ${
      active ? 'bg-primary-container text-on-primary border-primary-container' : 'hover:border-secondary'
    }`;

  return (
    <>
      {/* Filters Section */}
      <div className="flex flex-col gap-6 mb-12">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-label-caps text-label-caps text-on-surface-variant mr-2 uppercase tracking-widest">Filtrar por:</span>

          {/* Barrio Dropdown */}
          <div className="relative">
            <button
              onClick={() => setBarrioOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-full text-body-md font-body-md hover:border-secondary transition-colors"
            >
              <span>{barrio || 'Barrio'}</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            {barrioOpen && (
              <div className="absolute z-40 mt-2 w-56 max-h-72 overflow-auto bg-surface-container-lowest border border-outline-variant shadow-lg py-2">
                <button
                  onClick={() => { setBarrio(''); setBarrioOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-body-md font-body-md hover:bg-surface-container-low"
                >
                  Todos los barrios
                </button>
                {barrios.map((b) => (
                  <button
                    key={b}
                    onClick={() => { setBarrio(b); setBarrioOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-body-md font-body-md hover:bg-surface-container-low"
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Precio Chips */}
          <div className="h-6 w-px bg-outline-variant mx-2 hidden md:block"></div>
          <button className={chip(precio === 'todos')} onClick={() => setPrecio('todos')}>Todos los precios</button>
          <button className={chip(precio === 'hasta150')} onClick={() => setPrecio('hasta150')}>Hasta 150k</button>
          <button className={chip(precio === '150a300')} onClick={() => setPrecio('150a300')}>150k - 300k</button>
          <button className={chip(precio === 'mas300')} onClick={() => setPrecio('mas300')}>+300k</button>

          {/* Etapa Chips */}
          <div className="h-6 w-px bg-outline-variant mx-2 hidden md:block"></div>
          <button className={chip(etapa === 'en pozo')} onClick={() => setEtapa(etapa === 'en pozo' ? '' : 'en pozo')}>En pozo</button>
          <button className={chip(etapa === 'en construcción')} onClick={() => setEtapa(etapa === 'en construcción' ? '' : 'en construcción')}>En construcción</button>
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filtered.map((i) => (
          <article
            key={i.slug}
            className="property-card group bg-surface-container-lowest border border-outline-variant overflow-hidden transition-all duration-300 luxury-shadow"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {i.imagen ? (
                <img
                  className="w-full h-full object-cover transition-transform duration-500"
                  src={i.imagen}
                  alt={i.nombre}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-high" />
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-secondary text-on-primary px-3 py-1 font-label-caps text-label-caps tracking-widest">
                  {(i.etapa || 'EN POZO').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="serif text-headline-sm text-primary mb-1">{i.nombre}</h3>
              <p className="text-on-surface-variant font-body-md text-body-md mb-4">{i.direccion}</p>
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">VALOR</span>
                  <span className="text-link-gold font-headline-sm text-headline-sm font-bold">{i.precioLabel}</span>
                </div>
                <Link
                  className="text-primary font-label-caps text-label-caps underline underline-offset-4 hover:text-link-gold transition-colors"
                  href={`/desarrollos-inmobiliarios/${i.slug}/`}
                >
                  VER PROYECTO
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-on-surface-variant font-body-md text-body-md">
          No hay proyectos que coincidan con los filtros seleccionados.
        </p>
      )}
    </>
  );
}
