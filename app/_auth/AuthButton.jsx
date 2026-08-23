"use client";
// app/_auth/AuthButton.jsx — Acceso a "Mi selección" en el header (modelo login-gated).
// • Deslogueado: link a /mi-seleccion (que muestra la pantalla de acceso). Sin contador.
// • Logueado: link con el contador de guardados + botón "Salir" al lado.
// El contador solo aparece tras montar (ready) para no romper la hidratación.
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function AuthButton({ onNavigate }) {
  const { count, ready, user, enabled, logout } = useAuth();
  const logged = enabled ? !!user : true; // sin auth (dev), se comporta como logueado
  const showCount = ready && logged && count > 0;

  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <Link
        href="/mi-seleccion/"
        onClick={onNavigate}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-outline-variant px-3 py-1.5 text-label-caps font-label-caps text-primary hover:border-secondary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
        <span className="hidden lg:inline">MI PLAN</span>
        <span className="lg:hidden">MI PLAN</span>
        {showCount ? ` (${count})` : ""}
      </Link>
      {enabled && user && (
        <button
          type="button"
          onClick={() => { logout(); onNavigate && onNavigate(); }}
          aria-label="Salir de tu cuenta"
          title="Salir"
          className="inline-flex items-center justify-center w-8 h-8 rounded border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      )}
    </span>
  );
}
