'use client';

import { useState } from 'react';
import { BARRIO_CATALOGO } from '../../lib/barrios';

// Barrios con landing propia de catálogo (/desarrollos-inmobiliarios-en-{slug}/).
const BARRIOS = Object.keys(BARRIO_CATALOGO)
  .map((slug) => ({ slug, label: BARRIO_CATALOGO[slug].label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));

// Buscador del hero con DOS modos (toggle): por barrio (default) o hablando (IA).
// Por barrio navega a la landing del barrio; IA navega al catálogo con ?q= (abre modo IA allá).
export default function HomeBuscador() {
  const [modo, setModo] = useState('barrio');
  const [slug, setSlug] = useState('');
  const [q, setQ] = useState('');

  const goBarrio = (e) => {
    e.preventDefault();
    window.location.assign(slug ? `/desarrollos-inmobiliarios-en-${slug}/` : '/desarrollos-inmobiliarios/');
  };
  const goIA = (e) => {
    e.preventDefault();
    const t = q.trim();
    window.location.assign('/desarrollos-inmobiliarios/' + (t ? '?q=' + encodeURIComponent(t) : ''));
  };

  const tab = (id, label, icon) => (
    <button type="button" onClick={() => setModo(id)} aria-selected={modo === id}
      className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1.5 ${modo === id ? (id === 'ia' ? 'bg-secondary text-white' : 'bg-primary-container text-white') : 'text-primary'}`}>
      {icon ? <span className="material-symbols-outlined text-[16px]">{icon}</span> : null}{label}
    </button>
  );

  return (
    <div className="max-w-4xl">
      <div className="inline-flex items-center rounded-full bg-white/95 p-1 mb-3 shadow-lg">
        {tab('barrio', 'Por barrio')}
        {tab('ia', 'Buscar hablando', 'auto_awesome')}
      </div>

      {modo === 'barrio' ? (
        <form onSubmit={goBarrio} className="bg-surface p-6 md:p-8 rounded-xl shadow-2xl flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:flex-1 space-y-2">
            <label htmlFor="hero-barrio" className="text-on-surface-variant font-label-caps text-label-caps uppercase">Barrio</label>
            <select id="hero-barrio" value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Elegir barrio"
              className="w-full border border-outline-variant rounded p-3 text-on-surface outline-none appearance-none bg-white">
              <option value="">Todos los barrios</option>
              {BARRIOS.map((b) => (<option key={b.slug} value={b.slug}>{b.label}</option>))}
            </select>
          </div>
          <button className="w-full md:w-auto bg-primary-container text-on-primary font-bold px-8 py-4 rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 font-label-caps">
            <span className="material-symbols-outlined">search</span> BUSCAR PROYECTOS
          </button>
        </form>
      ) : (
        <form onSubmit={goIA} className="bg-surface p-6 md:p-8 rounded-xl shadow-2xl flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:flex-1 space-y-2">
            <label htmlFor="hero-ia" className="text-on-surface-variant font-label-caps text-label-caps uppercase">Contame qué buscás</label>
            <input id="hero-ia" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en lenguaje natural"
              placeholder="Ej: 2 ambientes en Palermo con financiación, entrega 2026"
              className="w-full border border-outline-variant rounded p-3 text-on-surface outline-none bg-white" />
          </div>
          <button className="w-full md:w-auto bg-secondary text-white font-bold px-8 py-4 rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 font-label-caps">
            <span className="material-symbols-outlined">auto_awesome</span> BUSCAR
          </button>
        </form>
      )}
    </div>
  );
}
