"use client";
// app/asesor/AsesorChat.jsx — Asesora "Sofía" (sin IA). Rediseño lead-capture (2026-08-08):
// PRINCIPIO "email primero, el resto es bonus":
//  • LEAD (desde ficha): 1 pregunta de enganche → EMAIL enmarcado como valor → se DISPARA el lead
//    parcial al instante (speed-to-lead) → WhatsApp opcional → enriquecimiento 100% opcional
//    (cada pregunta con "Saltar" + "Con esto alcanza"). Cada avance ACTUALIZA el lead.
//  • BUSCADOR (sin ficha): 2 preguntas (zona, ambientes) + escape al listado → al final ofrece
//    dejar el mail como ALERTA (opcional).
// MEMORIA: lee el perfil guardado (localStorage + nube si hay sesión) y NO re-pregunta lo sabido;
//    retoma y saluda de vuelta. Guarda cada dato (local + nube). Maneja groserías/mensajes raros con humor.
// Lead por Formsubmit: primario dema2910@gmail.com, _cc contacto@departamentosenpozo.com.ar.
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase, authEnabled } from "../../lib/supabase";
import { track } from "../../lib/track";

const PASOS = [
  { key: "zonas", p: "¿En qué zona te gustaría?", o: [["Caballito", "Caballito"], ["Villa Urquiza", "Villa Urquiza"], ["Palermo", "Palermo"], ["Belgrano / Núñez", "Belgrano / Núñez"], ["Me da igual", "Abierto a sugerencias"]] },
  { key: "ambientes", p: "¿Qué tamaño buscás?", o: [["Monoambiente", "Monoambiente"], ["2 amb", "2 ambientes"], ["3 amb", "3 ambientes"], ["Más grande", "3+ ambientes"]] },
  { key: "presupuesto", p: "¿Presupuesto aproximado? (USD)", o: [["Hasta 120k", "≤ USD 120k"], ["120–180k", "USD 120k–180k"], ["180–250k", "USD 180k–250k"], ["+250k", "USD 250k+"], ["Lo charlamos", "A conversar"]] },
];
const ENRICH = PASOS;                    // enriquecimiento opcional (después de captar el mail)
// El buscador arma un perfil un poco más completo (no solo lo que mapea a filtros) para ayudar mejor.
const BUSCADOR = PASOS;
const ETIQUETAS = { zonas: "Zonas", ambientes: "Tipología", presupuesto: "Presupuesto" };

const ZONA_BARRIO = { "Caballito": "Caballito", "Villa Urquiza": "Villa Urquiza", "Palermo": "Palermo", "Belgrano / Núñez": "Belgrano" };
const AMB_FILTRO = { "Monoambiente": "1", "2 ambientes": "2", "3 ambientes": "3", "3+ ambientes": "4+" };
function urlBuscador(perfil) {
  const sp = new URLSearchParams();
  const b = ZONA_BARRIO[perfil.zonas]; if (b) sp.set("barrio", b);
  const a = AMB_FILTRO[perfil.ambientes]; if (a) sp.set("amb", a);
  const qs = sp.toString();
  return "/desarrollos-inmobiliarios/" + (qs ? "?" + qs : "");
}

function readPerfil() { try { return JSON.parse(localStorage.getItem("dpp_perfil_v1")) || {}; } catch { return {}; } }
function leerFavoritos() { try { return (JSON.parse(localStorage.getItem("dpp_favoritos_v1")) || []).map((x) => x.nombre).filter(Boolean); } catch { return []; } }
async function persistPerfil(data) {
  const clean = { ...data, ts: Date.now() };
  try { localStorage.setItem("dpp_perfil_v1", JSON.stringify(clean)); } catch {}
  if (authEnabled) { try { const { data: u } = await supabase.auth.getUser(); const uid = u?.user?.id; if (uid) await supabase.from("perfiles").upsert({ user_id: uid, data: clean }); } catch {} }
}

// Interpretación de mensajes libres (groserías / mail válido) — Sofía amable y con humor.
const MALAS = ["puta", "puto", "concha", "mierda", "forro", "forra", "pelotudo", "boludo", "idiota", "estupido", "pajero", "sorete", "gil", "imbecil", "carajo", "joder", "trolo", "fuck", "shit", "bitch", "asshole", "wtf"];
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function tieneGroseria(s) { const t = norm(s); return MALAS.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t)); }
function extraerMail(s) { return (String(s || "").match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [""])[0]; }
function extraerWpp(s) { return ((String(s || "").match(/\d/g) || []).length >= 6) ? String(s).trim() : ""; }
// ¿El texto guardado parece un nombre real? (para no saludar con basura o groserías viejas)
function esNombreValido(s) {
  const t = String(s || "").trim();
  if (t.length < 2 || t.length > 40) return false;
  if (/https?:|www\.|@|\d{4,}/i.test(t)) return false;
  if ((t.match(/[a-záéíóúñ]/gi) || []).length < 2) return false;
  return true;
}

