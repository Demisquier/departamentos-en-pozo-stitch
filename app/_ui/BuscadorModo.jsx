"use client";
import { useEffect } from "react";
import CatalogoFiltros from "../desarrollos-inmobiliarios/CatalogoFiltros";

// Wrapper de LISTADOS: barra de filtros estructurados + acceso al modo Conversar.
// La búsqueda conversacional NO corre inline acá: el toggle "Conversar" lleva al CHAT
// (/explorar). Si el listado recibe ?q= / #q= (handoff viejo del hero), redirige directo
// al chat. Modo local único = Filtros (CatalogoFiltros).
export default function BuscadorModo({ items }) {
  useEffect(() => {
    try {
      let ss = null; try { ss = sessionStorage.getItem("dpp_iaq"); if (ss) sessionStorage.removeItem("dpp_iaq"); } catch {}
      const h = window.location.hash || "";
      const hm = h.match(/[#&]q=([^&]*)/);
      const q = ss || (hm ? decodeURIComponent(hm[1].replace(/\+/g, " ")) : new URLSearchParams(window.location.search).get("q"));
      if (q) {
        try { sessionStorage.setItem("dpp_iaq", q); } catch {}
        window.location.replace("/explorar/#q=" + encodeURIComponent(q));
      }
    } catch {}
  }, []);

  const toggleEl = (
    <div className="inline-flex items-center rounded-full border border-outline-variant p-1 bg-surface shrink-0" role="tablist" aria-label="Forma de buscar">
      <span role="tab" aria-selected="true" className="px-4 py-1.5 rounded-full text-[13px] font-medium bg-primary text-white">Filtros</span>
      <button type="button" onClick={() => window.location.assign("/explorar/")}
        className="px-4 py-1.5 rounded-full text-[13px] font-medium text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">forum</span> Conversar
      </button>
    </div>
  );

  return (
    <div>
      <CatalogoFiltros items={items} toggle={toggleEl} />
    </div>
  );
}
