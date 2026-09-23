"use client";
// app/_ui/DestacadosHome.jsx — Destacados de la home con personalización para REINGRESANTES.
// El server manda un POOL de candidatos ya rankeados por conversión (foto/precio/financiación…)
// y renderiza por defecto los 3 primeros (SSR, ideal para la primera visita y para SEO).
// Al montar, si el usuario ya nos visitó, leemos sus barrios de interés (perfil + guardados en
// localStorage) y REORDENAMOS el pool para mostrarle 3 destacados de SUS barrios — manteniendo
// diversidad. Estado inicial = [0,1,2] = lo que renderizó el server → sin desajuste de hidratación.
import { useState, useEffect } from "react";

const NORM = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
// Colapsa "Palermo Hollywood/Soho/…" en "palermo" (mismo criterio que topBarrio del server).
const topB = (b) => { const n = NORM(b); return n.startsWith("palermo") ? "palermo" : n; };

// Barrios de interés del usuario: de su perfil (zona elegida en el chat) y de sus proyectos guardados.
function preferredBarrios() {
  const pref = new Set();
  try {
    const p = JSON.parse(localStorage.getItem("dpp_perfil_v1") || "{}");
    const z = p && p.zonas;
    if (z && !/igual|abierto|sugerenc/i.test(String(z))) {
      String(z).split(/[/,]/).forEach((x) => { const t = topB(x); if (t) pref.add(t); });
    }
  } catch {}
  try {
    const favs = JSON.parse(localStorage.getItem("dpp_favoritos_v1") || "[]");
    (Array.isArray(favs) ? favs : []).forEach((f) => { if (f && f.barrio) { const t = topB(f.barrio); if (t) pref.add(t); } });
  } catch {}
  return pref;
}

export default function DestacadosHome({ cards = [], meta = [] }) {
  const n = Math.min(3, cards.length);
  const [idxs, setIdxs] = useState(Array.from({ length: n }, (_, i) => i));

  useEffect(() => {
    const pref = preferredBarrios();
    if (!pref.size || !meta.length) return;
    // Preferidos primero; a igualdad, respetamos el orden original (score de conversión).
    const order = meta.map((m, i) => ({ i, pref: pref.has(topB(m.barrio)) ? 1 : 0 }));
    order.sort((a, b) => (b.pref - a.pref) || (a.i - b.i));
    // Elegimos 3 con diversidad de barrio; completamos si faltan.
    const pick = [];
    const used = new Set();
    for (const o of order) {
      const b = topB(meta[o.i].barrio);
      if (used.has(b)) continue;
      used.add(b);
      pick.push(o.i);
      if (pick.length === 3) break;
    }
    for (const o of order) { if (pick.length >= 3) break; if (!pick.includes(o.i)) pick.push(o.i); }
    if (pick.length) setIdxs(pick.slice(0, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {idxs.map((i) => cards[i])}
    </div>
  );
}
