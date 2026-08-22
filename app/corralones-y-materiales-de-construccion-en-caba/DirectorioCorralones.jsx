"use client";
import { useState, useMemo } from "react";
import { deaccent } from "../../lib/format";
import LogoAvatar from "../_ui/LogoAvatar";

// Directorio de corralones y proveedores de materiales. Mismo molde de tarjeta e
// interacción que DirectorioDevs (hub de desarrolladoras): grid de 3 columnas, tarjeta
// compacta con avatar + badge + subtítulo + chips + bloque etiquetado + footer.
const TIPO_LABEL = { corralon: "Corralón", retail: "Retail / Homecenter", fabricante: "Fabricante" };

// "Compra online": derivado (sin dato nuevo) de tipo + espec. Señal accionable para el usuario.
const esOnline = (d) => /online/i.test(`${d.tipo || ""} ${d.espec || ""}`);

// Cobertura legible a partir de zonaKey (único campo capturado que hoy no se surfacea).
function coberturaLabel(zonaKey) {
  const z = (zonaKey || "").toLowerCase();
  if (z.includes("nacional")) return "Cobertura nacional";
  const hasCaba = z.includes("caba"), hasGba = z.includes("gba");
  if (hasCaba && hasGba) return "CABA + GBA";
  if (hasCaba) return "CABA";
  if (hasGba) return "GBA";
  return null;
}

function Card({ d }) {
  const cobertura = coberturaLabel(d.zonaKey);
  const online = esOnline(d);
  return (
    <li className={`rounded-xl p-4 bg-surface border ${d.destacada ? "border-link-gold/40" : "border-outline-variant"} flex flex-col`}>
      <div className="flex items-start gap-3">
        <LogoAvatar web={d.web} iniciales={d.iniciales} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-headline-sm text-[16px] leading-tight text-primary">{d.nombre}</h3>
            {d.badge ? (
              <span className="shrink-0 text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-secondary px-2.5 py-1 rounded-lg">{d.badge}</span>
            ) : d.destacada ? (
              <span className="shrink-0 text-[10px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-secondary px-2 py-0.5 rounded-full">Destacado</span>
            ) : null}
          </div>
          {d.tipo ? <p className="text-[13px] font-medium text-on-surface-variant mt-1">{d.tipo}</p> : null}
        </div>
      </div>

      {(d.zona || cobertura || online) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {d.zona && <span className="text-[11px] bg-surface-container text-primary rounded-md px-2 py-0.5">{d.zona}</span>}
          {cobertura && <span className="text-[11px] bg-surface-container text-primary rounded-md px-2 py-0.5">{cobertura}</span>}
          {online && <span className="text-[11px] bg-primary-container/60 text-primary rounded-md px-2 py-0.5">Compra online</span>}
        </div>
      )}

      {d.espec && (
        <dl className="mt-3 space-y-1.5 text-[13px]">
          <div className="flex gap-1.5"><dt className="font-label-caps uppercase text-on-surface-variant text-[10px] shrink-0 w-20 pt-0.5">Especialidad</dt><dd className="text-primary flex-1">{d.espec}</dd></div>
        </dl>
      )}

      <div className="mt-auto pt-3 border-t border-outline-variant flex flex-wrap items-center gap-x-4 gap-y-2">
        {d.web ? (
          <a href={d.web.startsWith("http") ? d.web : `https://${d.web}`} target="_blank" rel="nofollow noopener" className="text-[13px] text-on-surface-variant hover:text-secondary">Sitio oficial ↗</a>
        ) : <span className="text-[13px] text-on-surface-variant/60">Sin sitio verificado</span>}
      </div>
    </li>
  );
}

// Orden fijo de buckets de cobertura para los chips de zona.
const ZONA_ORDER = ["CABA", "GBA", "CABA + GBA", "Cobertura nacional"];

export default function DirectorioCorralones({ items = [] }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [zona, setZona] = useState("");

  const tipos = useMemo(() => {
    const set = new Set(items.map((d) => d.tipoKey).filter(Boolean));
    return ["corralon", "retail", "fabricante"].filter((k) => set.has(k));
  }, [items]);

  const zonas = useMemo(() => {
    const set = new Set(items.map((d) => coberturaLabel(d.zonaKey)).filter(Boolean));
    return ZONA_ORDER.filter((z) => set.has(z));
  }, [items]);

  const filtered = useMemo(() => {
    const nq = deaccent(q.trim());
    return items.filter((d) => {
      if (tipo && d.tipoKey !== tipo) return false;
      if (zona && coberturaLabel(d.zonaKey) !== zona) return false;
      if (!nq) return true;
      return deaccent(`${d.nombre} ${d.tipo} ${d.zona} ${d.espec}`).includes(nq);
    });
  }, [items, q, tipo, zona]);

  return (
    <section id="directorio" className="my-12">
      <h2 className="sr-only">Directorio de corralones y proveedores de materiales</h2>
      <p className="text-on-surface-variant mb-6">
        {items.length} proveedores con presencia verificable en CABA y GBA. Ordenado por criterios comprobables, no por pago.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, rubro o zona…" aria-label="Buscar proveedor"
          className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-[15px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container" />
        {tipos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTipo("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${tipo === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>Todos los tipos</button>
            {tipos.map((k) => (
              <button key={k} type="button" onClick={() => setTipo(tipo === k ? "" : k)}
                className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${tipo === k ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>
                {TIPO_LABEL[k]}
              </button>
            ))}
          </div>
        )}
        {zonas.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setZona("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${zona === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>Todas las zonas</button>
            {zonas.map((z) => (
              <button key={z} type="button" onClick={() => setZona(zona === z ? "" : z)}
                className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${zona === z ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>
                {z}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[13px] text-on-surface-variant mb-4">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
        {filtered.map((d) => <Card key={d.id} d={d} />)}
      </ul>

      {filtered.length === 0 && <p className="text-center text-on-surface-variant py-10">No encontramos proveedores con ese criterio.</p>}
    </section>
  );
}
