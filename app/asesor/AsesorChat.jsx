"use client";
// app/asesor/AsesorChat.jsx — Asesora "Valentina" (sin IA). Rediseño CONVERSIÓN (2026-08-25):
// El negocio solo necesita 4 datos: NOMBRE, WHATSAPP, EMAIL y QUÉ PROYECTO le interesa.
// Nada de objetivo (vivir/invertir) ni gate particular/inmobiliaria: no aportan al negocio.
// Flujo mínimo (menos mensajes, todos apuntados al dato): saludo con valor → nombre →
// [proyecto/zona si es buscador] → WhatsApp → email. Speed-to-lead: dispara el lead apenas hay
// un contacto. MEMORIA: si ya conocemos los datos, no re-pregunta. Lead por Formsubmit vía
// /api/lead: primario contacto@departamentosenpozo.com.ar (dema2910 ya NO recibe leads).
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase, authEnabled } from "../../lib/supabase";
import { track } from "../../lib/track";

const BOT = "Valentina";

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
function primerNombre(s) { const t = String(s || "").trim().split(/\s+/)[0]; return t && esNombreValido(t) ? t : ""; }

// Campos que faltan, en orden. Buscador suma "interes" (qué proyecto/zona).
function camposFaltantes(esLead, k) {
  const orden = esLead ? ["nombre", "whatsapp", "email"] : ["nombre", "interes", "whatsapp", "email"];
  return orden.filter((c) => {
    if (c === "nombre") return !(k.nombre && esNombreValido(k.nombre));
    if (c === "interes") return !k.interes;
    return !k[c];
  });
}

