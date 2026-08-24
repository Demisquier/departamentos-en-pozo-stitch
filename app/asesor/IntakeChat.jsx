"use client";
// app/asesor/IntakeChat.jsx — "Sofía-intake": chat para que una desarrolladora/inmobiliaria
// cargue o actualice un proyecto HABLANDO (sin formulario de 40 campos). ~8 preguntas, chips
// donde se puede, texto libre aceptado. Al terminar manda la propuesta a la cola de revisión
// (Google Sheet "Intake proyectos" vía el mismo Apps Script + copia por Formsubmit). NADA se
// publica automático: es un sitio de análisis, el dato pasa por curaduría. Self-contained para
// no tocar el chat de leads (AsesorChat).
import { useState, useEffect, useRef } from "react";
import { track } from "../../lib/track";

// Pasos del intake. type: 'text' | 'chips' | 'multi'. `opt` = etiqueta a guardar por chip.
const PASOS = [
  { key: "nombre", type: "text", p: "¡Hola! Soy la asistente de Departamentos en Pozo. ¿Comercializás o desarrollás un proyecto en pozo? Te lo cargo en 2 minutos, sin formularios. ¿Cómo se llama el proyecto?", ph: "Nombre del proyecto…" },
  { key: "barrio", type: "text", p: "Genial 👏 ¿En qué barrio está? (podés tirarme la dirección aproximada)", ph: "Barrio o dirección…" },
  { key: "etapa", type: "chips", p: "¿En qué etapa va la obra?", o: ["En pozo", "En construcción", "Próxima entrega"] },
  { key: "entrega", type: "text", p: "¿Para cuándo estiman la entrega? (año o trimestre)", ph: "Ej: mediados de 2027" },
  { key: "precio", type: "text", p: "¿Desde qué precio arranca? Podés darme el total de la unidad más chica o el valor por m² (USD).", ph: "Ej: USD 3.200/m² o USD 120.000" },
  { key: "tipologias", type: "multi", p: "¿Qué tipologías hay? Tocá todas las que apliquen.", o: ["Monoamb", "1 amb", "2 amb", "3 amb", "4+ amb"] },
  { key: "financiacion", type: "text", p: "¿Manejan financiación? Contame anticipo y cuotas, o saltá este paso.", ph: "Ej: 30% anticipo + 40 cuotas CAC", skip: true },
  { key: "desarrolladora", type: "text", p: "¿De qué desarrolladora es?", ph: "Nombre de la desarrolladora…" },
  { key: "email", type: "text", p: "Por último, ¿a qué mail corporativo te aviso cuando esté publicado? (lo usamos para verificar que sos de la empresa)", ph: "marketing@tudesarrolladora.com" },
];

const extraerMail = (s) => (String(s || "").match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [""])[0];

