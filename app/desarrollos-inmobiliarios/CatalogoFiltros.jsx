'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Recibe items ya mapeados desde WP (server). Filtra/ordena en cliente.
// item: { slug, nombre, barrio, direccion, precio, precioLabel, ambientes, ambientesNums, entrega, desarrolladora, etapa, imagen }
export default function CatalogoFiltros({ items }) {
  const [barrio, setBarrio] = useState('');
  const [amb, setAmb] = useState('');          // '' | '1' | '2' | '3' | '4+'
  const [precio, setPrecio] = useState('todos'); // todos | hasta3000 | 3000a4500 | mas4500
  const [etapa, setEtapa] = useState('');
  const [orden, setOrden] = useState('destacados');
  const [barrioOpen, setBarrioOpen] = useState(false);

  const barrios = useMemo(
    () => Array.from(new Set(items.map((i) => i.barrio).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [items]
  );

  const filtered = useMemo(() => {
    let out = items.filter((i) => {
      if (barrio && i.barrio !== barrio) return false;
      if (amb) {
        const nums = i.ambientesNums || [];
        const match = amb === '4+' ? nums.some((n) => n === '4+' || n === '4' || n === '5+') : nums.includes(amb);
        if (!match) return false;
      }
      if (precio !== 'todos') {
        const p = i.precio;
        if (p == null) return false;
        if (precio === 'hasta3000' && !(p <= 3000)) return false;
        if (precio === '3000a4500' && !(p > 3000 && p <= 4500)) return false;
        if (precio === 'mas4500' && !(p > 4500)) return false;
      }
      if (etapa && (i.etapa || '').toLowerCase() !== etapa) return false;
      return true;
    });

    const entregaKey = (s) => {
      const m = String(s || '').match(/(\d{2})\/(\d{4})/);
      return m ? Number(m[2]) * 100 + Number(m[1]) : 999999; // sin fecha al final
    };
    if (orden === 'precio_asc') out = [...out].sort((a, b) => (a.precio ?? Infinity) - (b.precio ?? Infinity));
    else if (orden === 'precio_desc') out = [...out].sort((a, b) => (b.precio ?? -Infinity) - (a.precio ?? -Infinity));
    else if (orden === 'entrega') out = [...out].sort((a, b) => entregaKey(a.entrega) - entregaKey(b.entrega));
    else if (orden === 'nombre') out = [...out].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return out;
  }, [items, barrio, amb, precio, etapa, orden]);

  const chip = (active) =>
    `px-3.5 py-2 border rounded-full text-[13px] font-body-md transition-all ${
      active ? 'bg-primary text-white border-primary' : 'border-outline-variant text-primary hover:border-primary'
    }`;

  const limpiar = () => { setBarrio(''); setAmb(''); setPrecio('todos'); setEtapa(''); };
  const hayFiltros = barrio || amb || precio !== 'todos' || etapa;

  return (
    <>
      {/* Barra de filtros */}
      <div className="border-y border-outline-variant py-4 mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Barrio */}
          <div className="relative">
            <button
              onClick={() => setBarrioOpen((o) => !o)}
              className={`flex items-center gap-2 px-3.5 py-2 border rounded-full text-[13px] transition-colors ${barrio ? 'bg-primary text-white border-primary' : 'border-outline-variant text-primary hover:border-primary'}`}
            >
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{barrio || 'Barrio'}</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            {barrioOpen && (
              <div className="absolute z-40 mt-2 w-60 max-h-80 overflow-auto bg-surface border border-outline-variant shadow-xl rounded-lg py-2">
                <button onClick={() => { setBarrio(''); setBarrioOpen(false); }} className="block w-full text-left px-4 py-2 text-[14px] hover:bg-surface-container">
                  Todos los barrios
                </button>
                {barrios.map((b) => (
                  <button key={b} onClick={() => { setBarrio(b); setBarrioOpen(false); }} className={`block w-full text-left px-4 py-2 text-[14px] hover:bg-surface-container ${b === barrio ? 'text-link-gold font-medium' : ''}`}>
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="h-6 w-px bg-outline-variant mx-1 hidden sm:block" />

          {/* Ambientes */}
          {['1', '2', '3', '4+'].map((a) => (
            <button key={a} className={chip(amb === a)} onClick={() => setAmb(amb === a ? '' : a)}>{a} amb</button>
          ))}

          <span className="h-6 w-px bg-outline-variant mx-1 hidden sm:block" />

          {/* Precio /m² */}
          <button className={chip(precio === 'hasta3000')} onClick={() => setPrecio(precio === 'hasta3000' ? 'todos' : 'hasta3000')}>Hasta USD 3.000/m²</button>
          <button className={chip(precio === '3000a4500')} onClick={() => setPrecio(precio === '3000a4500' ? 'todos' : '3000a4500')}>3.000–4.500/m²</button>
          <button className={chip(precio === 'mas4500')} onClick={() => setPrecio(precio === 'mas4500' ? 'todos' : 'mas4500')}>+4.500/m²</button>

          {hayFiltros && (
            <button onClick={limpiar} className="px-3 py-2 text-[13px] text-on-surface-variant hover:text-primary underline underline-offset-2">Limpiar</button>
          )}
        </div>

        {/* Contador + orden */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-on-surface-variant">
            <span className="text-primary font-medium">{filtered.length}</span> {filtered.length === 1 ? 'proyecto' : 'proyectos'}
            {filtered.length !== items.length && <span> de {items.length}</span>}
          </p>
          <label className="flex items-center gap-2 text-[13px] text-on-surface-variant">
            Ordenar por
            <select value={orden} onChange={(e) => setOrden(e.target.value)} className="border border-outline-variant rounded-lg px-2.5 py-1.5 text-[13px] text-primary bg-surface">
              <option value="destacados">Destacados</option>
              <option value="precio_asc">Precio/m² ↑</option>
              <option value="precio_desc">Precio/m² ↓</option>
              <option value="entrega">Entrega más próxima</option>
              <option value="nombre">Nombre (A–Z)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filtered.map((i) => (
          <Link
            key={i.slug}
            href={`/desarrollos-inmobiliarios/${i.slug}/`}
            className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
              {i.imagen ? (
                <img
                  src={i.imagen}
                  alt={`${i.nombre} — ${i.barrio}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline-variant text-4xl">image</span>
                </div>
              )}
              <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">
                {(i.etapa || 'EN POZO').toUpperCase()}
              </span>
            </div>

            <div className="p-5 flex flex-col flex-1">
              <h3 className="serif text-headline-sm text-primary leading-tight">{i.nombre}</h3>
              <p className="text-on-surface-variant text-[13px] flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>
                {i.barrio || i.direccion}
              </p>

              {(i.ambientes || i.entrega) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[12.5px] text-on-surface-variant">
                  {i.ambientes && (
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">apartment</span>{i.ambientes}</span>
                  )}
                  {i.entrega && (
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px]">event_available</span>Entrega {i.entrega}</span>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-outline-variant flex items-end justify-between">
                <div>
                  <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant block">DESDE</span>
                  {i.precio ? (
                    <span className="text-primary font-headline-sm text-headline-sm">USD {i.precio.toLocaleString('es-AR')}<span className="text-[13px] text-on-surface-variant"> /m²</span></span>
                  ) : (
                    <span className="text-on-surface-variant font-headline-sm text-headline-sm">Consultar</span>
                  )}
                </div>
                <span className="text-link-gold font-label-caps text-[11px] tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                  VER <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </div>
              {i.desarrolladora && (
                <p className="text-[11px] text-on-surface-variant mt-2 truncate">Desarrolla: {i.desarrolladora}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-on-surface-variant font-body-md text-body-md">No hay proyectos que coincidan con los filtros.</p>
          <button onClick={limpiar} className="mt-3 text-link-gold underline underline-offset-4 text-[14px]">Limpiar filtros</button>
        </div>
      )}
    </>
  );
}
