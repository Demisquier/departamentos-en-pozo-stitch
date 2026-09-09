'use client';

import { useState } from 'react';
import { BARRIO_CATALOGO } from '../../lib/barrios';

const BARRIOS = Object.keys(BARRIO_CATALOGO)
  .map((slug) => ({ slug, label: BARRIO_CATALOGO[slug].label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));

// Buscador del hero con las DOS formas de navegar el sitio, con igual peso (50/50):
//  · "Con filtros" → portal clásico (elegís barrio → listado/mapa/ficha).
//  · "Conversando" → modo tipo Roomix (/explorar): describís qué buscás y la IA te arma la
//    lista charlando. El texto se pasa por sessionStorage + #q= para que /explorar auto-consulte.
export default function HomeBuscador() {
  const [modo, setModo] = useState('barrio');
  const [slug, setSlug] = useState('');
  const [q, setQ] = useState('');

  const goBarrio = (e) => { e.preventDefault(); window.location.assign(slug ? `/desarrollos-inmobiliarios-en-${slug}/` : '/desarrollos-inmobiliarios/'); };
  const goIA = (e) => { e.preventDefault(); const t = q.trim(); try { if (t) sessionStorage.setItem('dpp_iaq', t); } catch {} window.location.assign('/explorar/' + (t ? '#q=' + encodeURIComponent(t) : '')); };

  const tab = (id, label, icon) => (
    <button type="button" onClick={() => setModo(id)} aria-selected={modo === id}
      className={`flex-1 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5 ${modo === id ? (id === 'ia' ? 'bg-secondary text-white shadow-sm' : 'bg-primary-container text-white shadow-sm') : 'text-on-surface-variant hover:text-primary'}`}>
      <span className="material-symbols-outlined text-[16px]">{icon}</span>{label}
      {id === 'ia' && <span className={`text-[9px] font-label-caps tracking-wider px-1.5 py-0.5 rounded-full ${modo === id ? 'bg-white/25 text-white' : 'bg-secondary/15 text-secondary'}`}>IA</span>}
    </button>
  );

  return (
    <div className="max-w-4xl bg-surface rounded-xl shadow-2xl p-4 md:p-6">
      {/* Dos formas de buscar, mismo peso */}
      <div className="flex items-center gap-1 rounded-full bg-surface-container p-1 mb-4 w-full">
        {tab('barrio', 'Con filtros', 'tune')}
        {tab('ia', 'Conversando', 'forum')}
      </div>

      {modo === 'barrio' ? (
        <form onSubmit={goBarrio} className="flex flex-col md:flex-row gap-3 md:items-end">
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
      ) : (
        <form onSubmit={goIA} className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="w-full md:flex-1 space-y-1.5">
            <label htmlFor="hero-ia" className="text-on-surface-variant font-label-caps text-label-caps uppercase">Contame qué buscás y lo charlamos</label>
            <input id="hero-ia" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar conversando en lenguaje natural"
              placeholder="Ej: 2 ambientes en Palermo para invertir, con financiación"
              className="w-full border border-outline-variant rounded-lg p-3 text-on-surface outline-none bg-white" />
          </div>
          <button className="w-full md:w-auto bg-secondary text-white font-bold px-8 py-3.5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 font-label-caps">
            <span className="material-symbols-outlined">auto_awesome</span> CONVERSAR
          </button>
        </form>
      )}
    </div>
  );
}
