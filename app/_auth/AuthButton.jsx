"use client";
// app/_auth/AuthButton.jsx — Control de sesión para el header.
// - feature apagada → no se muestra.
// - sin login → botón "Ingresar" (Google).
// - logueado → avatar + link a "Mi selección" + salir.
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function AuthButton({ onNavigate }) {
  const { user, enabled, signIn, signOut } = useAuth();
  if (!enabled) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        className="inline-flex items-center gap-1.5 rounded border border-outline-variant px-4 py-2 text-label-caps font-label-caps text-primary hover:border-secondary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">person</span>
        INGRESAR
      </button>
    );
  }

  const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const inicial = (user.user_metadata?.name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/mi-seleccion/"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-full border border-outline-variant pl-1 pr-3 py-1 hover:border-secondary transition-colors"
      >
        {avatar ? (
          <img src={avatar} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[13px] font-semibold">{inicial}</span>
        )}
        <span className="text-label-caps font-label-caps text-primary">MI SELECCIÓN</span>
      </Link>
      <button type="button" onClick={signOut} aria-label="Cerrar sesión" className="p-2 text-on-surface-variant hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </button>
    </div>
  );
}
