"use client";
// app/asesor/AsesorLauncher.jsx — Botón flotante (abajo a la derecha) para abrir a Sofía desde
// cualquier página: otra forma de buscar. Se oculta en la ficha (ya tiene su CTA) y en /asesor.
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AsesorModal from "./AsesorModal";

export default function AsesorLauncher() {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "";
  // Cerramos el modal al cambiar de página (para que no tape el listado al navegar, sobre todo en mobile).
  useEffect(() => { setOpen(false); }, [path]);
  const enFicha = /^\/desarrollos-inmobiliarios\/[^/]+\/?$/.test(path);
  if (path.startsWith("/asesor") || enFicha) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Buscá con Sofía"
        className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-primary-container text-on-primary shadow-lg px-4 py-3 hover:opacity-90 transition-all">
        <span className="material-symbols-outlined text-[22px]">forum</span>
        <span className="text-[13px] font-medium hidden sm:inline">Buscá con Sofía</span>
      </button>
      {open && <AsesorModal onClose={() => setOpen(false)} />}
    </>
  );
}
