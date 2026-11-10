"use client";
import { useState, useEffect } from "react";
import { crearAlerta, leerEmailPerfil, presupuestoDesdePrecio, EMAIL_RE } from "../../lib/alertaLead";

// Oferta de alerta en el ESTADO DE ÉXITO de un lead (WhatsAppGate, AsesorChat):
// "¿Querés que te avisemos cuando salga algo parecido en {barrio}?"
//  - Si ya tenemos el email (del form o del perfil) → 1 clic.
//  - Si no → input de email + botón.
// Alta: /api/lead origen "Alerta", zonas = barrio, presupuesto ≈ precio del proyecto (+15%).
// GA4: alerta_lead { fuente: "post_lead" }.
export default function AlertaPostLead({ barrio = "", precio = null, email = "", proyecto = "", nombre = "", whatsapp = "", className = "" }) {
  const [mail, setMail] = useState((email || "").trim());
  const [conocido, setConocido] = useState(EMAIL_RE.test((email || "").trim()));
  const [estado, setEstado] = useState("idle"); // idle | sending | ok
  const [err, setErr] = useState("");

  useEffect(() => {
    if (conocido) return;
    const e = leerEmailPerfil();
    if (EMAIL_RE.test(e)) { setMail(e); setConocido(true); }
  }, [conocido]);

  async function activar(e) {
    if (e) e.preventDefault();
    const val = mail.trim();
    if (!EMAIL_RE.test(val)) { setErr("Ingresá un email válido."); return; }
    setErr(""); setEstado("sending");
    await crearAlerta({
      email: val, zonas: barrio || "", presupuesto: presupuestoDesdePrecio(precio),
      fuente: "post_lead", nombre, whatsapp, referencia: proyecto,
      mensaje: "Alerta post-lead · parecido a " + (proyecto || "proyecto consultado") + (barrio ? " en " + barrio : ""),
    });
    setEstado("ok");
  }

  const donde = barrio ? " en " + barrio : "";
  return (
    <div className={"rounded-xl border border-outline-variant bg-surface-container-low p-4 text-left " + className}>
      {estado === "ok" ? (
        <p className="text-[13px] text-primary flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-green-700" aria-hidden="true">check_circle</span>
          <span>Listo. Te avisamos a <strong>{mail.trim()}</strong> cuando salga algo parecido{donde}.</span>
        </p>
      ) : (
        <>
          <p className="text-[14px] font-medium text-primary flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-link-gold" aria-hidden="true">notifications_active</span>
            <span>¿Querés que te avisemos cuando salga algo parecido{donde}?</span>
          </p>
          {conocido ? (
            <button type="button" onClick={activar} disabled={estado === "sending"}
              className="mt-3 w-full py-2.5 rounded border border-secondary text-secondary font-label-caps text-label-caps tracking-widest hover:bg-secondary hover:text-white transition-colors disabled:opacity-60">
              {estado === "sending" ? "ACTIVANDO…" : "SÍ, AVISAME"}
            </button>
          ) : (
            <form onSubmit={activar} className="mt-3 flex gap-2">
              <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="tu@email.com" aria-label="Tu email"
                className="flex-1 min-w-0 px-3 py-2.5 border border-outline-variant rounded-lg text-[14px] outline-none focus:border-secondary bg-white" />
              <button type="submit" disabled={estado === "sending"}
                className="shrink-0 px-4 py-2.5 rounded border border-secondary text-secondary font-label-caps text-label-caps hover:bg-secondary hover:text-white transition-colors disabled:opacity-60">
                {estado === "sending" ? "…" : "AVISAME"}
              </button>
            </form>
          )}
          {err && <p className="mt-2 text-[12px] text-error">{err}</p>}
          <p className="mt-2 text-[11px] text-on-surface-variant">Sólo lo que encaje. Baja con un clic.</p>
        </>
      )}
    </div>
  );
}
