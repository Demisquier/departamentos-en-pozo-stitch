"use client";
import { useState, useMemo } from "react";

// Directorio unificado de desarrolladoras, alimentado por el CPT `desarrolladora`.
// Recibe `devs` desde el server (page.jsx) → el listado ya viene en el HTML estático
// (Google lo indexa). El buscador y el toggle de destacadas son enhancement client.
const deaccent = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function DirectorioDevs({ devs = [] }) {
  const [q, setQ] = useState("");
  const [soloDest, setSoloDest] = useState(false);

  const filtered = useMemo(() => {
    const nq = deaccent(q.trim());
    return devs.filter((d) => {
      if (soloDest && !d.destacada) return false;
      if (!nq) return true;
      return deaccent(d.nombre + " " + d.desc).includes(nq);
    });
  }, [devs, q, soloDest]);

  const totalDest = devs.filter((d) => d.destacada).length;

  return (
    <section id="directorio" className="my-12">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-1">
        Directorio de desarrolladoras en CABA
      </h2>
      <p className="text-on-surface-variant mb-6">
        {devs.length} desarrolladoras activas en pozo. Las {totalDest} destacadas —por trayectoria y
        volumen entregado— aparecen primero.
      </p>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar desarrolladora"
          className="flex-1 border border-outline-variant rounded-lg px-4 py-2.5 text-[15px] bg-surface focus:outline-none focus:border-link-gold"
        />
        <button
          type="button"
          onClick={() => setSoloDest((v) => !v)}
          aria-pressed={soloDest}
          className={`px-4 py-2.5 rounded-lg text-[14px] font-medium border transition-colors whitespace-nowrap ${
            soloDest
              ? "bg-primary-container text-on-primary border-primary-container"
              : "border-outline-variant text-primary hover:border-link-gold"
          }`}
        >
          {soloDest ? "★ Solo destacadas" : "☆ Solo destacadas"}
        </button>
      </div>

      <p className="text-[13px] text-on-surface-variant mb-4">
        {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
      </p>

      {/* Listado */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((d) => (
          <li
            key={d.id}
            className={`border rounded-xl p-4 bg-surface transition-shadow hover:shadow-sm ${
              d.destacada ? "border-link-gold/40" : "border-outline-variant"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium text-primary text-[15px] leading-tight">{d.nombre}</h3>
              {d.destacada && (
                <span className="shrink-0 text-[10px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-link-gold px-2 py-0.5 rounded-full">
                  Destacada
                </span>
              )}
            </div>
            {d.desc && <p className="text-[13px] text-on-surface-variant mt-1.5 leading-relaxed">{d.desc}</p>}
            {d.web && (
              <a
                href={d.web}
                target="_blank"
                rel="nofollow noopener"
                className="inline-block mt-2 text-[13px] text-link-gold hover:underline"
              >
                Sitio oficial ↗
              </a>
            )}
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="text-center text-on-surface-variant py-10">
          No encontramos desarrolladoras con ese criterio.
        </p>
      )}
    </section>
  );
}
