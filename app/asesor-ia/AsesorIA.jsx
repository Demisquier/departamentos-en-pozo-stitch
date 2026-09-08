"use client";
// app/asesor-ia/AsesorIA.jsx — Chat real contra /api/chat (GPT, env-gated).
// Al montar hace GET /api/chat: si ready===false muestra "en preparación" (NO el chat).
// Si ready: burbujas + input + tarjetas de `sugeridos` + captura de lead (nombre+WhatsApp).
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { track } from "../../lib/track";

const HOLA = "¡Hola! Soy tu asesor con IA. Contame qué buscás — barrio, ambientes, presupuesto — y te oriento con proyectos en pozo de nuestro catálogo. También te aviso los riesgos a mirar.";

export default function AsesorIA() {
  const [ready, setReady] = useState(null); // null=cargando, false=off, true=on
  const [msgs, setMsgs] = useState([{ role: "assistant", content: HOLA }]);
  const [sugeridos, setSugeridos] = useState([]);
  const [txt, setTxt] = useState("");
  const [sending, setSending] = useState(false);
  const [lead, setLead] = useState({ nombre: "", whatsapp: "" });
  const [leadSent, setLeadSent] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let ok = true;
    fetch("/api/chat").then((r) => r.json()).then((d) => { if (ok) setReady(!!d?.ready); }).catch(() => { if (ok) setReady(false); });
    return () => { ok = false; };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, sending]);

  async function enviar(e) {
    e.preventDefault();
    const val = txt.trim();
    if (!val || sending) return;
    const next = [...msgs, { role: "user", content: val }];
    setMsgs(next); setTxt(""); setSending(true); setSugeridos([]);
    track("chat_ia_msg", {});
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "assistant", content: d?.reply || "Disculpá, no pude responder. Probá de nuevo." }]);
      if (Array.isArray(d?.sugeridos)) setSugeridos(d.sugeridos);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Se cortó la conexión. Probá de nuevo en un momento." }]);
    } finally {
      setSending(false);
    }
  }

  async function enviarLead(e) {
    e.preventDefault();
    const nombre = lead.nombre.trim();
    const whatsapp = lead.whatsapp.trim();
    if ((whatsapp.match(/\d/g) || []).length < 6) return;
    const proy = sugeridos[0]?.nombre || "";
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mail: { _subject: "Nuevo lead (chat IA)", _template: "table", _captcha: "false", Nombre: nombre || "—", WhatsApp: whatsapp, "Proyecto de interés": proy || "—", Origen: "Chat IA" },
          sheet: { origen: "chat-ia", tipo: "chat", nombre, email: "", whatsapp, proyecto: proy },
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
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-2.5">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.role === "user" ? "self-end" : "self-start"}`}>
            <div className={`text-[14px] leading-relaxed px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap ${m.role === "user" ? "bg-primary-container text-on-primary rounded-br-md" : "bg-surface-container-low text-on-surface border border-outline-variant rounded-bl-md"}`}>{m.content}</div>
          </div>
        ))}
        {sugeridos.length > 0 && (
          <div className="self-start w-full flex flex-col gap-2 mt-1">
            {sugeridos.map((s) => (
              <Link key={s.slug} href={`/desarrollos-inmobiliarios/${s.slug}/`} className="flex items-center gap-2 text-[13px] text-primary border border-outline-variant rounded-xl px-3 py-2 hover:border-secondary transition">
                <span className="material-symbols-outlined text-[18px] text-secondary">apartment</span>
                <span className="flex-1 truncate">{s.nombre}</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
              </Link>
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

      {!leadSent ? (
        <form onSubmit={enviarLead} className="shrink-0 border-t border-outline-variant bg-surface-container-low px-3 py-2.5 flex items-center gap-2">
          <input value={lead.nombre} onChange={(e) => setLead((l) => ({ ...l, nombre: e.target.value }))} placeholder="Nombre" autoComplete="given-name" className="w-24 shrink-0 px-3 py-2 rounded-full border border-outline-variant bg-surface text-[13px] outline-none focus:border-secondary" />
          <input value={lead.whatsapp} onChange={(e) => setLead((l) => ({ ...l, whatsapp: e.target.value }))} placeholder="WhatsApp con característica" inputMode="tel" autoComplete="tel" className="flex-1 px-3 py-2 rounded-full border border-outline-variant bg-surface text-[13px] outline-none focus:border-secondary" />
          <button type="submit" className="shrink-0 rounded-full bg-secondary text-white px-3.5 py-2 text-[12px] font-medium hover:opacity-90 transition">Que me contacten</button>
        </form>
      ) : (
        <div className="shrink-0 border-t border-outline-variant bg-surface-container-low px-3 py-2.5 text-[12.5px] text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span> ¡Listo! Un asesor te va a escribir por WhatsApp.
        </div>
      )}

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
