"use client";
// app/asesor/AsesorLauncher.jsx — Botón flotante para abrir a Sofía.
// Se oculta en la ficha (ya tiene su CTA) y en /asesor. Ademas SOLO aparece cuando el
// usuario scrollea >420px (deja el hero) — asi no pisa los CTAs del hero en la home.
// El nudge re-invita cada 3 dias (timestamp en localStorage).
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AsesorModal from "./AsesorModal";

export default function AsesorLauncher() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname() || "";
  useEffect(() => { setOpen(false); setScrolled(false); }, [path]);

  const enFicha = /^\/desarrollos-inmobiliarios\/[^/]+\/?$/.test(path);
  const oculto = path.startsWith("/asesor") || enFicha;

  // Aparece recien cuando el usuario baja del hero.
  useEffect(() => {
    if (oculto) return;
    const onScroll = () => { if (window.scrollY > 420) setScrolled(true); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [oculto, path]);

  // Nudge: una vez visible (scrolled), a los 8s, y no mas de 1 cada 3 dias.
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
        <div className="fixed bottom-40 md:bottom-20 right-5 z-[91] max-w-[240px] bg-surface border border-outline-variant shadow-xl rounded-2xl rounded-br-sm p-3.5 text-[13px] text-on-surface leading-snug">
          <button type="button" onClick={cerrarNudge} aria-label="Cerrar" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface border border-outline-variant text-[13px] leading-none text-on-surface-variant hover:text-primary">✕</button>
          ¿Querés el precio y la cuota de algún proyecto? Te lo consigo en 1 minuto, gratis.
          <button type="button" onClick={abrir} className="block mt-2 text-secondary font-medium underline hover:no-underline">Sí, dale →</button>
        </div>
      )}
      <button type="button" onClick={abrir} aria-label="¿Te ayudo a elegir? con Sofía"
        className="fixed bottom-24 md:bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-secondary text-white shadow-xl px-4 py-3 hover:opacity-90 transition-all">
        <span className="material-symbols-outlined text-[22px]">forum</span>
        <span className="text-[13px] font-medium">¿Te ayudo a elegir?</span>
      </button>
      {open && <AsesorModal onClose={() => setOpen(false)} />}
    </>
  );
}
