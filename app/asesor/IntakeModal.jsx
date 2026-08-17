"use client";
// Modal del intake (misma mecánica de viewport que AsesorModal, distinto contenido).
import { useEffect, useState } from "react";
import IntakeChat from "./IntakeChat";

export default function IntakeModal({ onClose }) {
  const [vp, setVp] = useState(null);

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
        <IntakeChat onClose={onClose} />
      </div>
    </div>
  );
}
