"use client";
import { useState, useEffect } from "react";
import CatalogoFiltros from "../desarrollos-inmobiliarios/CatalogoFiltros";
import BuscadorConversacional from "./BuscadorConversacional";

// Wrapper de LISTADOS: una sola sección con dos formas de buscar (toggle).
// Default = Filtros. Si llega ?q= (desde el hero de la home), abre modo IA con la frase.
// En desktop el toggle va inline a la izquierda de la barra de filtros; en mobile se apila.
export default function BuscadorModo({ items }) {
  const [modo, setModo] = useState("filtros");
  const [initial, setInitial] = useState("");
  const [query, setQuery] = useState(""); // se conserva al cambiar de modo
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) { setInitial(q); setQuery(q); setModo("ia"); }
    } catch {}
  }, []);

  const toggleEl = (
    <div className="inline-flex items-center rounded-full border border-outline-variant p-1 bg-surface shrink-0" role="tablist" aria-label="Forma de buscar">
      <button type="button" role="tab" aria-selected={modo === "filtros"} onClick={() => setModo("filtros")}
        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${modo === "filtros" ? "bg-primary text-white" : "text-on-surface-variant hover:text-primary"}`}>
        Filtros
      </button>
      <button type="button" role="tab" aria-selected={modo === "ia"} onClick={() => setModo("ia")}
        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1 ${modo === "ia" ? "bg-secondary text-white" : "text-on-surface-variant hover:text-primary"}`}>
        <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Búsqueda inteligente
      </button>
    </div>
  );

  return (
    <div>
      {modo === "filtros" ? (
        <CatalogoFiltros items={items} toggle={toggleEl} />
      ) : (
        <>
          <div className="mb-6">{toggleEl}</div>
          <BuscadorConversacional initialQuery={query || initial} onQueryChange={setQuery} />
        </>
      )}
    </div>
  );
}
