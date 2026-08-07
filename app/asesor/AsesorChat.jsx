"use client";
// app/asesor/AsesorChat.jsx — Asistente guiado (sin IA): capta el perfil del comprador de
// forma amigable con opciones (chips), lo GUARDA en la selección (localStorage 'dpp_perfil_v1')
// y lo ENVÍA como lead por mail vía Formsubmit (SIN WordPress, sin backend): primario a
// contacto@departamentosenpozo.com.ar, con copia (_cc) a dema2910@gmail.com.
// Incluye los proyectos guardados (favoritos) en el lead para que llegue rico.
import { useState } from "react";
import Link from "next/link";

const PASOS = [
  { key: "objetivo", p: "¡Hola! Soy Sofía, tu asesora. En 2 minutos armamos tu perfil para acompañarte mejor, sin vueltas. Para arrancar: ¿la compra es para vivir o para invertir?", o: [["Para invertir", "Inversión"], ["Para vivir", "Vivienda propia"], ["Todavía no lo sé", "A definir"]] },
  { key: "presupuesto", p: "Gracias por contarme. Solo si te queda cómodo: ¿con qué presupuesto (en dólares) te estás manejando?", o: [["Hasta 120k", "≤ USD 120k"], ["120k – 180k", "USD 120k–180k"], ["180k – 250k", "USD 180k–250k"], ["+250k", "USD 250k+"], ["Prefiero conversarlo", "A conversar"]] },
  { key: "zonas", p: "Perfecto. ¿Qué zona te interesa? Después podés sumar más.", o: [["Caballito", "Caballito"], ["Villa Urquiza", "Villa Urquiza"], ["Palermo", "Palermo"], ["Belgrano / Núñez", "Belgrano / Núñez"], ["Abierto a sugerencias", "Abierto a sugerencias"]] },
  { key: "ambientes", p: "¿Qué tipología estás buscando?", o: [["Monoambiente", "Monoambiente"], ["2 ambientes", "2 ambientes"], ["3 ambientes", "3 ambientes"], ["Más grande", "3+ ambientes"]] },
  { key: "entrega", p: "¿Te corre el tiempo con la entrega, o podés esperar si el precio acompaña?", o: [["Cuanto antes", "Lo antes posible"], ["Puedo esperar por precio", "Flexible por precio"]] },
  { key: "plazo", p: "¿Para cuándo te imaginás dando el paso? Sin apuro, es para acompañarte a tu ritmo.", o: [["En los próximos meses", "Próximos meses"], ["En algún momento este año", "Este año"], ["Estoy explorando", "Explorando"]] },
  { key: "financiacion", p: "Última cosita: ¿pensás usar financiación en cuotas o pagar de contado?", o: [["Necesito financiación", "Cuotas (ajuste CAC)"], ["Pago de contado", "Contado"], ["Todavía no sé", "A definir"]] },
];
const CONTACTO_MSG = "¡Genial! Con esto ya tengo tu perfil. Dejame tu nombre y un mail o WhatsApp: te lo guardo en tu selección y te acompañamos con propuestas a tu medida.";
const ETIQUETAS = { objetivo: "Objetivo", presupuesto: "Presupuesto", zonas: "Zonas", ambientes: "Tipología", entrega: "Entrega", plazo: "Plazo", financiacion: "Financiación" };

function leerFavoritos() {
  try {
    const raw = localStorage.getItem("dpp_favoritos_v1");
    const arr = raw ? JSON.parse(raw) : [];
    return arr.map((x) => x.nombre).filter(Boolean);
  } catch { return []; }
}

