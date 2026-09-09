"use client";
// app/explorar/ExplorarConversacional.jsx — Modo CONVERSAR (tipo Roomix): búsqueda 100%
// conversacional a pantalla completa. Panel IZQ = charla con la IA; panel DER = resultados
// que se actualizan a medida que la conversación refina. Mobile: toggle Conversar/Resultados.
// Usa /api/chat (reply + sugeridos; las cards salen del catálogo = 0 tokens de LLM). Si no
// hay match, la IA orienta y el panel ofrece aflojar criterios. Sin IA/crédito degrada a un
// CTA al buscador con filtros (plan B). Es el "modo distinto" al portal clásico (/buscar).
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { track } from "../../lib/track";

const HOLA = "¡Hola! Soy tu buscador conversacional. Contame en una frase qué estás buscando — barrio o zona, ambientes, presupuesto, si es para vivir o invertir — y te armo una lista de proyectos en pozo. Te aviso también qué mirar: avance de obra, fideicomiso, entrega.";
const EJEMPLOS = ["2 ambientes en Palermo para invertir, hasta USD 200.000", "Lo más barato con financiación en cuotas", "Monoambiente cerca del subte, entrega 2026", "3 ambientes en Núñez o Belgrano para vivir"];
const FOLLOWUPS = ["Más barato", "Otra zona", "Con más financiación", "Entrega más cercana", "Comparar los 2 primeros"];
const RELAX = ["Ampliar la zona", "Subir el presupuesto", "Sacar un requisito"];

