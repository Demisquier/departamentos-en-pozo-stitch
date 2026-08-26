"use client";
// app/asesor/AsesorChat.jsx — Asesora "Sofía" (sin IA). Rediseño lead-quality (2026-08-25):
// APRENDIZAJE de los leads reales: ~45% quedaban solo-email (sin objetivo/zona/WhatsApp) y
// ~20% eran del rubro (inmobiliarias). Cambios:
//  1) GATE al inicio: ¿particular o del rubro? → limpia data + abre canal B2B.
//  2) OBJETIVO (vivir/invertir) se capta ANTES del contacto (1 tap, sin fricción).
//  3) WhatsApp es el pedido PRIMARIO ("¿a qué WhatsApp te paso precio y cuota?"), el mail es
//     fallback; después se pide el otro contacto (opcional). Speed-to-lead: se dispara el lead
//     apenas hay UN contacto.
// MEMORIA: lee el perfil guardado (localStorage + nube) y no re-pregunta lo sabido.
// Lead por Formsubmit vía /api/lead: primario dema2910@, _cc contacto@departamentosenpozo.com.ar.
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase, authEnabled } from "../../lib/supabase";
import { track } from "../../lib/track";

const PASOS = [
  { key: "objetivo", p: "¿Es para vivir o para invertir?", o: [["Para vivir", "Vivienda propia"], ["Inversión / renta", "Inversión / renta"], ["Las dos", "Vivienda + inversión"]] },
  { key: "zonas", p: "¿En qué zona te gustaría?", o: [["Caballito", "Caballito"], ["Villa Urquiza", "Villa Urquiza"], ["Palermo", "Palermo"], ["Belgrano / Núñez", "Belgrano / Núñez"], ["Me da igual", "Abierto a sugerencias"]] },
  { key: "ambientes", p: "¿Qué tamaño buscás?", o: [["Monoambiente", "Monoambiente"], ["2 amb", "2 ambientes"], ["3 amb", "3 ambientes"], ["Más grande", "3+ ambientes"]] },
  { key: "presupuesto", p: "¿Presupuesto aproximado? (USD)", o: [["Hasta 120k", "≤ USD 120k"], ["120–180k", "USD 120k–180k"], ["180–250k", "USD 180k–250k"], ["+250k", "USD 250k+"], ["Lo charlamos", "A conversar"]] },
];
const BUSCADOR = PASOS;                  // buscador: objetivo + zona + ambientes + presupuesto
const ENRICH = PASOS;
const ETIQUETAS = { objetivo: "Objetivo", zonas: "Zonas", ambientes: "Tipología", presupuesto: "Presupuesto" };

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

const MALAS = ["puta", "puto", "concha", "mierda", "forro", "forra", "pelotudo", "boludo", "idiota", "estupido", "pajero", "sorete", "gil", "imbecil", "carajo", "joder", "trolo", "fuck", "shit", "bitch", "asshole", "wtf"];
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function tieneGroseria(s) { const t = norm(s); return MALAS.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t)); }
function extraerMail(s) { return (String(s || "").match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [""])[0]; }
function extraerWpp(s) { return ((String(s || "").match(/\d/g) || []).length >= 6) ? String(s).trim() : ""; }
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

