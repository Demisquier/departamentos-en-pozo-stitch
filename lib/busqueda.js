// lib/busqueda.js — Motor de búsqueda inteligente compartido (single source of truth).
// Lo usa BuscadorConversacional (listado + home handoff). Sin LLM = gratis.
// Interpreta lenguaje natural (barrio, ambientes, precio, entrega, financiación),
// tolera errores de ortografía (fuzzy) y aplica sinónimos AR. Lógica argentina:
// ambientes = dormitorios + 1.

export const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const NUMW = { un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };

// Sinónimos AR: normalizamos variantes coloquiales/abreviadas a una forma canónica
// ANTES de tokenizar. "dpto 2 amb en madero" == "departamento 2 ambientes en puerto madero".
const SINONIMOS = [
  [/\bdptos?\b/g, "departamento"],
  [/\bdeptos?\b/g, "departamento"],
  [/\bdtos?\b/g, "departamento"],
  [/\bdepto\b/g, "departamento"],
  [/\bunidades?\b/g, "departamento"],
  [/\bmonoamb\b/g, "monoambiente"],
  [/\bmono\s+ambiente\b/g, "monoambiente"],
  [/\bamb\b/g, "ambientes"],
  [/\bdorm\b/g, "dormitorios"],
  [/\bhab\b/g, "dormitorios"],
  [/\bhabitacion(es)?\b/g, "dormitorios"],
  [/\bgarage\b/g, "cochera"],
  [/\bgaraje\b/g, "cochera"],
  [/\bpiscina\b/g, "pileta"],
  [/\bgym\b/g, "gimnasio"],
  [/\bcuotas?\b/g, "financiacion"],
  [/\bfinanciad[oa]\b/g, "financiacion"],
  [/\ben\s+pozo\b/g, "pozo"],
  [/\bmadero\b/g, "puerto madero"],
  [/\bcolegial\b/g, "colegiales"],
  [/\bpalermo\s+soho\b/g, "palermo"],
  [/\bpalermo\s+hollywood\b/g, "palermo"],
  [/\bbotanico\b/g, "palermo"],
];

export const aplicarSinonimos = (qn) => {
  let out = qn;
  for (const [re, rep] of SINONIMOS) out = out.replace(re, rep);
  return out.replace(/\s+/g, " ").trim();
};

// Palabras de relleno o de features que el dato NO tiene (pileta, cochera, etc.):
// van a STOP para que no vacíen los resultados como texto-libre sin match.
const STOP = new Set(
  "de del en el la los las un una unos unas y o u con que para por a al su sus mi mis tu busco quiero necesito buscando busca departamento departamentos depto deptos dept ambiente ambientes amb ambient dormitorio dormitorios dorm dormitor habitacion habitaciones hab pozo preventa proyecto proyectos zona zonas barrio barrios hasta desde entre menos mas precio presupuesto dolares dolar usd algo tipo cerca financiacion financiado financiada financian cuotas cuota entrega entregas entregar terminado terminada construccion construida mil miles millon millones mono monoambiente monoamb estudio inmediata listo listos estrenar inversion invertir comprar compra aproximadamente aprox nuevo nueva unidades unidad m2 metro metros barato baratos economico cochera cocheras pileta piscina gimnasio gym parrilla sum solarium amenities amenity balcon balcones terraza terrazas laundry seguridad luminoso apto credito profesional".split(
    " "
  )
);
const STOPARR = [...STOP].filter((s) => s.length >= 4);
const INTENT_PREFIX = ["amb", "dorm", "habitac", "financ", "cuota", "mono", "estudi", "entrega", "termin", "construc", "pozo", "preventa", "invers", "invert", "depart"];

export const money = (n) => (n ? "USD " + Number(n).toLocaleString("es-AR") : null);

function lev(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 9;
  const dp = [];
  for (let i = 0; i <= m; i++) { dp[i] = [i]; for (let j = 1; j <= n; j++) dp[i][j] = i === 0 ? j : 0; }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}
const fuzzyEq = (a, b) => { if (a === b) return true; const L = Math.max(a.length, b.length); if (L <= 4) return a === b; return lev(a, b) <= (L <= 7 ? 1 : 2); };

