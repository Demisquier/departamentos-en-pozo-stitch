// lib/metricas.js — Métricas propias por proyecto (server-only).
// Guarda conteos diarios en Supabase (tabla metricas_diarias vía RPC track_metricas) y los lee
// para el panel (RPC panel_metricas / panel_serie, protegidas con PANEL_KEY).
// Si Supabase no está configurado, todo queda inerte (no rompe el sitio).
import crypto from "crypto";

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const metricasActivas = () => !!(URL_SB && ANON);

async function rpc(fn, body, ms = 4000) {
  if (!metricasActivas()) return null;
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(`${URL_SB}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: c.signal, cache: "no-store",
    });
    if (!r.ok) throw new Error(`${fn} ${r.status} ${(await r.text()).slice(0, 200)}`);
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  } finally { clearTimeout(t); }
}

const SLUG_OK = /^[a-z0-9-]{3,160}$/;
const TIPOS = new Set(["imp", "vis", "wa", "lead"]);

// eventos: [{s: slug, t: "imp"|"vis"|"wa"|"lead", n?: 1}] → se agrupan antes de enviar.
export async function registrarMetricas(eventos = []) {
  const acc = new Map();
  for (const e of eventos) {
    if (!e || !SLUG_OK.test(String(e.s || "")) || !TIPOS.has(e.t)) continue;
    const k = e.s + "|" + e.t;
    acc.set(k, Math.min((acc.get(k) || 0) + (Number(e.n) || 1), 50));
  }
  if (!acc.size) return;
  const p = [...acc.entries()].slice(0, 300).map(([k, n]) => { const [s, t] = k.split("|"); return { s, t, n }; });
  try { await rpc("track_metricas", { p }); } catch (e) { console.error("metricas", e.message); }
}

export async function leerMetricas(desde, hasta) {
  const key = process.env.PANEL_KEY;
  if (!key) throw new Error("Falta PANEL_KEY en Vercel");
  return (await rpc("panel_metricas", { p_key: key, p_desde: desde, p_hasta: hasta }, 10000)) || [];
}
export async function leerSerie(desde, hasta, slugs = null) {
  const key = process.env.PANEL_KEY;
  if (!key) throw new Error("Falta PANEL_KEY en Vercel");
  return (await rpc("panel_serie", { p_key: key, p_desde: desde, p_hasta: hasta, p_slugs: slugs }, 10000)) || [];
}

// Empresa responsable de una ficha (para agrupar): la comercializadora si hay, si no la desarrolladora.
export function empresaDe(item) {
  const limpia = (s) => String(s || "").replace(/\(.*?\)/g, "").replace(/^com\.?\s*/i, "").trim();
  return limpia(item.comercializadora) || limpia(item.desarrolladoraNombre) || "Sin identificar";
}
export const empresaSlug = (n) => String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
// Token del link privado por empresa (no adivinable; requiere MAIL_SECRET del server).
export function tokenEmpresa(slugEmpresa) {
  return crypto.createHmac("sha256", String(process.env.PANEL_KEY || process.env.MAIL_SECRET || "x")).update("emp:" + slugEmpresa).digest("hex").slice(0, 20);
}

// Fechas en hora AR (YYYY-MM-DD).
export function hoyAR(offsetDias = 0) {
  const d = new Date(Date.now() - 3 * 3600e3 + offsetDias * 864e5);
  return d.toISOString().slice(0, 10);
}
