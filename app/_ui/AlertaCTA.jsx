"use client";
import { useState } from "react";

// Banner reusable para captar suscriptores a las alertas de lanzamientos (email-first).
// Guarda el email + criterio (barrio) en el Sheet vía el webhook (origen "Alerta").
const WEBHOOK = "https://script.google.com/macros/s/AKfycbyITcB1Ob6drt8Kfh_WnWbNeD02GxjH5pkBYJGFrfKwUOh_c158KXHGxyUk3rXmxvLy0w/exec";

export default function AlertaCTA({
  titulo = "No te pierdas el próximo lanzamiento",
  texto = "Recibí por email los nuevos proyectos en pozo que encajan con tu búsqueda, antes de que salgan a los portales.",
  cta = "Activar mi alerta",
  contexto = "",
} = {}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const val = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) { setErr("Ingresá un email válido."); return; }
    setErr("");
    try {
      const body = new URLSearchParams({
        origen: "Alerta", tipo: "alerta_lanzamiento", email: val,
        zonas: contexto || "", mensaje: "Suscripción a alertas de lanzamientos" + (contexto ? " · " + contexto : ""),
      });
      fetch(WEBHOOK, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    } catch {}
    try { if (window.gtag) window.gtag("event", "alerta_lead", { contexto }); else if (window.dataLayer) window.dataLayer.push({ event: "alerta_lead", contexto }); } catch {}
    setSent(true);
  }

  return (
    <div className="my-10 rounded-lg bg-primary-container text-white p-7 md:p-9">
      <div className="max-w-2xl">
        <h3 className="font-headline-sm text-headline-sm mb-2">{titulo}</h3>
        <p className="text-white/85 text-[15px] mb-4">{texto}</p>
        {sent ? (
          <p className="font-medium text-[15px]">✓ Listo. Te avisamos por email apenas se lance algo que encaje{contexto ? " en " + contexto : ""}.</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email" aria-label="Tu email"
              className="flex-1 rounded border border-white/30 bg-white/10 px-4 py-2.5 text-white placeholder-white/60 focus:outline-none focus:border-white"
            />
            <button type="submit" className="rounded-full bg-secondary px-5 py-2.5 text-white font-label-caps text-label-caps whitespace-nowrap hover:bg-secondary/90 transition-colors">
              {cta}
            </button>
          </form>
        )}
        {err && <p className="mt-2 text-[13px] text-white/90">{err}</p>}
        <p className="mt-3 text-[12px] text-white/60">Sin spam. Solo lanzamientos que matcheen tu búsqueda.</p>
      </div>
    </div>
  );
}