export default function ExplorarConversacional() {
  const [ready, setReady] = useState(null); // null=cargando · false=off · true=on
  const [msgs, setMsgs] = useState([{ role: "assistant", content: HOLA }]);
  const [results, setResults] = useState([]);
  const [verMas, setVerMas] = useState("/buscar/");
  const [noMatch, setNoMatch] = useState(false);
  const [txt, setTxt] = useState("");
  const [sending, setSending] = useState(false);
  const [pane, setPane] = useState("chat"); // mobile: "chat" | "res"
  const [lead, setLead] = useState({ nombre: "", whatsapp: "" });
  const [leadSent, setLeadSent] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const scrollRef = useRef(null);
  const ranSeed = useRef(false);

  const gotReply = msgs.filter((m) => m.role === "assistant").length > 1;
  const chatVacio = !msgs.some((m) => m.role === "user");

  useEffect(() => {
    let ok = true;
    fetch("/api/chat").then((r) => r.json()).then((d) => {
      if (!ok) return;
      const on = !!d?.ready;
      setReady(on);
      // Handoff desde el home ("Conversando") o desde una ficha: #q= o sessionStorage → auto-consulta.
      if (on && !ranSeed.current) {
        ranSeed.current = true;
        let q0 = "";
        try {
          const ss = sessionStorage.getItem("dpp_iaq");
          if (ss) sessionStorage.removeItem("dpp_iaq");
          const hm = (window.location.hash || "").match(/[#&]q=([^&]*)/);
          q0 = (ss || (hm ? decodeURIComponent(hm[1].replace(/\+/g, " ")) : "")).trim();
        } catch {}
        if (q0) sendText(q0);
      }
    }).catch(() => { if (ok) setReady(false); });
    return () => { ok = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, sending]);

  async function sendText(raw) {
    const val = (raw || "").trim();
    if (!val || sending) return;
    const next = [...msgs, { role: "user", content: val }];
    setMsgs(next); setTxt(""); setSending(true); setLastQuery(val);
    track("explorar_msg", {});
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "assistant", content: d?.reply || "Disculpá, no pude responder. Probá reformular en una frase." }]);
      const sug = Array.isArray(d?.sugeridos) ? d.sugeridos : [];
      if (sug.length) { setResults(sug); setNoMatch(false); setPane("res"); }
      else { setNoMatch(true); }
      if (typeof d?.verMas === "string") setVerMas(d.verMas);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Se cortó la conexión. Probá de nuevo en un momento." }]);
    } finally {
      setSending(false);
    }
  }

  function enviar(e) { e.preventDefault(); sendText(txt); }

  async function enviarLead(e) {
    e.preventDefault();
    const nombre = lead.nombre.trim();
    const whatsapp = lead.whatsapp.trim();
    if ((whatsapp.match(/\d/g) || []).length < 6) return;
    const proy = results[0]?.nombre || "";
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mail: { _subject: "Nuevo lead (Explorar IA)", _template: "table", _captcha: "false", Nombre: nombre || "—", WhatsApp: whatsapp, "Proyecto de interés": proy || "—", Origen: "Explorar IA" },
          sheet: { origen: "explorar-ia", tipo: "chat", nombre, email: "", whatsapp, proyecto: proy, proyectoSlug: results[0]?.slug || "" },
        }),
      });
      track("lead", { tipo: "chat", origen: "explorar-ia", proyecto: proy });
    } catch {}
    setLeadSent(true);
  }

  if (ready === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-secondary text-[30px]">progress_activity</span>
      </div>
    );
  }

  if (ready === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-4 p-8">
        <span className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span className="material-symbols-outlined text-[28px]">forum</span></span>
        <div>
          <h2 className="text-headline-sm font-headline-md text-primary mb-2">Modo conversar en pausa</h2>
          <p className="text-on-surface-variant text-body-md max-w-sm">Por ahora buscá con filtros: elegí barrio, precio y ambientes y compará proyectos en pozo.</p>
        </div>
        <Link href="/buscar/" className="inline-flex items-center gap-2 rounded bg-secondary text-white px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition"><span className="material-symbols-outlined text-[18px]">tune</span> Buscar con filtros</Link>
      </div>
    );
  }

  const Card = (s) => (
    <Link key={s.slug} href={`/desarrollos-inmobiliarios/${s.slug}/`} className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-secondary hover:shadow-lg transition-all">
      <div className="relative aspect-[4/3] bg-surface-container-high overflow-hidden">
        {s.imagen ? (
          <img src={s.imagen} alt={s.nombre} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary"><span className="material-symbols-outlined text-3xl">apartment</span></div>
        )}
        <span className="absolute top-2 left-2 bg-primary/90 text-white px-2 py-0.5 rounded text-[9px] font-label-caps tracking-widest">EN POZO</span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-headline-sm text-[14.5px] text-primary leading-tight line-clamp-2">{s.nombre}</h3>
        {s.barrio && <p className="text-on-surface-variant text-[12px] mt-0.5">{s.barrio}</p>}
        {(s.ambientes || s.entregaLabel) && <p className="text-[10.5px] text-on-surface-variant mt-0.5 truncate">{[s.ambientes, s.entregaLabel].filter(Boolean).join(" · ")}</p>}
        <div className="mt-auto pt-2.5 border-t border-outline-variant flex items-end justify-between">
          <span className="text-primary font-headline-sm text-[14px]">{s.precioDesde ? `USD ${Number(s.precioDesde).toLocaleString("es-AR")}` : "Consultar"}</span>
          <span className="text-[11.5px] text-secondary group-hover:underline">Ver ficha →</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="h-full flex flex-col">
      {/* ModeToggleConversar: cambia a Filtros llevando la última consulta (lastQuery) a /buscar. */}
      <div className="shrink-0 flex items-center gap-1 rounded-full bg-surface-container p-1 w-full max-w-xs mb-3">
        <button type="button" onClick={() => { const t = (lastQuery || "").trim(); try { if (t) sessionStorage.setItem("dpp_iaq", t); } catch {} window.location.assign("/buscar/" + (t ? "#q=" + encodeURIComponent(t) : "")); }} className="flex-1 px-3 py-1.5 rounded-full text-[13px] font-semibold text-on-surface-variant hover:text-secondary inline-flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[15px]">tune</span> Filtros y lista</button>
        <span className="flex-1 text-center px-3 py-1.5 rounded-full text-[13px] font-semibold bg-secondary text-white inline-flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[15px]">forum</span> Conversar</span>
      </div>
      {/* Toggle mobile Conversar / Resultados */}
      <div className="lg:hidden shrink-0 flex items-center gap-1 p-1 bg-surface-container rounded-full mb-3 w-full max-w-sm mx-auto">
        <button type="button" onClick={() => setPane("chat")} aria-selected={pane === "chat"} className={`flex-1 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${pane === "chat" ? "bg-secondary text-white" : "text-on-surface-variant"}`}>Conversar</button>
        <button type="button" onClick={() => setPane("res")} aria-selected={pane === "res"} className={`flex-1 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${pane === "res" ? "bg-secondary text-white" : "text-on-surface-variant"}`}>Resultados{results.length ? ` (${results.length})` : ""}</button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,42%)_minmax(0,58%)] gap-4">
        {/* PANEL CHAT */}
        <div className={`${pane === "chat" ? "flex" : "hidden"} lg:flex flex-col min-h-0 bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm`}>
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
            <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">auto_awesome</span></span>
            <div className="leading-tight">
              <div className="text-[14px] font-medium text-primary">Buscador conversacional</div>
              <div className="text-[12px] text-secondary">Análisis independiente · beta</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-2.5">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[88%] ${m.role === "user" ? "self-end" : "self-start"}`}>
                <div className={`text-[14px] leading-relaxed px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap ${m.role === "user" ? "bg-primary-container text-on-primary rounded-br-md" : "bg-surface-container-low text-on-surface border border-outline-variant rounded-bl-md"}`}>{m.content}</div>
              </div>
            ))}
            {chatVacio && !sending && (
              <div className="self-start w-full mt-1 flex flex-wrap gap-2">
                {EJEMPLOS.map((qp) => (
                  <button key={qp} type="button" onClick={() => sendText(qp)} className="text-[13px] border border-outline-variant rounded-full px-3 py-1.5 text-primary bg-surface hover:border-secondary hover:text-secondary transition text-left">{qp}</button>
                ))}
              </div>
            )}
            {gotReply && !sending && (
              <div className="self-start w-full mt-0.5 flex flex-wrap gap-2">
                {FOLLOWUPS.map((fu) => (
                  <button key={fu} type="button" onClick={() => sendText(fu)} className="text-[12.5px] border border-outline-variant rounded-full px-3 py-1 text-on-surface-variant bg-surface hover:border-secondary hover:text-secondary transition">{fu}</button>
                ))}
              </div>
            )}
            {sending && (
              <div className="max-w-[85%] self-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-surface-container-low border border-outline-variant text-secondary">
                  <span className="typing-dots"><span></span><span></span><span></span></span>
                </div>
              </div>
            )}
          </div>

          {gotReply && (!leadSent ? (
            <form onSubmit={enviarLead} className="shrink-0 border-t border-outline-variant bg-surface-container-low px-3 py-2.5 flex items-center gap-2">
              <input value={lead.nombre} onChange={(e) => setLead((l) => ({ ...l, nombre: e.target.value }))} placeholder="Nombre" autoComplete="given-name" className="w-24 shrink-0 px-3 py-2 rounded-full border border-outline-variant bg-surface text-[13px] outline-none focus:border-secondary" />
              <input value={lead.whatsapp} onChange={(e) => setLead((l) => ({ ...l, whatsapp: e.target.value }))} placeholder="WhatsApp con característica" inputMode="tel" autoComplete="tel" className="flex-1 px-3 py-2 rounded-full border border-outline-variant bg-surface text-[13px] outline-none focus:border-secondary" />
              <button type="submit" className="shrink-0 rounded-full bg-secondary text-white px-3.5 py-2 text-[12px] font-medium hover:opacity-90 transition">Que me contacten</button>
            </form>
          ) : (
            <div className="shrink-0 border-t border-outline-variant bg-surface-container-low px-3 py-2.5 text-[12.5px] text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span> ¡Listo! Un asesor te va a escribir por WhatsApp.
            </div>
          ))}

          <form onSubmit={enviar} className="shrink-0 border-t border-outline-variant bg-surface p-3">
            <div className="flex items-center gap-2">
              <input value={txt} onChange={(e) => setTxt(e.target.value)} disabled={sending} placeholder="Describí lo que buscás…" className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={sending || !txt.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
              </button>
            </div>
          </form>
        </div>

        {/* PANEL RESULTADOS */}
        <div className={`${pane === "res" ? "flex" : "hidden"} lg:flex flex-col min-h-0 bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden`}>
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface">
            <div className="text-[14px] font-medium text-primary">{results.length ? `${results.length} proyectos sugeridos` : "Resultados"}</div>
            <Link href={verMas} className="text-[12.5px] text-secondary hover:text-primary font-medium inline-flex items-center gap-1">Ver todo con filtros <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
                <span className="material-symbols-outlined text-outline-variant text-4xl">{noMatch ? "search_off" : "forum"}</span>
                <p className="text-on-surface-variant text-[13.5px] max-w-xs">{noMatch ? "No encontré un match exacto. Probá aflojar un criterio:" : "Contame qué buscás y acá van a aparecer los proyectos que mejor encajan."}</p>
                {noMatch && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {RELAX.map((rx) => (
                      <button key={rx} type="button" onClick={() => sendText(rx)} className="text-[12.5px] border border-outline-variant rounded-full px-3 py-1 text-secondary bg-surface hover:border-secondary transition">{rx}</button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((s) => Card(s))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
