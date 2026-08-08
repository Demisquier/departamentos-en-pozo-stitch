"use client";
// app/asesor/AsesorChat.jsx — Asesora "Sofía" (sin IA). Dos modos:
//  • BUSCADOR (home / botón flotante / sin aviso): pocas preguntas → catálogo con filtros (?barrio=&amb=).
//  • LEAD (desde una ficha): pide contacto conversando + arma perfil → guarda y envía lead por mail
//    (Formsubmit): primario dema2910@gmail.com, _cc contacto@departamentosenpozo.com.ar.
// MEMORIA: lee el perfil guardado (localStorage 'dpp_perfil_v1'; en logueados se sincroniza con la
//    nube vía AuthProvider). NO re-pregunta lo que ya sabe: retoma lo hecho en charlas previas y
//    saluda de vuelta por nombre. Guarda cada avance (local + nube si hay sesión) para ser más útil.
// UX chat: escribe de a poco ("escribiendo…"), scroll siempre al último mensaje, caja fija abajo.
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase, authEnabled } from "../../lib/supabase";

// Preguntas simples y humanas. Solo las esenciales.
const PASOS = [
  { key: "objetivo", p: "¿Es para vivir o para invertir?", o: [["Para invertir", "Inversión"], ["Para vivir", "Vivienda propia"], ["No lo sé aún", "A definir"]] },
  { key: "zonas", p: "¿En qué zona te gustaría?", o: [["Caballito", "Caballito"], ["Villa Urquiza", "Villa Urquiza"], ["Palermo", "Palermo"], ["Belgrano / Núñez", "Belgrano / Núñez"], ["Me da igual", "Abierto a sugerencias"]] },
  { key: "ambientes", p: "¿Qué tamaño buscás?", o: [["Monoambiente", "Monoambiente"], ["2 amb", "2 ambientes"], ["3 amb", "3 ambientes"], ["Más grande", "3+ ambientes"]] },
  { key: "presupuesto", p: "¿Presupuesto aproximado? (USD)", o: [["Hasta 120k", "≤ USD 120k"], ["120–180k", "USD 120k–180k"], ["180–250k", "USD 180k–250k"], ["+250k", "USD 250k+"], ["Lo charlamos", "A conversar"]] },
];
// El buscador solo necesita lo que mapea a filtros del catálogo.
const PASOS_BUSCADOR = PASOS.filter((p) => p.key === "zonas" || p.key === "ambientes");
const QKEYS = PASOS.map((p) => p.key);
const ETIQUETAS = { objetivo: "Objetivo", presupuesto: "Presupuesto", zonas: "Zonas", ambientes: "Tipología" };

// Mapeos perfil → filtros del catálogo (?barrio=&amb=), para el modo buscador.
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
function pickPerfil(k) { const o = {}; QKEYS.forEach((key) => { if (k[key]) o[key] = k[key]; }); return o; }
function resumen(k) {
  const parts = [];
  if (k.ambientes) parts.push(String(k.ambientes).toLowerCase());
  if (k.zonas && k.zonas !== "Abierto a sugerencias") parts.push("en " + k.zonas);
  return parts.join(" ");
}
function leerFavoritos() {
  try { const arr = JSON.parse(localStorage.getItem("dpp_favoritos_v1")) || []; return arr.map((x) => x.nombre).filter(Boolean); }
  catch { return []; }
}

// ── Interpretación de mensajes libres (nombre / mail+WhatsApp) ──────────────
// Sofía es amable: si le tiran una grosería o algo que no responde, lo toma con
// humor y vuelve a preguntar sin trabarse.
const MALAS = ["puta", "puto", "concha", "mierda", "forro", "forra", "pelotudo", "pelotuda", "boludo", "boluda", "idiota", "estupido", "pajero", "sorete", "gil", "imbecil", "carajo", "joder", "cagar", "trolo", "fuck", "shit", "bitch", "asshole", "wtf"];
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function tieneGroseria(s) {
  const t = norm(s);
  return MALAS.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t));
}
function esNombreValido(s) {
  const t = (s || "").trim();
  if (t.length < 2 || t.length > 40) return false;
  if (/https?:|www\.|@|\d{4,}/i.test(t)) return false;          // links, mails, números largos → no es un nombre
  if ((t.match(/[a-záéíóúñ]/gi) || []).length < 2) return false; // tiene que tener letras
  return true;
}
// Guarda el perfil: localStorage + nube (si hay sesión), para que Sofía sea más inteligente en la próxima.
async function persistPerfil(data) {
  const clean = { ...data, ts: Date.now() };
  try { localStorage.setItem("dpp_perfil_v1", JSON.stringify(clean)); } catch {}
  if (authEnabled) {
    try { const { data: u } = await supabase.auth.getUser(); const uid = u?.user?.id; if (uid) await supabase.from("perfiles").upsert({ user_id: uid, data: clean }); } catch {}
  }
}

