"use client";
// app/_auth/AuthButton.jsx — Acceso a "Mi Plan" en el header (modelo login-gated).
// • Deslogueado: link a /mi-seleccion (pantalla de acceso). Sin contador.
// • Logueado: link con el contador de guardados + botón "Salir".
// El contador solo aparece tras montar (ready) para no romper la hidratación.
// prop `full`: layout apilable para el menú MOBILE → fila full-width y "Salir" CON TEXTO
//   (tap-target grande y claro). Sin `full` (desktop): pill compacta + Salir sólo ícono.
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function AuthButton({ onNavigate, full = false }) {
  const { count, ready, user, enabled, logout } = useAuth();
  const logged = enabled ? !!user : true; // sin auth (dev), se comporta como logueado
  const showCount = ready && logged && count > 0;

  return (
    <span className={full ? "flex w-full items-center gap-2" : "inline-flex items-center gap-1 shrink-0"}>
      <Link
        href="/mi-seleccion/"
        onClick={onNavigate}
        className={"inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-secondary bg-secondary px-3.5 py-1.5 text-label-caps font-label-caps text-white shadow-sm hover:bg-secondary/90 transition-colors" + (full ? " flex-1 justify-center py-2.5" : "")}
      >
        <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
        <span>MI PLAN</span>
        {showCount ? " (" + count + ")" : ""}
      </Link>
      {enabled && user && (
        <button
          type="button"
          onClick={() => { logout(); onNavigate && onNavigate(); }}
          aria-label="Salir de tu cuenta"
          title="Salir"
          className={full
            ? "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-outline-variant px-4 py-2.5 text-label-caps font-label-caps text-on-surface-variant hover:border-secondary hover:text-primary transition-colors"
            : "inline-flex items-center justify-center w-8 h-8 rounded border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-primary transition-colors"}
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          {full ? <span>Salir</span> : null}
        </button>
      )}
    </span>
  );
}
