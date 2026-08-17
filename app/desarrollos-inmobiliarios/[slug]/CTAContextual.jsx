"use client";
// CTA contextual de la ficha: un botón pegado a cada bloque (confianza, precio, due diligence)
// que abre a Sofía con el pedido YA cargado (perfil.objetivo). Cosecha la intención en el
// momento exacto en que la duda se resolvió. Reusa el motor de leads (AsesorModal → AsesorChat).
import { useState } from "react";
import AsesorModal from "../../asesor/AsesorModal";
import { track } from "../../../lib/track";

export default function CTAContextual({ pedido, nombre, slug, label, icon = "forum", variant = "line" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => { track("cta_contextual", { pedido, proyecto: nombre }); setOpen(true); }}
        className={
          variant === "solid"
            ? "inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-4 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all"
            : "inline-flex items-center gap-1.5 text-[13px] font-medium text-secondary hover:text-primary underline underline-offset-2"
        }
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        {label}
      </button>
      {open && <AsesorModal nombre={nombre} slug={slug} pedido={pedido} onClose={() => setOpen(false)} />}
    </>
  );
}