export default function IntakeChat({ onClose = null }) {
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(true);
  const [idx, setIdx] = useState(0);
  const [fase, setFase] = useState("chat");      // chat | ok | error
  const [txt, setTxt] = useState("");
  const [multi, setMulti] = useState([]);
  const [gotcha, setGotcha] = useState("");
  const datos = useRef({});
  const started = useRef(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const say = (text, delay = 700) => new Promise((resolve) => {
    setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { s: "a", t: text }]); setTyping(false); resolve(); }, delay);
  });

  useEffect(() => {
    if (started.current) return; started.current = true;
    track("intake_open", {});
    (async () => { await say(PASOS[0].p, 350); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => requestAnimationFrame(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; });
  useEffect(() => {
    scrollToBottom();
    const paso = PASOS[idx];
    if (paso && paso.type === "text" && !typing && inputRef.current) inputRef.current.focus();
  }, [msgs, typing, idx]);

  async function avanzar(valor, etiqueta) {
    const paso = PASOS[idx];
    datos.current = { ...datos.current, [paso.key]: valor };
    setMsgs((m) => [...m, { s: "u", t: etiqueta }]);
    const next = idx + 1;
    setIdx(next);
    setTxt(""); setMulti([]);
    if (next < PASOS.length) { await say(PASOS[next].p); return; }
    await enviar();
  }

  async function onText(e) {
    e.preventDefault();
    if (gotcha || typing) return;
    const paso = PASOS[idx];
    const val = txt.trim();
    if (!val) return;
    if (paso.key === "email") {
      const mail = extraerMail(val);
      if (!mail) { setMsgs((m) => [...m, { s: "u", t: val }]); setTxt(""); await say("Necesito un mail válido (con @) para avisarte cuando esté online.", 500); return; }
      await avanzar(mail, mail);
      return;
    }
    await avanzar(val, val);
  }

  function toggleMulti(o) {
    setMulti((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]);
  }
  async function confirmarMulti() {
    if (typing) return;
    const sel = multi.length ? multi : ["A confirmar"];
    await avanzar(sel.join(", "), sel.join(", "));
  }
  async function saltar() {
    if (typing) return;
    await avanzar("", "Saltar");
  }

  async function enviar() {
    const d = datos.current;
    const email = extraerMail(d.email || "");
    const payload = {
      _subject: "Nuevo proyecto (intake desarrolladora)",
      _template: "table",
      _captcha: "false",
      _cc: "contacto@departamentosenpozo.com.ar",
      Proyecto: d.nombre || "—",
      Barrio: d.barrio || "—",
      Etapa: d.etapa || "—",
      Entrega: d.entrega || "—",
      Precio: d.precio || "—",
      Tipologías: d.tipologias || "—",
      Financiación: d.financiacion || "—",
      Desarrolladora: d.desarrolladora || "—",
      "Mail corporativo": email || "—",
      Origen: "Intake proyecto (chat)",
    };
    if (email) {
      payload._replyto = email;
      payload._autoresponse = `¡Gracias por cargar ${d.nombre || "tu proyecto"}! Lo estamos revisando y te avisamos por mail cuando esté publicado. Para sumar render o amenities, respondé este correo. — Equipo Departamentos en Pozo`;
    }
    try {
      const sheet = {
        origen: "Intake proyecto (chat)", tipo: "intake", estado: "pendiente",
        nombre: d.desarrolladora || "", email, whatsapp: "",
        proyecto: d.nombre || "", zonas: d.barrio || "", ambientes: d.tipologias || "",
        presupuesto: d.precio || "",
            mensaje: `Etapa: ${d.etapa || "—"} | Entrega: ${d.entrega || "—"} | Financiación: ${d.financiacion || "—"}`,
      };
      await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mail: payload, sheet }) });
      track("intake_submit", { proyecto: d.nombre || "" });
      await say(`Listo ✅ Con esto armo la ficha de ${d.nombre || "tu proyecto"}${d.barrio ? ` (${d.barrio})` : ""}. La revisamos y te aviso${email ? ` a ${email}` : ""} cuando esté online. ¡Gracias!`, 700);
      setFase("ok");
    } catch {
      await say("Uy, no pude enviar la carga. ¿Probamos de nuevo?", 500);
      setFase("error");
    }
  }

  const paso = PASOS[idx];
  const progreso = fase === "ok" ? "¡Recibido!" : `Paso ${Math.min(idx + 1, PASOS.length)} de ${PASOS.length}`;

  return (
    <div className="flex flex-col h-full bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">apartment</span></span>
        <div className="leading-tight flex-1">
          <div className="text-[14px] font-medium text-primary">Cargá tu proyecto</div>
          <div className="text-[12px] text-secondary">{progreso}</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 flex items-center justify-center rounded-full text-[22px] leading-none text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition">✕</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-2.5">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.s === "u" ? "self-end" : "self-start"}`}>
            <div className={`text-[14px] leading-relaxed px-3.5 py-2.5 rounded-2xl ${m.s === "u" ? "bg-primary-container text-on-primary rounded-br-md" : "bg-surface-container-low text-on-surface border border-outline-variant rounded-bl-md"}`}>{m.t}</div>
          </div>
        ))}
        {typing && (
          <div className="max-w-[85%] self-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-surface-container-low border border-outline-variant text-secondary">
              <span className="typing-dots"><span></span><span></span><span></span></span>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-outline-variant bg-surface">
        {fase === "chat" && !typing && paso && paso.type === "chips" && (
          <div className="p-3 flex flex-wrap gap-2">
            {paso.o.map((o) => (
              <button key={o} type="button" onClick={() => avanzar(o, o)} className="text-[13px] px-3.5 py-2 rounded-full border border-outline-variant text-primary hover:border-secondary hover:bg-surface-container-low transition-colors">{o}</button>
            ))}
          </div>
        )}

        {fase === "chat" && !typing && paso && paso.type === "multi" && (
          <div className="p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {paso.o.map((o) => (
                <button key={o} type="button" onClick={() => toggleMulti(o)} className={`text-[13px] px-3.5 py-2 rounded-full border transition-colors ${multi.includes(o) ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary hover:border-secondary"}`}>{o}</button>
              ))}
            </div>
            <button type="button" onClick={confirmarMulti} className="text-[12.5px] text-secondary underline underline-offset-2 hover:no-underline">Listo, seguir →</button>
          </div>
        )}

        {fase === "chat" && paso && paso.type === "text" && (
          <form onSubmit={onText} className="p-3">
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={txt} onChange={(e) => setTxt(e.target.value)} disabled={typing}
                onFocus={() => setTimeout(scrollToBottom, 320)}
                inputMode={paso.key === "email" ? "email" : "text"}
                placeholder={paso.ph || "Escribí acá…"}
                className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={typing || !txt.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
              </button>
            </div>
            {paso.skip && (
              <button type="button" onClick={saltar} className="text-[12.5px] text-on-surface-variant underline underline-offset-2 hover:text-primary mt-2 px-1">Saltar este paso</button>
            )}
            <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          </form>
        )}

        {fase === "ok" && (
          <div className="p-4 flex items-center justify-center gap-3 flex-wrap">
            {onClose && (
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-[18px]">check</span> Cerrar
              </button>
            )}
          </div>
        )}

        {fase === "error" && (
          <div className="p-4 flex items-center justify-center gap-3 flex-wrap">
            <button type="button" onClick={() => enviar()} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
