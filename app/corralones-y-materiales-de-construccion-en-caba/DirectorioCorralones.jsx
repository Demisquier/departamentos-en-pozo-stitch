"use client";
import { useState, useMemo } from "react";
import { deaccent } from "../../lib/format";

// Directorio de corralones y proveedores de materiales. Mismo formato de tarjeta rica
// que inmobiliarias/desarrolladoras. Filtros: tipo (corralon/retail/fabricante) y zona.
const TIPO_LABEL = { corralon: "Corralon", retail: "Retail / Homecenter", fabricante: "Fabricante" };
const ZONA_LABEL = { caba: "CABA", gba: "GBA", nacional: "Nacional" };

function Card({ d }) {
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
              <span className="shrink-0 text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-secondary px-2.5 py-1 rounded-lg">{d.badge}</span>
            ) : null}
          </div>
          {d.tipo ? <p className="text-[13px] font-medium text-on-surface-variant mt-1">{d.tipo}</p> : null}
        </div>
      </div>

      {d.zona ? (
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[12px] bg-surface-container text-primary rounded-lg px-2.5 py-1">{d.zona}</span>
        </div>
      ) : null}

      {d.espec ? (
        <dl className="mt-4 space-y-2.5 text-[14px]">
          <div><dt className="font-label-caps text-label-caps uppercase text-on-surface-variant text-[11px]">Especialidad</dt><dd className="text-primary">{d.espec}</dd></div>
        </dl>
      ) : null}

      <div className="mt-4 pt-3 border-t border-outline-variant">
        {d.web ? (
          <a href={d.web.startsWith("http") ? d.web : `https://${d.web}`} target="_blank" rel="nofollow noopener" className="text-[13px] text-on-surface-variant hover:text-secondary">Sitio oficial ↗</a>
        ) : <span className="text-[13px] text-on-surface-variant/60">Sin sitio verificado</span>}
      </div>
    </li>
  );
}

export default function DirectorioCorralones({ items = [] }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [zona, setZona] = useState("");

  const tipos = useMemo(() => {
    const set = new Set(items.map((d) => d.tipoKey).filter(Boolean));
    return ["corralon", "retail", "fabricante"].filter((k) => set.has(k));
  }, [items]);

  const zonas = useMemo(() => {
    const count = {};
    items.forEach((d) => (d.zonaKey || "").split(/\s+/).filter(Boolean).forEach((k) => { count[k] = (count[k] || 0) + 1; }));
    return ["caba", "gba", "nacional"].filter((k) => count[k]);
  }, [items]);

  const filtered = useMemo(() => {
    const nq = deaccent(q.trim());
    return items.filter((d) => {
      if (tipo && d.tipoKey !== tipo) return false;
      if (zona && !(d.zonaKey || "").split(/\s+/).includes(zona)) return false;
      if (!nq) return true;
      return deaccent(`${d.nombre} ${d.tipo} ${d.zona} ${d.espec}`).includes(nq);
    });
  }, [items, q, tipo, zona]);

  return (
    <section id="directorio" className="my-12">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Directorio de corralones y proveedores</h2>
      <p className="text-on-surface-variant mb-6">
        {items.length} proveedores con presencia verificable en CABA y GBA. Ordenado por criterios comprobables, no por pago.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, rubro o zona…" aria-label="Buscar proveedor"
          className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-[15px] bg-surface focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTipo("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${tipo === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>Todos los tipos</button>
          {tipos.map((k) => (
            <button key={k} type="button" onClick={() => setTipo(tipo === k ? "" : k)}
              className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${tipo === k ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>
              {TIPO_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setZona("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${zona === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>Todas las zonas</button>
          {zonas.map((k) => (
            <button key={k} type="button" onClick={() => setZona(zona === k ? "" : k)}
              className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${zona === k ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>
              {ZONA_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[13px] text-on-surface-variant mb-4">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</p>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((d) => <Card key={d.id} d={d} />)}
      </ul>

      {filtered.length === 0 && <p className="text-center text-on-surface-variant py-10">No encontramos proveedores con ese criterio.</p>}
    </section>
  );
}
