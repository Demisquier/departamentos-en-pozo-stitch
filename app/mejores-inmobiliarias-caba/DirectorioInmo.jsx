"use client";
import { useState, useMemo } from "react";

// Directorio de inmobiliarias (CPT `inmobiliaria`). Mismo formato de tarjeta rica que
// el de desarrolladoras. Server-rendered (SEO); buscador + filtros = enhancement client.
const deaccent = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const BARRIO_LABEL = {
  palermo: "Palermo", belgrano: "Belgrano", caballito: "Caballito", nunez: "Núñez",
  "puerto-madero": "Puerto Madero", recoleta: "Recoleta", "villa-urquiza": "Villa Urquiza",
  colegiales: "Colegiales", "barrio-norte": "Barrio Norte", almagro: "Almagro",
  "las-canitas": "Las Cañitas", "villa-devoto": "Villa Devoto", "palermo-chico": "Palermo Chico",
};

function Card({ d }) {
  const zonas = (d.zonas || "").split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <li className={`rounded-2xl p-5 bg-surface border ${d.destacada ? "border-link-gold/40" : "border-outline-variant"}`}>
      <div className="flex items-start gap-4">
        {d.iniciales ? (
          <span className="shrink-0 w-14 h-14 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-headline-sm text-[18px] tracking-wide">{d.iniciales}</span>
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-headline-sm text-[19px] leading-tight text-primary">{d.nombre}</h3>
            {d.badge ? (
              <span className="shrink-0 text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-link-gold px-2.5 py-1 rounded-lg">{d.badge}</span>
            ) : null}
          </div>
          {d.matricula ? <p className="text-[13px] font-medium text-on-surface-variant mt-1">Matrícula: {d.matricula}</p> : null}
        </div>
      </div>

      {zonas.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {zonas.map((b) => <span key={b} className="text-[12px] bg-surface-container text-primary rounded-lg px-2.5 py-1">{b}</span>)}
        </div>
      )}

      {(d.espec || d.avisos || d.sucursales) && (
        <dl className="mt-4 space-y-2.5 text-[14px]">
          {d.espec && (<div><dt className="font-label-caps text-label-caps uppercase text-on-surface-variant text-[11px]">Especialización en pozo</dt><dd className="text-primary">{d.espec}</dd></div>)}
          {d.avisos && (<div><dt className="font-label-caps text-label-caps uppercase text-on-surface-variant text-[11px]">Avisos activos</dt><dd className="text-primary">{d.avisos}</dd></div>)}
          {d.sucursales && (<div><dt className="font-label-caps text-label-caps uppercase text-on-surface-variant text-[11px]">Estructura</dt><dd className="text-primary">{d.sucursales}</dd></div>)}
        </dl>
      )}

      <div className="mt-4 pt-3 border-t border-outline-variant">
        {d.web && (
          <a href={d.web.startsWith("http") ? d.web : `https://${d.web}`} target="_blank" rel="nofollow noopener" className="text-[13px] text-on-surface-variant hover:text-link-gold">Sitio oficial ↗</a>
        )}
      </div>
    </li>
  );
}

export default function DirectorioInmo({ items = [] }) {
  const [q, setQ] = useState("");
  const [zona, setZona] = useState("");
  const [soloMat, setSoloMat] = useState(false);

  const zonas = useMemo(() => {
    const count = {};
    items.forEach((d) => {
      (d.zonasKey || "").split(/\s+/).filter(Boolean).forEach((k) => { count[k] = (count[k] || 0) + 1; });
    });
    return Object.entries(count).filter(([k, n]) => n >= 3 && BARRIO_LABEL[k]).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [items]);

  const filtered = useMemo(() => {
    const nq = deaccent(q.trim());
    return items.filter((d) => {
      if (soloMat && !d.badge) return false;
      if (zona && !deaccent(d.zonasKey || "").split(/\s+/).includes(zona)) return false;
      if (!nq) return true;
      return deaccent(d.nombre + " " + d.zonas + " " + d.espec).includes(nq);
    });
  }, [items, q, zona, soloMat]);

  const totalMat = items.filter((d) => d.badge).length;

  return (
    <section id="directorio" className="my-12">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Directorio de inmobiliarias en Capital Federal</h2>
      <p className="text-on-surface-variant mb-6">
        {items.length} inmobiliarias relevadas. Las {totalMat} con matrícula CUCICBA verificable aparecen primero. Ordenado por criterios comprobables, no por opinión.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o zona…" aria-label="Buscar inmobiliaria"
            className="flex-1 border border-outline-variant rounded-lg px-4 py-2.5 text-[15px] bg-surface focus:outline-none focus:border-link-gold" />
          <button type="button" onClick={() => setSoloMat((v) => !v)} aria-pressed={soloMat}
            className={`px-4 py-2.5 rounded-lg text-[14px] font-medium border transition-colors whitespace-nowrap ${soloMat ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-link-gold"}`}>
            {soloMat ? "✓ Con matrícula" : "Con matrícula verificable"}
          </button>
        </div>
        {zonas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setZona("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${zona === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-link-gold"}`}>Todas</button>
            {zonas.map((b) => (
              <button key={b} type="button" onClick={() => setZona(zona === b ? "" : b)}
                className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${zona === b ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-link-gold"}`}>
                {BARRIO_LABEL[b] || b}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[13px] text-on-surface-variant mb-4">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</p>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((d) => <Card key={d.id} d={d} />)}
      </ul>

      {filtered.length === 0 && <p className="text-center text-on-surface-variant py-10">No encontramos inmobiliarias con ese criterio.</p>}
    </section>
  );
}
