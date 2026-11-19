// lib/afinidad.js — Personalización implícita para TODOS los usuarios (client-only).
// Por qué: antes sólo personalizábamos a quien había usado el chat o guardado favoritos.
// Cómo: registramos las fichas que mira cada usuario (barrio, precio, ambientes) y armamos una
// "afinidad" que reordena el listado y los destacados de la home. Con grupo de control (20%)
// para medir el lift real en GA4 (user property `grupo_pers`).
const K_VISTOS = "dpp_vistos_v1";
const K_AB = "dpp_ab_pers_v1";
const K_IMP = "dpp_imp_v1";      // {slug: veces que vio la card sin entrar}
const K_REB = "dpp_rebote_v1";   // [slug] fichas que abrió y dejó en <10 s
const K_ACC = "dpp_accion_v1";   // [slug] fichas donde consultó / WhatsApp / guardó

// --- Desinterés: lo que el usuario ya descartó no vuelve arriba del listado ---
export function registrarImpresion(slug) {
  if (typeof window === "undefined" || !slug) return;
  const m = read(K_IMP, {}); m[slug] = (m[slug] || 0) + 1;
  const keys = Object.keys(m); if (keys.length > 400) keys.slice(0, keys.length - 400).forEach((k) => delete m[k]);
  try { localStorage.setItem(K_IMP, JSON.stringify(m)); } catch {}
}
const addLista = (k, slug, max = 80) => { if (typeof window === "undefined" || !slug) return; const l = read(k, []).filter((x) => x !== slug); l.unshift(slug); try { localStorage.setItem(k, JSON.stringify(l.slice(0, max))); } catch {} };
export const registrarRebote = (slug) => addLista(K_REB, slug);
export const registrarAccion = (slug) => addLista(K_ACC, slug);

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
  const rebotes = new Set(read(K_REB, []));
  const acciones = new Set(read(K_ACC, []));
  const imps = read(K_IMP, {});
  const precios = [], amb = new Set(), vistosSet = new Set();
  (Array.isArray(vistos) ? vistos : []).forEach((v, i) => {
    if (!v) return;
    vistosSet.add(v.slug);
    if (rebotes.has(v.slug) && !acciones.has(v.slug)) return; // la abrió y se fue: no es señal de interés
    add(v.b, 1 / (1 + i * 0.15)); // lo más reciente pesa más
    if (v.p) precios.push(v.p);
    (v.a || []).forEach((x) => amb.add(x));
  });
  precios.sort((a, b) => a - b);
  const max = Math.max(0, ...Object.values(barrios));
  return {
    barrios, max, amb, vistos: vistosSet, rebotes, acciones, imps,
    precioRef: precios.length ? precios[Math.floor(precios.length / 2)] : null,
    senales: Object.keys(barrios).length + precios.length + rebotes.size + Object.keys(imps).length,
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
  // Desinterés: card vista 3+ veces sin entrar, o ficha abierta y abandonada en <10 s.
  if (!af.vistos.has(item.slug) && (af.imps && af.imps[item.slug] >= 3)) s -= 250;
  if (af.rebotes && af.rebotes.has(item.slug) && !(af.acciones && af.acciones.has(item.slug))) s -= 300;
  return s;
}

// ¿El proyecto encaja con el perfil del usuario? (para no empujar sellados que no le interesan)
export function encajaPerfil(item, af) {
  if (!af || !af.senales) return true;
  const sinPerfil = !Object.keys(af.barrios).length && !af.precioRef;
  if (sinPerfil) return true;
  const w = af.barrios[topBarrio(item.barrio)] || 0;
  const p = item.precioDesde ?? item.precio;
  const precioOk = !af.precioRef || !p || Math.abs(p - af.precioRef) / af.precioRef <= 0.5;
  return (w > 0 || !Object.keys(af.barrios).length) && precioOk;
}
