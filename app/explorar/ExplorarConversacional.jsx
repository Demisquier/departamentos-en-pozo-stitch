"use client";
// app/explorar/ExplorarConversacional.jsx — Modo CONVERSAR (tipo Roomix): búsqueda 100%
// conversacional a pantalla completa. Panel IZQ = charla con Valentina; panel DER = LISTA
// vertical de resultados. Click en un resultado → DRAWER lateral (fetch /api/proyecto/{slug})
// SIN salir del chat (la conversación se conserva). Mobile: toggle Conversar/Resultados +
// bottom-sheet. Captura de lead PROGRESIVA (un dato por vez, arranca por lo que falta) que
// escribe el PERFIL ÚNICO (dpp_perfil_v1, mismo que Mi Plan): si ya te conocemos, no
// re-preguntamos y te saludamos por tu nombre. Sin IA/crédito degrada a CTA /buscar (plan B).
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { track } from "../../lib/track";
import { readPerfil, writePerfil, enviarLead, primerNombre, wppValido } from "../../lib/perfil";

const HOLA = "¡Hola! Soy Valentina. Decime zona, presupuesto y ambientes (o lo que busques) y te armo la lista de proyectos en pozo.";
const EJEMPLOS = ["2 ambientes en Palermo para invertir, hasta USD 200.000", "Lo más barato con financiación en cuotas", "Monoambiente cerca del subte, entrega 2026", "3 ambientes en Núñez o Belgrano para vivir"];
const FOLLOWUPS = ["Más barato", "Otra zona", "Con más financiación", "Entrega más cercana", "Comparar los 2 primeros"];
const RELAX = ["Ampliar la zona", "Subir el presupuesto", "Sacar un requisito"];

const precioLabel = (s) => (s.precioDesde ? `USD ${Number(s.precioDesde).toLocaleString("es-AR")}` : "Consultar");

