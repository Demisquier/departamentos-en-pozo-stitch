// lib/metricas.js — Métricas propias por proyecto (server-only).
// Por qué Sheets: usa la service account que ya guarda los leads (sin base nueva ni claves extra).
// Cómo: cada lote del navegador se agrega como filas [fecha, slug, tipo, n] en la pestaña "Metricas";
// el cron diario compacta los días cerrados (una fila por fecha+slug+tipo) para que no crezca.
import crypto from "crypto";
import { sheetsReady, appendRows, getValues, ensureTab, clearRange, updateValues } from "./googleSheets";

const TAB = "Metricas";
export const metricasActivas = () => sheetsReady();

const SLUG_OK = /^[a-z0-9-]{3,160}$/;
const TIPOS = new Set(["imp", "vis", "wa", "lead"]);
let _tabOk = false;
async function tab() { if (!_tabOk) { await ensureTab(TAB, ["fecha", "slug", "tipo", "n"]); _tabOk = true; } }

// eventos: [{s: slug, t: "imp"|"vis"|"wa"|"lead", n?: 1}] → se agrupan antes de guardar.
export async function registrarMetricas(eventos = []) {
  if (!metricasActivas()) return;
  const acc = new Map();
  for (const e of eventos) {
    if (!e || !SLUG_OK.test(String(e.s || "")) || !TIPOS.has(e.t)) continue;
    const k = e.s + "|" + e.t;
    acc.set(k, Math.min((acc.get(k) || 0) + (Number(e.n) || 1), 50));
  }
  if (!acc.size) return;
  const f = hoyAR(0);
  const rows = [...acc.entries()].slice(0, 300).map(([k, n]) => { const [s, t] = k.split("|"); return [f, s, t, n]; });
  try { await tab(); await appendRows(TAB, rows); } catch (e) { console.error("metricas", e.message); }
}

async function filas() {
  if (!metricasActivas()) throw new Error("Google Sheets no configurado");
  await tab();
  return (await getValues(TAB + "!A2:D")).filter((r) => r && r[0] && r[1] && TIPOS.has(r[2]));
}
const CAMPO = { imp: "impresiones", vis: "visitas", wa: "clics_wa", lead: "leads" };

export async function leerMetricas(desde, hasta) {
  const m = new Map();
  for (const [f, s, t, n] of await filas()) {
    if (f < desde || f > hasta) continue;
    if (!m.has(s)) m.set(s, { slug: s, impresiones: 0, visitas: 0, clics_wa: 0, leads: 0 });
    m.get(s)[CAMPO[t]] += Number(n) || 0;
  }
  return [...m.values()];
}
export async function leerSerie(desde, hasta, slugs = null) {
  const set = slugs ? new Set(slugs) : null;
  const m = new Map();
  for (const [f, s, t, n] of await filas()) {
    if (f < desde || f > hasta || (set && !set.has(s))) continue;
    if (!m.has(f)) m.set(f, { fecha: f, impresiones: 0, visitas: 0, clics_wa: 0, leads: 0 });
    m.get(f)[CAMPO[t]] += Number(n) || 0;
  }
  return [...m.values()].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}

// Compacta días cerrados: una fila por fecha+slug+tipo. Lo llama el cron diario.
export async function compactarMetricas() {
  const rows = await filas();
  const hoy = hoyAR(0);
  const acc = new Map(); const deHoy = [];
  for (const r of rows) {
    if (r[0] >= hoy) { deHoy.push(r.slice(0, 4)); continue; }
    const k = r[0] + "|" + r[1] + "|" + r[2];
    acc.set(k, (acc.get(k) || 0) + (Number(r[3]) || 0));
  }
  const viejas = [...acc.entries()].map(([k, n]) => [...k.split("|"), n]);
  const todo = [...viejas, ...deHoy];
  if (todo.length >= rows.length) return { antes: rows.length, despues: rows.length };
  await clearRange(TAB + "!A2:D");
  if (todo.length) await updateValues(TAB + "!A2:D" + (todo.length + 1), todo);
  return { antes: rows.length, despues: todo.length };
}

// Clave del panel: PANEL_KEY si existe; si no, derivada de un secreto que ya está en Vercel.
export function panelKey() {
  if (process.env.PANEL_KEY) return process.env.PANEL_KEY;
  const base = process.env.MAIL_SECRET || process.env.GOOGLE_SA_KEY;
  if (!base) return null;
  return crypto.createHmac("sha256", String(base)).update("panel-v1").digest("hex").slice(0, 24);
}
export const panelUrl = () => { const k = panelKey(); return k ? `https://departamentosenpozo.com.ar/panel?k=${k}` : null; };

// Empresa responsable de una ficha (para agrupar): la comercializadora si hay, si no la desarrolladora.
export function empresaDe(item) {
  const limpia = (s) => String(s || "").replace(/\(.*?\)/g, "").replace(/^com\.?\s*/i, "").trim();
  return limpia(item.comercializadora) || limpia(item.desarrolladoraNombre) || "Sin identificar";
}
export const empresaSlug = (n) => String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
// Token del link privado por empresa (no adivinable; requiere MAIL_SECRET del server).
export function tokenEmpresa(slugEmpresa) {
  return crypto.createHmac("sha256", String(panelKey() || "x")).update("emp:" + slugEmpresa).digest("hex").slice(0, 20);
}

// Fechas en hora AR (YYYY-MM-DD).
export function hoyAR(offsetDias = 0) {
  const d = new Date(Date.now() - 3 * 3600e3 + offsetDias * 864e5);
  return d.toISOString().slice(0, 10);
}
