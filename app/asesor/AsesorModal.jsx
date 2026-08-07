"use client";
// app/asesor/AsesorModal.jsx — Abre el asesor como modal SOBRE la ficha, sin perder navegación.
// Bloquea el scroll del fondo mientras está abierto y cierra tocando la zona oscura o la ✕ del header.
import { useEffect } from "react";
import AsesorChat from "./AsesorChat";

export default function AsesorModal({ nombre = "", slug = "", onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onEsc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onEsc); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 scrim-soft" onClick={onClose}>
      <div className="w-full sm:max-w-lg h-[90vh] sm:h-[640px] max-h-[94vh]" onClick={(e) => e.stopPropagation()}>
        <AsesorChat proyectoNombre={nombre} proyectoSlug={slug} onClose={onClose} />
      </div>
    </div>
  );
}
