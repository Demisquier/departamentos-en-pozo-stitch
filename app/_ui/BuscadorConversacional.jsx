"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { interpretar, scoreProyecto, money } from "../../lib/busqueda";
import { track } from "../../lib/track";

// Búsqueda inteligente: caja de texto (escribí o pegá lo que buscás). Filtra el
// catálogo (/catalogo.json) EN VIVO. Sin LLM = gratis. La lógica de interpretación
// (barrio, ambientes, precio, sinónimos, fuzzy) vive en lib/busqueda.js (single source).

export default function BuscadorConversacional({ initialQuery = "", onQueryChange }) {
  const [q, setQ] = useState(initialQuery);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const data = useRef(null);
  const barrioLabels = useRef([]);
  const deb = useRef(null);
  const gaDeb = useRef(null);

  const ejemplos = ["2 ambientes en Palermo con financiación", "3 dormitorios en Núñez", "Belgrano hasta USD 200.000 entrega 2026", "Monoambiente en pozo en Caballito"];

  // Refleja la query en la URL (#q=) para que la búsqueda sea compartible y recuperable.
  function syncUrl(texto) {
    try {
      const base = window.location.pathname + window.location.search;
      const url = texto && texto.trim() ? base + "#q=" + encodeURIComponent(texto.trim()) : base;
      window.history.replaceState(null, "", url);
    } catch {}
  }

  // Evento GA4 (debounced) para medir qué busca la gente y qué queda en cero.
  function trackBusqueda(texto, total) {
    const t = (texto || "").trim();
    if (t.length < 3) return;
    clearTimeout(gaDeb.current);
    gaDeb.current = setTimeout(() => {
      track("busqueda_inteligente", { query: t.slice(0, 100), resultados: total, sin_resultados: total === 0 });
    }, 900);
  }

  function run(texto, arr) {
    const list = arr || data.current;
    if (!list) return;
    const f = interpretar(texto || "", barrioLabels.current);
    const scored = list.map((p) => [scoreProyecto(p, f), p]).filter((x) => x[0] >= 0).sort((a, b) => b[0] - a[0] || (Number(!!b[1].imagen) - Number(!!a[1].imagen)));
    setRes({ items: scored.slice(0, 60).map((x) => x[1]), f, total: scored.length });
    syncUrl(texto);
    trackBusqueda(texto, scored.length);
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/catalogo.json");
        const j = await r.json();
        const arr = (j && j.proyectos) || [];
        barrioLabels.current = [...new Set(arr.map((p) => (p.barrio || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")).filter(Boolean))];
        data.current = arr;
        run(initialQuery, arr);
      } catch { data.current = []; setRes({ items: [], f: {}, total: 0 }); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(v) {
    setQ(v);
    onQueryChange && onQueryChange(v);
    clearTimeout(deb.current);
    deb.current = setTimeout(() => run(v), 200);
  }
  function setQuick(v) {
    setQ(v);
    onQueryChange && onQueryChange(v);
    run(v);
  }

  const f = res && res.f ? res.f : {};
  const chips = res ? [
    ...(f.barrios || []).map((b) => "📍 " + b.charAt(0).toUpperCase() + b.slice(1)),
    ...(f.amb || []).map((a) => "🛏 " + a + " amb"),
    f.maxTotal ? "💵 hasta " + money(f.maxTotal) : null,
    f.maxM2 ? "📐 hasta " + money(f.maxM2) + "/m²" : null,
    f.anio ? "📅 entrega " + f.anio : null,
    f.fin ? "💳 prioriza financiación" : null,
    ...(f.text || []).map((t) => "🔎 " + t),
  ].filter(Boolean) : [];

  return (
    <div className="w-full">
      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[22px] pointer-events-none">auto_awesome</span>
          <input
            value={q}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribí o pegá lo que buscás. Ej: 2 ambientes en Palermo con financiación"
            aria-label="Búsqueda inteligente en lenguaje natural"
            className="w-full border-2 border-outline-variant focus:border-secondary rounded-xl pl-12 pr-11 py-3.5 text-[16px] bg-surface focus:outline-none"
          />
          {q && (
            <button type="button" onClick={() => { setQ(""); onQueryChange && onQueryChange(""); run(""); }} aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
        <button type="submit" className="bg-secondary text-white font-medium px-6 py-3.5 rounded-xl hover:opacity-90 whitespace-nowrap">Buscar</button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-[12px] text-on-surface-variant self-center">Probá:</span>
        {ejemplos.map((e) => (
          <button key={e} onClick={() => setQuick(e)} className="text-[12px] border border-outline-variant rounded-full px-3 py-1 text-primary hover:border-secondary">{e}</button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div key={k} className="rounded-xl border border-outline-variant overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-surface-container-high" />
              <div className="p-4 space-y-2"><div className="h-4 bg-surface-container-high rounded w-3/4" /><div className="h-3 bg-surface-container-high rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : res && (
        <div className="mt-6">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[12px] text-on-surface-variant">Entendí:</span>
              {chips.map((c, i) => <span key={i} className="text-[12px] bg-secondary/10 text-secondary rounded-md px-2.5 py-1">{c}</span>)}
              <button type="button" onClick={() => { setQ(""); run(""); }} className="text-[12px] text-on-surface-variant underline ml-1">limpiar</button>
            </div>
          )}
          <p className="text-[14px] text-on-surface-variant mb-4">{res.total} proyecto{res.total === 1 ? "" : "s"} en pozo{chips.length ? " que matchean" : ""}</p>
          {res.items.length === 0 ? (
            <div className="border border-outline-variant rounded-xl p-8 text-center">
              <p className="text-on-surface-variant mb-4">No encontramos proyectos con esos criterios. Probá con menos condiciones o cambiá el barrio/precio.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {ejemplos.map((e) => (
                  <button key={e} type="button" onClick={() => setQuick(e)} className="text-[12px] border border-outline-variant rounded-full px-3 py-1 text-secondary hover:border-secondary">{e}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {res.items.map((p) => (
                <Link key={p.slug} href={"/desarrollos-inmobiliarios/" + p.slug + "/"} className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative aspect-[4/3] bg-surface-container-high overflow-hidden">
                    {p.imagen ? <img src={p.imagen} alt={p.nombre} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline-variant text-4xl">apartment</span></div>}
                    <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">EN POZO</span>
                    {p.financiacion_en_cuotas && <span className="absolute top-3 right-3 bg-secondary text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">CUOTAS</span>}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-headline-sm text-[16px] text-primary leading-tight">{p.nombre}</h3>
                    {p.barrio && <p className="text-on-surface-variant text-[13px] mt-0.5">{p.barrio}{p.entrega_anio ? " · entrega " + p.entrega_anio : ""}</p>}
                    <div className="mt-3 pt-3 border-t border-outline-variant flex items-end justify-between">
                      <span className="text-primary font-headline-sm text-[15px]">{p.precio_desde_usd ? money(p.precio_desde_usd) : (p.precio_m2_usd ? money(p.precio_m2_usd) + "/m²" : "Consultar")}</span>
                      <span className="text-[12px] text-secondary group-hover:underline">Ver ficha →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
