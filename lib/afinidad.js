// lib/afinidad.js — Personalización implícita para TODOS los usuarios (client-only).
// Por qué: antes sólo personalizábamos a quien había usado el chat o guardado favoritos.
// Cómo: registramos las fichas que mira cada usuario (barrio, precio, ambientes) y armamos una
// "afinidad" que reordena el listado y los destacados de la home. Con grupo de control (20%)
// para medir el lift real en GA4 (user property `grupo_pers`).
const K_VISTOS = "dpp_vistos_v1";
const K_AB = "dpp_ab_pers_v1";

const NORM = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
export const topBarrio = (b) => { const n = NORM(b); return n.startsWith("palermo") ? "palermo" : n; };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

// Ficha vista → se guarda arriba de la lista (máx. 40, sin duplicados).
export function registrarVista({ slug, barrio, precio, ambientes }) {
  if (typeof window === "undefined" || !slug) return;
  const prev = read(K_VISTOS, []).filter((v) => v && v.slug !== slug);
  const next = [{ slug, b: topBarrio(barrio), p: Number(precio) || null, a: (ambientes || []).map((x) => String(x).replace(/\D/g, "")).filter(Boolean), t: Date.now() }, ...prev].slice(0, 40);
  try { localStorage.setItem(K_VISTOS, JSON.stringify(next)); } catch {}
}

// 80% personalizado / 20% control, estable por navegador. Se reporta a GA4.
export function grupoPers() {
  if (typeof window === "undefined") return "control";
  let g = read(K_AB, null);
  if (g !== "pers" && g !== "control") {
    g = Math.random() < 0.8 ? "pers" : "control";
    try { localStorage.setItem(K_AB, JSON.stringify(g)); } catch {}
  }
  try { window.gtag && window.gtag("set", "user_properties", { grupo_pers: g }); } catch {}
  return g;
}

// Afinidad = barrios ponderados + precio de referencia + ambientes + vistos.
export function leerAfinidad() {
  const barrios = {};
  const add = (b, w) => { const t = topBarrio(b); if (t) barrios[t] = (barrios[t] || 0) + w; };
  const perfil = read("dpp_perfil_v1", {});
  if (perfil && perfil.zonas && !/igual|abierto|sugerenc/i.test(String(perfil.zonas))) String(perfil.zonas).split(/[/,]/).forEach((z) => add(z, 3));
  const favs = read("dpp_favoritos_v1", []);
  (Array.isArray(favs) ? favs : []).forEach((f) => f && f.barrio && add(f.barrio, 3));
  const vistos = read(K_VISTOS, []);
  const precios = [], amb = new Set(), vistosSet = new Set();
  (Array.isArray(vistos) ? vistos : []).forEach((v, i) => {
    if (!v) return;
    vistosSet.add(v.slug);
    add(v.b, 1 / (1 + i * 0.15)); // lo más reciente pesa más
    if (v.p) precios.push(v.p);
    (v.a || []).forEach((x) => amb.add(x));
  });
  precios.sort((a, b) => a - b);
  const max = Math.max(0, ...Object.values(barrios));
  return {
    barrios, max, amb, vistos: vistosSet,
    precioRef: precios.length ? precios[Math.floor(precios.length / 2)] : null,
    senales: Object.keys(barrios).length + precios.length,
  };
}

// Puntaje de afinidad de un proyecto (0 si no hay señales). Escala comparable a los +500 de antes.
export function puntajeAfinidad(item, af) {
  if (!af || !af.senales) return 0;
  let s = 0;
  const w = af.barrios[topBarrio(item.barrio)] || 0;
  if (w && af.max) s += Math.round(400 * (w / af.max));
  const p = item.precioDesde ?? item.precio;
  if (af.precioRef && p) {
    const d = Math.abs(p - af.precioRef) / af.precioRef;
    if (d <= 0.25) s += 150; else if (d <= 0.5) s += 60; else if (d > 1) s -= 40;
  }
  if (af.amb.size && (item.ambientesNums || []).some((x) => af.amb.has(String(x).replace(/\D/g, "")))) s += 80;
  if (af.vistos.has(item.slug)) s -= 120; // ya la vio: priorizamos opciones nuevas parecidas
  return s;
}
