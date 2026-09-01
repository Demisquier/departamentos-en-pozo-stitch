"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

// Buscador conversacional: caja de texto + dictado por voz. Filtra el catálogo
// (leído de /catalogo.json) EN VIVO mientras escribís o hablás. Sin LLM = gratis.
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const NUMW = { un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
const money = (n) => (n ? "USD " + Number(n).toLocaleString("es-AR") : null);

function parseMonto(txt) {
  const m = txt.match(/(\d[\d.,]*)\s*(millones?|mill?|m|mil|k)?/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  const u = m[2] || "";
  if (/^mill|^m$|millon/.test(u)) n *= 1000000;
  else if (/mil|^k$/.test(u)) n *= 1000;
  return Math.round(n);
}

// LÓGICA ARGENTINA: "ambientes" incluye el living. 1 amb = monoambiente (0 dorm).
// 2 amb = 1 dormitorio; 3 amb = 2 dormitorios. Es decir: ambientes = dormitorios + 1.
function interpretar(q, barrioWords) {
  const qn = norm(q);
  const f = { barrios: [], amb: [], maxTotal: null, maxM2: null, anio: null, etapa: null, fin: false, texto: qn };
  f.barrios = [...barrioWords].filter((w) => w.length > 3 && new RegExp("\\b" + w + "\\b").test(qn));
  // Ambientes (directo)
  if (/\b(mono|monoambiente|estudio)\b/.test(qn)) f.amb.push(1);
  let mm;
  const reAmb = /(\d+)\s*(?:amb|ambient)/g;
  while ((mm = reAmb.exec(qn))) f.amb.push(parseInt(mm[1], 10));
  // Dormitorios / habitaciones -> ambientes = dorm + 1
  const reDorm = /(\d+)\s*(?:dorm|dormitor|habitac|\bhab\b)/g;
  while ((mm = reDorm.exec(qn))) f.amb.push(parseInt(mm[1], 10) + 1);
  for (const w in NUMW) {
    if (new RegExp("\\b" + w + "\\s*(?:amb|ambient)").test(qn)) f.amb.push(NUMW[w]);
    if (new RegExp("\\b" + w + "\\s*(?:dorm|dormitor|habitac)").test(qn)) f.amb.push(NUMW[w] + 1);
  }
  f.amb = [...new Set(f.amb)];
  // Precio
  const mon = qn.match(/(?:usd|u\$s|dolares?|\$)?\s*(\d[\d.,]*)\s*(millones?|mill?|mil|k)?/);
  if (mon) {
    const val = parseMonto(mon[0].replace(/usd|u\$s|dolares?|\$/g, "").trim());
    if (val) {
      const esM2 = /m2|m²|metro/.test(qn) || (val >= 500 && val <= 8000);
      if (esM2) f.maxM2 = val; else if (val >= 20000) f.maxTotal = val;
    }
  }
  const yr = qn.match(/\b(20\d{2})\b/);
  if (yr) f.anio = parseInt(yr[1], 10);
  if (/termin|entrega inmediata|listo/.test(qn)) f.etapa = "Terminado";
  else if (/construc/.test(qn)) f.etapa = "En construcción";
  else if (/\bpozo\b/.test(qn)) f.etapa = "En pozo";
  if (/financ|cuota|en cuotas/.test(qn)) f.fin = true;
  return f;
}

function match(p, f) {
  const pb = norm(p.barrio);
  if (f.barrios.length && !f.barrios.some((w) => new RegExp("\\b" + w + "\\b").test(pb))) return false;
  if (f.amb.length) {
    const t = norm(p.tipologias);
    if (!t) return false;
    const nums = (t.match(/\d\+?/g) || []);
    const ok = f.amb.some((a) => nums.includes(String(a)) || nums.includes(a + "+") || t.includes(String(a)));
    if (!ok) return false;
  }
  if (f.maxTotal && p.precio_desde_usd && p.precio_desde_usd > f.maxTotal) return false;
  if (f.maxM2 && p.precio_m2_usd && p.precio_m2_usd > f.maxM2) return false;
  if (f.anio && p.entrega_anio && p.entrega_anio > f.anio) return false;
  if (f.etapa && p.etapa && norm(p.etapa) !== norm(f.etapa)) return false;
  if (f.fin && !p.financiacion_en_cuotas) return false;
  return true;
}

const rank = (arr) => [...arr].sort((a, b) => (Number(!!b.imagen) - Number(!!a.imagen)) || (Number(!!b.precio_desde_usd) - Number(!!a.precio_desde_usd)));

export default function BuscadorConversacional({ initialQuery = "" }) {
  const [q, setQ] = useState(initialQuery);
  const [res, setRes] = useState(null); // {items, f}
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const data = useRef(null);
  const barrioWords = useRef(new Set());
  const deb = useRef(null);
  const rec = useRef(null);

  const ejemplos = ["2 ambientes en Palermo con financiación", "3 dormitorios en Núñez", "Belgrano hasta USD 200.000 entrega 2026", "Monoambiente en pozo en Caballito"];

  function run(texto, arr) {
    const list = arr || data.current;
    if (!list) return;
    const f = interpretar(texto || "", barrioWords.current);
    const items = rank(list.filter((p) => match(p, f))).slice(0, 60);
    setRes({ items, f, total: list.filter((p) => match(p, f)).length });
  }

  useEffect(() => {
    setVoiceOk(typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    (async () => {
      try {
        const r = await fetch("/catalogo.json");
        const j = await r.json();
        const arr = (j && j.proyectos) || [];
        arr.forEach((p) => norm(p.barrio).split(/\s+/).forEach((w) => { if (w.length > 3) barrioWords.current.add(w); }));
        data.current = arr;
        run(initialQuery, arr); // por default muestra TODO (query vacía)
      } catch { data.current = []; setRes({ items: [], f: {}, total: 0 }); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(v) {
    setQ(v);
    clearTimeout(deb.current);
    deb.current = setTimeout(() => run(v), 250);
  }

  function toggleVoz() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening && rec.current) { rec.current.stop(); return; }
    const r = new SR();
    r.lang = "es-AR"; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => { const txt = Array.from(e.results).map((x) => x[0].transcript).join(""); setQ(txt); run(txt); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    rec.current = r; setListening(true);
    try { r.start(); } catch { setListening(false); }
  }

  const f = res && res.f ? res.f : {};
  const chips = res ? [
    ...(f.barrios || []).map((b) => "📍 " + b.charAt(0).toUpperCase() + b.slice(1)),
    ...(f.amb || []).map((a) => "🛏 " + a + " amb"),
    f.maxTotal ? "💵 hasta " + money(f.maxTotal) : null,
    f.maxM2 ? "📐 hasta " + money(f.maxM2) + "/m²" : null,
    f.anio ? "📅 entrega " + f.anio : null,
    f.etapa ? "🏗 " + f.etapa : null,
    f.fin ? "💳 con financiación" : null,
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
