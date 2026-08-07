"use client";
// app/asesor/AsesorChat.jsx — Asistente guiado (sin IA): capta el perfil del comprador
// conversando (chips para el perfil + texto libre para el contacto), lo GUARDA en la selección
// (localStorage 'dpp_perfil_v1') y lo ENVÍA como lead por mail vía Formsubmit (SIN WordPress):
// primario a contacto@departamentosenpozo.com.ar, con copia (_cc) a dema2910@gmail.com.
//
// UX tipo chat: header fijo arriba, conversación con scroll interno (auto-scroll al último
// mensaje) y la caja de respuesta SIEMPRE fija abajo. TODO se pide charlando: primero el perfil
// con opciones, después nombre y contacto uno por uno en el mismo chat. Sirve como página
// (/asesor) o dentro de un modal sobre la ficha (prop onClose + proyecto).
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const PASOS = [
  { key: "objetivo", p: "Para arrancar: ¿la compra es para vivir o para invertir?", o: [["Para invertir", "Inversión"], ["Para vivir", "Vivienda propia"], ["Todavía no lo sé", "A definir"]] },
  { key: "presupuesto", p: "Solo si te queda cómodo: ¿con qué presupuesto (en dólares) te estás manejando?", o: [["Hasta 120k", "≤ USD 120k"], ["120k – 180k", "USD 120k–180k"], ["180k – 250k", "USD 180k–250k"], ["+250k", "USD 250k+"], ["Prefiero conversarlo", "A conversar"]] },
  { key: "zonas", p: "¿Qué zona te interesa? Después podés sumar más.", o: [["Caballito", "Caballito"], ["Villa Urquiza", "Villa Urquiza"], ["Palermo", "Palermo"], ["Belgrano / Núñez", "Belgrano / Núñez"], ["Abierto a sugerencias", "Abierto a sugerencias"]] },
  { key: "ambientes", p: "¿Qué tipología estás buscando?", o: [["Monoambiente", "Monoambiente"], ["2 ambientes", "2 ambientes"], ["3 ambientes", "3 ambientes"], ["Más grande", "3+ ambientes"]] },
  { key: "entrega", p: "¿Te corre el tiempo con la entrega, o podés esperar si el precio acompaña?", o: [["Cuanto antes", "Lo antes posible"], ["Puedo esperar por precio", "Flexible por precio"]] },
  { key: "plazo", p: "¿Para cuándo te imaginás dando el paso? Sin apuro, es para acompañarte a tu ritmo.", o: [["En los próximos meses", "Próximos meses"], ["En algún momento este año", "Este año"], ["Estoy explorando", "Explorando"]] },
  { key: "financiacion", p: "Última cosita: ¿pensás usar financiación en cuotas o pagar de contado?", o: [["Necesito financiación", "Cuotas (ajuste CAC)"], ["Pago de contado", "Contado"], ["Todavía no sé", "A definir"]] },
];
// Marco amable arriba: qué vamos a hacer y por qué pedimos un dato al final (transparencia).
const INTRO = "¡Hola! Soy Sofía, tu asesora. Te hago unas preguntas rápidas para entender qué buscás y recomendarte proyectos que encajen de verdad. Al final te pido un dato de contacto — es solo para pasarte las propuestas, no lo compartimos con nadie.";
const Q_NOMBRE = "¡Genial! Con esto ya tengo tu perfil. Antes de pasártelo al equipo, ¿cómo te llamás?";
const ETIQUETAS = { objetivo: "Objetivo", presupuesto: "Presupuesto", zonas: "Zonas", ambientes: "Tipología", entrega: "Entrega", plazo: "Plazo", financiacion: "Financiación" };

function leerFavoritos() {
  try {
    const raw = localStorage.getItem("dpp_favoritos_v1");
    const arr = raw ? JSON.parse(raw) : [];
    return arr.map((x) => x.nombre).filter(Boolean);
  } catch { return []; }
}

