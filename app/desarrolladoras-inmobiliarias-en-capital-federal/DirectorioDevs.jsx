"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

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

// Barrio (clave) → slug de la página curada. Con esto los chips del hub se vuelven
// LINKS navegables (filtro = URL propia = indexable), en vez de filtro client-only.
const BARRIO_URL = {
  palermo: "palermo", belgrano: "belgrano", caballito: "caballito", nunez: "nunez",
  "puerto-madero": "puerto-madero", recoleta: "recoleta", "villa-urquiza": "villa-urquiza",
  colegiales: "colegiales-chacarita", chacarita: "colegiales-chacarita",
  saavedra: "saavedra-coghlan", coghlan: "saavedra-coghlan",
};

function Card({ d }) {
  const barrios = (d.barrios || "").split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <li className={`rounded-xl p-4 bg-surface border ${d.destacada ? "border-link-gold/40" : "border-outline-variant"} flex flex-col`}>
      <div className="flex items-start gap-3">
        {d.iniciales ? (
          <span className="shrink-0 w-11 h-11 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-headline-sm text-[15px] tracking-wide">
            {d.iniciales}
          </span>
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-headline-sm text-[16px] leading-tight text-primary">{d.nombre}</h3>
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
        {d.proyectosSlug && d.proyectosSlug.length > 0 && (
          <a href={`/desarrolladoras/${d.slug}/`} className="text-[13px] font-semibold text-secondary hover:underline">
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
      {/* En el hub el H1 de la página ya dice "Directorio de desarrolladoras"; acá el H2
          va oculto (sr-only) para mantener estructura/a11y sin repetir visualmente. */}
      {barrioFijo ? (
        <h2 className="font-headline-sm text-headline-sm text-primary mb-1">
          Desarrolladoras en {tituloBarrio || BARRIO_LABEL[barrioFijo] || barrioFijo}
        </h2>
      ) : (
        <h2 className="sr-only">Directorio de desarrolladoras en CABA</h2>
      )}
      <p className="text-on-surface-variant mb-6">
        {barrioFijo
          ? <>Desarrolladoras con obra activa en pozo en {tituloBarrio || BARRIO_LABEL[barrioFijo] || barrioFijo}. <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/" className="text-secondary underline hover:no-underline">Ver todas las de CABA →</Link></>
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
                    className="px-3 py-1.5 rounded-full text-[13px] border border-outline-variant text-primary hover:border-link-gold transition-colors">
                    {BARRIO_LABEL[b] || b}
                  </Link>
                ))
              : (<>
                  <button type="button" onClick={() => setBarrio("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${barrio === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-link-gold"}`}>Todos</button>
                  {barrios.map((b) => (
                    <button key={b} type="button" onClick={() => setBarrio(barrio === b ? "" : b)}
                      className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${barrio === b ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-link-gold"}`}>
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
