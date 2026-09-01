"use client";
import { useState, useRef } from "react";
import Link from "next/link";

// Buscador conversacional: interpreta una frase en lenguaje natural y filtra el
// catálogo (leído de /catalogo.json en el cliente). Sin LLM en runtime = gratis.
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const NUMW = { un: 1, uno: 1, mono: 1, monoambiente: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
const money = (n) => (n ? "USD " + Number(n).toLocaleString("es-AR") : null);

// Parsea "150.000", "150 mil", "150k", "1,5 millones" -> número
function parseMonto(txt) {
  const m = txt.match(/(\d[\d.,]*)\s*(millones?|mill?|m|mil|k)?/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  const u = m[2] || "";
  if (/^mill|^m$|millon/.test(u)) n *= 1000000;
  else if (/mil|^k$/.test(u)) n *= 1000;
  return Math.round(n);
}

function interpretar(q, barrioWords) {
  const qn = norm(q);
  const f = { barrios: [], amb: [], maxTotal: null, maxM2: null, anio: null, etapa: null, fin: false, texto: qn };
  // Barrios (palabras de barrio presentes en la frase)
  f.barrios = [...barrioWords].filter((w) => w.length > 3 && new RegExp("\\b" + w + "\\b").test(qn));
  // Ambientes
  const mono = /\b(mono|monoambiente|estudio)\b/.test(qn);
  if (mono) f.amb.push(1);
  let mm; const re = /(\d+)\s*(?:amb|ambient|dorm)/g;
  while ((mm = re.exec(qn))) f.amb.push(parseInt(mm[1], 10));
  for (const w in NUMW) if (new RegExp("\\b" + w + "\\s*(?:amb|ambient|dorm)").test(qn)) f.amb.push(NUMW[w]);
  f.amb = [...new Set(f.amb)];
  // Precio (primer monto)
  const mon = qn.match(/(?:usd|u\$s|dolares?|\$)?\s*(\d[\d.,]*)\s*(millones?|mill?|mil|k)?/);
  if (mon) {
    const val = parseMonto(mon[0].replace(/usd|u\$s|dolares?|\$/g, "").trim());
    if (val) {
      const esM2 = /m2|m²|metro/.test(qn) || (val >= 500 && val <= 8000);
      if (esM2) f.maxM2 = val; else if (val >= 20000) f.maxTotal = val;
    }
  }
  // Entrega / etapa
  const yr = qn.match(/\b(20\d{2})\b/);
  if (yr) f.anio = parseInt(yr[1], 10);
  if (/termin|entrega inmediata|listo/.test(qn)) f.etapa = "Terminado";
  else if (/construc/.test(qn)) f.etapa = "En construcción";
  else if (/\bpozo\b/.test(qn)) f.etapa = "En pozo";
  // Financiación
  if (/financ|cuota|en cuotas/.test(qn)) f.fin = true;
  return f;
}

function match(p, f) {
  const pb = norm(p.barrio);
  if (f.barrios.length && !f.barrios.some((w) => new RegExp("\\b" + w + "\\b").test(pb))) return false;
  if (f.amb.length) {
    const t = norm(p.tipologias);
    const nums = (t.match(/\d\+?/g) || []);
    const ok = f.amb.some((a) => nums.includes(String(a)) || nums.includes(a + "+") || t.includes(String(a)));
    if (!ok && t) return false;
    if (!t) return false;
  }
  if (f.maxTotal && p.precio_desde_usd && p.precio_desde_usd > f.maxTotal) return false;
  if (f.maxM2 && p.precio_m2_usd && p.precio_m2_usd > f.maxM2) return false;
  if (f.anio && p.entrega_anio && p.entrega_anio > f.anio) return false;
  if (f.etapa && p.etapa && norm(p.etapa) !== norm(f.etapa)) return false;
  if (f.fin && !p.financiacion_en_cuotas) return false;
  // Si no se detectó ningún filtro estructurado, busca texto libre
  const nadaEstructurado = !f.barrios.length && !f.amb.length && !f.maxTotal && !f.maxM2 && !f.anio && !f.etapa && !f.fin;
  if (nadaEstructurado) {
    const hay = norm(p.nombre + " " + p.barrio + " " + p.desarrolladora);
    return f.texto.split(/\s+/).filter((w) => w.length > 3).every((w) => hay.includes(w));
  }
  return true;
}

export default function BuscadorConversacional() {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null); // {items, f}
  const cache = useRef(null);
  const barrioWords = useRef(new Set());

  const ejemplos = [
    "2 ambientes en Palermo con financiación",
    "Belgrano hasta USD 200.000 entrega 2026",
    "Monoambiente en pozo en Caballito",
    "3 ambientes en Núñez con cuotas",
  ];

  async function cargar() {
    if (cache.current) return cache.current;
    setLoading(true);
    try {
      const r = await fetch("/catalogo.json");
      const j = await r.json();
      const arr = (j && j.proyectos) || [];
      arr.forEach((p) => norm(p.barrio).split(/\s+/).forEach((w) => { if (w.length > 3) barrioWords.current.add(w); }));
      cache.current = arr; setData(arr);
      return arr;
    } finally { setLoading(false); }
  }

  async function buscar(texto) {
    const query = (texto != null ? texto : q).trim();
    setQ(query);
    if (!query) { setRes(null); return; }
    const arr = await cargar();
    const f = interpretar(query, barrioWords.current);
    const items = arr.filter((p) => match(p, f))
      .sort((a, b) => (Number(!!b.imagen) - Number(!!a.imagen)) || (Number(!!b.precio_desde_usd) - Number(!!a.precio_desde_usd)))
      .slice(0, 30);
    setRes({ items, f });
  }

  const chips = res ? [
    ...res.f.barrios.map((b) => "📍 " + b.charAt(0).toUpperCase() + b.slice(1)),
    ...res.f.amb.map((a) => "🛏 " + a + " amb"),
    res.f.maxTotal ? "💵 hasta " + money(res.f.maxTotal) : null,
    res.f.maxM2 ? "📐 hasta " + money(res.f.maxM2) + "/m²" : null,
    res.f.anio ? "📅 entrega " + res.f.anio : null,
    res.f.etapa ? "🏗 " + res.f.etapa : null,
    res.f.fin ? "💳 con financiación" : null,
  ].filter(Boolean) : [];

  return (
    <div className="w-full">
      <form onSubmit={(e) => { e.preventDefault(); buscar(); }} className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej: 2 ambientes en Palermo con financiación, entrega 2026, hasta USD 200.000"
          aria-label="Buscar en lenguaje natural"
          className="w-full border-2 border-outline-variant focus:border-secondary rounded-xl pl-5 pr-28 py-4 text-[16px] bg-surface focus:outline-none"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-secondary text-white font-medium px-5 py-2.5 rounded-lg hover:opacity-90">
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-[12px] text-on-surface-variant self-center">Probá:</span>
        {ejemplos.map((e) => (
          <button key={e} onClick={() => buscar(e)} className="text-[12px] border border-outline-variant rounded-full px-3 py-1 text-primary hover:border-secondary">
            {e}
          </button>
        ))}
      </div>

      {loading && <p className="text-on-surface-variant mt-6">Buscando en el catálogo…</p>}

      {res && (
        <div className="mt-6">
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[12px] text-on-surface-variant">Entendí:</span>
              {chips.map((c, i) => <span key={i} className="text-[12px] bg-secondary/10 text-secondary rounded-md px-2.5 py-1">{c}</span>)}
            </div>
          )}
          <p className="text-[14px] text-on-surface-variant mb-4">{res.items.length} proyecto{res.items.length === 1 ? "" : "s"} en pozo que matchean</p>
          {res.items.length === 0 ? (
            <div className="border border-outline-variant rounded-xl p-8 text-center text-on-surface-variant">
              No encontramos proyectos con esos criterios. Probá con menos condiciones o cambiá el barrio/precio.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {res.items.map((p) => (
                <Link key={p.slug} href={"/desarrollos-inmobiliarios/" + p.slug + "/"} className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative aspect-[4/3] bg-surface-container-high overflow-hidden">
                    {p.imagen ? <img src={p.imagen} alt={p.nombre} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline-variant text-4xl">apartment</span></div>}
                    <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">EN POZO</span>
                    {p.financiacion_en_cuotas && <span className="absolute top-3 right-3 bg-secondary text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">CUOTAS</span>}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-headline-sm text-[16px] text-primary leading-tight">{p.nombre}</h3>
                    {p.barrio && <p className="text-on-surface-variant text-[13px] mt-0.5">{p.barrio}{p.entrega_anio ? " · entrega " + p.entrega_anio : ""}</p>}
                    <div className="mt-3 pt-3 border-t border-outline-variant flex items-end justify-between">
                      <span className="text-primary font-headline-sm text-[15px]">
                        {p.precio_desde_usd ? money(p.precio_desde_usd) : (p.precio_m2_usd ? money(p.precio_m2_usd) + "/m²" : "Consultar")}
                      </span>
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