export default function AsesorChat({ proyectoNombre = "", proyectoSlug = "", pedido = "", onClose = null }) {
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(true);
  const [modo, setModo] = useState(proyectoNombre ? "lead" : "buscador");
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [campo, setCampo] = useState(null);       // 'nombre' | 'interes' | 'whatsapp' | 'email'
  const [fase, setFase] = useState("intro");      // intro | input | okBuscar | ok | error
  const [txt, setTxt] = useState("");
  const [gotcha, setGotcha] = useState("");
  const [proyecto, setProyecto] = useState(proyectoNombre || "");
  const [buscarUrl, setBuscarUrl] = useState("/desarrollos-inmobiliarios/");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);
  const perfilRef = useRef({});
  const leadRef = useRef({ sent: false, snap: "" });

  const say = (text, delay = 700) => new Promise((resolve) => {
    setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { s: "a", t: text }]); setTyping(false); resolve(); }, delay);
  });
  const setPerfilAll = (data) => { perfilRef.current = data; };

  const promptDe = (c) => {
    const nombre = primerNombre(perfilRef.current.nombre);
    if (c === "nombre") return "Contame, ¿cómo te llamás?";
    if (c === "interes") return `${nombre ? `Bien, ${nombre}. ` : ""}¿Buscás algún proyecto o zona en particular? Si estás mirando, poné \"explorando\".`;
    if (c === "whatsapp") return `${nombre ? `Perfecto, ${nombre}. ` : "Perfecto. "}¿A qué WhatsApp te escribo? Es lo más rápido.`;
    if (c === "email") return "¿Y un email, por las dudas? Así no se pierde nada.";
    return "";
  };

  const promptBare = (c) => {
    if (c === "nombre") return "Contame, ¿cómo te llamás?";
    if (c === "interes") return "¿Buscás algún proyecto o zona en particular? Si estás mirando, poné 'explorando'.";
    if (c === "whatsapp") return "¿A qué WhatsApp te escribo? Es lo más rápido.";
    if (c === "email") return "¿Y un email, por las dudas? Así no se pierde nada.";
    return "";
  };

  async function preguntar(c) { setCampo(c); setFase("input"); await say(promptDe(c), 600); }

  // Lead a Formsubmit + Sheet. Solo los datos que importan: Nombre, WhatsApp, Email, Proyecto.
  async function mandarLead(data, tipo) {
    const email = (data.email || "").trim();
    const whatsapp = (data.whatsapp || "").trim();
    if (!email && !whatsapp) return;
    const proy = proyecto || data.interes || "";
    const snap = JSON.stringify({ nombre: data.nombre, email, whatsapp, proy });
    if (leadRef.current.sent && leadRef.current.snap === snap) return;
    const subj = leadRef.current.sent ? "Lead actualizado (asesor)" : "Nuevo lead (asesor)";
    const payload = { _subject: subj, _template: "table", _captcha: "false", Nombre: data.nombre || "—", WhatsApp: whatsapp || "—", Email: email || "—" };
    if (email && !leadRef.current.sent) {
      payload._replyto = email;
      payload._autoresponse = `¡Hola${data.nombre ? ` ${primerNombre(data.nombre) || data.nombre}` : ""}! Gracias por tu consulta${proy ? ` sobre ${proy}` : ""}. En breve te paso precio, cuota y formas de pago, por acá o por WhatsApp. Cualquier duda, respondé este mail. — Valentina · Departamentos en Pozo`;
    }
    payload["Proyecto de interés"] = proy || "—";
    const guardados = leerFavoritos();
    payload["Proyectos guardados"] = guardados.length ? guardados.join(", ") : "ninguno";
    payload["Origen"] = proyecto ? "Ficha · quiero más info" : "Asesor";
    try {
      const sheet = { origen: payload["Origen"], tipo, nombre: data.nombre || "", email, whatsapp, proyecto: proyecto || "", proyectoSlug: proyectoSlug || "", interes: data.interes || "", mensaje: proy };
      await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mail: payload, sheet }) });
      // Mail directo a Formsubmit desde el navegador: Formsubmit descarta los envíos server-side
      // (Vercel) al endpoint contacto@ recién activado, pero los del navegador (Origin del dominio) sí
      // entregan. El proxy /api/lead ya guardó el lead en la planilla; esto asegura la notificación por mail.
      if(false) try { await fetch("https://formsubmit.co/ajax/contacto@departamentosenpozo.com.ar" /* FormSubmit directo desactivado: el Apps Script ya manda 1 solo mail */, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) }); } catch {}
      leadRef.current = { sent: true, snap };
      track("lead", { tipo, origen: payload["Origen"], proyecto: proy });
    } catch {}
  }

  useEffect(() => {
    if (started.current) return; started.current = true;
    let n = proyectoNombre;
    if (!n) { try { n = new URLSearchParams(window.location.search).get("nombre") || ""; } catch {} }
    track("chat_open", { modo: n ? "lead" : "buscador", proyecto: n || "" });
    const known = readPerfil();
    perfilRef.current = { ...known };
    if (pedido && !perfilRef.current.pedido) perfilRef.current.pedido = pedido;
    const esLead = !!n;
    const first = primerNombre(known.nombre);

    (async () => {
      let intro;
      if (esLead) {
        setModo("lead"); setProyecto(n);
        intro = `¡Hola${first ? ` de nuevo, ${first}` : ""}! Soy ${BOT}. Te ayudo con ${pedido ? pedido : "precio, cuota y disponibilidad"} de ${n}: se lo pido al equipo comercial del proyecto y te lo paso.`;
      } else {
        setModo("buscador");
        intro = `¡Hola${first ? ` de nuevo, ${first}` : ""}! Soy ${BOT}. En dos o tres preguntas te muestro lo que encaja y te paso precios.`;
      }
      const q = camposFaltantes(esLead, known);
      if (!q.length) { // ya tenemos todo → dispara y cierra
        await say(intro, 450);
        await mandarLead(perfilRef.current, "final");
        await cerrarOk(esLead, true);
        return;
      }
      setQueue(q); setIdx(0);
      // 1 solo globo: saludo + primera pregunta juntos (menos mensajes)
      setCampo(q[0]); setFase("input");
      await say(`${intro} ${promptBare(q[0])}`, 450);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => { requestAnimationFrame(() => { requestAnimationFrame(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }); }); };
  useEffect(() => {
    scrollToBottom();
    if (fase === "input" && !typing && inputRef.current) inputRef.current.focus();
  }, [msgs, typing, fase, idx]);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const on = () => scrollToBottom();
    vv.addEventListener("resize", on); vv.addEventListener("scroll", on);
    return () => { vv.removeEventListener("resize", on); vv.removeEventListener("scroll", on); };
  }, []);

  async function avanzar() {
    const next = idx + 1;
    setIdx(next);
    if (next >= queue.length) { await cerrar(); return; }
    await preguntar(queue[next]);
  }

  async function enviar(e) {
    e.preventDefault(); if (gotcha) return;
    const val = txt.trim(); if (!val || typing) return;

    if (campo === "nombre") {
      if (!esNombreValido(val) || tieneGroseria(val)) { setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]); await say("¿Me pasás tu nombre? Así te escribo como corresponde.", 500); return; }
      setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]);
      const data = { ...perfilRef.current, nombre: val }; setPerfilAll(data); persistPerfil(data);
      await avanzar(); return;
    }
    if (campo === "interes") {
      setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]);
      const data = { ...perfilRef.current, interes: val }; setPerfilAll(data); persistPerfil(data);
      await avanzar(); return;
    }
    if (campo === "whatsapp") {
      const wpp = extraerWpp(val);
      if (!wpp) { setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]); await say("Uy, ese número no me cierra. Pasámelo con característica y seguimos.", 500); return; }
      setTxt(""); setMsgs((m) => [...m, { s: "u", t: wpp }]);
      const data = { ...perfilRef.current, whatsapp: wpp }; setPerfilAll(data); persistPerfil(data);
      track("chat_whatsapp", { origen: proyecto ? "ficha" : "asesor" });
      await mandarLead(data, "parcial"); // speed-to-lead
      await avanzar(); return;
    }
    if (campo === "email") {
      const mail = extraerMail(val);
      if (!mail) { setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]); await say("Revisá el mail (que tenga @) y lo intentamos de nuevo.", 500); return; }
      setTxt(""); setMsgs((m) => [...m, { s: "u", t: mail }]);
      const data = { ...perfilRef.current, email: mail }; setPerfilAll(data); persistPerfil(data);
      track("chat_email", { origen: proyecto ? "ficha" : "asesor" });
      await mandarLead(data, "parcial");
      await avanzar(); return;
    }
  }

  async function omitir() {
    if (typing) return;
    // Solo whatsapp/email son salteables. Nombre/interes se piden sí o sí.
    setMsgs((m) => [...m, { s: "u", t: "Ahora no" }]);
    await avanzar();
  }

  async function cerrar() {
    const data = perfilRef.current;
    persistPerfil(data);
    await mandarLead(data, "final");
    await cerrarOk(modo === "lead", false);
  }
  async function cerrarOk(esLead, yaTeniamos) {
    const nombre = primerNombre(perfilRef.current.nombre);
    const hay = leadRef.current.sent;
    if (esLead || proyecto) {
      await say(hay ? `¡Gracias${nombre ? `, ${nombre}` : ""}! En un rato te escribo por WhatsApp con precio, cuota y formas de pago. Lo dejé en tu Plan.` : `Cuando quieras me dejás un contacto y te paso todo.`, 700);
      setFase("ok");
    } else {
      setBuscarUrl("/desarrollos-inmobiliarios/");
      await say(hay ? `¡Gracias${nombre ? `, ${nombre}` : ""}! Te muestro lo que encaja y te escribo por WhatsApp.` : "Te muestro los proyectos que tenemos.", 700);
      setFase("okBuscar");
    }
  }

  async function reiniciar() {
    perfilRef.current = {}; leadRef.current = { sent: false, snap: "" };
    const q = camposFaltantes(modo === "lead", {});
    setQueue(q); setIdx(0);
    setCampo(q[0]); setFase("input");
    await say(`Dale, de nuevo. ${promptBare(q[0])}`, 350);
  }

  const total = queue.length || 1;
  const progreso = fase === "input" ? `Dato ${Math.min(idx + 1, total)} de ${total}` : ((fase === "ok" || fase === "okBuscar") ? "¡Listo!" : "Encantada de ayudarte");
  const salteable = campo === "whatsapp" || campo === "email";
  const inputMode = campo === "email" ? "email" : (campo === "whatsapp" ? "tel" : "text");
  const placeholder = campo === "email" ? "tucorreo@mail.com" : (campo === "whatsapp" ? "Tu WhatsApp con característica…" : (campo === "interes" ? "Proyecto, zona o \"explorando\"…" : "Tu nombre…"));

  return (
    <div className="flex flex-col h-full bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
        <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">support_agent</span></span>
        <div className="leading-tight flex-1">
          <div className="text-[14px] font-medium text-primary">{BOT} · tu asesora</div>
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
        {fase === "input" && (
          <form onSubmit={enviar} className="p-3">
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={txt} onChange={(e) => setTxt(e.target.value)} disabled={typing}
                onFocus={() => setTimeout(scrollToBottom, 320)}
                inputMode={inputMode}
                autoComplete={campo === "email" ? "email" : (campo === "whatsapp" ? "tel" : (campo === "nombre" ? "given-name" : "off"))}
                placeholder={placeholder}
                className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={typing || !txt.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2 px-1">
              {salteable ? (
                <button type="button" onClick={omitir} className="text-[12.5px] text-on-surface-variant underline underline-offset-2 hover:text-primary">Ahora no</button>
              ) : <span />}
              <span className="text-[11px] text-on-surface-variant">No lo compartimos con terceros.</span>
            </div>
            <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          </form>
        )}

        {fase === "error" && (
          <div className="p-3 flex items-center justify-center gap-3 flex-wrap">
            <button type="button" onClick={() => cerrar()} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
            </button>
            <Link href="/mi-seleccion/" className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Ver mi Plan</Link>
          </div>
        )}

        {fase === "okBuscar" && (
          <div className="p-4 flex items-center justify-center gap-3 flex-wrap">
            <Link href={buscarUrl} onClick={() => { track("ver_listado", { origen: "chat_cta" }); onClose && onClose(); }} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">search</span> Ver los proyectos
            </Link>
            <button type="button" onClick={reiniciar} className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Empezar de nuevo</button>
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
