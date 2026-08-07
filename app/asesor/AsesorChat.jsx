"use client";
// app/asesor/AsesorChat.jsx — Asesora "Sofía" (sin IA). Conversa de forma humana: escribe de a poco
// (indicador "escribiendo…"), pide PRIMERO los datos de contacto y después el perfil con opciones (chips).
// Guarda el perfil en la selección (localStorage 'dpp_perfil_v1') y envía el lead por mail vía Formsubmit
// (SIN WordPress): primario a contacto@departamentosenpozo.com.ar, con copia (_cc) a dema2910@gmail.com.
// Sirve como página (/asesor) o dentro de un modal sobre la ficha (prop onClose + proyecto).
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const PASOS = [
  { key: "objetivo", p: "¿La compra es para vivir o para invertir?", o: [["Para invertir", "Inversión"], ["Para vivir", "Vivienda propia"], ["Todavía no lo sé", "A definir"]] },
  { key: "presupuesto", p: "¿Con qué presupuesto te manejás? (en dólares)", o: [["Hasta 120k", "≤ USD 120k"], ["120k – 180k", "USD 120k–180k"], ["180k – 250k", "USD 180k–250k"], ["+250k", "USD 250k+"], ["Lo charlamos", "A conversar"]] },
  { key: "zonas", p: "¿Qué zona te gusta?", o: [["Caballito", "Caballito"], ["Villa Urquiza", "Villa Urquiza"], ["Palermo", "Palermo"], ["Belgrano / Núñez", "Belgrano / Núñez"], ["Abierta/o", "Abierto a sugerencias"]] },
  { key: "ambientes", p: "¿Qué tamaño buscás?", o: [["Monoambiente", "Monoambiente"], ["2 amb", "2 ambientes"], ["3 amb", "3 ambientes"], ["Más grande", "3+ ambientes"]] },
  { key: "entrega", p: "¿Te corre el tiempo con la entrega?", o: [["Cuanto antes", "Lo antes posible"], ["Puedo esperar", "Flexible por precio"]] },
  { key: "plazo", p: "¿Para cuándo pensás dar el paso?", o: [["Próximos meses", "Próximos meses"], ["Este año", "Este año"], ["Explorando", "Explorando"]] },
  { key: "financiacion", p: "¿Cuotas o contado?", o: [["Cuotas", "Cuotas (ajuste CAC)"], ["Contado", "Contado"], ["No sé aún", "A definir"]] },
];
const ETIQUETAS = { objetivo: "Objetivo", presupuesto: "Presupuesto", zonas: "Zonas", ambientes: "Tipología", entrega: "Entrega", plazo: "Plazo", financiacion: "Financiación" };

function leerFavoritos() {
  try {
    const raw = localStorage.getItem("dpp_favoritos_v1");
    const arr = raw ? JSON.parse(raw) : [];
    return arr.map((x) => x.nombre).filter(Boolean);
  } catch { return []; }
}

