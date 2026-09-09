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

// Núcleo del prefiltro: puntúa cada proyecto contra la query y devuelve el array
// ordenado [{p,s}]. Reutilizado por prefiltrar() y prefiltrarHits(). Tokens cortos
// (<3) se ignoran salvo dígitos de ambientes.
function scored(items, q) {
  const t = norm(q);
  const toks = t.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  const budget = parseBudget(q);
  const ambMatch = t.match(/(\d)\s*(amb|dorm|ambiente|dormitorio)/);
  const ambN = ambMatch ? ambMatch[1] : null;

  const arr = (items || []).map((p) => {
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
  arr.sort((a, b) => b.s - a.s);
  return arr;
}

// Devuelve los mejores `max`. Si nada matchea, cae a los primeros `max` (contexto
// nunca vacío). Para la búsqueda semántica, que igual quiere candidatos aunque el
// score sea bajo.
export function prefiltrar(items, q, max = 15) {
  const arr = scored(items, q);
  const hits = arr.filter((x) => x.s > 0).slice(0, max).map((x) => x.p);
  return hits.length ? hits : (items || []).slice(0, max);
}

// Igual que prefiltrar pero informa si HUBO match real (algún score > 0). El chat lo
// usa para NO pintar carrusel de cards random cuando la consulta no matchea nada.
export function prefiltrarHits(items, q, max = 15) {
  const arr = scored(items, q);
  const reales = arr.filter((x) => x.s > 0).slice(0, max).map((x) => x.p);
  return { hit: reales.length > 0, hits: reales.length ? reales : (items || []).slice(0, max) };
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

// ---- Sanitizado de cards (compartido por chat + búsqueda IA) --------------------
// Dedupe por slug: nunca el mismo proyecto dos veces en sugeridos/resultados.
export function dedupeBySlug(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr || []) {
    if (!x || !x.slug || seen.has(x.slug)) continue;
    seen.add(x.slug);
    out.push(x);
  }
  return out;
}

// "1, 4, 3, 2 amb" (o array de nums) -> ordenado, dedupe: "1-4 amb" si es contiguo,
// si no "1, 2, 4 amb". Preserva el "+" del tope (4+, 5+).
export function ambientesLabel(raw, nums) {
  const src = Array.isArray(nums) && nums.length ? nums : String(raw || "").split(/[,\s]+/);
  const set = [];
  let plus = false;
  for (const x of src) {
    const m = String(x).match(/\d+/);
    if (!m) continue;
    const n = parseInt(m[0], 10);
    if (/\+/.test(String(x))) plus = true;
    if (!set.includes(n)) set.push(n);
  }
  if (!set.length) return String(raw || "").trim();
  set.sort((a, b) => a - b);
  const contiguo = set.length > 2 && set[set.length - 1] - set[0] === set.length - 1;
  const body = contiguo ? `${set[0]}-${set[set.length - 1]}` : set.join(", ");
  return `${body}${plus ? "+" : ""} amb`;
}

// Devuelve el label de entrega LISTO para mostrar (sin duplicar el prefijo "entrega").
// Fecha MM/YYYY o YYYY -> "entrega MM/YYYY". Texto que ya arranca con entrega/inmediata/
// a estrenar -> se muestra tal cual (colapsando "entrega entrega inmediata").
export function entregaLabel(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^\d{1,2}\/\d{4}$/.test(s) || /^\d{4}$/.test(s)) return "entrega " + s;
  if (/^(entrega|inmediat|a estrenar|estrena|listo|terminad)/i.test(s)) {
    return s.replace(/^(entrega\s+)+/i, "entrega ").trim();
  }
  return "entrega " + s;
}

// Card de proyecto normalizada para el front (chat + búsqueda). `entregaLabel` viene
// listo: el front lo muestra tal cual, sin anteponer "entrega ".
export function cardFrom(p) {
  return {
    slug: p.slug,
    nombre: p.nombre,
    barrio: p.barrio || "",
    precioDesde: p.precioDesde || null,
    ambientes: ambientesLabel(p.ambientes, p.ambientesNums),
    entregaLabel: entregaLabel(p.entrega),
    imagen: p.imagen || "",
    url: fichaUrl(p.slug),
  };
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