export default function AsesorChat({ proyectoNombre = "", proyectoSlug = "", onClose = null }) {
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(true);
  const [modo, setModo] = useState(proyectoNombre ? "lead" : "buscador");
  const [queue, setQueue] = useState([]); // preguntas que realmente se van a hacer (las que faltan)
  const [idx, setIdx] = useState(0);
  const [perfil, setPerfil] = useState({});
  const [fase, setFase] = useState("intro"); // intro | contacto | chat | enviando | ok | okBuscar | error
  const [cto, setCto] = useState(0); // 0 = nombre, 1 = mail + WhatsApp (texto libre)
  const [txt, setTxt] = useState("");
  const [form, setForm] = useState({ nombre: "", email: "", whatsapp: "" });
  const [gotcha, setGotcha] = useState("");
  const [proyecto, setProyecto] = useState(proyectoNombre || "");
  const [buscarUrl, setBuscarUrl] = useState("/desarrollos-inmobiliarios/");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);
  const perfilRef = useRef({});
  const knownRef = useRef({});
  const reintento = useRef(0);

  const say = (text, delay = 850) => new Promise((resolve) => {
    setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { s: "a", t: text }]); setTyping(false); resolve(); }, delay);
  });

  useEffect(() => {
    if (started.current) return; started.current = true;
    let n = proyectoNombre;
    if (!n) { try { n = new URLSearchParams(window.location.search).get("nombre") || ""; } catch {} }

    const known = readPerfil();
    knownRef.current = known;
    setPerfil(pickPerfil(known));
    setForm({ nombre: known.nombre || "", email: known.email || "", whatsapp: known.whatsapp || "" });
    const first = (known.nombre || "").split(" ")[0];

    (async () => {
      if (n) {
        // ── LEAD (desde una ficha) ─────────────────────────────────────────
        setModo("lead"); setProyecto(n);
        if (known.nombre) await say(`¡Hola de nuevo, ${first}! Te doy una mano con ${n}.`, 400);
        else await say(`Hola, soy Sofía y te doy una mano con ${n}.`, 400);

        const enrich = PASOS.filter((p) => !known[p.key]);
        if (known.nombre && known.email) {
          // Ya tenemos su contacto de antes → no lo volvemos a pedir.
          await say(`Le paso tus datos a la desarrolladora para que te contacten.`, 850);
          if (enrich.length) {
            await say("Confirmame un par de cosas y te muestro proyectos que encajen.", 850);
            setQueue(enrich); setIdx(0); setFase("chat");
            await say(enrich[0].p, 700);
          } else {
            await say("Ya tengo todo lo tuyo. Le aviso y te escribo. Dame un segundo…", 850);
            enviar({ ...known });
          }
        } else {
          await say("Le paso tus datos a la desarrolladora para que te contacten. Te hago un par de preguntas cortas —también me sirven para mostrarte proyectos que van con lo tuyo.", 1000);
          setFase("contacto");
          if (known.nombre) { setCto(1); await say("¿A qué mail y WhatsApp te escribimos?", 700); }
          else { setCto(0); await say("¿Cómo te llamás?", 600); }
        }
      } else {
        // ── BUSCADOR (home / botón flotante) ───────────────────────────────
        setModo("buscador");
        if (known.nombre) await say(`¡Hola de nuevo, ${first}!`, 400);
        else await say("Hola, soy Sofía.", 400);

        const q = PASOS_BUSCADOR.filter((p) => !known[p.key]);
        if (q.length === 0) {
          setBuscarUrl(urlBuscador(known));
          const r = resumen(known);
          await say(r ? `La última vez buscabas ${r}. Te muestro esos.` : "Te muestro los proyectos que tenemos.", 850);
          setFase("okBuscar");
        } else {
          if (q.length < PASOS_BUSCADOR.length) await say("Retomo lo que ya me habías contado, me falta un dato.", 750);
          else await say("En dos toques te armo el listado a tu medida.", 700);
          setQueue(q); setIdx(0); setFase("chat");
          await say(q[0].p, 700);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll SIEMPRE al último mensaje (tras cada mensaje, cambio de fase o de opciones).
  const scrollToBottom = () => { requestAnimationFrame(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }); };
  useEffect(() => {
    scrollToBottom();
    if (fase === "contacto" && !typing && inputRef.current) inputRef.current.focus();
  }, [msgs, typing, fase, idx, cto]);

  // Teclado mobile: al cambiar el viewport visible, re-scrolleamos al último mensaje.
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const on = () => scrollToBottom();
    vv.addEventListener("resize", on); vv.addEventListener("scroll", on);
    return () => { vv.removeEventListener("resize", on); vv.removeEventListener("scroll", on); };
  }, []);

  // Contacto conversado (modo lead): nombre → mail + WhatsApp en texto libre.
  async function enviarContacto(e) {
    e.preventDefault();
    const val = txt.trim();
    if (!val || typing) return;
    setTxt(""); setMsgs((m) => [...m, { s: "u", t: val }]);
    if (cto === 0) {
      // Validamos el nombre: groserías y cosas que no son un nombre → repregunta amable.
      if (tieneGroseria(val)) { await say("Jajaja, con ese nombre no te anoto. ¿Cómo te llamás en serio?", 550); return; }
      if (!esNombreValido(val)) {
        const opciones = ["Mmm, no me quedó claro. ¿Me pasás tu nombre?", "Perdón, no lo agarré. ¿Cómo es tu nombre?", "Escribime tu nombre y seguimos. ¿Cómo es?"];
        await say(opciones[reintento.current++ % opciones.length], 550); return;
      }
      const nombreLimpio = val.trim().replace(/\s+/g, " ");
      setForm((f) => ({ ...f, nombre: nombreLimpio }));
      setCto(1);
      await say(`Un gusto, ${nombreLimpio.split(" ")[0]}. ¿A qué mail y WhatsApp te escribimos?`, 850);
    } else {
      const mail = (val.match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [""])[0];
      const resto = val.replace(mail, "").trim();
      const wpp = ((resto.match(/\d/g) || []).length >= 6) ? resto : "";
      if (!mail && !wpp) {
        const linea = tieneGroseria(val)
          ? "Jaja, tranqui. Igual necesito un mail (con @) o un WhatsApp para poder escribirte."
          : "No lo agarré. Pasame un mail (con @) o tu WhatsApp con característica y listo.";
        await say(linea, 600); return;
      }
      const datos = { ...form, email: mail, whatsapp: wpp };
      setForm(datos);
      const base = { ...knownRef.current, ...perfil, ...datos };
      persistPerfil(base);
      const enrich = PASOS.filter((p) => !knownRef.current[p.key]);
      if (enrich.length) {
        setQueue(enrich); setIdx(0); setFase("chat");
        await say("¡Gracias! Un par de preguntas cortas para mostrarte proyectos que te encajen.", 850);
        await say(enrich[0].p, 800);
      } else {
        await say("¡Gracias! Ya tengo todo. Le aviso y te escribo. Dame un segundo…", 850);
        enviar(base);
      }
    }
  }

  function elegir(label, value) {
    if (typing) return;
    const paso = queue[idx];
    if (!paso) return;
    const nuevo = { ...perfil, [paso.key]: value };
    setPerfil(nuevo);
    setMsgs((m) => [...m, { s: "u", t: label }]);
    const next = idx + 1;
    setIdx(next);
    (async () => {
      if (next < queue.length) { await say(queue[next].p); return; }
      // Fin del cuestionario: bifurca por modo.
      const full = { ...knownRef.current, ...nuevo, ...form };
      perfilRef.current = full;
      persistPerfil(full);
      if (modo === "buscador") {
        setBuscarUrl(urlBuscador(full));
        await say("¡Listo! Te armé una búsqueda a tu medida.", 750);
        setFase("okBuscar");
      } else {
        await say("¡Listo! Con esto tengo todo. Dame un segundo…", 700);
        enviar(full);
      }
    })();
  }

  // "Empezar de cero" (ignora lo guardado y vuelve a preguntar todo).
  async function reiniciar() {
    knownRef.current = {}; setPerfil({});
    const base = modo === "buscador" ? PASOS_BUSCADOR : PASOS;
    setQueue(base); setIdx(0); setFase("chat");
    await say("Dale, arranquemos de cero.", 400);
    await say(base[0].p, 600);
  }

  async function enviar(perfilFinal) {
    if (gotcha) return; // honeypot
    perfilRef.current = perfilFinal;
    setFase("enviando");
    const datos = { nombre: perfilFinal.nombre || form.nombre, email: perfilFinal.email || form.email, whatsapp: perfilFinal.whatsapp || form.whatsapp };
    const guardados = leerFavoritos();
    persistPerfil({ ...perfilFinal, ...datos });
    const payload = { _subject: "Nuevo perfil de comprador (asesor)", _template: "table", _captcha: "false", _cc: "contacto@departamentosenpozo.com.ar", Nombre: (datos.nombre || "").trim() || "—", Email: (datos.email || "").trim() || "—", WhatsApp: (datos.whatsapp || "").trim() || "—" };
    PASOS.forEach((p) => { payload[ETIQUETAS[p.key]] = perfilFinal[p.key] || "—"; });
    payload["Proyectos guardados"] = guardados.length ? guardados.join(", ") : "ninguno aún";
    if (proyecto) payload["Proyecto de interés"] = proyecto;
    payload["Origen"] = proyecto ? "Ficha · quiero más info" : "Asesor · perfil";
    try {
      const res = await fetch("https://formsubmit.co/ajax/dema2910@gmail.com", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success === true || data.success === "true")) {
        const first = (datos.nombre || "").split(" ")[0] || "";
        if (proyecto) await say(`¡Gracias, ${first}! Le pasé tu interés en ${proyecto} a la desarrolladora y te escribo con más opciones que encajen con vos.`, 700);
        else await say(`¡Gracias, ${first}! Guardé tu perfil y te escribo con proyectos que van con vos.`, 700);
        setFase("ok");
      } else { await say("Uy, ahora no pude enviarlo. Ya te guardé el perfil igual; podés reintentar el envío.", 500); setFase("error"); }
    } catch { await say("Uy, ahora no pude enviarlo. Ya te guardé el perfil igual; podés reintentar el envío.", 500); setFase("error"); }
  }

  const total = queue.length || 1;
  const progreso = fase === "chat" ? `Paso ${Math.min(idx + 1, total)} de ${total}` : ((fase === "ok" || fase === "okBuscar") ? "¡Listo!" : "Encantada de ayudarte");
  const escapeUrl = urlBuscador({ ...knownRef.current, ...perfil });

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
          <>
            <div className="p-3 pb-2 flex flex-wrap gap-2">
              {queue[idx].o.map(([label, value]) => (
                <button key={value} type="button" onClick={() => elegir(label, value)} className="text-[13px] px-3.5 py-2 rounded-full border border-outline-variant text-primary hover:border-secondary hover:bg-surface-container-low transition-colors">{label}</button>
              ))}
            </div>
            {modo === "buscador" && (
              <div className="px-3 pb-3">
                <Link href={escapeUrl} className="text-[12.5px] text-secondary underline underline-offset-2 hover:no-underline">Prefiero ver el listado ahora →</Link>
              </div>
            )}
          </>
        )}

        {fase === "contacto" && (
          <form onSubmit={enviarContacto} className="p-3">
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={txt} onChange={(e) => setTxt(e.target.value)} disabled={typing}
                onFocus={() => setTimeout(scrollToBottom, 320)}
                inputMode={cto === 1 ? "email" : "text"} placeholder={cto === 0 ? "Escribí tu nombre…" : "Tu mail y tu WhatsApp…"}
                className="flex-1 px-3.5 py-2.5 rounded-full border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary disabled:opacity-60" />
              <button type="submit" disabled={typing || !txt.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-primary-container text-on-primary flex items-center justify-center hover:opacity-90 transition disabled:opacity-50">
                <span className="material-symbols-outlined fill-icon text-[20px]">send</span>
              </button>
            </div>
            <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <p className="text-[11px] text-on-surface-variant mt-2 px-1">Usamos tus datos solo para pasarte las propuestas. No los compartimos con terceros.</p>
          </form>
        )}

        {fase === "error" && (
          <div className="p-3 flex items-center justify-center gap-3 flex-wrap">
            <button type="button" onClick={() => enviar(perfilRef.current)} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
            </button>
            <Link href="/mi-seleccion/" className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Ver mi selección</Link>
          </div>
        )}

        {fase === "okBuscar" && (
          <div className="p-4 flex items-center justify-center gap-3 flex-wrap">
            <Link href={buscarUrl} className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">search</span> Ver proyectos que encajan
            </Link>
            <button type="button" onClick={reiniciar} className="rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Buscar otra cosa</button>
          </div>
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
