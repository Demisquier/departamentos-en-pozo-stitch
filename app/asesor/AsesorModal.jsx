"use client";
// app/asesor/AsesorModal.jsx — Abre el asesor como modal SOBRE la ficha, sin perder navegación.
// Fix mobile: cuando el teclado aparece, la altura del panel sigue al visualViewport (así la caja
// de escritura no queda tapada). En desktop usa altura fija.
import { useEffect, useState } from "react";
import AsesorChat from "./AsesorChat";

export default function AsesorModal({ nombre = "", slug = "", onClose }) {
  const [vh, setVh] = useState(null); // alto visible en mobile (px) o null (desktop → clase)

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onEsc);

    const vv = window.visualViewport;
    const sync = () => setVh(window.innerWidth < 640 && vv ? Math.round(vv.height) : null);
    sync();
    if (vv) { vv.addEventListener("resize", sync); vv.addEventListener("scroll", sync); }
    window.addEventListener("resize", sync);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", sync);
      if (vv) { vv.removeEventListener("resize", sync); vv.removeEventListener("scroll", sync); }
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 scrim-soft" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg h-[100dvh] sm:h-[640px] sm:max-h-[94vh]"
        style={vh ? { height: vh + "px" } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <AsesorChat proyectoNombre={nombre} proyectoSlug={slug} onClose={onClose} />
      </div>
    </div>
  );
}
