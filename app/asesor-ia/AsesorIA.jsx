"use client";
// app/asesor-ia/AsesorIA.jsx — Chat real contra /api/chat (GPT, env-gated).
// Standalone (/asesor-ia): al montar hace GET /api/chat; si ready===false muestra "en
// preparación". EMBEBIDO (dentro de AsesorModal): recibe embedded=true → asume ready
// (el modal ya chequeó) y NO muestra placeholder; el modal decide IA vs chat guionado.
// Si ready: burbujas + input + tarjetas de `sugeridos` + captura de lead (nombre+WhatsApp).
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { track } from "../../lib/track";

export default function AsesorIA({ embedded = false, proyectoNombre = "", proyectoSlug = "", pedido = "", onClose = null }) {
  const hola = proyectoNombre
    ? `¡Hola! Soy tu asesor con IA. Te ayudo con ${pedido || "precio, cuota y disponibilidad"} de ${proyectoNombre} y proyectos similares en pozo. ¿Qué querés saber?`
    : "¡Hola! Soy tu asesor con IA. Contame qué buscás — barrio, ambientes, presupuesto — y te oriento con proyectos en pozo de nuestro catálogo. También te aviso los riesgos a mirar.";
  const [ready, setReady] = useState(embedded ? true : null); // null=cargando, false=off, true=on
  const [msgs, setMsgs] = useState([{ role: "assistant", content: hola }]);
  const [sugeridos, setSugeridos] = useState([]);
  const [verMas, setVerMas] = useState("");
  const [txt, setTxt] = useState("");
  const [sending, setSending] = useState(false);
  const [lead, setLead] = useState({ nombre: "", whatsapp: "" });
  const [leadSent, setLeadSent] = useState(false);
  const scrollRef = useRef(null);

  // ¿Ya hubo al menos 1 respuesta útil del asistente? (saludo inicial + >=1 reply).
  const gotReply = msgs.filter((m) => m.role === "assistant").length > 1;
  // ¿Chat vacío? (solo el saludo, el usuario todavía no escribió nada).
  const chatVacio = !msgs.some((m) => m.role === "user");
  // Chips deterministas (0 tokens). Prompts iniciales contextuales al proyecto.
  const quickPrompts = proyectoNombre
    ? ["¿Cuál es la forma de pago?", "¿Qué riesgos tiene?", "Mostrame similares", "¿Cuándo entrega?"]
    : ["2 ambientes en Palermo hasta 200k", "Algo para alquilar en Núñez", "Monoambiente en pozo barato", "¿Conviene pozo o usado?"];
  // Follow-ups tras cada respuesta (evita el dead-end).
  const followUps = ["Más barato", "Otro barrio", "Con financiación", "Comparar los primeros 2"];

  useEffect(() => {
    if (embedded) return; // el modal ya validó readiness → no re-chequear
    let ok = true;
    fetch("/api/chat").then((r) => r.json()).then((d) => { if (ok) setReady(!!d?.ready); }).catch(() => { if (ok) setReady(false); });
    return () => { ok = false; };
  }, [embedded]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, sending]);

  function enviar(e) {
    e.preventDefault();
    sendText(txt);
  }

  // Envía una consulta (desde el input o desde un chip determinista). 0 tokens extra:
  // los chips solo pre-cargan el texto, la llamada al LLM es la misma de siempre.
  async function sendText(raw) {
    const val = (raw || "").trim();
    if (!val || sending) return;
    const next = [...msgs, { role: "user", content: val }];
    setMsgs(next); setTxt(""); setSending(true); setSugeridos([]); setVerMas("");
    track("chat_ia_msg", {});
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12), proyecto: proyectoNombre || "" }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "assistant", content: d?.reply || "Disculpá, no pude responder. Probá de nuevo." }]);
      if (Array.isArray(d?.sugeridos)) setSugeridos(d.sugeridos);
      if (typeof d?.verMas === "string") setVerMas(d.verMas);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Se cortó la conexión. Probá de nuevo en un momento, o dejanos tu WhatsApp y te contactamos." }]);
    } finally {
      setSending(false);
    }
  }

  async function enviarLead(e) {
    e.preventDefault();
    const nombre = lead.nombre.trim();
    const whatsapp = lead.whatsapp.trim();
    if ((whatsapp.match(/\d/g) || []).length < 6) return;
    const proy = sugeridos[0]?.nombre || proyectoNombre || "";
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mail: { _subject: "Nuevo lead (chat IA)", _template: "table", _captcha: "false", Nombre: nombre || "—", WhatsApp: whatsapp, "Proyecto de interés": proy || "—", Origen: "Chat IA" },
          sheet: { origen: "chat-ia", tipo: "chat", nombre, email: "", whatsapp, proyecto: proy, proyectoSlug: proyectoSlug || "" },
        }),
      });
      track("lead", { tipo: "chat", origen: "chat-ia", proyecto: proy });
    } catch {}
    setLeadSent(true);
  }

  if (ready === null) {
    return (
      <div className="h-full flex items-center justify-center bg-surface border border-outline-variant rounded-2xl">
        <span className="material-symbols-outlined animate-spin text-secondary text-[28px]">progress_activity</span>
      </div>
    );
  }

  if (ready === false) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-4 bg-surface border border-outline-variant rounded-2xl p-8">
        <span className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span className="material-symbols-outlined text-[28px]">auto_awesome</span></span>
        <div>
          <h2 className="text-headline-sm font-headline-md text-primary mb-2">Asesor IA en preparación</h2>
          <p className="text-on-surface-variant text-body-md max-w-sm">Estamos afinando el asesor con IA. Mientras tanto, un asesor humano te ayuda con precios, cuotas y proyectos en pozo.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/asesor/" className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition">
            <span className="material-symbols-outlined text-[18px]">support_agent</span> Hablar con un asesor
          </Link>
          <Link href="/buscar/" className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition">Buscar proyectos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">auto_awesome</span></span>
        <div className="leading-tight flex-1">
          <div className="text-[14px] font-medium text-primary">Asesor IA</div>
          <div className="text-[12px] text-secondary">Análisis independiente · beta</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 flex items-center justify-center rounded-full text-[22px] leading-none text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition">✕</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-2.5">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.role === "user" ? "self-end" : "self-start"}`}>
            <div className={`text-[14px] leading-relaxed px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap ${m.role === "user" ? "bg-primary-container text-on-primary rounded-br-md" : "bg-surface-container-low text-on-surface border border-outline-variant rounded-bl-md"}`}>{m.content}</div>
          </div>
        ))}
        {chatVacio && !sending && (
          <div className="self-start w-full mt-1 flex flex-wrap gap-2">
            {quickPrompts.map((qp) => (
              <button key={qp} type="button" onClick={() => sendText(qp)}
                className="text-[13px] border border-outline-variant rounded-full px-3 py-1.5 text-primary bg-surface hover:border-secondary hover:text-secondary transition">
                {qp}
              </button>
            ))}
          </div>
        )}
        {sugeridos.length > 0 && (
          <div className="self-start w-full mt-1">
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 -mx-1 px-1 snap-x">
              {sugeridos.map((s) => (
                <Link key={s.slug} href={`/desarrollos-inmobiliarios/${s.slug}/`} className="shrink-0 w-[160px] snap-start rounded-xl border border-outline-variant bg-surface overflow-hidden hover:border-secondary transition group">
                  <div className="h-[92px] bg-surface-container-high overflow-hidden">
                    {s.imagen ? (
                      <img src={s.imagen} alt={s.nombre} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-[1.03] transition" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary"><span className="material-symbols-outlined text-[26px]">apartment</span></div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-[12.5px] font-medium text-primary leading-snug line-clamp-2">{s.nombre}</div>
                    {s.barrio && <div className="text-[11px] text-on-surface-variant truncate mt-0.5">{s.barrio}</div>}
                    <div className="text-[12px] text-secondary font-medium mt-1">{s.precioDesde ? `Desde USD ${Number(s.precioDesde).toLocaleString("es-AR")}` : "Consultar"}</div>
                    {(s.ambientes || s.entregaLabel) && <div className="text-[10.5px] text-on-surface-variant mt-0.5 truncate">{[s.ambientes, s.entregaLabel].filter(Boolean).join(" · ")}</div>}
                  </div>
                </Link>
              ))}
            </div>
            <Link href={verMas || "/desarrollos-inmobiliarios/"} className="inline-flex items-center gap-1 text-[12.5px] text-secondary hover:text-primary transition mt-1.5 font-medium">
              Ver listado completo <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        )}
        {gotReply && !sending && (
          <div className="self-start w-full mt-0.5 flex flex-wrap gap-2">
            {followUps.map((fu) => (
              <button key={fu} type="button" onClick={() => sendText(fu)}
                className="text-[12.5px] border border-outline-variant rounded-full px-3 py-1 text-on-surface-variant bg-surface hover:border-secondary hover:text-secondary transition">
                {fu}
              </button>
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

      {/* Captura de contacto: aparece SOLO después de la 1ª respuesta útil (valor antes de pedir el dato). */}
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
          <input value={txt} onChange={(e) => setTxt(e.target.value)} disabled={sending} placeholder="Escribí tu consulta…" className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
          <button type="submit" disabled={sending || !txt.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
            <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
