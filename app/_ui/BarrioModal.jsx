'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { zonificarBarrios, BARRIO_CATALOGO } from '../../lib/barrios';

// Normaliza (saca acentos, minúsculas) para el autocompletado acento-insensible.
const NORM = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Barrios con landing propia (SEO): SIEMPRE presentes en el selector para poder saltar de un
// barrio a otro, incluso en una landing de barrio donde `barrios` (derivado de items) trae uno solo.
// zonificarBarrios los deduplica contra el universo pasado en `barrios`.
const LANDING_LABELS = Object.values(BARRIO_CATALOGO).map((v) => v.label);

// Selector de UBICACIÓN unificado (home + listado + landings de barrio), estilo portal AR
// (Zonaprop): un botón que abre un modal con input de autocompletado y los barrios AGRUPADOS
// por zona (Capital Federal / GBA Norte-Oeste-Sur / La Plata) en secciones expandibles.
//
// Props:
//  - barrios:   string[]      universo de barrios crudos (labels). zonificarBarrios los agrupa.
//  - value:     string        barrio seleccionado ('' = todos) — modo filtro (listado).
//  - barrioFijo:string|null    en una landing de barrio, el barrio fijo (se muestra en el trigger).
//  - onSelect:  (label|null)=>void | null
//        Si se pasa (modo FILTRO, listado): elegir un barrio SIN landing llama onSelect(label)
//        y "Todos" llama onSelect(null) — filtra en el lugar, sin navegar.
//        Si NO se pasa (modo NAVEGAR, home/landing): elegir navega a la URL del barrio.
//        En ambos modos, un barrio CON landing propia navega a su página (SEO).
//  - variant:   'hero' | 'pill'   estilo del botón trigger.
//  - buttonLabel:string          texto por defecto del trigger cuando no hay selección.
export default function BarrioModal({ barrios = [], value = '', barrioFijo = null, onSelect = null, variant = 'pill', buttonLabel = 'Elegí barrio o zona' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  // Zonas expandidas: Capital Federal abierta por defecto (es la mayoría del inventario).
  const [openZonas, setOpenZonas] = useState({ 'Capital Federal': true });
  const inputRef = useRef(null);

  const grupos = useMemo(() => zonificarBarrios([...LANDING_LABELS, ...barrios]), [barrios]);
  const nq = NORM(q.trim());
  const filtered = useMemo(() => {
    if (!nq) return grupos;
    return grupos
      .map((g) => ({ zona: g.zona, items: g.items.filter((it) => NORM(it.label).includes(nq)) }))
      .filter((g) => g.items.length);
  }, [grupos, nq]);
  const totalHits = filtered.reduce((n, g) => n + g.items.length, 0);

  const sel = barrioFijo || value || '';
  const close = () => { setOpen(false); setQ(''); };

  useEffect(() => { if (open) { const t = setTimeout(() => inputRef.current?.focus(), 40); return () => clearTimeout(t); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  // Acción al elegir. it = {label, slug} | null (Todos).
  const pick = (it) => {
    close();
    if (it && it.slug) { window.location.assign(`/desarrollos-inmobiliarios-en-${it.slug}/`); return; }
    if (it == null) {
      if (onSelect) onSelect(null); else window.location.assign('/desarrollos-inmobiliarios/');
      return;
    }
    if (onSelect) { onSelect(it.label); return; }
    window.location.assign(`/desarrollos-inmobiliarios/?barrio=${encodeURIComponent(it.label)}`);
  };

  const toggleZona = (z) => setOpenZonas((o) => ({ ...o, [z]: !o[z] }));

  const triggerCls = variant === 'hero'
    ? 'w-full flex items-center justify-between gap-2 border border-outline-variant rounded-lg p-3 text-left bg-white text-on-surface hover:border-secondary transition-colors'
    : `inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 border rounded-full text-[14px] md:text-[13px] transition-colors ${sel ? 'bg-primary-container text-on-primary border-primary-container' : 'border-outline-variant text-primary hover:border-secondary'}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className={triggerCls}>
        <span className="inline-flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">location_on</span>
          <span className="truncate">{sel || buttonLabel}</span>
        </span>
        <span className="material-symbols-outlined text-[18px] opacity-70" aria-hidden="true">expand_more</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Elegir ubicación">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="absolute inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-fit md:max-h-[80vh] md:w-[460px] bg-surface rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[88dvh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
              <h2 className="text-[15px] font-medium text-primary">Elegí barrio o zona</h2>
              <button type="button" onClick={close} aria-label="Cerrar" className="p-2 -mr-2 text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="p-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-full border border-outline-variant focus-within:border-secondary">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant" aria-hidden="true">search</span>
                <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escribí un barrio o zona…" aria-label="Buscar barrio o zona" className="flex-1 bg-transparent outline-none text-[14px] text-primary" />
                {q && <button type="button" onClick={() => setQ('')} aria-label="Limpiar" className="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-primary">close</button>}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 py-1">
              {!nq && (
                <button type="button" onClick={() => pick(null)} className="flex items-center gap-2 w-full text-left px-4 py-3 text-[14px] text-primary hover:bg-surface-container border-b border-outline-variant/60">
                  <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">public</span> Todos los barrios
                </button>
              )}
              {filtered.map((g) => {
                const isOpen = nq ? true : !!openZonas[g.zona];
                return (
                  <div key={g.zona} className="border-b border-outline-variant/60 last:border-0">
                    <button type="button" onClick={() => !nq && toggleZona(g.zona)} className="flex items-center justify-between w-full px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      <span>{g.zona} <span className="text-outline font-normal normal-case">({g.items.length})</span></span>
                      {!nq && <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">expand_more</span>}
                    </button>
                    {isOpen && g.items.map((it) => (
                      <button type="button" key={g.zona + it.label} onClick={() => pick(it)} className={`flex items-center justify-between gap-2 w-full text-left pl-7 pr-4 py-2.5 text-[14px] hover:bg-surface-container ${it.label === sel ? 'text-secondary font-medium' : 'text-primary'}`}>
                        <span className="truncate">{it.label}</span>
                        {it.slug && <span className="shrink-0 text-[10px] uppercase tracking-wide text-on-surface-variant border border-outline-variant rounded-full px-1.5 py-0.5">página propia</span>}
                      </button>
                    ))}
                  </div>
                );
              })}
              {totalHits === 0 && <p className="px-4 py-8 text-center text-[13px] text-on-surface-variant">Sin barrios que coincidan con «{q}».</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
