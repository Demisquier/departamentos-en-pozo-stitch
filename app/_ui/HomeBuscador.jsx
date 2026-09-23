'use client';

import { useState } from 'react';
import { BARRIO_CATALOGO } from '../../lib/barrios';

// Barrios con landing propia de catálogo (/desarrollos-inmobiliarios-en-{slug}/).
const BARRIOS = Object.keys(BARRIO_CATALOGO)
  .map((slug) => ({ slug, label: BARRIO_CATALOGO[slug].label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));

// Caja PRINCIPAL del hero = buscador por barrio (mismo funcionamiento que el listado:
// al elegir un barrio navega a SU landing de catálogo; "Todos" al pilar). La búsqueda
// conversacional (IA) y el catálogo con filtros quedan como LINKS secundarios debajo de la
// caja (ver page.jsx), para que no se confundan con el proceso de búsqueda por barrio.
export default function HomeBuscador() {
  const [slug, setSlug] = useState('');
  const go = (e) => { e.preventDefault(); window.location.assign(slug ? `/desarrollos-inmobiliarios-en-${slug}/` : '/desarrollos-inmobiliarios/'); };

  return (
    <form onSubmit={go} className="max-w-4xl bg-surface rounded-xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row gap-3 md:items-end">
      <div className="w-full md:flex-1 space-y-1.5">
        <label htmlFor="hero-barrio" className="text-on-surface-variant font-label-caps text-label-caps uppercase">Barrio</label>
        <select id="hero-barrio" value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Elegir barrio"
          className="w-full border border-outline-variant rounded-lg p-3 text-on-surface outline-none appearance-none bg-white">
          <option value="">Todos los barrios</option>
          {BARRIOS.map((b) => (<option key={b.slug} value={b.slug}>{b.label}</option>))}
        </select>
      </div>
      <button className="w-full md:w-auto bg-primary-container text-on-primary font-bold px-8 py-3.5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 font-label-caps">
        <span className="material-symbols-outlined">search</span> BUSCAR PROYECTOS
      </button>
    </form>
  );
}
