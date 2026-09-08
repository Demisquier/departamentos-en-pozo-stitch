"use client";
// app/buscar/BuscadorIA.jsx — Búsqueda semántica con IA (beta), additiva sobre /buscar.
// Se auto-oculta si GET /api/buscar-ia devuelve ready:false (env-gated: sin API key no aparece).
// Postea { q } a /api/buscar-ia y muestra los matches como tarjetas (link a ficha + motivo).
import { useState, useEffect } from "react";
import Link from "next/link";
import { track } from "../../lib/track";

export default function BuscadorIA() {
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ok = true;
    fetch("/api/buscar-ia").then((r) => r.json()).then((d) => { if (ok) setReady(!!d?.ready); }).catch(() => {});
    return () => { ok = false; };
  }, []);

  async function run(e) {
    e.preventDefault();
    const val = q.trim();
    if (!val || loading) return;
    setLoading(true); setRes(null);
    track("busqueda_ia", { query: val.slice(0, 100) });
    try {
      const r = await fetch("/api/buscar-ia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: val }) });
      const d = await r.json();
      setRes(Array.isArray(d?.resultados) ? d.resultados : []);
    } catch {
      setRes([]);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <section className="mt-12 border-t border-outline-variant pt-10">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-secondary text-[22px]">auto_awesome</span>
        <h2 className="font-headline-md text-headline-sm md:text-headline-md text-primary">Búsqueda con IA <span className="text-secondary text-[13px] font-label-caps uppercase align-middle">beta</span></h2>
      </div>
      <p className="text-body-md text-on-surface-variant mb-4 max-w-2xl">
        Describí en tus palabras lo que buscás y la IA elige los proyectos que mejor encajan, con el motivo de cada match.
      </p>

      <form onSubmit={run} className="flex flex-col sm:flex-row gap-2 max-w-3xl">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: algo tranquilo cerca de un parque en Núñez para alquilar" className="flex-1 border-2 border-outline-variant focus:border-secondary rounded-xl px-4 py-3.5 text-[16px] bg-surface focus:outline-none" />
        <button type="submit" disabled={loading || !q.trim()} className="bg-secondary text-white font-medium px-6 py-3.5 rounded-xl hover:opacity-90 whitespace-nowrap disabled:opacity-50">
          {loading ? "Buscando…" : "Buscar con IA"}
        </button>
      </form>

      {loading && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
          {[0, 1, 2].map((k) => (
            <div key={k} className="rounded-xl border border-outline-variant overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-surface-container-high" />
              <div className="p-4 space-y-2"><div className="h-4 bg-surface-container-high rounded w-3/4" /><div className="h-3 bg-surface-container-high rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      )}

      {res && !loading && (
        res.length === 0 ? (
          <div className="mt-6 border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-on-surface-variant">No encontramos matches para esa búsqueda. Probá con otra descripción o usá la búsqueda inteligente de arriba.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {res.map((p) => (
              <Link key={p.slug} href={`/desarrollos-inmobiliarios/${p.slug}/`} className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] bg-surface-container-high overflow-hidden">
                  {p.imagen ? <img src={p.imagen} alt={p.nombre} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline-variant text-4xl">apartment</span></div>}
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <h3 className="text-[15px] font-medium text-primary leading-tight">{p.nombre}</h3>
                  <p className="text-[13px] text-on-surface-variant">{p.barrio}{p.precioDesde ? ` · desde USD ${p.precioDesde.toLocaleString("es-AR")}` : ""}</p>
                  {p.motivo && <p className="text-[12.5px] text-secondary mt-1 leading-snug"><span className="material-symbols-outlined text-[14px] align-middle mr-0.5">auto_awesome</span>{p.motivo}</p>}
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </section>
  );
}