export default function AsesorChat({ proyectoNombre = "", proyectoSlug = "", pedido = "", onClose = null }) {
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(true);
  const [modo, setModo] = useState(proyectoNombre ? "lead" : "buscador");
  const [etapa, setEtapa] = useState(null);       // 'buscar' | 'preContacto' | 'enrich'
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [perfil, setPerfil] = useState({});
  const [fase, setFase] = useState("intro");      // intro | rubro | chat | contacto | contacto2 | okBuscar | ok | error
  const [txt, setTxt] = useState("");
  const [gotcha, setGotcha] = useState("");
  const [b2b, setB2b] = useState(false);          // flujo inmobiliaria/rubro
  const [proyecto, setProyecto] = useState(proyectoNombre || "");
  const [buscarUrl, setBuscarUrl] = useState("/desarrollos-inmobiliarios/");
  const [alertaOk, setAlertaOk] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);
  const perfilRef = useRef({});
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
    const snap = JSON.stringify({ email, whatsapp, objetivo: data.objetivo, zonas: data.zonas, ambientes: data.ambientes, presupuesto: data.presupuesto, tipoContacto: data.tipoContacto, proyecto });
    if (leadRef.current.sent && leadRef.current.snap === snap) return;
    const esInmo = data.tipoContacto === "inmobiliaria";
    const subj = esInmo ? "Consulta de inmobiliaria / rubro (asesor)" : (tipo === "alerta" ? "Nueva alerta de búsqueda (asesor)" : (leadRef.current.sent ? "Perfil de comprador (actualizado)" : "Nuevo perfil de comprador (asesor)"));
    const payload = { _subject: subj, _template: "table", _captcha: "false", _cc: "contacto@departamentosenpozo.com.ar", Email: email || "—", WhatsApp: whatsapp || "—" };
    if (email && !leadRef.current.sent) {
      payload._replyto = email;
      payload._autoresponse = esInmo
        ? `¡Hola! Gracias por escribir. Recibimos tu consulta como inmobiliaria/broker y te contactamos para ver cómo trabajamos juntos. — Equipo Departamentos en Pozo`
        : `¡Hola! Gracias por tu consulta${proyecto ? ` sobre ${proyecto}` : ""}. Ya la recibimos y en breve te escribimos con precio, disponibilidad y formas de pago. Cualquier duda, respondé este mail. — Equipo Departamentos en Pozo`;
    }
    payload["Tipo de contacto"] = esInmo ? "Inmobiliaria / rubro" : "Particular";
    PASOS.forEach((p) => { payload[ETIQUETAS[p.key]] = data[p.key] || "—"; });
    const guardados = leerFavoritos();
    payload["Proyectos guardados"] = guardados.length ? guardados.join(", ") : "ninguno aún";
    if (proyecto) payload["Proyecto de interés"] = proyecto;
    payload["Origen"] = esInmo ? "B2B · inmobiliaria" : (tipo === "alerta" ? "Buscador · alerta" : (proyecto ? "Ficha · quiero más info" : "Asesor · perfil"));
    try {
      const sheet = {
        origen: payload["Origen"], tipo,
        nombre: data.nombre || "", email, whatsapp,
        tipoContacto: data.tipoContacto || "particular",
        proyecto: proyecto || "", proyectoSlug: proyectoSlug || "", zonas: data.zonas || "", ambientes: data.ambientes || "",
        presupuesto: data.presupuesto || "", mensaje: data.objetivo || "",
      };
      await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mail: payload, sheet }) });
      leadRef.current = { sent: true, snap };
      track("lead", { tipo, origen: payload["Origen"], proyecto: proyecto || "" });
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
    if (known.tipoContacto === "inmobiliaria") setB2b(true);
    const nombreOk = known.nombre && esNombreValido(known.nombre) && !tieneGroseria(known.nombre);
    const first = nombreOk ? String(known.nombre).split(" ")[0] : "";

    (async () => {
      const saludo = first ? `¡Hola de nuevo, ${first}!` : "Hola, soy Sofía.";
      if (n) {
        setModo("lead"); setProyecto(n);
        // Usuario que vuelve y ya dejó contacto → disparamos interés y empujamos lo que falte.
        if (known.email || known.whatsapp) {
          await say(`${saludo} Le aviso a la desarrolladora de ${n} que seguís interesado, así te contactan.`, 400);
          await mandarLead({ ...perfilRef.current }, "parcial");
          if (!known.whatsapp) { setFase("contacto2"); await say("¿Me dejás un WhatsApp para que te escriban más rápido? (opcional)", 800); }
          else { setFase("ok"); await say("Ya está, te van a contactar. Lo guardé también en tu Plan.", 800); }
          return;
        }
        // Nuevo: saludo con valor + gate de rubro.
        await say(`${saludo} ${pedido ? `Te consigo ${pedido} de ${n}` : `Te paso precio, disponibilidad y cuota de ${n}`} directo de la desarrolladora.`, 400);
        if (known.tipoContacto) { await seguirComo(known.tipoContacto, true); }
        else { setFase("rubro"); await say("Para pasarte lo justo: ¿buscás para vos o sos del rubro inmobiliario?", 700); }
      } else {
        setModo("buscador");
        await say(saludo, 400);
        if (known.tipoContacto) { await seguirComo(known.tipoContacto, false); }
        else { setFase("rubro"); await say("Antes de arrancar: ¿buscás para vos o sos del rubro inmobiliario?", 700); }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => { requestAnimationFrame(() => { requestAnimationFrame(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }); }); };
  useEffect(() => {
    scrollToBottom();
    if ((fase === "contacto" || fase === "contacto2") && !typing && inputRef.current) inputRef.current.focus();
  }, [msgs, typing, fase, idx]);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const on = () => scrollToBottom();
    vv.addEventListener("resize", on); vv.addEventListener("scroll", on);
    return () => { vv.removeEventListener("resize", on); vv.removeEventListener("scroll", on); };
  }, []);

  // ── GATE particular / inmobiliaria ─────────────────────────────────────────
  async function elegirRubro(tipo, label) {
    if (typing) return;
    setMsgs((m) => [...m, { s: "u", t: label }]);
    const data = { ...perfilRef.current, tipoContacto: tipo };
    setPerfilAll(data); persistPerfil(data);
    setB2b(tipo === "inmobiliaria");
    await seguirComo(tipo);
  }
  async function seguirComo(tipo, isLead = (modo === "lead")) {
    if (tipo === "inmobiliaria") {
      setB2b(true);
      setFase("contacto");
      await say("¡Buenísimo! Trabajamos con inmobiliarias y brokers. Dejame tu mail y te contactamos para ver cómo sumamos tus proyectos o trabajamos juntos.", 800);
      return;
    }
    // Particular
    if (isLead) {
      const pend = BUSCADOR.filter((p) => p.key === "objetivo" && !perfilRef.current[p.key]);
      if (pend.length) { setEtapa("preContacto"); setQueue(pend); setIdx(0); setFase("chat"); await say(pend[0].p, 650); }
      else { await irAContacto(); }
    } else {
      const q = BUSCADOR.filter((p) => !perfilRef.current[p.key]);
      if (!q.length) { setBuscarUrl(urlBuscador(perfilRef.current)); await say(resumen(perfilRef.current) ? `Buscás ${resumen(perfilRef.current)}. Te muestro esos.` : "Te muestro los proyectos que tenemos.", 800); setFase("okBuscar"); }
      else { setEtapa("buscar"); setQueue(q); setIdx(0); setFase("chat"); await say(q[0].p, 700); }
    }
  }

  async function irAContacto() {
    setFase("contacto");
    await say(`Genial. ¿A qué WhatsApp te paso precio, disponibilidad y cuota${proyecto ? ` de ${proyecto}` : ""}? Si preferís, dejame un mail.`, 750);
  }

  // ── CONTACTO primario (WhatsApp o mail) ────────────────────────────────────
  async function enviarContacto(e) {
    e.preventDefault(); if (gotcha) return;
    const val = txt.trim(); if (!val || typing) return;
    const mail = extraerMail(val);
    const wpp = mail ? "" : extraerWpp(val);
    if (b2b) {
      if (!mail) { setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]); await say("Para el contacto del rubro necesito un mail válido (con @).", 550); return; }
      setTxt(""); setMsgs((m) => [...m, { s: "u", t: mail }]);
      const data = { ...perfilRef.current, email: mail };
      setPerfilAll(data); persistPerfil(data);
      track("chat_email", { origen: "b2b" });
      await mandarLead(data, "final");
      await say("¡Gracias! Te contactamos a la brevedad para trabajar juntos.", 800);
      setFase("ok");
      return;
    }
    if (!mail && !wpp) {
      setMsgs((m) => [...m, { s: "u", t: val }]);
      await say(tieneGroseria(val) ? "Jaja, en serio: pasame un WhatsApp (con característica) o un mail con @." : "Mmm, eso no me cierra. Pasame un WhatsApp con característica o un mail con @.", 550);
      setTxt(""); return;
    }
    setTxt("");
    setMsgs((m) => [...m, { s: "u", t: mail || wpp }]);
    const data = { ...perfilRef.current, ...(mail ? { email: mail } : { whatsapp: wpp }) };
    setPerfilAll(data); persistPerfil(data);
    track(mail ? "chat_email" : "chat_whatsapp", { origen: proyecto ? "ficha" : "asesor" });
    await mandarLead(data, "parcial");
    // Pedimos el OTRO contacto (opcional) — WhatsApp es el que más acelera el cierre.
    if (mail) {
      setFase("contacto2");
      await say("¡Listo! Ya avisé a la desarrolladora. ¿Me dejás un WhatsApp así te escriben más rápido? (opcional)", 850);
    } else {
      setFase("contacto2");
      await say("¡Genial! Ya avisé a la desarrolladora, te van a escribir. ¿Me dejás un mail también? (opcional)", 850);
    }
  }
  async function omitirContacto() {
    if (typing) return;
    if (b2b) { setMsgs((m) => [...m, { s: "u", t: "Ahora no" }]); await say("Sin drama. Cuando quieras nos escribís.", 650); setFase("ok"); return; }
    setMsgs((m) => [...m, { s: "u", t: "Prefiero no dejar contacto" }]);
    await say("Sin drama. Igual te muestro los proyectos que te pueden interesar.", 700);
    setBuscarUrl(urlBuscador(perfilRef.current)); setFase("okBuscar");
  }

  // ── CONTACTO secundario (el que falte) ─────────────────────────────────────
  async function enviarContacto2(e) {
    e.preventDefault(); if (gotcha) return;
    const val = txt.trim(); if (!val || typing) return;
    const mail = extraerMail(val);
    const wpp = mail ? "" : extraerWpp(val);
    if (!mail && !wpp) { setMsgs((m) => [...m, { s: "u", t: val }]); await say("Ese dato no me cierra. Pasámelo bien o seguimos sin eso.", 500); setTxt(""); return; }
    setTxt("");
    setMsgs((m) => [...m, { s: "u", t: mail || wpp }]);
    const data = { ...perfilRef.current, ...(mail ? { email: mail } : { whatsapp: wpp }) };
    setPerfilAll(data); persistPerfil(data);
    await mandarLead(data, "parcial");
    await cerrarLead();
  }
  async function omitirContacto2() {
    if (typing) return;
    setMsgs((m) => [...m, { s: "u", t: "Así está bien" }]);
    await cerrarLead();
  }

  // ── Enriquecimiento (chips: objetivo/zona/amb/presupuesto) ──────────────────
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
    if (etapa === "buscar") { setBuscarUrl(urlBuscador(data)); await say("¡Listo! Acá tenés los proyectos con lo que me dijiste.", 700); setFase("okBuscar"); return; }
    if (etapa === "preContacto") { await irAContacto(); return; }
    cerrarLead();
  }
  async function cerrarLead() {
    const data = perfilRef.current;
    persistPerfil(data);
    await mandarLead(data, "final");
    if (proyecto || modo === "lead") { await say("¡Listo! Ya le pasé todo a la desarrolladora, te van a contactar. Lo guardé en tu Plan.", 850); setFase("ok"); }
    else { setBuscarUrl(urlBuscador(data)); await say("¡Listo! Acá tenés los proyectos que te pueden interesar.", 800); setFase("okBuscar"); }
  }

  // ── Alerta por mail/WhatsApp al final del buscador (opcional) ───────────────
  async function enviarAlerta(e) {
    e.preventDefault(); if (gotcha) return;
    const val = txt.trim(); if (!val || typing) return;
    const mail = extraerMail(val);
    const wpp = mail ? "" : extraerWpp(val);
    if (!mail && !wpp) { setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]); await say("Pasame un WhatsApp o un mail con @ (o dejalo y listo).", 550); return; }
    setTxt("");
    const data = { ...perfilRef.current, ...(mail ? { email: mail } : { whatsapp: wpp }) };
    setPerfilAll(data); persistPerfil(data);
    track(mail ? "alerta_email" : "alerta_whatsapp", {});
    await mandarLead(data, "alerta");
    setAlertaOk(true);
  }

  async function reiniciar() {
    knownRef.current = {}; perfilRef.current = {}; setPerfil({}); leadRef.current = { sent: false, snap: "" }; setAlertaOk(false); setB2b(false);
    setEtapa("buscar"); setQueue(BUSCADOR); setIdx(0); setFase("chat");
    await say("Dale, arranquemos de cero.", 400);
    await say(BUSCADOR[0].p, 600);
  }

  const total = queue.length || 1;
  const progreso = fase === "chat" ? `Paso ${Math.min(idx + 1, total)} de ${total}` : (fase === "contacto" || fase === "contacto2" ? "Un dato y seguimos" : ((fase === "ok" || fase === "okBuscar") ? "¡Listo!" : "Encantada de ayudarte"));
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
        {fase === "rubro" && !typing && (
          <div className="p-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => elegirRubro("particular", "Busco para mí")} className="text-[13px] px-4 py-2.5 rounded-full bg-primary-container text-on-primary hover:opacity-90 transition">Busco para mí</button>
            <button type="button" onClick={() => elegirRubro("inmobiliaria", "Soy del rubro (inmobiliaria/broker)")} className="text-[13px] px-4 py-2.5 rounded-full border border-outline-variant text-primary hover:border-secondary transition-colors">Soy inmobiliaria / broker</button>
          </div>
        )}

        {fase === "chat" && !typing && idx < queue.length && (
          <div className="p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              {queue[idx].o.map(([label, value]) => (
                <button key={value} type="button" onClick={() => elegir(label, value)} className="text-[13px] px-3.5 py-2 rounded-full border border-outline-variant text-primary hover:border-secondary hover:bg-surface-container-low transition-colors">{label}</button>
              ))}
            </div>
            <div className="flex items-center gap-4 pt-0.5">
              {etapa === "enrich" && (
                <>
                  <button type="button" onClick={saltar} className="text-[12.5px] text-on-surface-variant underline underline-offset-2 hover:text-primary">Saltar</button>
                  <button type="button" onClick={terminarEnrich} className="text-[12.5px] text-secondary underline underline-offset-2 hover:no-underline">Listo, con esto alcanza</button>
                </>
              )}
              {etapa === "buscar" && (
                <Link href={escapeUrl} onClick={() => { track("ver_listado", { origen: "chat_escape" }); onClose && onClose(); }} className="text-[12.5px] text-secondary underline underline-offset-2 hover:no-underline">Prefiero ver el listado →</Link>
              )}
            </div>
          </div>
        )}

        {(fase === "contacto" || fase === "contacto2") && (
          <form onSubmit={fase === "contacto" ? enviarContacto : enviarContacto2} className="p-3">
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={txt} onChange={(e) => setTxt(e.target.value)} disabled={typing}
                onFocus={() => setTimeout(scrollToBottom, 320)}
                inputMode={b2b ? "email" : "text"}
                placeholder={b2b ? "tucorreo@mail.com" : (fase === "contacto" ? "Tu WhatsApp (o mail)…" : "Sumá el otro dato…")}
                className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={typing || !txt.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2 px-1">
              <button type="button" onClick={fase === "contacto" ? omitirContacto : omitirContacto2} className="text-[12.5px] text-on-surface-variant underline underline-offset-2 hover:text-primary">
                {fase === "contacto" ? (b2b ? "Ahora no" : "Prefiero no dejar contacto") : "Así está bien"}
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
            <Link href="/mi-seleccion/" className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Ver mi Plan</Link>
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
            {!leadRef.current.sent && !alertaOk ? (
              <form onSubmit={enviarAlerta} className="pt-2 border-t border-outline-variant">
                <p className="text-[13px] text-on-surface-variant mb-2">Te aviso por WhatsApp (o mail) apenas entra algo que encaje, antes que en los portales. ¿A qué te escribo?</p>
                <div className="flex items-center gap-2">
                  <input value={txt} onChange={(e) => setTxt(e.target.value)} inputMode="text" placeholder="Tu WhatsApp o mail…"
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
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span> Ver mi Plan
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
