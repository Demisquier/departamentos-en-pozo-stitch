"use client";
// app/asesor/AsesorModal.jsx — Abre el asesor como modal SOBRE la ficha, sin perder navegación.
// AI-FIRST: al montar chequea GET /api/chat. Si ready===true → chat IA (AsesorIA embebido).
// Si ready===false / error → chat GUIONADO actual (Valentina, AsesorChat) = PLAN B. Cero
// ruptura: si se acaba el crédito de OpenAI, el modal vuelve solo al chat que ya funciona.
// Fix mobile: cuando el teclado aparece, el panel se ancla EXACTAMENTE al viewport visible
// (top + height del visualViewport), así la caja de escritura nunca queda tapada ni corrida.
import { useEffect, useState } from "react";
import AsesorChat from "./AsesorChat";
import AsesorIA from "../asesor-ia/AsesorIA";

export default function AsesorModal({ nombre = "", slug = "", pedido = "", onClose }) {
  const [vp, setVp] = useState(null); // { top, height } en mobile, o null en desktop
  const [modo, setModo] = useState(null); // null=chequeando · "ia" · "scripted"

  // AI-first: preguntamos si el chat IA está disponible; si no, plan B = guionado.
  useEffect(() => {
    let ok = true;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => { if (ok) setModo(d?.ready ? "ia" : "scripted"); })
      .catch(() => { if (ok) setModo("scripted"); });
    return () => { ok = false; };
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onEsc);

    const vv = window.visualViewport;
    const sync = () => {
      if (window.innerWidth < 640 && vv) setVp({ top: Math.round(vv.offsetTop), height: Math.round(vv.height) });
      else setVp(null);
    };
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
        className={vp ? "fixed left-0 right-0 w-full" : "w-full sm:max-w-lg h-[100dvh] sm:h-[640px] sm:max-h-[94vh]"}
        style={vp ? { top: vp.top + "px", height: vp.height + "px" } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {modo === null ? (
          <div className="flex h-full items-center justify-center bg-surface border border-outline-variant rounded-2xl">
            <span className="material-symbols-outlined animate-spin text-secondary text-[28px]">progress_activity</span>
          </div>
        ) : modo === "ia" ? (
          <AsesorIA embedded proyectoNombre={nombre} proyectoSlug={slug} pedido={pedido} onClose={onClose} />
        ) : (
          <AsesorChat proyectoNombre={nombre} proyectoSlug={slug} pedido={pedido} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
