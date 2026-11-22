// lib/statsPozo.js — Estadísticas propias del catálogo (server-only) para páginas de datos
// (índice de precios por barrio, cuotas, comercializadoras). Por qué: es el dato que ningún
// portal publica ("precio por m² EN POZO por barrio") y el que más nos hace citables (GEO).
import { getDesarrollos } from "./wp";
import { mapDesarrollos } from "./catalogo";
import { conSellos } from "./sellos";
import { BARRIO_CATALOGO, matchBarrioCatalogo } from "./barrios";

const pct = (arr, p) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(p * (arr.length - 1) + 0.5))] : null);
const okM2 = (v) => v && v > 400 && v < 20000;
const okDesde = (v) => v && v > 15000 && v < 5000000;

export async function catalogoConSellos() {
  try { return conSellos(mapDesarrollos(await getDesarrollos(5000))); } catch (e) { return []; }
}

// Estadísticas por barrio/zona de catálogo (las mismas landings /desarrollos-inmobiliarios-en-{slug}/).
export function statsPorBarrio(items, minN = 3) {
  const out = [];
  for (const [slug, cfg] of Object.entries(BARRIO_CATALOGO)) {
    const enB = items.filter((i) => matchBarrioCatalogo(i.barrio, slug));
    if (enB.length < minN) continue;
    const m2 = enB.map((i) => i.precio).filter(okM2).sort((a, b) => a - b);
    const desde = enB.map((i) => i.precioDesde).filter(okDesde).sort((a, b) => a - b);
    out.push({
      slug, label: cfg.label, n: enB.length,
      nM2: m2.length, medM2: m2.length >= 3 ? pct(m2, 0.5) : null, p25: m2.length >= 4 ? pct(m2, 0.25) : null, p75: m2.length >= 4 ? pct(m2, 0.75) : null,
      minDesde: desde[0] || null,
      conCuotas: enB.filter((i) => i.financiacion).length,
    });
  }
  return out;
}

export function statsGlobal(items) {
  const m2 = items.map((i) => i.precio).filter(okM2).sort((a, b) => a - b);
  const desde = items.map((i) => i.precioDesde).filter(okDesde).sort((a, b) => a - b);
  return {
    n: items.length, nM2: m2.length, medM2: pct(m2, 0.5), p25: pct(m2, 0.25), p75: pct(m2, 0.75),
    medDesde: pct(desde, 0.5), minDesde: desde[0] || null,
    conCuotas: items.filter((i) => i.financiacion).length,
  };
}

export const usd = (n) => (n ? "USD " + Math.round(n).toLocaleString("es-AR") : "—");
export const mesAnio = () => new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });
