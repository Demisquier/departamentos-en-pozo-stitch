"use client";
// app/_components/PlanToast.jsx — Toast global "plan-aware".
// Escucha window "dpp-guardado" (lo dispara GuardarBtn al guardar) y muestra un aviso
// flotante con el conteo del plan + link a Mi Plan. Señal tipo "carrito": cada proyecto
// que el usuario suma hace crecer su plan y lo invita a ir a verlo.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";

export default function PlanToast() {
  const { items } = useAuth();
  const [visible, setVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const timer = useRef(null);
  const count = Array.isArray(items) ? items.length : 0;

  useEffect(() => {
    const onGuardado = (e) => {
      setNombre((e && e.detail && e.detail.nombre) || "");
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 4500);
    };
    window.addEventListener("dpp-guardado", onGuardado);
    return () => {
      window.removeEventListener("dpp-guardado", onGuardado);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 md:bottom-6 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-secondary bg-surface px-4 py-2.5 shadow-lg">
        <span className="material-symbols-outlined text-secondary icon-fill" aria-hidden="true">favorite</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-on-surface">
            Guardado en tu Plan{nombre ? ": " + nombre : ""}
          </p>
          <p className="text-xs text-on-surface/70">
            {count} {count === 1 ? "proyecto" : "proyectos"} en tu plan
          </p>
        </div>
        <Link href="/mi-seleccion/" onClick={() => setVisible(false)} className="shrink-0 rounded-full bg-secondary px-3.5 py-1.5 text-label-caps font-label-caps uppercase tracking-wider text-white hover:bg-secondary/90 transition-colors">
          Ver mi plan
        </Link>
      </div>
    </div>
  );
}
