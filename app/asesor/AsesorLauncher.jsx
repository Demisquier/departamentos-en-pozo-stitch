"use client";
// app/asesor/AsesorLauncher.jsx — Botón flotante para abrir a Sofía.
// Se oculta en la ficha (ya tiene su CTA) y en /asesor. Visibilidad DINAMICA por scroll:
// aparece solo cuando el usuario baja >420px (deja el hero/CTAs) y se OCULTA de nuevo al
// volver arriba — asi nunca tapa los CTAs del hero. Color navy (bg-primary) para contraste.
// Posicion mas baja (bottom-20) para no quedar "muy alto" en mobile. Nudge re-invita cada 3 dias.
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AsesorModal from "./AsesorModal";

export default function AsesorLauncher() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname() || "";
  useEffect(() => { setOpen(false); }, [path]);

  const enFicha = /^\/desarrollos-inmobiliarios\/[^/]+\/?$/.test(path);
  const oculto = path.startsWith("/asesor") || path.startsWith("/mi-seleccion") || enFicha;

  // Visibilidad dinamica: verdadero SOLO mientras estas debajo del hero (>420px).
  useEffect(() => {
    if (oculto) { setScrolled(false); return; }
    const onScroll = () => setScrolled(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [oculto, path]);

  // Nudge: una vez visible, a los 8s, no mas de 1 cada 3 dias.
  useEffect(() => {
    if (oculto || !scrolled) return;
    try { const last = Number(localStorage.getItem("dpp_nudge_v1") || 0); if (Date.now() - last < 3 * 24 * 3600 * 1000) return; } catch {}
    const t = setTimeout(() => setNudge(true), 8000);
    return () => clearTimeout(t);
  }, [oculto, scrolled]);

  const cerrarNudge = () => { setNudge(false); try { localStorage.setItem("dpp_nudge_v1", String(Date.now())); } catch {} };
  const abrir = () => { cerrarNudge(); setOpen(true); };

  if (oculto || !scrolled) return null;

  return (
    <>
      {nudge && !open && (
        <div className="fixed bottom-36 md:bottom-20 right-4 z-[91] max-w-[240px] bg-surface border border-outline-variant shadow-xl rounded-2xl rounded-br-sm p-3.5 text-[13px] text-on-surface leading-snug">
          <button type="button" onClick={cerrarNudge} aria-label="Cerrar" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface border border-outline-variant text-[13px] leading-none text-on-surface-variant hover:text-primary">✕</button>
          ¿Querés el precio y la cuota de algún proyecto? Te lo consigo en 1 minuto, gratis.
          <button type="button" onClick={abrir} className="block mt-2 text-secondary font-medium underline hover:no-underline">Sí, dale →</button>
        </div>
      )}
      <button type="button" onClick={abrir} aria-label="¿Te ayudo a elegir? con Sofía"
        className="fixed bottom-20 md:bottom-5 right-4 z-[90] inline-flex items-center gap-2 rounded-full bg-primary text-white ring-1 ring-white/20 shadow-2xl px-4 py-3 hover:bg-primary/90 transition-all">
        <span className="material-symbols-outlined text-[22px] text-link-gold">forum</span>
        <span className="text-[13px] font-medium">¿Te ayudo a elegir?</span>
      </button>
      {open && <AsesorModal onClose={() => setOpen(false)} />}
    </>
  );
}
