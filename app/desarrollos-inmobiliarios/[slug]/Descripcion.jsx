"use client";
import { useState, useRef, useEffect } from "react";

// Descripción con "Leer más": muestra un preview y expande. El HTML queda siempre
// en el DOM (bueno para SEO); solo se recorta visualmente cuando supera el alto.
export default function Descripcion({ html }) {
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.scrollHeight > 220) setOverflow(true);
  }, [html]);

  return (
    <div>
      <div
        ref={ref}
        className={`font-body-md text-body-md text-on-surface-variant leading-relaxed prose max-w-none relative overflow-hidden transition-all ${open ? "max-h-none" : "max-h-[13.5rem]"}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {overflow && !open && (
        <div className="pointer-events-none -mt-16 h-16 bg-gradient-to-t from-surface to-transparent relative" />
      )}
      {overflow && (
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="mt-2 inline-flex items-center gap-1 text-link-gold font-medium text-[14px]">
          {open ? "Ver menos" : "Leer descripción completa"}
          <span className={`material-symbols-outlined text-[18px] transition-transform ${open ? "rotate-180" : ""}`}>expand_more</span>
        </button>
      )}
    </div>
  );
}
