"use client";
// app/_auth/AuthButton.jsx — Acceso a "Mi selección" en el header. Sin login: es un link
// con el contador de propiedades guardadas (localStorage). El contador solo se muestra
// después de montar (ready) para no romper la hidratación (server render = sin contador).
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function AuthButton({ onNavigate }) {
  const { count, ready } = useAuth();
  return (
    <Link
      href="/mi-seleccion/"
      onClick={onNavigate}
      className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded border border-outline-variant px-3 py-1.5 text-label-caps font-label-caps text-primary hover:border-secondary transition-colors"
    >
      <span className="material-symbols-outlined text-[18px]">favorite</span>
      <span className="hidden lg:inline">MI SELECCIÓN</span>
      <span className="lg:hidden">SELECCIÓN</span>
      {ready && count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
