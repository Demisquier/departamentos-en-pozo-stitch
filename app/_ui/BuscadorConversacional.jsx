"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// Buscador conversacional: caja de texto + dictado por voz. Filtra el catálogo
// (leído de /catalogo.json) EN VIVO. Sin LLM = gratis. Tolerante a errores de
// ortografía (fuzzy match) y con lógica argentina de ambientes = dormitorios + 1.
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const NUMW = { un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
const STOP = new Set("de del en el la los las un una unos unas y o u con que para por a al su sus mi mis tu busco quiero necesito buscando busca departamento departamentos depto deptos dept ambiente ambientes amb ambient dormitorio dormitorios dorm dormitor habitacion habitaciones hab pozo preventa proyecto proyectos zona zonas barrio barrios hasta desde entre menos mas precio presupuesto dolares dolar usd algo tipo cerca financiacion financiado financiada financian cuotas cuota entrega entregas entregar terminado terminada construccion construida mil miles millon millones mono monoambiente monoamb estudio inmediata listo listos estrenar inversion invertir comprar compra aproximadamente aprox nuevo nueva unidades unidad m2 metro metros barato baratos economico".split(" "));
const STOPARR = [...STOP].filter((s) => s.length >= 4);
const INTENT_PREFIX = ["amb", "dorm", "habitac", "financ", "cuota", "mono", "estudi", "entrega", "termin", "construc", "pozo", "preventa", "invers", "invert", "depart"];
const money = (n) => (n ? "USD " + Number(n).toLocaleString("es-AR") : null);

// Levenshtein acotado + igualdad difusa (tolera 1–2 errores según largo).
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
function interpretar(q, barrioLabels) {
  const qn = norm(q);
  const toks = qn.split(" ").filter(Boolean);
  const f = { amb: [], barrios: [], maxTotal: null, maxM2: null, anio: null, etapa: null, fin: false, text: [] };
  if (/\bmono/.test(qn) || /\bestudi/.test(qn)) f.amb.push(1); // tolera "monoanbiente", "estudioo"
  let m;
  const reAmb = /(\d+)\s*(?:amb|ambient)/g;
  while ((m = reAmb.exec(qn))) f.amb.push(parseInt(m[1], 10));
  const reDorm = /(\d+)\s*(?:dorm|dormitor|habitac|\bhab\b)/g;
  while ((m = reDorm.exec(qn))) f.amb.push(parseInt(m[1], 10) + 1);
  for (const w in NUMW) {
    if (new RegExp("\\b" + w + "\\s*(?:amb|ambient)").test(qn)) f.amb.push(NUMW[w]);
    if (new RegExp("\\b" + w + "\\s*(?:dorm|dormitor|habitac)").test(qn)) f.amb.push(NUMW[w] + 1);
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
  if (/financ|cuota/.test(qn)) f.fin = true;
  // Barrios FUZZY: un barrio matchea si TODAS sus palabras aparecen (exacto/fuzzy/prefijo) en los tokens.
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
  // Texto libre: saca stop, prefijos de intención, barrios (con typos) y números.
  f.text = [...new Set(toks.filter((w) =>
    w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)
    && !consumidoPorBarrio(w)
    && !INTENT_PREFIX.some((p) => w.startsWith(p))
    && !STOPARR.some((s) => fuzzyEq(w, s))
  ))];
  return f;
}

// score >= 0 incluye. Filtros duros excluyen; financiación prioriza; texto libre
// es blando si ya hay filtros estructurales (así un typo no vacía resultados).
function scoreProyecto(p, f) {
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
  if (p.imagen) s += 1;
  if (p.precio_desde_usd) s += 0.4;
  return s;
}

export default function BuscadorConversacional({ initialQuery = "" }) {
  const [q, setQ] = useState(initialQuery);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const [vozMsg, setVozMsg] = useState("");
  const data = useRef(null);
  const barrioLabels = useRef([]);
  const deb = useRef(null);
  const rec = useRef(null);

  const ejemplos = ["2 ambientes en Palermo con financiación", "3 dormitorios en Núñez", "Belgrano hasta USD 200.000 entrega 2026", "Monoambiente en pozo en Caballito"];

  function run(texto, arr) {
    const list = arr || data.current;
    if (!list) return;
    const f = interpretar(texto || "", barrioLabels.current);
    const scored = list.map((p) => [scoreProyecto(p, f), p]).filter((x) => x[0] >= 0).sort((a, b) => b[0] - a[0]);
    setRes({ items: scored.slice(0, 60).map((x) => x[1]), f, total: scored.length });
  }

  useEffect(() => {
    setVoiceOk(typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    (async () => {
      try {
        const r = await fetch("/catalogo.json");
        const j = await r.json();
        const arr = (j && j.proyectos) || [];
        barrioLabels.current = [...new Set(arr.map((p) => norm(p.barrio)).filter(Boolean))];
        data.current = arr;
        run(initialQuery, arr);
      } catch { data.current = []; setRes({ items: [], f: {}, total: 0 }); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(v) {
    setQ(v);
    clearTimeout(deb.current);
    deb.current = setTimeout(() => run(v), 200);
  }

  async function toggleVoz() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVozMsg("Tu navegador no permite dictado. Usá Chrome (fuera de incógnito) o escribí tu búsqueda."); return; }
    if (listening && rec.current) { rec.current.stop(); return; }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const st = await navigator.mediaDevices.getUserMedia({ audio: true });
        st.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setVozMsg("No pudimos acceder al micrófono. Activá el permiso del navegador (o probá fuera de una ventana de incógnito).");
      return;
    }
    const rc = new SR();
    rc.lang = "es-AR"; rc.interimResults = true; rc.continuous = false; rc.maxAlternatives = 1;
    rc.onresult = (e) => { const txt = Array.from(e.results).map((x) => x[0].transcript).join(""); setQ(txt); run(txt); };
    rc.onerror = (e) => {
      setListening(false);
      const map = { "no-speech": "No te escuché. Tocá el micrófono y hablá de nuevo.", "not-allowed": "El micrófono está bloqueado. Activá el permiso en el navegador.", "service-not-allowed": "El dictado no está disponible acá (probá en Chrome, fuera de incógnito).", "audio-capture": "No detectamos ningún micrófono.", network: "Se cortó la conexión del dictado. Probá de nuevo." };
      setVozMsg(map[e.error] || "No pudimos usar el dictado. Escribí tu búsqueda y funciona igual.");
    };
    rc.onend = () => setListening(false);
    rec.current = rc; setVozMsg(""); setListening(true);
    try { rc.start(); } catch { setListening(false); }
  }

  const f = res && res.f ? res.f : {};
  const chips = res ? [
    ...(f.barrios || []).map((b) => "📍 " + b.charAt(0).toUpperCase() + b.slice(1)),
    ...(f.amb || []).map((a) => "🛏 " + a + " amb"),
    f.maxTotal ? "💵 hasta " + money(f.maxTotal) : null,
    f.maxM2 ? "📐 hasta " + money(f.maxM2) + "/m²" : null,
    f.anio ? "📅 entrega " + f.anio : null,
    f.fin ? "💳 prioriza financiación" : null,
    ...(f.text || []).map((t) => "🔎 " + t),
  ].filter(Boolean) : [];

  return (
    <div className="w-full">
      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ej: 2 ambientes en Palermo con financiación… (o tocá el micrófono)"
            aria-label="Buscar en lenguaje natural"
            className="w-full border-2 border-outline-variant focus:border-secondary rounded-xl pl-5 pr-14 py-3.5 text-[16px] bg-surface focus:outline-none"
          />
          {voiceOk && (
            <button type="button" onClick={toggleVoz} aria-label={listening ? "Detener dictado" : "Buscar por voz"}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${listening ? "bg-red-500 text-white animate-pulse" : "text-secondary hover:bg-secondary/10"}`}>
              <span className="material-symbols-outlined text-[22px]">{listening ? "stop" : "mic"}</span>
            </button>
          )}
        </div>
        <button type="submit" className="bg-secondary text-white font-medium px-6 py-3.5 rounded-xl hover:opacity-90 whitespace-nowrap">Buscar</button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-[12px] text-on-surface-variant self-center">Probá:</span>
        {ejemplos.map((e) => (
          <button key={e} onClick={() => { setQ(e); run(e); }} className="text-[12px] border border-outline-variant rounded-full px-3 py-1 text-primary hover:border-secondary">{e}</button>
        ))}
      </div>
      {listening && <p className="text-[13px] text-red-500 mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">graphic_eq</span> Escuchando… hablá ahora</p>}
      {vozMsg && <p className="text-[13px] text-on-surface-variant mt-2 flex items-start gap-1"><span className="material-symbols-outlined text-[16px] text-secondary">info</span> {vozMsg}</p>}

      {loading ? (
        <p className="text-on-surface-variant mt-6">Cargando el catálogo…</p>
      ) : res && (
        <div className="mt-6">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[12px] text-on-surface-variant">Entendí:</span>
              {chips.map((c, i) => <span key={i} className="text-[12px] bg-secondary/10 text-secondary rounded-md px-2.5 py-1">{c}</span>)}
              <button type="button" onClick={() => { setQ(""); run(""); }} className="text-[12px] text-on-surface-variant underline ml-1">limpiar</button>
            </div>
          )}
          <p className="text-[14px] text-on-surface-variant mb-4">{res.total} proyecto{res.total === 1 ? "" : "s"} en pozo{chips.length ? " que matchean" : ""}</p>
          {res.items.length === 0 ? (
            <div className="border border-outline-variant rounded-xl p-8 text-center text-on-surface-variant">
              No encontramos proyectos con esos criterios. Probá con menos condiciones o cambiá el barrio/precio.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {res.items.map((p) => (
                <Link key={p.slug} href={"/desarrollos-inmobiliarios/" + p.slug + "/"} className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative aspect-[4/3] bg-surface-container-high overflow-hidden">
                    {p.imagen ? <img src={p.imagen} alt={p.nombre} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline-variant text-4xl">apartment</span></div>}
                    <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">EN POZO</span>
                    {p.financiacion_en_cuotas && <span className="absolute top-3 right-3 bg-secondary text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">CUOTAS</span>}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-headline-sm text-[16px] text-primary leading-tight">{p.nombre}</h3>
                    {p.barrio && <p className="text-on-surface-variant text-[13px] mt-0.5">{p.barrio}{p.entrega_anio ? " · entrega " + p.entrega_anio : ""}</p>}
                    <div className="mt-3 pt-3 border-t border-outline-variant flex items-end justify-between">
                      <span className="text-primary font-headline-sm text-[15px]">{p.precio_desde_usd ? money(p.precio_desde_usd) : (p.precio_m2_usd ? money(p.precio_m2_usd) + "/m²" : "Consultar")}</span>
                      <span className="text-[12px] text-secondary group-hover:underline">Ver ficha →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
