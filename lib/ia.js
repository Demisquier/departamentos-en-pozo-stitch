// lib/ia.js — Helpers compartidos por las features de IA (chat + búsqueda semántica).
// Cargan el MISMO catálogo real del sitio (mapDesarrollos) y prefiltran por keywords
// para no mandarle a GPT los ~760 proyectos enteros (tokens). Sin deps nuevas.
import { getDesarrollos, SITE } from "./wp";
import { mapDesarrollos } from "./catalogo";

export const OPENAI_MODEL = "gpt-4o-mini";
export const hasKey = () => !!process.env.OPENAI_API_KEY;
export const fichaUrl = (slug) => `${SITE}/desarrollos-inmobiliarios/${slug}/`;

const norm = (s) =>
  (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Carga defensiva del catálogo mapeado. Nunca tira: si falla, devuelve [].
export async function loadCatalogo() {
  try {
    return mapDesarrollos(await getDesarrollos(2000)) || [];
  } catch {
    return [];
  }
}

// Extrae un presupuesto (USD) del texto: "200.000", "usd 150000", "150k", "1.2M".
export function parseBudget(q) {
  const t = norm(q);
  const mk = t.match(/(\d+(?:[.,]\d+)?)\s*(k|mil)\b/);
  if (mk) return Math.round(parseFloat(mk[1].replace(",", ".")) * 1000);
  const mm = t.match(/(\d+(?:[.,]\d+)?)\s*m(?:illones)?\b/);
  if (mm) return Math.round(parseFloat(mm[1].replace(",", ".")) * 1e6);
  const mn = t.match(/(\d[\d.]{4,})/);
  if (mn) return parseInt(mn[1].replace(/\./g, ""), 10) || null;
  return null;
}

// Puntúa cada proyecto contra la query (barrio, tipología, nombre, dev, presupuesto)
// y devuelve los mejores `max`. Si nada matchea, cae a los primeros `max` (contexto
// nunca vacío). Tokens cortos (<3) se ignoran salvo dígitos de ambientes.
export function prefiltrar(items, q, max = 15) {
  const t = norm(q);
  const toks = t.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  const budget = parseBudget(q);
  const ambMatch = t.match(/(\d)\s*(amb|dorm|ambiente|dormitorio)/);
  const ambN = ambMatch ? ambMatch[1] : null;

  const scored = (items || []).map((p) => {
    const hayBarrio = norm(p.barrio);
    const hayNombre = norm(p.nombre);
    const hayDev = norm(p.desarrolladora);
    const hayAmb = norm(p.ambientes);
    let s = 0;
    for (const w of toks) {
      if (hayBarrio.includes(w)) s += 6;
      if (hayNombre.includes(w)) s += 3;
      if (hayDev.includes(w)) s += 2;
      if (hayAmb.includes(w)) s += 2;
    }
    if (ambN && hayAmb.includes(ambN)) s += 5;
    if (budget && p.precioDesde) {
      if (p.precioDesde <= budget * 1.1) s += 4;
      else s -= 3;
    }
    if (p.imagen) s += 0.5;
    if (p.precioDesde) s += 0.5;
    return { p, s };
  });

  scored.sort((a, b) => b.s - a.s);
  const hits = scored.filter((x) => x.s > 0).slice(0, max).map((x) => x.p);
  return hits.length ? hits : (items || []).slice(0, max);
}

// Línea compacta por proyecto para el prompt (barato en tokens).
export function lineaProyecto(p) {
  const precio = p.precioDesde
    ? `desde USD ${p.precioDesde.toLocaleString("es-AR")}`
    : (p.precioM2 ? `USD ${p.precioM2.toLocaleString("es-AR")}/m2` : "precio a consultar");
  const tip = p.ambientes ? `, ${p.ambientes}` : "";
  const ent = p.entrega ? `, entrega ${p.entrega}` : "";
  return `- ${p.nombre} (${p.barrio || "s/barrio"})${tip}, ${precio}${ent} [slug:${p.slug}]`;
}

// Llama a OpenAI Chat Completions con fetch nativo. Devuelve el string del assistant
// (o lanza si la API responde error). jsonMode fuerza response_format json_object.
export async function openaiChat(messages, { jsonMode = false, temperature = 0.4 } = {}) {
  const body = {
    model: OPENAI_MODEL,
    messages,
    temperature,
    max_tokens: 700,
  };
  if (jsonMode) body.response_format = { type: "json_object" };
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`openai_${r.status}`);
    const data = await r.json();
    return data?.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(to);
  }
}
