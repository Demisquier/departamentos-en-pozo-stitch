"use client";
import { useState, useMemo } from "react";

// Directorio unificado de desarrolladoras (CPT `desarrolladora`). Server-rendered:
// el listado sale en el HTML (SEO). Buscador + filtro por barrio = enhancement client.
const deaccent = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Etiquetas lindas para las claves de barrio (bk) que guardamos en el CPT.
const BARRIO_LABEL = {
  palermo: "Palermo", belgrano: "Belgrano", caballito: "Caballito", nunez: "Núñez",
  "puerto-madero": "Puerto Madero", "puerto madero": "Puerto Madero", recoleta: "Recoleta",
  "villa-urquiza": "Villa Urquiza", "villa urquiza": "Villa Urquiza", colegiales: "Colegiales",
  chacarita: "Chacarita", saavedra: "Saavedra", coghlan: "Coghlan", retiro: "Retiro",
};

function Card({ d }) {
  const barrios = (d.barrios || "").split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <li className={`rounded-2xl p-5 bg-surface border ${d.destacada ? "border-link-gold/40" : "border-outline-variant"}`}>
      <div className="flex items-start gap-4">
        {d.iniciales ? (
          <span className="shrink-0 w-14 h-14 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-headline-sm text-[18px] tracking-wide">
            {d.iniciales}
          </span>
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-headline-sm text-[19px] leading-tight text-primary">{d.nombre}</h3>
            {d.badge ? (
              <span className="shrink-0 text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-link-gold px-2.5 py-1 rounded-lg">
                {d.badge}
              </span>
            ) : d.destacada ? (
              <span className="shrink-0 text-[10px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-link-gold px-2 py-0.5 rounded-full">Destacada</span>
            ) : null}
          </div>
          {d.anios ? <p className="text-[13px] font-medium text-on-surface-variant mt-1">{d.anios}</p> : null}
        </div>
      </div>

      {barrios.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {barrios.map((b) => (
            <span key={b} className="text-[12px] bg-surface-container text-primary rounded-lg px-2.5 py-1">{b}</span>
          ))}
        </div>
      )}

      {(d.proyecto || d.estructura || d.volumen) && (
        <dl className="mt-4 space-y-2.5 text-[14px]">
          {d.proyecto && (<div><dt className="font-label-caps text-label-caps uppercase text-on-surface-variant text-[11px]">Proyecto</dt><dd className="text-primary">{d.proyecto}</dd></div>)}
          {d.estructura && (<div><dt className="font-label-caps text-label-caps uppercase text-on-surface-variant text-[11px]">Estructura</dt><dd className="text-primary">{d.estructura}</dd></div>)}
          {d.volumen && (<div><dt className="font-label-caps text-label-caps uppercase text-on-surface-variant text-[11px]">Volumen</dt><dd className="text-primary">{d.volumen}</dd></div>)}
        </dl>
      )}

      {d.desc && <p className="text-[13px] text-on-surface-variant mt-4 leading-relaxed">{d.desc}</p>}

      <div className="mt-4 pt-3 border-t border-outline-variant flex flex-wrap items-center gap-x-5 gap-y-2">
        {d.proyectosSlug && d.proyectosSlug.length > 0 && (
          <a href={`/desarrolladoras/${d.slug}/`} className="text-[13px] font-medium text-link-gold hover:underline">
            Ver {d.proyectosSlug.length} proyecto{d.proyectosSlug.length === 1 ? "" : "s"} →
          </a>
        )}
        {d.web && (
          <a href={d.web.startsWith("http") ? d.web : `https://${d.web}`} target="_blank" rel="nofollow noopener" className="text-[13px] text-on-surface-variant hover:text-link-gold">
            Sitio oficial ↗
          </a>
        )}
      </div>
    </li>
  );
}

export default function DirectorioDevs({ devs = [] }) {
  const [q, setQ] = useState("");
  const [barrio, setBarrio] = useState("");
  const [soloDest, setSoloDest] = useState(false);

  // Barrios disponibles (de barriosKey + barrios), ordenados por frecuencia.
  const barrios = useMemo(() => {
    const count = {};
    devs.forEach((d) => {
      const keys = new Set([
        ...(d.barriosKey || "").split(/\s+/),
        ...(d.barrios || "").split(",").map((s) => deaccent(s).trim().replace(/\s+/g, "-")),
      ].filter(Boolean));
      keys.forEach((k) => { count[k] = (count[k] || 0) + 1; });
    });
    return Object.entries(count)
      .filter(([k, n]) => n >= 3 && BARRIO_LABEL[k])
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
  }, [devs]);

  const filtered = useMemo(() => {
    const nq = deaccent(q.trim());
    return devs.filter((d) => {
      if (soloDest && !d.destacada) return false;
      if (barrio) {
        const hay = deaccent((d.barriosKey || "") + " " + (d.barrios || "")).includes(barrio.replace(/-/g, " ")) ||
                    deaccent(d.barriosKey || "").split(/\s+/).includes(barrio);
        if (!hay) return false;
      }
      if (!nq) return true;
      return deaccent(d.nombre + " " + d.desc + " " + d.barrios).includes(nq);
    });
  }, [devs, q, barrio, soloDest]);

  const totalDest = devs.filter((d) => d.destacada).length;

  return (
    <section id="directorio" className="my-12">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Directorio de desarrolladoras en CABA</h2>
      <p className="text-on-surface-variant mb-6">
        {devs.length} desarrolladoras activas en pozo. Las {totalDest} destacadas —por trayectoria y volumen entregado— aparecen primero.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o barrio…" aria-label="Buscar desarrolladora"
            className="flex-1 border border-outline-variant rounded-lg px-4 py-2.5 text-[15px] bg-surface focus:outline-none focus:border-link-gold" />
          <button type="button" onClick={() => setSoloDest((v) => !v)} aria-pressed={soloDest}
            className={`px-4 py-2.5 rounded-lg text-[14px] font-medium border transition-colors whitespace-nowrap ${soloDest ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-link-gold"}`}>
            {soloDest ? "★ Solo destacadas" : "☆ Solo destacadas"}
          </button>
        </div>
        {barrios.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setBarrio("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${barrio === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-link-gold"}`}>Todos</button>
            {barrios.map((b) => (
              <button key={b} type="button" onClick={() => setBarrio(barrio === b ? "" : b)}
                className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${barrio === b ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-link-gold"}`}>
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

      {filtered.length === 0 && <p className="text-center text-on-surface-variant py-10">No encontramos desarrolladoras con ese criterio.</p>}
    </section>
  );
}