function resumen(k) {
  const parts = [];
  if (k.ambientes) parts.push(String(k.ambientes).toLowerCase());
  if (k.zonas && k.zonas !== "Abierto a sugerencias") parts.push("en " + k.zonas);
  return parts.join(" ");
}

export default function AsesorChat({ proyectoNombre = "", proyectoSlug = "", onClose = null }) {
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(true);
  const [modo, setModo] = useState(proyectoNombre ? "lead" : "buscador");
  const [etapa, setEtapa] = useState(null);       // 'engage' | 'enrich' | 'buscar'
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [perfil, setPerfil] = useState({});
  const [fase, setFase] = useState("intro");      // intro | chat | email | whatsapp | okBuscar | ok | error
  const [txt, setTxt] = useState("");
  const [gotcha, setGotcha] = useState("");
  const [proyecto, setProyecto] = useState(proyectoNombre || "");
  const [buscarUrl, setBuscarUrl] = useState("/desarrollos-inmobiliarios/");
  const [alertaOk, setAlertaOk] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);
  const perfilRef = useRef({});   // fuente de verdad del perfil (merge known + respuestas + contacto)
  const knownRef = useRef({});
  const leadRef = useRef({ sent: false, snap: "" });

  const say = (text, delay = 850) => new Promise((resolve) => {
    setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { s: "a", t: text }]); setTyping(false); resolve(); }, delay);
  });
  const setPerfilAll = (data) => { perfilRef.current = data; setPerfil(data); };

  // Envía / actualiza el lead por Formsubmit. tipo: 'parcial' | 'final' | 'alerta'. Evita duplicados idénticos.
  async function mandarLead(data, tipo) {
    const email = (data.email || "").trim();
    const whatsapp = (data.whatsapp || "").trim();
    if (!email && !whatsapp) return; // sin contacto no hay lead
    const snap = JSON.stringify({ email, whatsapp, objetivo: data.objetivo, zonas: data.zonas, ambientes: data.ambientes, presupuesto: data.presupuesto, proyecto });
    if (leadRef.current.sent && leadRef.current.snap === snap) return; // nada nuevo
    const subj = tipo === "alerta" ? "Nueva alerta de búsqueda (asesor)" : (leadRef.current.sent ? "Perfil de comprador (actualizado)" : "Nuevo perfil de comprador (asesor)");
    const payload = { _subject: subj, _template: "table", _captcha: "false", _cc: "contacto@departamentosenpozo.com.ar", Email: email || "—", WhatsApp: whatsapp || "—" };
    // Speed-to-lead: confirmación automática AL INTERESADO (solo la 1ª vez, para no repetir).
    if (email && !leadRef.current.sent) {
      payload._replyto = email;
      payload._autoresponse = `¡Hola! Gracias por tu interés${proyecto ? ` en ${proyecto}` : ""}. Recibimos tus datos y te vamos a contactar a la brevedad con precios actualizados, disponibilidad y formas de pago. Si querés, respondé este mail con tus dudas. — Equipo Departamentos en Pozo`;
    }
    PASOS.forEach((p) => { payload[ETIQUETAS[p.key]] = data[p.key] || "—"; });
    const guardados = leerFavoritos();
    payload["Proyectos guardados"] = guardados.length ? guardados.join(", ") : "ninguno aún";
    if (proyecto) payload["Proyecto de interés"] = proyecto;
    payload["Origen"] = tipo === "alerta" ? "Buscador · alerta" : (proyecto ? "Ficha · quiero más info" : "Asesor · perfil");
    try {
      await fetch("https://formsubmit.co/ajax/dema2910@gmail.com", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      // Además del mail: registramos el lead en la planilla (Google Sheet vía Apps Script).
      try {
        fetch("https://script.google.com/macros/s/AKfycbxQYPNfcKOdHuATx7f7XvXKFPJ7eVvmD7EJwJmSqN4C6PXZIauk59dOgwQE3nMlYvZf0Q/exec", {
          method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            origen: payload["Origen"], tipo,
            nombre: data.nombre || "", email, whatsapp,
            proyecto: proyecto || "", zonas: data.zonas || "", ambientes: data.ambientes || "",
            presupuesto: data.presupuesto || "", mensaje: data.objetivo || "",
          }),
        });
      } catch {}
      leadRef.current = { sent: true, snap };
      track("lead", { tipo, origen: tipo === "alerta" ? "buscador" : (proyecto ? "ficha" : "asesor"), proyecto: proyecto || "" });
    } catch {}
  }

  useEffect(() => {
    if (started.current) return; started.current = true;
    let n = proyectoNombre;
    if (!n) { try { n = new URLSearchParams(window.location.search).get("nombre") || ""; } catch {} }
    track("chat_open", { modo: n ? "lead" : "buscador", proyecto: n || "" });
    const known = readPerfil();
    knownRef.current = known;
    perfilRef.current = { ...known };
    setPerfil({ ...known });
    // Nombre guardado: solo lo usamos para saludar si es válido (no grosería ni basura).
    const nombreOk = known.nombre && esNombreValido(known.nombre) && !tieneGroseria(known.nombre);
    const first = nombreOk ? String(known.nombre).split(" ")[0] : "";

    (async () => {
      if (n) {
        setModo("lead"); setProyecto(n);
        const saludo = first ? `¡Hola de nuevo, ${first}!` : "Hola, soy Sofía.";
        if (known.email) {
          // Ya lo conocemos: disparamos el lead directo y pasamos a los datos opcionales.
          await say(`${saludo} Le aviso a la desarrolladora de ${n} que seguís interesado así te contactan.`, 400);
          await mandarLead({ ...perfilRef.current, email: known.email }, "parcial");
          startEnrich();
        } else {
          // Un solo mensaje: saludo + valor + pedido de mail. Cero fricción previa.
          setFase("email");
          await say(`${saludo} Te paso precios, disponibilidad y formas de pago de ${n} directo de la desarrolladora. ¿A qué mail te los envío?`, 400);
        }
      } else {
        setModo("buscador");
        if (first) await say(`¡Hola de nuevo, ${first}!`, 400);
        else await say("Hola, soy Sofía.", 400);
        const q = BUSCADOR.filter((p) => !known[p.key]);
        if (q.length === 0) {
          setBuscarUrl(urlBuscador(known));
          const r = resumen(known);
          await say(r ? `La última vez buscabas ${r}. Te muestro esos.` : "Te muestro los proyectos que tenemos.", 850);
          setFase("okBuscar");
        } else {
          if (q.length < BUSCADOR.length) await say("Retomo lo que ya me contaste, me falta un dato.", 750);
          else await say("Te ayudo a ver listados de lo que estás buscando. Un par de preguntas cortas.", 750);
          setEtapa("buscar"); setQueue(q); setIdx(0); setFase("chat");
          await say(q[0].p, 700);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => { requestAnimationFrame(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }); };
  useEffect(() => {
    scrollToBottom();
    if ((fase === "email" || fase === "whatsapp") && !typing && inputRef.current) inputRef.current.focus();
  }, [msgs, typing, fase, idx]);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const on = () => scrollToBottom();
    vv.addEventListener("resize", on); vv.addEventListener("scroll", on);
    return () => { vv.removeEventListener("resize", on); vv.removeEventListener("scroll", on); };
  }, []);

  // ── Pedido de EMAIL (enmarcado como valor) ─────────────────────────────────
  async function pedirEmail() {
    const k = knownRef.current;
    if (k.email) { // ya lo tenemos → lead parcial y a enriquecer
      await mandarLead({ ...perfilRef.current, email: k.email }, "parcial");
      await say("Ya le avisé a la desarrolladora tu interés. Te hago un par de preguntas para pasarles y ayudarte mejor.", 900);
      startEnrich();
    } else {
      setFase("email");
      await say(`Vamos a avisarle a la desarrolladora que te interesó ${proyecto || "este proyecto"}, así te contactan. ¿A qué mail te escriben?`, 850);
    }
  }
  async function enviarEmail(e) {
    e.preventDefault(); if (gotcha) return;
    const val = txt.trim(); if (!val || typing) return;
    setTxt("");
    const mail = extraerMail(val);
    if (!mail) {
      setMsgs((m) => [...m, { s: "u", t: val }]);
      await say(tieneGroseria(val) ? "Jaja, igual necesito un mail válido (con @) para que te contacten." : "Mmm, ese mail no me cierra. ¿Me lo pasás con @?", 550);
      return;
    }
    setMsgs((m) => [...m, { s: "u", t: mail }]);
    const data = { ...perfilRef.current, email: mail };
    setPerfilAll(data); persistPerfil(data);
    track("chat_email", { origen: proyecto ? "ficha" : "asesor" });
    await mandarLead(data, "parcial");
    await say("¡Listo! Ya le avisé a la desarrolladora tu interés, te van a contactar. ¿Querés dejar también un WhatsApp? (opcional)", 900);
    setFase("whatsapp");
  }
  async function omitirEmail() {
    if (typing) return;
    setMsgs((m) => [...m, { s: "u", t: "Ahora no" }]);
    await say("Sin drama. Igual te muestro los proyectos que te pueden interesar.", 700);
    startEnrich();
  }

  // ── WhatsApp opcional ──────────────────────────────────────────────────────
  async function enviarWhatsapp(e) {
    e.preventDefault(); if (gotcha) return;
    const val = txt.trim(); if (!val || typing) return;
    setTxt("");
    const wpp = extraerWpp(val);
    if (!wpp) { setMsgs((m) => [...m, { s: "u", t: val }]); await say("Ese no parece un WhatsApp. Pasámelo con característica, o seguimos sin eso.", 550); return; }
    setMsgs((m) => [...m, { s: "u", t: wpp }]);
    const data = { ...perfilRef.current, whatsapp: wpp };
    setPerfilAll(data); persistPerfil(data);
    await mandarLead(data, "parcial");
    await say("¡Genial! Te hago un par de preguntas más para pasarle a la desarrolladora (o cerramos cuando quieras).", 850);
    startEnrich();
  }
  async function omitirWhatsapp() {
    if (typing) return;
    setMsgs((m) => [...m, { s: "u", t: "Seguir sin WhatsApp" }]);
    await say("Perfecto. Un par de preguntas y listo.", 700);
    startEnrich();
  }

  // ── Enriquecimiento (opcional) ─────────────────────────────────────────────
  async function startEnrich() {
    const pend = ENRICH.filter((p) => !perfilRef.current[p.key]);
    if (!pend.length) { cerrarLead(); return; }
    setEtapa("enrich"); setQueue(pend); setIdx(0); setFase("chat");
    await say(pend[0].p, 650);
  }
  function elegir(label, value) {
    if (typing) return;
    const paso = queue[idx]; if (!paso) return;
    const data = { ...perfilRef.current, [paso.key]: value };
    setPerfilAll(data);
    setMsgs((m) => [...m, { s: "u", t: label }]);
    const next = idx + 1; setIdx(next);
    (async () => { if (next < queue.length) { await say(queue[next].p); return; } await finQueue(data); })();
  }
  function saltar() {
    if (typing) return;
    setMsgs((m) => [...m, { s: "u", t: "Prefiero no decir" }]);
    const next = idx + 1; setIdx(next);
    (async () => { if (next < queue.length) { await say(queue[next].p); return; } await finQueue(perfilRef.current); })();
  }
  function terminarEnrich() { if (typing) return; cerrarLead(); }

  async function finQueue(data) {
    persistPerfil(data);
    if (etapa === "buscar") {
      setBuscarUrl(urlBuscador(data));
      await say("¡Listo! Acá tenés los proyectos con lo que me dijiste.", 700);
      setFase("okBuscar");
      return;
    }
    cerrarLead(); // enrich
  }
  async function cerrarLead() {
    const data = perfilRef.current;
    persistPerfil(data);
    await mandarLead(data, "final");
    if (proyecto) { await say("¡Listo! Ya le pasé todo a la desarrolladora, te van a contactar. Guardé tu búsqueda en Mi selección.", 850); setFase("ok"); }
    else { setBuscarUrl(urlBuscador(data)); await say("¡Listo! Acá tenés los proyectos que te pueden interesar.", 800); setFase("okBuscar"); }
  }

  // ── Alerta por mail al final del buscador (opcional) ───────────────────────
  async function enviarAlerta(e) {
    e.preventDefault(); if (gotcha) return;
    const val = txt.trim(); if (!val || typing) return;
    const mail = extraerMail(val);
    if (!mail) { setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]); await say("Ese mail no me cierra. ¿Me lo pasás con @? (o dejalo y listo)", 550); return; }
    setTxt("");
    const data = { ...perfilRef.current, email: mail };
    setPerfilAll(data); persistPerfil(data);
    track("alerta_email", {});
    await mandarLead(data, "alerta");
    setAlertaOk(true);
  }

  async function reiniciar() {
    knownRef.current = {}; perfilRef.current = {}; setPerfil({}); leadRef.current = { sent: false, snap: "" }; setAlertaOk(false);
    const base = modo === "buscador" ? BUSCADOR : ENRICH;
    setEtapa(modo === "buscador" ? "buscar" : "enrich"); setQueue(base); setIdx(0); setFase("chat");
    await say("Dale, arranquemos de cero.", 400);
    await say(base[0].p, 600);
  }

  const total = queue.length || 1;
  const progreso = fase === "chat" ? `Paso ${Math.min(idx + 1, total)} de ${total}` : (fase === "email" || fase === "whatsapp" ? "Un dato y seguimos" : ((fase === "ok" || fase === "okBuscar") ? "¡Listo!" : "Encantada de ayudarte"));
  const escapeUrl = urlBuscador(perfil);

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

      {/* Conversación */}
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

      {/* Caja de respuesta fija abajo */}
      <div className="shrink-0 border-t border-outline-variant bg-surface">
        {fase === "chat" && !typing && idx < queue.length && (
          <div className="p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {queue[idx].o.map(([label, value]) => (
                <button key={value} type="button" onClick={() => elegir(label, value)} className="text-[13px] px-3.5 py-2 rounded-full border border-outline-variant text-primary hover:border-secondary hover:bg-surface-container-low transition-colors">{label}</button>
              ))}
            </div>
            <div className="flex items-center gap-4 pt-0.5">
              {etapa !== "buscar" && (
                <button type="button" onClick={saltar} className="text-[12.5px] text-on-surface-variant underline underline-offset-2 hover:text-primary">Saltar</button>
              )}
              {etapa === "enrich" && (
                <button type="button" onClick={terminarEnrich} className="text-[12.5px] text-secondary underline underline-offset-2 hover:no-underline">Listo, con esto alcanza</button>
              )}
              {etapa === "buscar" && (
                <Link href={escapeUrl} onClick={() => { track("ver_listado", { origen: "chat_escape" }); onClose && onClose(); }} className="text-[12.5px] text-secondary underline underline-offset-2 hover:no-underline">Prefiero ver el listado →</Link>
              )}
            </div>
          </div>
        )}

        {(fase === "email" || fase === "whatsapp") && (
          <form onSubmit={fase === "email" ? enviarEmail : enviarWhatsapp} className="p-3">
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={txt} onChange={(e) => setTxt(e.target.value)} disabled={typing}
                onFocus={() => setTimeout(scrollToBottom, 320)}
                inputMode={fase === "email" ? "email" : "tel"}
                placeholder={fase === "email" ? "tucorreo@mail.com" : "Tu WhatsApp con característica…"}
                className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={typing || !txt.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2 px-1">
              <button type="button" onClick={fase === "email" ? omitirEmail : omitirWhatsapp} className="text-[12.5px] text-on-surface-variant underline underline-offset-2 hover:text-primary">
                {fase === "email" ? "Prefiero no dejar mail" : "Seguir sin WhatsApp"}
              </button>
              <span className="text-[11px] text-on-surface-variant">No lo compartimos con terceros.</span>
            </div>
            <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          </form>
        )}

        {fase === "error" && (
          <div className="p-3 flex items-center justify-center gap-3 flex-wrap">
            <button type="button" onClick={() => cerrarLead()} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
            </button>
            <Link href="/mi-seleccion/" className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Ver mi selección</Link>
          </div>
        )}

        {fase === "okBuscar" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={buscarUrl} onClick={() => { track("ver_listado", { origen: "chat_cta" }); onClose && onClose(); }} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-[18px]">search</span> Ver los proyectos
              </Link>
              <button type="button" onClick={reiniciar} className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Buscar otra cosa</button>
            </div>
            {/* Alerta por mail (opcional) */}
            {!leadRef.current.sent && !alertaOk ? (
              <form onSubmit={enviarAlerta} className="pt-2 border-t border-outline-variant">
                <p className="text-[13px] text-on-surface-variant mb-2">¿Te aviso cuando entre algo así? Dejame tu mail (opcional).</p>
                <div className="flex items-center gap-2">
                  <input value={txt} onChange={(e) => setTxt(e.target.value)} inputMode="email" placeholder="tucorreo@mail.com"
                    className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary" />
                  <button type="submit" disabled={!txt.trim()} className="shrink-0 rounded-full bg-secondary-container text-primary px-4 h-11 text-[13px] hover:opacity-90 transition disabled:opacity-50">Avisame</button>
                </div>
                <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              </form>
            ) : alertaOk ? (
              <p className="text-[13px] text-secondary text-center pt-2 border-t border-outline-variant">Listo, te aviso cuando entre algo de tu interés.</p>
            ) : null}
          </div>
        )}

        {fase === "ok" && (
          <div className="p-4 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/mi-seleccion/" onClick={() => onClose && onClose()} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
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
