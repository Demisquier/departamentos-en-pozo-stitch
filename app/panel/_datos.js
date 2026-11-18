// Datos del panel: métricas de Supabase + catálogo (para saber a qué empresa pertenece cada ficha).
import { getDesarrollos } from "../../lib/wp";
import { mapDesarrollos } from "../../lib/catalogo";
import { leerMetricas, leerSerie, empresaDe, empresaSlug, tokenEmpresa, hoyAR } from "../../lib/metricas";

export const RANGOS = { "7": 7, "30": 30, "90": 90 };
export const pct = (a, b) => (b > 0 ? (100 * a) / b : null);
export const fmtPct = (v) => (v == null ? "—" : v < 10 ? v.toFixed(1) + "%" : Math.round(v) + "%");

function sumar(rows) {
  const t = { imp: 0, vis: 0, wa: 0, leads: 0 };
  for (const r of rows) { t.imp += r.imp; t.vis += r.vis; t.wa += r.wa; t.leads += r.leads; }
  t.ctr = pct(t.vis, t.imp); t.cr = pct(t.leads + t.wa, t.vis);
  return t;
}

export async function cargarPanel(dias) {
  const desde = hoyAR(-(dias - 1)), hasta = hoyAR(0);
  const [met, items] = await Promise.all([leerMetricas(desde, hasta), getDesarrollos().then(mapDesarrollos).catch(() => [])]);
  const porSlug = new Map(items.map((i) => [i.slug, i]));
  const proyectos = met.map((m) => {
    const it = porSlug.get(m.slug);
    const empresa = it ? empresaDe(it) : "Fuera de catálogo";
    const r = { slug: m.slug, nombre: it ? it.nombre : m.slug, barrio: it ? it.barrio : "", empresa,
      imp: Number(m.impresiones) || 0, vis: Number(m.visitas) || 0, wa: Number(m.clics_wa) || 0, leads: Number(m.leads) || 0 };
    r.ctr = pct(r.vis, r.imp); r.cr = pct(r.leads + r.wa, r.vis);
    return r;
  });
  const grupos = new Map();
  for (const p of proyectos) { if (!grupos.has(p.empresa)) grupos.set(p.empresa, []); grupos.get(p.empresa).push(p); }
  // Cantidad de fichas publicadas por empresa (aunque no tengan métricas todavía).
  const fichasPorEmpresa = new Map();
  for (const it of items) { const e = empresaDe(it); fichasPorEmpresa.set(e, (fichasPorEmpresa.get(e) || 0) + 1); }
  const empresas = [...grupos.entries()].map(([nombre, rows]) => {
    const s = empresaSlug(nombre);
    return { nombre, slug: s, token: tokenEmpresa(s), fichas: fichasPorEmpresa.get(nombre) || rows.length, ...sumar(rows) };
  });
  return { desde, hasta, total: sumar(proyectos), proyectos, empresas, items };
}

export async function cargarEmpresa(slugEmp, dias) {
  const base = await cargarPanel(dias);
  const emp = base.empresas.find((e) => e.slug === slugEmp);
  const nombre = emp ? emp.nombre : (base.items.map(empresaDe).find((n) => empresaSlug(n) === slugEmp) || null);
  if (!nombre) return null;
  const proyectos = base.proyectos.filter((p) => p.empresa === nombre);
  const fichas = base.items.filter((i) => empresaDe(i) === nombre);
  const slugs = fichas.map((f) => f.slug);
  let serie = [];
  try { serie = await leerSerie(base.desde, base.hasta, slugs.length ? slugs : null); } catch (e) {}
  return { ...base, nombre, proyectos, fichas, total: sumar(proyectos), serie };
}
