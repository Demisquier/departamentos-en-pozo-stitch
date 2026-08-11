"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { deaccent } from "../../lib/format";
import { BARRIO_LABEL, BARRIO_URL } from "../../lib/barrios";
import LogoAvatar from "../_ui/LogoAvatar";

// Directorio unificado de desarrolladoras (CPT `desarrolladora`). Server-rendered:
// el listado sale en el HTML (SEO). Buscador + filtro por barrio = enhancement client.
// deaccent, BARRIO_LABEL (etiquetas por clave del CPT) y BARRIO_URL (clave → slug de
// página curada, para chips navegables) viven en lib/format y lib/barrios.

function Card({ d }) {
  const barrios = (d.barrios || "").split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <li className={`rounded-xl p-4 bg-surface border ${d.destacada ? "border-link-gold/40" : "border-outline-variant"} flex flex-col`}>
      <div className="flex items-start gap-3">
        <LogoAvatar web={d.web} iniciales={d.iniciales} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-headline-sm text-[16px] leading-tight text-primary">{d.nombre}</h3>
            {d.badge ? (
              <span className="shrink-0 text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-secondary px-2.5 py-1 rounded-lg">
                {d.badge}
              </span>
            ) : d.destacada ? (
              <span className="shrink-0 text-[10px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-secondary px-2 py-0.5 rounded-full">Destacada</span>
            ) : null}
          </div>
          {d.anios ? <p className="text-[13px] font-medium text-on-surface-variant mt-1">{d.anios}</p> : null}
        </div>
      </div>

      {barrios.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {barrios.slice(0, 4).map((b) => (
            <span key={b} className="text-[11px] bg-surface-container text-primary rounded-md px-2 py-0.5">{b}</span>
          ))}
        </div>
      )}

      {(d.proyecto || d.estructura || d.volumen) && (
        <dl className="mt-3 space-y-1.5 text-[13px]">
          {d.proyecto && (<div className="flex gap-1.5"><dt className="font-label-caps uppercase text-on-surface-variant text-[10px] shrink-0 w-16 pt-0.5">Proyecto</dt><dd className="text-primary flex-1">{d.proyecto}</dd></div>)}
          {d.estructura && (<div className="flex gap-1.5"><dt className="font-label-caps uppercase text-on-surface-variant text-[10px] shrink-0 w-16 pt-0.5">Estructura</dt><dd className="text-primary flex-1">{d.estructura}</dd></div>)}
          {d.volumen && (<div className="flex gap-1.5"><dt className="font-label-caps uppercase text-on-surface-variant text-[10px] shrink-0 w-16 pt-0.5">Volumen</dt><dd className="text-primary flex-1">{d.volumen}</dd></div>)}
        </dl>
      )}

      {d.desc && <p className="text-[12.5px] text-on-surface-variant mt-3 leading-relaxed line-clamp-2">{d.desc}</p>}

      <div className="mt-auto pt-3 border-t border-outline-variant flex flex-wrap items-center gap-x-4 gap-y-2">
        <a href={`/desarrolladoras/${d.slug}/`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-on-primary px-3.5 py-2 text-[13px] font-semibold hover:bg-primary/90 transition-colors">
          {d.proyectosSlug && d.proyectosSlug.length > 0
            ? `Ver ${d.proyectosSlug.length} proyecto${d.proyectosSlug.length === 1 ? "" : "s"} →`
            : "Ver perfil →"}
        </a>
        {d.web && (
          <a href={d.web.startsWith("http") ? d.web : `https://${d.web}`} target="_blank" rel="nofollow noopener" className="text-[13px] text-on-surface-variant hover:text-secondary">
            Sitio oficial ↗
          </a>
        )}
      </div>
    </li>
  );
}

// Props:
//  - barrioFijo: si viene (ej "palermo"), el directorio arranca pre-filtrado a ese barrio
//    y oculta los chips (se usa en las páginas de barrio).
//  - chipsComoLinks: si es true, los chips de barrio son <a> a la página del barrio
//    (se usa en el hub: filtrar = navegar = URL propia).
//  - tituloBarrio: nombre lindo del barrio para el encabezado.
export default function DirectorioDevs({ devs = [], barrioFijo = "", chipsComoLinks = false, tituloBarrio = "" }) {
  const [q, setQ] = useState("");
  const [barrio, setBarrio] = useState(barrioFijo || "");
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
      {/* H2 siempre sr-only (el H1 de la página, hub o barrio, ya es el título visible).
          Así el directorio se ve IDÉNTICO en hub y en barrio: solo cambia el texto. */}
      <h2 className="sr-only">
        {barrioFijo ? `Desarrolladoras en ${tituloBarrio || BARRIO_LABEL[barrioFijo] || barrioFijo}` : "Directorio de desarrolladoras en CABA"}
      </h2>
      <p className="text-on-surface-variant mb-6">
        {barrioFijo
          ? <>{devs.length} desarrolladoras con obra activa en pozo en {tituloBarrio || BARRIO_LABEL[barrioFijo] || barrioFijo}.</>
          : <>{devs.length} desarrolladoras activas en pozo en CABA, GBA e interior.</>}
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o barrio…" aria-label="Buscar desarrolladora"
          className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-[15px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container" />
        {/* En el hub: chips = LINKS a la página del barrio (filtro navegable, URL propia).
            En la página de barrio: sin chips (ya está pre-filtrado). */}
        {!barrioFijo && barrios.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chipsComoLinks
              ? barrios.map((b) => (
                  <Link key={b} href={`/desarrolladoras-inmobiliarias-en-${BARRIO_URL[b] || b}/`}
                    className="px-3 py-1.5 rounded-full text-[13px] border border-outline-variant text-primary hover:border-secondary transition-colors">
                    {BARRIO_LABEL[b] || b}
                  </Link>
                ))
              : (<>
                  <button type="button" onClick={() => setBarrio("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${barrio === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>Todos</button>
                  {barrios.map((b) => (
                    <button key={b} type="button" onClick={() => setBarrio(barrio === b ? "" : b)}
                      className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${barrio === b ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>
                      {BARRIO_LABEL[b] || b}
                    </button>
                  ))}
                </>)}
          </div>
        )}
      </div>

      <p className="text-[13px] text-on-surface-variant mb-4">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
        {filtered.map((d) => <Card key={d.id} d={d} />)}
      </ul>

      {filtered.length === 0 && <p className="text-center text-on-surface-variant py-10">No encontramos desarrolladoras con ese criterio.</p>}
    </section>
  );
}