// LÓGICA ARGENTINA: ambientes = dormitorios + 1. mono/estudio = 1 amb.
export function interpretar(q, barrioLabels) {
  const qn = aplicarSinonimos(norm(q));
  const toks = qn.split(" ").filter(Boolean);
  const f = { amb: [], barrios: [], maxTotal: null, maxM2: null, anio: null, etapa: null, fin: false, text: [] };
  if (/\bmonoambiente\b/.test(qn) || /\bestudi/.test(qn)) f.amb.push(1);
  let m;
  const reAmb = /(\d+)\s*(?:ambientes?)/g;
  while ((m = reAmb.exec(qn))) f.amb.push(parseInt(m[1], 10));
  const reDorm = /(\d+)\s*(?:dormitorios?)/g;
  while ((m = reDorm.exec(qn))) f.amb.push(parseInt(m[1], 10) + 1);
  for (const w in NUMW) {
    if (new RegExp("\\b" + w + "\\s*ambientes?").test(qn)) f.amb.push(NUMW[w]);
    if (new RegExp("\\b" + w + "\\s*dormitorios?").test(qn)) f.amb.push(NUMW[w] + 1);
  }
  f.amb = [...new Set(f.amb)];
  const pm = qn.match(/(\d[\d.]*)\s*(millones?|mill?|mil|k|m)?/g) || [];
  for (const seg of pm) {
    const mm = seg.match(/(\d[\d.]*)\s*(millones?|mill?|mil|k|m)?/);
    if (!mm) continue;
    const raw = mm[1].replace(/\./g, "");
    if (/^20\d{2}$/.test(raw) && !mm[2]) continue;
    let n = parseFloat(raw);
    const u = mm[2] || "";
    if (/millon|^m$|^mill/.test(u)) n *= 1000000;
    else if (/mil|^k$/.test(u)) n *= 1000;
    n = Math.round(n);
    if (/m2|metro|el m/.test(qn) && n >= 500 && n <= 20000) f.maxM2 = n;
    else if (n >= 20000) f.maxTotal = n;
  }
  const yr = qn.match(/\b(20\d{2})\b/);
  if (yr) f.anio = parseInt(yr[1], 10);
  if (/termin|entrega inmediata|listo|a estrenar/.test(qn)) f.etapa = "terminado";
  else if (/construc/.test(qn)) f.etapa = "construccion";
  else if (/\bpozo\b/.test(qn)) f.etapa = "pozo";
  if (/financ/.test(qn)) f.fin = true;
  const barrioWords = new Set();
  for (const b of barrioLabels) {
    const words = b.split(" ").filter((w) => w.length >= 4);
    if (!words.length) continue;
    const ok = words.every((w) => toks.some((t) => t === w || fuzzyEq(t, w) || (t.length >= w.length && t.startsWith(w))));
    if (ok) { f.barrios.push(b); words.forEach((w) => barrioWords.add(w)); }
  }
  f.barrios = [...new Set(f.barrios)];
  const bw = [...barrioWords];
  const consumidoPorBarrio = (t) => bw.some((w) => t === w || fuzzyEq(t, w) || (t.length >= w.length && t.startsWith(w)));
  f.text = [...new Set(toks.filter((w) =>
    w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)
    && !consumidoPorBarrio(w)
    && !INTENT_PREFIX.some((p) => w.startsWith(p))
    && !STOPARR.some((s) => fuzzyEq(w, s))
  ))];
  return f;
}

export function scoreProyecto(p, f) {
  const barrio = norm(p.barrio);
  const tipo = norm(p.tipologias);
  const hay = [norm(p.nombre), barrio, norm(p.desarrolladora), norm(p.direccion), tipo].join(" ");
  const structural = f.barrios.length || f.amb.length || f.maxTotal || f.maxM2 || f.anio;
  let s = 0;
  if (f.barrios.length) { if (!f.barrios.some((b) => barrio.includes(b))) return -1; s += 6; }
  if (f.amb.length) {
    const nums = (tipo.match(/\d+/g) || []).map(Number);
    if (nums.length) { if (!f.amb.some((a) => nums.includes(a))) return -1; s += 4; } else s -= 0.5;
  }
  if (f.maxTotal) { if (p.precio_desde_usd) { if (p.precio_desde_usd > f.maxTotal) return -1; s += 3; } else s -= 1; }
  if (f.maxM2 && p.precio_m2_usd) { if (p.precio_m2_usd > f.maxM2) return -1; s += 2; }
  if (f.anio && p.entrega_anio) { if (p.entrega_anio > f.anio) return -1; s += 1; }
  if (f.fin && p.financiacion_en_cuotas) s += 4;
  if (f.text.length) {
    const hw = hay.split(" ");
    let hits = 0;
    for (const t of f.text) { if (hay.includes(t) || hw.some((w) => fuzzyEq(w, t))) hits++; }
    if (hits === 0 && !structural) return -2;
    s += hits * 5;
  }
  // Ranking por completitud de la ficha (más señales = más chance de convertir).
  if (p.imagen) s += 1;
  if (p.precio_desde_usd) s += 0.5;
  else if (p.precio_m2_usd) s += 0.2;
  if (p.financiacion_en_cuotas) s += 0.2;
  if (p.lat != null) s += 0.1;
  return s;
}

// Ejecuta la búsqueda completa y devuelve items ordenados por relevancia.
export function buscar(lista, texto, barrioLabels) {
  const f = interpretar(texto || "", barrioLabels || []);
  const scored = lista
    .map((p) => [scoreProyecto(p, f), p])
    .filter((x) => x[0] >= 0)
    .sort((a, b) => b[0] - a[0] || (Number(!!b[1].imagen) - Number(!!a[1].imagen)));
  return { f, total: scored.length, items: scored.map((x) => x[1]) };
}
