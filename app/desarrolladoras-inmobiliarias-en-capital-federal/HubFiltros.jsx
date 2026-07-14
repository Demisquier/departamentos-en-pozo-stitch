"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

const deaccent = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Directorio de desarrolladoras con filtro por zona + búsqueda REALES (client).
export default function HubFiltros({ firmas = [] }) {
  const [zona, setZona] = useState("Todas");
  const [q, setQ] = useState("");

  // Zonas disponibles a partir de las firmas (no hardcode).
  const zonas = useMemo(() => {
    const set = new Set();
    firmas.forEach((f) => (f.zonas || []).forEach((z) => set.add(z)));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [firmas]);

  const visibles = useMemo(() => {
    const qn = deaccent(q.trim());
    return firmas.filter((f) => {
      if (zona !== "Todas" && !(f.zonas || []).includes(zona)) return false;
      if (qn && !(deaccent(f.nombre).includes(qn) || deaccent(f.desc).includes(qn))) return false;
      return true;
    });
  }, [firmas, zona, q]);

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-outline-variant pb-8">
        <div className="flex flex-wrap gap-3">
          {zonas.map((z) => (
            <button
              key={z}
              onClick={() => setZona(z)}
              className={
                z === zona
                  ? "px-5 py-2 bg-primary-container text-on-primary text-label-caps font-label-caps transition-all"
                  : "px-5 py-2 border border-outline text-on-surface-variant text-label-caps font-label-caps hover:border-secondary hover:text-secondary transition-all"
              }
            >
              {z}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant border-b border-outline-variant px-2 py-1">
          <span className="material-symbols-outlined">search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent border-none focus:ring-0 outline-none text-body-md placeholder:text-on-surface-variant"
            placeholder="Buscar por nombre…"
            type="text"
          />
        </div>
      </div>

      <p className="text-[13px] text-on-surface-variant mb-6">
        <span className="text-primary font-medium">{visibles.length}</span> {visibles.length === 1 ? "desarrolladora" : "desarrolladoras"}
        {(zona !== "Todas" || q) && <button onClick={() => { setZona("Todas"); setQ(""); }} className="ml-3 text-link-gold underline underline-offset-2">Limpiar</button>}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {visibles.map((d) => (
          <div key={d.nombre} className="bg-white border border-outline-variant flex flex-col luxury-shadow group hover:border-secondary transition-all duration-500">
            <div className="p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-surface-container flex items-center justify-center border border-outline-variant">
                  <span className="font-headline-sm text-headline-sm text-primary-container">{d.monograma}</span>
                </div>
                <span className="text-label-caps font-label-caps text-secondary border border-secondary px-3 py-1 rounded-full uppercase">{d.badge}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-3">{d.nombre}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6 line-clamp-4">{d.desc}</p>
              {(d.zonas || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {d.zonas.map((z) => (
                    <span key={z} className="text-[11px] px-2.5 py-1 bg-surface-container-low border border-outline-variant rounded-full text-on-surface-variant">{z}</span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-6 border-t border-outline-variant flex justify-end items-center">
                <Link className="flex items-center gap-2 text-secondary font-bold hover:gap-4 transition-all" href="/desarrollos-inmobiliarios/">
                  VER PROYECTOS
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibles.length === 0 && (
        <div className="text-center py-16">
          <p className="text-on-surface-variant">No hay desarrolladoras que coincidan con el filtro.</p>
          <button onClick={() => { setZona("Todas"); setQ(""); }} className="mt-3 text-link-gold underline underline-offset-4">Limpiar filtros</button>
        </div>
      )}
    </>
  );
}
