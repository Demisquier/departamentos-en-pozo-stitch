'use client';

import BarrioModal from './BarrioModal';

// Caja PRINCIPAL del hero = selector de UBICACIÓN (mismo componente que el listado:
// BarrioModal). Al elegir un barrio con landing propia navega a SU landing de catálogo;
// un barrio sin landing va al catálogo filtrado por ese barrio; "Todos" al pilar. La
// búsqueda conversacional (IA) y el catálogo con filtros quedan como LINKS secundarios
// debajo de la caja (ver page.jsx).
export default function HomeBuscador({ barrios = [] }) {
  return (
    <div className="max-w-4xl bg-surface rounded-xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row gap-3 md:items-end">
      <div className="w-full md:flex-1 space-y-1.5">
        <span className="block text-on-surface-variant font-label-caps text-label-caps uppercase">Barrio o zona</span>
        <BarrioModal barrios={barrios} variant="hero" buttonLabel="Elegí barrio o zona" />
      </div>
      <a href="/desarrollos-inmobiliarios/" className="w-full md:w-auto bg-primary-container text-on-primary font-bold px-8 py-3.5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 font-label-caps">
        <span className="material-symbols-outlined">search</span> BUSCAR PROYECTOS
      </a>
    </div>
  );
}
