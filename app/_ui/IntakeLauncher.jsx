"use client";
// CTA de entrada al intake: "¿Comercializás este proyecto? Cargalo/Actualizalo".
// variant "banner" = franja completa (pie de ficha); "line" = link discreto.
import { useState } from "react";
import IntakeModal from "../asesor/IntakeModal";
import { track } from "../../lib/track";

export default function IntakeLauncher({ variant = "banner", label }) {
  const [open, setOpen] = useState(false);
  const abrir = () => { track("intake_launch", { variant }); setOpen(true); };

  return (
    <>
      {variant === "banner" ? (
        <div className="mt-6 rounded-xl border border-outline-variant bg-surface-container-low p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <div className="flex-1">
            <p className="font-headline-sm text-[16px] text-primary leading-tight">¿Comercializás o desarrollás este proyecto?</p>
            <p className="text-[13px] text-on-surface-variant mt-1">Cargá o actualizá los datos en 2 minutos, hablando. Nada de formularios de 40 campos.</p>
          </div>
          <button type="button" onClick={abrir}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            {label || "Cargar / actualizar"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={abrir} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-secondary hover:text-primary underline underline-offset-2">
          <span className="material-symbols-outlined text-[18px]">add_business</span>
          {label || "¿Comercializás un proyecto? Cargalo"}
        </button>
      )}
      {open && <IntakeModal onClose={() => setOpen(false)} />}
    </>
  );
}
