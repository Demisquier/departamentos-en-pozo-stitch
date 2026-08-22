"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { deaccent } from "../../lib/format";
import { ZONA_INMO_LABEL as BARRIO_LABEL } from "../../lib/barrios";
import LogoAvatar from "../_ui/LogoAvatar";

// Directorio de inmobiliarias (CPT `inmobiliaria`). Mismo molde de tarjeta e interacción
// que DirectorioDevs (hub de desarrolladoras): grid de 3 columnas, tarjeta compacta con
// avatar + badge + subtítulo + chips + bloque etiquetado + footer. Server-rendered (SEO);
// buscador + chips = enhancement client.

// Padrón público de matriculados de CUCICBA (verificación gratuita de matrícula).
const CUCICBA_URL = "https://colegioinmobiliario.org.ar/servicios/guia-de-matriculados";

function Card({ d }) {
  const zonas = (d.zonas || "").split(",").map((s) => s.trim()).filter(Boolean);
  // Matrícula con número (verificable) vs "no publicada". Derivado del dato existente.
  const matNum = d.matricula && !/no\s*public/i.test(d.matricula) ? d.matricula : "";
  // Chip "Especialista en pozo": derivado por regex sobre inm_espec (sin dato nuevo).
  const esPozo = /pozo|emprendimiento|fideicomiso|preventa|en\s*construc/i.test(d.espec || "");
  // Badge redundante: si ya se muestra el número + ✓, no repetir "matrícula verificable".
  const showBadge = d.badge && !(matNum && /matr[íi]cula\s*verificable/i.test(d.badge));
  return (
    <li className={`rounded-xl p-4 flex flex-col ${d.destacada ? "border-2 border-link-gold ring-1 ring-link-gold/40 shadow-md bg-link-gold/5" : "bg-surface border border-outline-variant"}`}>
      <div className="flex items-start gap-3">
        <LogoAvatar web={d.web} iniciales={d.iniciales} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-headline-sm text-[16px] leading-tight text-primary">{d.nombre}</h3>
            {showBadge ? (
              <span className="shrink-0 text-[11px] font-label-caps uppercase tracking-wider bg-link-gold/15 text-secondary px-2.5 py-1 rounded-lg">{d.badge}</span>
            ) : d.destacada ? (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-label-caps uppercase tracking-wider bg-link-gold text-white px-2.5 py-1 rounded-md shadow-sm">★ Destacada</span>
            ) : null}
          </div>
          {matNum ? (
            <p className="text-[13px] font-medium mt-1">
              <a href={CUCICBA_URL} target="_blank" rel="nofollow noopener" className="inline-flex items-center gap-1 text-secondary hover:underline" title="Verificar en el padrón público de CUCICBA">
                <span aria-hidden="true">✓</span> Matrícula {matNum}
              </a>
            </p>
          ) : (
            <p className="text-[13px] font-medium mt-1">
              <a href={CUCICBA_URL} target="_blank" rel="nofollow noopener" className="text-on-surface-variant hover:text-secondary hover:underline" title="Verificar matrícula en el padrón público de CUCICBA">
                Matrícula no publicada — verificala en CUCICBA ↗
              </a>
            </p>
          )}
          {esPozo && (
            <span className="mt-1.5 inline-flex w-fit items-center gap-1 text-[10px] font-label-caps uppercase tracking-wider bg-secondary/10 text-secondary px-2 py-0.5 rounded-md">Especialista en pozo</span>
          )}
        </div>
      </div>

      {zonas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {zonas.slice(0, 4).map((b) => (
            <span key={b} className="text-[11px] bg-surface-container text-primary rounded-md px-2 py-0.5">{b}</span>
          ))}
          {zonas.length > 4 && (
            <span className="text-[11px] text-on-surface-variant rounded-md px-2 py-0.5" title={zonas.join(", ")}>+{zonas.length - 4} barrios</span>
          )}
        </div>
      )}

      {(d.espec || d.avisos || d.sucursales) && (
        <dl className="mt-3 space-y-1.5 text-[13px]">
          {d.espec && (<div className="flex gap-1.5"><dt className="font-label-caps uppercase text-on-surface-variant text-[10px] shrink-0 w-20 pt-0.5">Especialidad</dt><dd className="text-primary flex-1">{d.espec}</dd></div>)}
          {d.avisos && (<div className="flex gap-1.5"><dt className="font-label-caps uppercase text-on-surface-variant text-[10px] shrink-0 w-20 pt-0.5">Avisos</dt><dd className="text-primary flex-1">{d.avisos}</dd></div>)}
          {d.sucursales && (<div className="flex gap-1.5"><dt className="font-label-caps uppercase text-on-surface-variant text-[10px] shrink-0 w-20 pt-0.5">Estructura</dt><dd className="text-primary flex-1">{d.sucursales}</dd></div>)}
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

export default function DirectorioInmo({ items = [], zonaFija = "", chipsComoLinks = false, tituloZona = "" }) {
  const [q, setQ] = useState("");
  const [zona, setZona] = useState(zonaFija || "");

  const base = useMemo(
    () => (zonaFija ? items.filter((d) => deaccent(d.zonasKey || "").split(/\s+/).includes(zonaFija)) : items),
    [items, zonaFija]
  );

  const zonas = useMemo(() => {
    const count = {};
    base.forEach((d) => {
      (d.zonasKey || "").split(/\s+/).filter(Boolean).forEach((k) => { count[k] = (count[k] || 0) + 1; });
    });
    return Object.entries(count).filter(([k, n]) => n >= 3 && BARRIO_LABEL[k]).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [base]);

  const filtered = useMemo(() => {
    const nq = deaccent(q.trim());
    return base.filter((d) => {
      if (zona && !deaccent(d.zonasKey || "").split(/\s+/).includes(zona)) return false;
      if (!nq) return true;
      return deaccent(d.nombre + " " + d.zonas + " " + d.espec).includes(nq);
    });
  }, [base, q, zona]);

  const titulo = zonaFija ? (BARRIO_LABEL[zonaFija] || tituloZona || zonaFija) : null;

  return (
    <section id="directorio" className="my-12">
      <h2 className="sr-only">{titulo ? `Inmobiliarias en ${titulo}` : "Directorio de inmobiliarias en Capital Federal"}</h2>
      <p className="text-on-surface-variant mb-6">
        {titulo
          ? <>{base.length} inmobiliarias con actividad en {titulo}. Ordenado por criterios comprobables, no por opinión ni pago.</>
          : <>{base.length} inmobiliarias relevadas en CABA. Las de matrícula CUCICBA verificable aparecen primero. Ordenado por criterios comprobables, no por pago.</>}
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o zona…" aria-label="Buscar inmobiliaria"
          className="w-full border border-outline-variant rounded-lg px-4 py-2.5 text-[15px] bg-surface focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container" />
        {!zonaFija && zonas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chipsComoLinks
              ? zonas.map((b) => (
                  <Link key={b} href={`/mejores-inmobiliarias-en-${b}/`} className="px-3 py-1.5 rounded-full text-[13px] border border-outline-variant text-primary hover:border-secondary transition-colors">
                    {BARRIO_LABEL[b] || b}
                  </Link>
                ))
              : (<>
                  <button type="button" onClick={() => setZona("")} className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${zona === "" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>Todas</button>
                  {zonas.map((b) => (
                    <button key={b} type="button" onClick={() => setZona(zona === b ? "" : b)}
                      className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${zona === b ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>
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

      {filtered.length === 0 && <p className="text-center text-on-surface-variant py-10">No encontramos inmobiliarias con ese criterio.</p>}
    </section>
  );
}