export default function ExplorarConversacional() {
  const [ready, setReady] = useState(null); // null=cargando · false=off · true=on
  const [perfil, setPerfil] = useState({});
  const [msgs, setMsgs] = useState([{ role: "assistant", content: HOLA }]);
  const [results, setResults] = useState([]);
  const [verMas, setVerMas] = useState("/buscar/");
  const [noMatch, setNoMatch] = useState(false);
  const [txt, setTxt] = useState("");
  const [sending, setSending] = useState(false);
  const [pane, setPane] = useState("chat"); // mobile: "chat" | "res"
  const [detalle, setDetalle] = useState(null); // { slug, nombre } → abre drawer, NO nueva pestaña
  // Lead progresivo: paso "nombre" → "whatsapp" → "done". Arranca en el 1er dato que falta.
  const [leadPaso, setLeadPaso] = useState("nombre");
  const [leadVal, setLeadVal] = useState("");
  const [leadSent, setLeadSent] = useState(false);
  const scrollRef = useRef(null);
  const ranSeed = useRef(false);

  const gotReply = msgs.filter((m) => m.role === "assistant").length > 1;
  const chatVacio = !msgs.some((m) => m.role === "user");

  useEffect(() => {
    // Perfil unificado: pre-cargamos lo que ya sabemos del usuario (Mi Plan / chats previos).
    const p = readPerfil();
    setPerfil(p);
    if (wppValido(p.whatsapp)) { setLeadSent(true); setLeadPaso("done"); }
    else if (primerNombre(p.nombre)) setLeadPaso("whatsapp");
    else setLeadPaso("nombre");
    // Saludo personalizado si ya te conocemos.
    const nom = primerNombre(p.nombre);
    if (nom) setMsgs([{ role: "assistant", content: `¡Hola de nuevo, ${nom}! Soy Valentina. ¿Seguimos buscando? Decime zona, presupuesto y ambientes y te actualizo la lista.` }]);

    let ok = true;
    fetch("/api/chat").then((r) => r.json()).then((d) => {
      if (!ok) return;
      const on = !!d?.ready;
      setReady(on);
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
    setMsgs(next); setTxt(""); setSending(true);
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

  // Captura PROGRESIVA: un dato por vez. Guarda cada paso en el perfil único y dispara el
  // lead apenas hay WhatsApp (speed-to-lead). El nombre se pide solo si no lo tenemos.
  function avanzarLead(e) {
    e.preventDefault();
    const v = leadVal.trim();
    if (leadPaso === "nombre") {
      const nom = primerNombre(v) || v;
      if (v.length < 2) return;
      writePerfil({ nombre: nom });
      setPerfil((p) => ({ ...p, nombre: nom }));
      setLeadVal(""); setLeadPaso("whatsapp");
    } else if (leadPaso === "whatsapp") {
      if (!wppValido(v)) return;
      const proy = results[0]?.nombre || "";
      const cur = readPerfil();
      enviarLead({ nombre: cur.nombre || "", whatsapp: v, email: cur.email || "", proyecto: proy, proyectoSlug: results[0]?.slug || "", origen: "explorar-ia", track });
      setPerfil((p) => ({ ...p, whatsapp: v }));
      setLeadVal(""); setLeadPaso("done"); setLeadSent(true);
    }
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

  // Fila de resultado: LISTA vertical. Click → drawer (no nueva pestaña) para no perder el chat.
  const Row = (s) => (
    <button key={s.slug} type="button" onClick={() => { setDetalle({ slug: s.slug, nombre: s.nombre }); track("explorar_ver_detalle", { slug: s.slug }); }}
      className="group w-full text-left flex gap-3 bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-secondary hover:shadow-md transition-all">
      <div className="relative w-[104px] shrink-0 aspect-[4/3] bg-surface-container-high overflow-hidden">
        {s.imagen ? (
          <img src={s.imagen} alt={s.nombre} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary"><span className="material-symbols-outlined text-2xl">apartment</span></div>
        )}
        <span className="absolute top-1.5 left-1.5 bg-primary/90 text-white px-1.5 py-0.5 rounded text-[8.5px] font-label-caps tracking-widest">EN POZO</span>
      </div>
      <div className="py-2.5 pr-3 flex flex-col flex-1 min-w-0">
        <h3 className="font-headline-sm text-[14.5px] text-primary leading-tight line-clamp-1">{s.nombre}</h3>
        {s.barrio && <p className="text-on-surface-variant text-[12px] mt-0.5">{s.barrio}</p>}
        {(s.ambientes || s.entregaLabel) && <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{[s.ambientes, s.entregaLabel].filter(Boolean).join(" · ")}</p>}
        <div className="mt-auto pt-1.5 flex items-end justify-between">
          <span className="text-primary font-headline-sm text-[14px]">{precioLabel(s)}</span>
          <span className="text-[11.5px] text-secondary group-hover:underline inline-flex items-center gap-0.5">Ver <span className="material-symbols-outlined text-[15px]">chevron_right</span></span>
        </div>
      </div>
    </button>
  );

  // Barra de lead progresiva (un input, cambia según el paso). Value-first: aparece tras la 1ª respuesta.
  const leadBar = () => {
    if (leadSent || leadPaso === "done") {
      return (
        <div className="shrink-0 border-t border-outline-variant bg-surface-container-low px-3 py-2.5 text-[12.5px] text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {perfil.nombre ? `¡Listo, ${primerNombre(perfil.nombre)}!` : "¡Listo!"} Un asesor te escribe por WhatsApp. Guardado en tu Plan.
        </div>
      );
    }
    const esNombre = leadPaso === "nombre";
    return (
      <div className="shrink-0 border-t border-outline-variant bg-surface-container-low px-3 py-2.5">
        <p className="text-[12.5px] text-primary font-medium mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
          {esNombre ? "¿Te paso precio, cuota y disponibilidad? Empecemos: ¿cómo te llamás?" : `Gracias${primerNombre(perfil.nombre) ? ", " + primerNombre(perfil.nombre) : ""}. ¿A qué WhatsApp te contactamos?`}
        </p>
        <form onSubmit={avanzarLead} className="flex items-center gap-2">
          <input value={leadVal} onChange={(e) => setLeadVal(e.target.value)} autoComplete={esNombre ? "given-name" : "tel"} inputMode={esNombre ? "text" : "tel"}
            placeholder={esNombre ? "Tu nombre" : "WhatsApp con característica"}
            className="flex-1 px-3 py-2 rounded-full border border-outline-variant bg-surface text-[13px] outline-none focus:border-secondary" />
          <button type="submit" className="shrink-0 rounded-full bg-secondary text-white px-4 py-2 text-[12px] font-medium hover:opacity-90 transition">{esNombre ? "Seguir" : "Que me contacten"}</button>
        </form>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
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
              <div className="text-[14px] font-medium text-primary">Valentina</div>
              <div className="text-[12px] text-secondary">Tu asesora en pozo</div>
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

          {gotReply && leadBar()}

          <form onSubmit={enviar} className="shrink-0 border-t border-outline-variant bg-surface p-3">
            <div className="flex items-center gap-2">
              <input value={txt} onChange={(e) => setTxt(e.target.value)} disabled={sending} placeholder="Describí lo que buscás…" className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={sending || !txt.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
              </button>
            </div>
          </form>
        </div>

        {/* PANEL RESULTADOS — lista vertical */}
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
              <div className="flex flex-col gap-2.5">
                {results.map((s) => Row(s))}
              </div>
            )}
          </div>
        </div>
      </div>

      {detalle && (
        <DetalleDrawer slug={detalle.slug} nombre={detalle.nombre} perfil={perfil}
          onClose={() => setDetalle(null)}
          onLead={(v) => { const cur = readPerfil(); enviarLead({ nombre: cur.nombre || "", whatsapp: v, email: cur.email || "", proyecto: detalle.nombre, proyectoSlug: detalle.slug, origen: "explorar-ia", track }); setPerfil((p) => ({ ...p, whatsapp: v })); setLeadSent(true); setLeadPaso("done"); }} />
      )}
    </div>
  );
}

// Drawer lateral (desktop) / bottom-sheet (mobile) con el detalle del proyecto. Trae el dato
// completo de /api/proyecto/{slug} SIN sacarte del chat. CTA de contacto por este proyecto +
// link a la ficha completa (nueva pestaña) como fallback.
function DetalleDrawer({ slug, nombre, perfil, onClose, onLead }) {
  const [data, setData] = useState(null);
  const [wpp, setWpp] = useState("");
  const [sent, setSent] = useState(wppValido(perfil?.whatsapp));

  useEffect(() => {
    let vivo = true;
    (async () => { try { const r = await fetch(`/api/proyecto/${slug}`); if (r.ok) { const j = await r.json(); if (vivo && !j.error) setData(j); } } catch {} })();
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { vivo = false; window.removeEventListener("keydown", onEsc); document.body.style.overflow = prev; };
  }, [slug, onClose]);

  const d = data || {};
  const img = d.imagen || d.img || "";
  const precio = d.precioDesde ? `Desde USD ${Number(d.precioDesde).toLocaleString("es-AR")}` : (d.precioM2 ? `USD ${Number(d.precioM2).toLocaleString("es-AR")} /m²` : "Consultar");

  return (
    <div className="fixed inset-0 z-[120] flex justify-end scrim-soft" onClick={onClose}>
      <div className="w-full sm:max-w-md h-full bg-surface shadow-2xl flex flex-col animate-[slidein_.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <span className="text-[13px] font-label-caps tracking-widest text-secondary">DETALLE · SEGUÍS EN EL CHAT</span>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 flex items-center justify-center rounded-full text-[20px] text-on-surface-variant hover:bg-surface-container-high transition">✕</button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="relative aspect-[16/10] bg-surface-container-high">
            {img ? <img src={img} alt={nombre} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-secondary"><span className="material-symbols-outlined text-4xl">apartment</span></div>}
            <span className="absolute top-2 left-2 bg-primary/90 text-white px-2 py-0.5 rounded text-[9px] font-label-caps tracking-widest">EN POZO</span>
          </div>
          <div className="p-4">
            <h2 className="font-headline-md text-headline-sm text-primary leading-tight">{d.nombre || nombre}</h2>
            {d.barrio && <p className="text-on-surface-variant text-[13px] mt-0.5">{d.barrio}{d.direccion ? ` · ${d.direccion}` : ""}</p>}
            <p className="text-primary font-headline-sm text-[17px] mt-2">{precio}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
              {d.ambientes && <div className="bg-surface-container-low rounded-lg px-3 py-2"><dt className="text-on-surface-variant text-[11px]">Tipología</dt><dd className="text-primary font-medium">{d.ambientes}</dd></div>}
              {(d.entregaLabel || d.entrega) && <div className="bg-surface-container-low rounded-lg px-3 py-2"><dt className="text-on-surface-variant text-[11px]">Entrega</dt><dd className="text-primary font-medium">{d.entregaLabel || d.entrega}</dd></div>}
              {d.desarrolladora && <div className="bg-surface-container-low rounded-lg px-3 py-2 col-span-2"><dt className="text-on-surface-variant text-[11px]">Desarrolladora</dt><dd className="text-primary font-medium truncate">{d.desarrolladora}</dd></div>}
            </dl>
            {d.descripcion && <p className="text-[13px] text-on-surface-variant leading-relaxed mt-3 line-clamp-6">{String(d.descripcion).replace(/<[^>]+>/g, "").slice(0, 420)}</p>}
          </div>
        </div>
        <div className="shrink-0 border-t border-outline-variant bg-surface-container-low p-3">
          {sent ? (
            <div className="text-[12.5px] text-secondary flex items-center gap-2 py-1"><span className="material-symbols-outlined text-[18px]">check_circle</span> Te contactamos por este proyecto. Seguí mirando otros.</div>
          ) : (
            <>
              <p className="text-[12.5px] text-primary font-medium mb-2">Dejá tu WhatsApp y te pasamos precio, cuota y disponibilidad de {d.nombre || nombre}.</p>
              <form onSubmit={(e) => { e.preventDefault(); if (!wppValido(wpp)) return; onLead(wpp.trim()); setSent(true); }} className="flex items-center gap-2">
                <input value={wpp} onChange={(e) => setWpp(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="WhatsApp con característica" className="flex-1 px-3 py-2 rounded-full border border-outline-variant bg-surface text-[13px] outline-none focus:border-secondary" />
                <button type="submit" className="shrink-0 rounded-full bg-secondary text-white px-4 py-2 text-[12px] font-medium hover:opacity-90 transition">Que me contacten</button>
              </form>
            </>
          )}
          <Link href={`/desarrollos-inmobiliarios/${slug}/`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12px] text-secondary hover:text-primary transition">Ver ficha completa <span className="material-symbols-outlined text-[15px]">open_in_new</span></Link>
        </div>
      </div>
    </div>
  );
}