export default function AsesorChat({ proyectoNombre = "", proyectoSlug = "", onClose = null }) {
  const [msgs, setMsgs] = useState([{ s: "a", t: INTRO }, { s: "a", t: PASOS[0].p }]);
  const [idx, setIdx] = useState(0);
  const [perfil, setPerfil] = useState({});
  const [fase, setFase] = useState("chat"); // chat | contacto | enviando | ok | error
  const [cto, setCto] = useState(0); // paso de contacto: 0 = nombre, 1 = mail/WhatsApp
  const [txt, setTxt] = useState(""); // input de texto libre
  const [form, setForm] = useState({ nombre: "", email: "", whatsapp: "" });
  const [gotcha, setGotcha] = useState("");
  const [proyecto, setProyecto] = useState(proyectoNombre || "");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Contexto del proyecto: por prop (modal en la ficha) o por la URL (página /asesor).
  useEffect(() => {
    let n = proyectoNombre;
    if (!n) { try { n = new URLSearchParams(window.location.search).get("nombre") || ""; } catch {} }
    if (n) {
      setProyecto(n);
      setMsgs((m) => [{ s: "a", t: `Veo que te interesó ${n}. ¡Buenísimo! Te hago unas preguntas para recomendarte con criterio y guardo tu interés.` }, ...m]);
    }
  }, [proyectoNombre]);

  // Auto-scroll al último mensaje: la conversación se mueve sola, la caja queda fija abajo.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    if (fase === "contacto" && inputRef.current) inputRef.current.focus();
  }, [msgs, fase]);

  function elegir(label, value) {
    const paso = PASOS[idx];
    setPerfil((p) => ({ ...p, [paso.key]: value }));
    const next = idx + 1;
    setIdx(next);
    setMsgs((m) => {
      const out = [...m, { s: "u", t: label }];
      if (next < PASOS.length) out.push({ s: "a", t: PASOS[next].p });
      else out.push({ s: "a", t: Q_NOMBRE });
      return out;
    });
    if (next >= PASOS.length) { setFase("contacto"); setCto(0); }
  }

  // Contacto conversacional: nombre primero, después mail o WhatsApp. Al segundo dato, enviamos.
  function responderTexto(e) {
    e.preventDefault();
    const val = txt.trim();
    if (!val) return;
    setTxt("");
    setMsgs((m) => [...m, { s: "u", t: val }]);
    if (cto === 0) {
      setForm((f) => ({ ...f, nombre: val }));
      setCto(1);
      setMsgs((m) => [...m, { s: "a", t: `Un gusto, ${val.split(" ")[0]}. ¿A qué mail o WhatsApp te paso las propuestas?` }]);
    } else {
      const isEmail = val.includes("@");
      const datos = { ...form, email: isEmail ? val : form.email, whatsapp: isEmail ? form.whatsapp : val };
      setForm(datos);
      enviar(datos);
    }
  }

  async function enviar(datos) {
    if (gotcha) return; // honeypot
    if (!datos.nombre.trim() || (!datos.email.trim() && !datos.whatsapp.trim())) { setFase("error"); return; }
    setFase("enviando");
    const guardados = leerFavoritos();
    try { localStorage.setItem("dpp_perfil_v1", JSON.stringify({ ...perfil, ...datos, ts: Date.now() })); } catch {}
    const payload = { _subject: "Nuevo perfil de comprador (asesor)", _template: "table", _captcha: "false", _cc: "dema2910@gmail.com", Nombre: datos.nombre.trim(), Email: datos.email.trim() || "—", WhatsApp: datos.whatsapp.trim() || "—" };
    PASOS.forEach((p) => { payload[ETIQUETAS[p.key]] = perfil[p.key] || "—"; });
    payload["Proyectos guardados"] = guardados.length ? guardados.join(", ") : "ninguno aún";
    if (proyecto) payload["Proyecto de interés"] = proyecto;
    payload["Origen"] = proyecto ? "Ficha · quiero más info" : "Asesor · perfil";
    try {
      const res = await fetch("https://formsubmit.co/ajax/contacto@departamentosenpozo.com.ar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success === true || data.success === "true")) {
        setMsgs((m) => [...m, { s: "a", t: "¡Listo! Guardé tu perfil y se lo pasé al equipo. Te vamos a escribir con propuestas que encajen con vos." }]);
        setFase("ok");
      } else { setFase("error"); setMsgs((m) => [...m, { s: "a", t: "Uy, no pude enviarlo. Probá de nuevo escribiendo tu mail o WhatsApp." }]); }
    } catch { setFase("error"); setMsgs((m) => [...m, { s: "a", t: "Uy, no pude enviarlo. Probá de nuevo escribiendo tu mail o WhatsApp." }]); }
  }

  const progreso = fase === "chat" ? `Paso ${Math.min(idx + 1, PASOS.length)} de ${PASOS.length}` : (fase === "ok" ? "¡Listo!" : "Casi terminamos");
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
      </div>

      {/* Caja de respuesta SIEMPRE fija abajo */}
      <div className="shrink-0 border-t border-outline-variant bg-surface">
        {fase === "chat" && (
          <div className="p-3 flex flex-wrap gap-2">
            {PASOS[idx].o.map(([label, value]) => (
              <button key={value} type="button" onClick={() => elegir(label, value)} className="text-[13px] px-3.5 py-2 rounded-full border border-outline-variant text-primary hover:border-secondary hover:bg-surface-container-low transition-colors">{label}</button>
            ))}
          </div>
        )}

        {(fase === "contacto" || fase === "enviando" || fase === "error") && (
          <form onSubmit={responderTexto} className="p-3">
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={txt} onChange={(e) => setTxt(e.target.value)} disabled={fase === "enviando"}
                type={cto === 1 ? "text" : "text"} inputMode={cto === 1 ? "email" : "text"} placeholder={placeholder}
                className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={fase === "enviando" || !txt.trim()} aria-label="Enviar"
                className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">{fase === "enviando" ? "hourglass_top" : "send"}</span>
              </button>
            </div>
            {/* honeypot */}
            <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <p className="text-[11px] text-on-surface-variant mt-2 px-1">Solo usamos tu dato para pasarte las propuestas. No lo compartimos con terceros.</p>
          </form>
        )}

        {fase === "ok" && (
          <div className="p-4 flex items-center justify-center gap-3">
            <Link href="/mi-seleccion/" className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">favorite</span> Ver mi selección
            </Link>
            {onClose && (
              <button type="button" onClick={onClose} className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Seguir viendo la propiedad</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