export default function AsesorChat() {
  const [msgs, setMsgs] = useState([{ s: "a", t: PASOS[0].p }]);
  const [idx, setIdx] = useState(0);
  const [perfil, setPerfil] = useState({});
  const [fase, setFase] = useState("chat"); // chat | contacto | enviando | ok | error
  const [form, setForm] = useState({ nombre: "", email: "", whatsapp: "" });
  const [gotcha, setGotcha] = useState("");

  function elegir(label, value) {
    const paso = PASOS[idx];
    const nuevoPerfil = { ...perfil, [paso.key]: value };
    setPerfil(nuevoPerfil);
    const next = idx + 1;
    setIdx(next);
    setMsgs((m) => {
      const out = [...m, { s: "u", t: label }];
      if (next < PASOS.length) out.push({ s: "a", t: PASOS[next].p });
      else { out.push({ s: "a", t: CONTACTO_MSG }); }
      return out;
    });
    if (next >= PASOS.length) setFase("contacto");
  }

  async function enviar(e) {
    e.preventDefault();
    if (gotcha) return; // honeypot
    if (!form.nombre.trim() || (!form.email.trim() && !form.whatsapp.trim())) { setFase("error"); return; }
    setFase("enviando");
    const guardados = leerFavoritos();
    // Guardamos el perfil en la selección (localStorage) SIEMPRE, aunque el mail falle.
    try { localStorage.setItem("dpp_perfil_v1", JSON.stringify({ ...perfil, ...form, ts: Date.now() })); } catch {}
    // Envío del lead por mail vía Formsubmit (sin WordPress, sin backend). Cada campo va como
    // clave para que el mail llegue como una tabla legible. _captcha:false habilita el flujo AJAX.
    const payload = { _subject: "Nuevo perfil de comprador (asesor)", _template: "table", _captcha: "false", _cc: "dema2910@gmail.com", Nombre: form.nombre.trim(), Email: form.email.trim() || "—", WhatsApp: form.whatsapp.trim() || "—" };
    PASOS.forEach((p) => { payload[ETIQUETAS[p.key]] = perfil[p.key] || "—"; });
    payload["Proyectos guardados"] = guardados.length ? guardados.join(", ") : "ninguno aún";
    payload["Origen"] = "Asesor · perfil";
    try {
      const res = await fetch("https://formsubmit.co/ajax/contacto@departamentosenpozo.com.ar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      setFase(res.ok && (data.success === true || data.success === "true") ? "ok" : "error");
    } catch { setFase("error"); }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant bg-surface-container-low">
          <span className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">support_agent</span></span>
          <div className="leading-tight">
            <div className="text-[14px] font-medium text-primary">Sofía · tu asesora</div>
            <div className="text-[12px] text-secondary">acá para acompañarte</div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2.5">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[85%] ${m.s === "u" ? "self-end" : "self-start"}`}>
              <div className={`text-[14px] leading-relaxed px-3.5 py-2.5 rounded-2xl ${m.s === "u" ? "bg-primary-container text-on-primary rounded-br-md" : "bg-surface-container-low text-on-surface border border-outline-variant rounded-bl-md"}`}>{m.t}</div>
            </div>
          ))}
        </div>

        {fase === "chat" && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {PASOS[idx].o.map(([label, value]) => (
              <button key={value} type="button" onClick={() => elegir(label, value)} className="text-[13px] px-3.5 py-2 rounded-full border border-outline-variant text-primary hover:border-secondary transition-colors">{label}</button>
            ))}
          </div>
        )}

        {(fase === "contacto" || fase === "enviando" || fase === "error") && (
          <form onSubmit={enviar} className="px-4 pb-4 flex flex-col gap-2.5">
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Tu nombre" className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px]" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email" className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px]" />
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp (opcional)" className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px]" />
            <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            {fase === "error" && <p className="text-[13px] text-red-600">No pude enviarlo. Revisá que esté tu nombre y un mail o WhatsApp, y probá de nuevo.</p>}
            <button type="submit" disabled={fase === "enviando"} className="mt-1 inline-flex items-center justify-center gap-2 rounded bg-primary-container text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-60">
              {fase === "enviando" ? "Guardando…" : "Guardar mi perfil"}
            </button>
            <p className="text-[11px] text-on-surface-variant">Guardamos tu perfil para acompañarte. No compartimos tus datos con terceros sin tu permiso.</p>
          </form>
        )}

        {fase === "ok" && (
          <div className="px-4 pb-5 text-center">
            <span className="material-symbols-outlined icon-fill text-[40px] text-green-600">check_circle</span>
            <p className="text-[15px] text-primary font-medium mt-1">¡Listo, {form.nombre.split(" ")[0] || "gracias"}!</p>
            <p className="text-[13.5px] text-on-surface-variant mt-1 max-w-sm mx-auto">Guardé tu perfil en tu selección y se lo pasé a nuestro equipo. Te vamos a escribir con propuestas que encajen con vos.</p>
            <Link href="/mi-seleccion/" className="mt-4 inline-block rounded border border-outline-variant px-5 py-2.5 text-[13px] text-primary hover:border-secondary transition-colors">Ver mi selección</Link>
          </div>
        )}
      </div>
    </div>
  );
}
