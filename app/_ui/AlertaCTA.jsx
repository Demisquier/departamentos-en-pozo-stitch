"use client";
import { useState, useEffect } from "react";
import { crearAlerta, leerEmailPerfil, EMAIL_RE } from "../../lib/alertaLead";

// Banner reusable para captar suscriptores a las alertas de lanzamientos (email-first).
// Alta vía /api/lead con el shape único de alertas (lib/alertaLead): origen "Alerta",
// tipo "alerta_lanzamiento", zonas/presupuesto/ambientes en columnas (no en "mensaje").
//  - contexto: barrio(s) → zonas ("" = todo CABA)
//  - fuente: superficie para GA4 (alerta_lead { fuente })
//  - variant: "dark" (bloque navy, default) | "soft" (card clara, para no competir con CTAs)
export default function AlertaCTA({
  titulo = "No te pierdas el próximo lanzamiento",
  texto = "Recibí por email los nuevos proyectos en pozo que encajan con tu búsqueda, antes de que salgan a los portales.",
  cta = "Activar mi alerta",
  contexto = "",
  fuente = "banner",
  presupuesto = "",
  ambientes = "",
  referencia = "",
  variant = "dark",
} = {}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { const e = leerEmailPerfil(); if (e) setEmail(e); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const val = email.trim();
    if (!EMAIL_RE.test(val)) { setErr("Ingresá un email válido."); return; }
    setErr(""); setSending(true);
    await crearAlerta({ email: val, zonas: contexto, presupuesto, ambientes, fuente, referencia });
    setSending(false); setSent(true);
  }

  const soft = variant === "soft";
  const wrap = soft
    ? "my-8 rounded-xl border border-outline-variant bg-surface-container-low p-5 md:p-6"
    : "my-10 rounded-lg bg-primary-container text-white p-7 md:p-9";
  const h = soft ? "font-headline-sm text-headline-sm text-primary mb-1.5 flex items-center gap-2" : "font-headline-sm text-headline-sm mb-2";
  const p = soft ? "text-on-surface-variant text-[14px] mb-4" : "text-white/85 text-[15px] mb-4";
  const inp = soft
    ? "flex-1 rounded border border-outline-variant bg-white px-4 py-2.5 text-primary text-[14px] focus:outline-none focus:border-secondary"
    : "flex-1 rounded border border-white/30 bg-white/10 px-4 py-2.5 text-white placeholder-white/60 focus:outline-none focus:border-white";
  const btn = soft
    ? "rounded-full border border-secondary text-secondary px-5 py-2.5 font-label-caps text-label-caps whitespace-nowrap hover:bg-secondary hover:text-white transition-colors disabled:opacity-60"
    : "rounded-full bg-secondary px-5 py-2.5 text-white font-label-caps text-label-caps whitespace-nowrap hover:bg-secondary/90 transition-colors disabled:opacity-60";
  const small = soft ? "mt-3 text-[12px] text-on-surface-variant" : "mt-3 text-[12px] text-white/60";

  return (
    <div className={wrap}>
      <div className="max-w-2xl">
        <h3 className={h}>
          {soft && <span className="material-symbols-outlined text-link-gold text-[22px]" aria-hidden="true">notifications_active</span>}
          {titulo}
        </h3>
        <p className={p}>{texto}</p>
        {sent ? (
          <p className={soft ? "font-medium text-[14px] text-primary flex items-center gap-1.5" : "font-medium text-[15px]"}>
            {soft && <span className="material-symbols-outlined text-[18px] text-green-700" aria-hidden="true">check_circle</span>}
            {soft ? "" : "✓ "}Listo. Te avisamos por email apenas aparezca algo que encaje{contexto ? " en " + contexto : ""}.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email" aria-label="Tu email" className={inp}
            />
            <button type="submit" disabled={sending} className={btn}>
              {sending ? "Activando…" : cta}
            </button>
          </form>
        )}
        {err && <p className={soft ? "mt-2 text-[13px] text-error" : "mt-2 text-[13px] text-white/90"}>{err}</p>}
        <p className={small}>Sin spam. Solo lo que matchee tu búsqueda; te das de baja con un clic. <a href="/politica-de-privacidad/" target="_blank" rel="noopener" className={soft ? "underline hover:text-primary" : "underline hover:text-white"}>Privacidad</a>.</p>
      </div>
    </div>
  );
}