export default function AsesorChat({ proyectoNombre = "", proyectoSlug = "", onClose = null }) {
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(true);
  const [idx, setIdx] = useState(0);
  const [perfil, setPerfil] = useState({});
  const [fase, setFase] = useState("intro"); // intro | contacto | chat | enviando | ok | error
  const [cto, setCto] = useState(0); // 0 = nombre, 1 = mail/WhatsApp
  const [txt, setTxt] = useState("");
  const [form, setForm] = useState({ nombre: "", email: "", whatsapp: "" });
  const [gotcha, setGotcha] = useState("");
  const [proyecto, setProyecto] = useState(proyectoNombre || "");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);

  // Sofía "piensa" y después escribe: burbuja de puntos + delay antes de cada mensaje.
  const say = (text, delay = 850) => new Promise((resolve) => {
    setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { s: "a", t: text }]); setTyping(false); resolve(); }, delay);
  });

  // Apertura humana: saludo corto + (contexto del proyecto si vino de una ficha) → pedimos el nombre.
  useEffect(() => {
    if (started.current) return; started.current = true;
    let n = proyectoNombre;
    if (!n) { try { n = new URLSearchParams(window.location.search).get("nombre") || ""; } catch {} }
    (async () => {
      if (n) { setProyecto(n); await say("¡Hola! Soy Sofía.", 500); await say(`Qué bueno que te gustó ${n}.`, 900); }
      else { await say("¡Hola! Soy Sofía.", 500); }
      await say("Te ayudo a encontrar el depto que va con vos. ¿Cómo te llamás?", 950);
      setFase("contacto"); setCto(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    if ((fase === "contacto" || fase === "error") && !typing && inputRef.current) inputRef.current.focus();
  }, [msgs, typing, fase]);

  // Contacto conversacional: nombre → mail/WhatsApp → arrancan las preguntas del perfil.
  async function responderTexto(e) {
    e.preventDefault();
    const val = txt.trim();
    if (!val || typing) return;
    setTxt("");
    setMsgs((m) => [...m, { s: "u", t: val }]);
    if (cto === 0) {
      setForm((f) => ({ ...f, nombre: val }));
      setCto(1);
      await say(`Un gusto, ${val.split(" ")[0]}. ¿A qué mail o WhatsApp te escribo?`, 800);
    } else {
      const isEmail = val.includes("@");
      setForm((f) => ({ ...f, email: isEmail ? val : f.email, whatsapp: isEmail ? f.whatsapp : val }));
      setFase("chat"); setIdx(0);
      await say("¡Genial! Ahora, unas preguntas rápidas para recomendarte bien.", 700);
      await say(PASOS[0].p, 800);
    }
  }

  function elegir(label, value) {
    if (typing) return;
    const paso = PASOS[idx];
    const nuevo = { ...perfil, [paso.key]: value };
    setPerfil(nuevo);
    setMsgs((m) => [...m, { s: "u", t: label }]);
    const next = idx + 1;
    setIdx(next);
    (async () => {
      if (next < PASOS.length) { await say(PASOS[next].p); }
      else { await say("¡Listo! Con esto ya tengo todo. Dame un segundo…", 700); enviar(nuevo); }
    })();
  }

  async function enviar(perfilFinal) {
    if (gotcha) return; // honeypot
    setFase("enviando");
    const datos = form;
    const guardados = leerFavoritos();
    try { localStorage.setItem("dpp_perfil_v1", JSON.stringify({ ...perfilFinal, ...datos, ts: Date.now() })); } catch {}
    const payload = { _subject: "Nuevo perfil de comprador (asesor)", _template: "table", _captcha: "false", _cc: "dema2910@gmail.com", Nombre: datos.nombre.trim() || "—", Email: datos.email.trim() || "—", WhatsApp: datos.whatsapp.trim() || "—" };
    PASOS.forEach((p) => { payload[ETIQUETAS[p.key]] = perfilFinal[p.key] || "—"; });
    payload["Proyectos guardados"] = guardados.length ? guardados.join(", ") : "ninguno aún";
    if (proyecto) payload["Proyecto de interés"] = proyecto;
    payload["Origen"] = proyecto ? "Ficha · quiero más info" : "Asesor · perfil";
    try {
      const res = await fetch("https://formsubmit.co/ajax/contacto@departamentosenpozo.com.ar", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success === true || data.success === "true")) {
        await say(`¡Gracias, ${datos.nombre.split(" ")[0] || ""}! Guardé tu perfil y te escribo con propuestas que encajen con vos.`, 700);
        setFase("ok");
      } else { await say("Uy, no me salió enviarlo. ¿Probamos de nuevo con tu mail o WhatsApp?", 500); setFase("error"); setCto(1); }
    } catch { await say("Uy, no me salió enviarlo. ¿Probamos de nuevo con tu mail o WhatsApp?", 500); setFase("error"); setCto(1); }
  }

  const progreso = fase === "chat" ? `Paso ${Math.min(idx + 1, PASOS.length)} de ${PASOS.length}` : (fase === "ok" ? "¡Listo!" : (fase === "chat" ? "" : "Encantada de ayudarte"));
  const placeholder = cto === 0 ? "Escribí tu nombre…" : "Tu mail o WhatsApp…";

  return (
    <div className="flex flex-col h-full bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
      {/* Header fijo */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">support_agent</span></span>
        <div className="leading-tight flex-1">
          <div className="text-[14px] font-medium text-primary">Sofía · tu asesora</div>
          <div className="text-[12px] text-secondary">{progreso}</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Cerrar" className="w-9 h-9 flex items-center justify-center rounded-full text-[22px] leading-none text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition">✕</button>
        )}
      </div>

      {/* Conversación con scroll interno */}
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

      {/* Caja de respuesta SIEMPRE fija abajo */}
      <div className="shrink-0 border-t border-outline-variant bg-surface">
        {fase === "chat" && !typing && idx < PASOS.length && (
          <div className="p-3 flex flex-wrap gap-2">
            {PASOS[idx].o.map(([label, value]) => (
              <button key={value} type="button" onClick={() => elegir(label, value)} className="text-[13px] px-3.5 py-2 rounded-full border border-outline-variant text-primary hover:border-secondary hover:bg-surface-container-low transition-colors">{label}</button>
            ))}
          </div>
        )}

        {(fase === "contacto" || fase === "error") && (
          <form onSubmit={responderTexto} className="p-3">
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={txt} onChange={(e) => setTxt(e.target.value)} disabled={typing}
                inputMode={cto === 1 ? "email" : "text"} placeholder={placeholder}
                className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={typing || !txt.trim()} aria-label="Enviar"
                className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
              </button>
            </div>
            <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <p className="text-[11px] text-on-surface-variant mt-2 px-1">Usamos tu dato solo para pasarte las propuestas. No lo compartimos con terceros.</p>
          </form>
        )}

        {fase === "ok" && (
          <div className="p-4 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/mi-seleccion/" className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">favorite</span> Ver mi selección
            </Link>
            {onClose && (
              <button type="button" onClick={onClose} className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Seguir viendo</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
