"use client";
import { useState, useEffect } from "react";
import { track } from "../../../lib/track";

// Botón de WhatsApp con CAPTURA previa: pide nombre + WhatsApp (email opcional) antes de
// abrir la conversación. Así el lead queda registrado (Sheet + mail a la desarrolladora vía
// /api/lead) aunque el usuario después no escriba. Prellenamos con el perfil guardado.
// Destino: el WhatsApp de la desarrolladora si lo tenemos; si no, la línea del sitio.
export default function WhatsAppGate({ phone, esDelDev, nombre, slug, barrio, dev, variant = "full" }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", whatsapp: "", email: "" });
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      const p = JSON.parse(localStorage.getItem("dpp_perfil_v1") || "{}");
      setForm((f) => ({
        nombre: f.nombre || p.nombre || "",
        whatsapp: f.whatsapp || p.whatsapp || "",
        email: f.email || p.email || "",
      }));
    } catch {}
  }, [open]);

  // Si no tenemos el WhatsApp del dev/comercializadora, el boton NO se muestra (el chat sigue
  // disponible para todos). Nunca se rutea a una linea del sitio. La cobertura de WhatsApp crece
  // a medida que cargamos numeros en data/dev-whatsapp.json.
  if (!esDelDev) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const mensaje = "Hola, soy " + (form.nombre || "...") + ". Me interesa " + nombre + (barrio ? " en " + barrio : "") + ". Los vi en Departamentos en Pozo — ¿me pasás precio, disponibilidad y forma de pago?";

  async function enviar(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.whatsapp.trim()) {
      setErr("Necesitamos tu nombre y WhatsApp para conectarte.");
      return;
    }
    setErr("");
    setSending(true);
    try {
      const prev = JSON.parse(localStorage.getItem("dpp_perfil_v1") || "{}");
      localStorage.setItem("dpp_perfil_v1", JSON.stringify({ ...prev, nombre: form.nombre, whatsapp: form.whatsapp, email: form.email }));
    } catch {}
    const sheet = {
      origen: "WhatsApp ficha",
      tipo: "whatsapp",
      nombre: form.nombre.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      proyecto: nombre,
      proyectoSlug: slug,
      desarrolladora: dev || "",
      mensaje: "Consulta por WhatsApp — " + nombre,
    };
    const mail = {
      _subject: "Nuevo lead (WhatsApp) — " + nombre,
      _template: "table",
      _captcha: "false",
      Nombre: form.nombre.trim() || "—",
      WhatsApp: form.whatsapp.trim() || "—",
      Email: form.email.trim() || "—",
      "Proyecto de interés": nombre,
      Origen: "WhatsApp ficha",
    };
    try {
      await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheet, mail }) });
    } catch {}
    track("wa_lead", { proyecto: nombre, del_dev: !!esDelDev });
    setSending(false);
    if (esDelDev && phone) {
      const url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(mensaje);
      window.open(url, "_blank", "noopener");
      setOpen(false);
    } else {
      // Sin WhatsApp del dev: NO abrimos wa.me a la linea del sitio (evita que el lead caiga
      // en un WhatsApp personal). El lead ya quedo capturado y ruteado por mail a la
      // desarrolladora/comercializadora + aviso a contacto@.
      setEnviado(true);
    }
  }

  const btnCls =
    variant === "bar"
      ? "flex-1 px-4 py-3.5 rounded font-label-caps text-label-caps tracking-widest shadow-lg flex items-center justify-center gap-2"
      : "w-full py-3.5 rounded font-label-caps text-label-caps tracking-widest hover:opacity-90 transition-all flex justify-center items-center gap-2 mt-2";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnCls} style={{ backgroundColor: "#1FA855", color: "#fff" }}>
        WHATSAPP
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.599 5.336l-.999 3.648 3.899-1.223zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.767.967-.94 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div className="bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-headline-sm text-headline-sm text-primary">Consultar por WhatsApp</h3>
              <button type="button" onClick={() => setOpen(false)} className="material-symbols-outlined text-on-surface-variant">close</button>
            </div>
            {enviado ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-[42px]" style={{ color: "#1FA855" }}>check_circle</span>
                <h4 className="font-headline-sm text-headline-sm text-primary mt-2">¡Listo, lo tomamos!</h4>
                <p className="text-[13px] text-on-surface-variant mt-1">Le pasamos tu consulta por <strong>{nombre}</strong> a la desarrolladora y te vamos a contactar. No te soltamos: seguimos acompañándote desde Departamentos en Pozo.</p>
                <button type="button" onClick={() => { setOpen(false); setEnviado(false); }} className="mt-4 w-full py-3 rounded font-label-caps text-label-caps tracking-widest bg-primary-container text-on-primary hover:opacity-90 transition-all">Cerrar</button>
              </div>
            ) : (
            <>
            <p className="text-[13px] text-on-surface-variant mb-4">
              Dejanos tus datos y {esDelDev ? "te conectamos por WhatsApp con la comercializadora de" : "le pasamos tu consulta a la desarrolladora de"} <strong>{nombre}</strong>. Sin costo.
            </p>
            <form onSubmit={enviar} className="space-y-3">
              <label className="block">
                <span className="text-[12px] text-on-surface-variant">Nombre</span>
                <input value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre"
                  className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-[14px] outline-none focus:border-secondary bg-white" />
              </label>
              <label className="block">
                <span className="text-[12px] text-on-surface-variant">WhatsApp</span>
                <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+54 9 11 …" type="tel"
                  className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-[14px] outline-none focus:border-secondary bg-white" />
              </label>
              <label className="block">
                <span className="text-[12px] text-on-surface-variant">Email <span className="opacity-60">(opcional)</span></span>
                <input value={form.email} onChange={set("email")} placeholder="tu@email.com" type="email"
                  className="w-full mt-1 px-3 py-2.5 border border-outline-variant rounded-lg text-[14px] outline-none focus:border-secondary bg-white" />
              </label>
              {err && <p className="text-[13px] text-red-600">{err}</p>}
              <button type="submit" disabled={sending}
                className="w-full py-3.5 rounded font-label-caps text-label-caps tracking-widest flex justify-center items-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#1FA855", color: "#fff" }}>
                {sending ? "ENVIANDO…" : (esDelDev ? "ABRIR WHATSAPP" : "ENVIAR CONSULTA")}
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
              <p className="text-[11px] text-on-surface-variant text-center">Al continuar aceptás que te contactemos por tu consulta. No compartimos tus datos con terceros.</p>
            </form>
            </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
