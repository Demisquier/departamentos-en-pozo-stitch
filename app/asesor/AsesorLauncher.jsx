"use client";
// app/asesor/AsesorLauncher.jsx — Botón flotante para abrir a Sofía desde cualquier página.
// Se oculta en la ficha (ya tiene su CTA) y en /asesor. Mejoras de apertura (2026-08):
// label SIEMPRE visible, no choca con el BottomNav mobile (bottom-24), copy de valor, y un
// nudge temporizado que aparece una sola vez (se recuerda en localStorage).
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AsesorModal from "./AsesorModal";

export default function AsesorLauncher() {
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const path = usePathname() || "";
  useEffect(() => { setOpen(false); }, [path]);

  const enFicha = /^\/desarrollos-inmobiliarios\/[^/]+\/?$/.test(path);
  const oculto = path.startsWith("/asesor") || enFicha;

  useEffect(() => {
    if (oculto) return;
    try { if (localStorage.getItem("dpp_nudge_v1")) return; } catch {}
    const t = setTimeout(() => setNudge(true), 8000);
    return () => clearTimeout(t);
  }, [oculto]);

  const cerrarNudge = () => { setNudge(false); try { localStorage.setItem("dpp_nudge_v1", "1"); } catch {} };
  const abrir = () => { cerrarNudge(); setOpen(true); };

  if (oculto) return null;

  return (
    <>
      {nudge && !open && (
        <div className="fixed bottom-40 md:bottom-20 right-5 z-[91] max-w-[240px] bg-surface border border-outline-variant shadow-xl rounded-2xl rounded-br-sm p-3.5 text-[13px] text-on-surface leading-snug">
          <button type="button" onClick={cerrarNudge} aria-label="Cerrar" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface border border-outline-variant text-[13px] leading-none text-on-surface-variant hover:text-primary">✕</button>
          ¿Querés el precio y la cuota de algún proyecto? Te lo consigo en 1 minuto.
          <button type="button" onClick={abrir} className="block mt-2 text-secondary font-medium underline hover:no-underline">Sí, dale →</button>
        </div>
      )}
      <button type="button" onClick={abrir} aria-label="Preguntá por precio con Sofía"
        className="fixed bottom-24 md:bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-secondary text-white shadow-xl px-4 py-3 hover:opacity-90 transition-all">
        <span className="material-symbols-outlined text-[22px]">forum</span>
        <span className="text-[13px] font-medium">Preguntá por precio</span>
      </button>
      {open && <AsesorModal onClose={() => setOpen(false)} />}
    </>
  );
}
