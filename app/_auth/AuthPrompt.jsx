"use client";
// app/_auth/AuthPrompt.jsx — Modal que pide login cuando alguien sin sesión toca "Guardar".
// Explica el porqué (menos rebote) y al confirmar recuerda el proyecto (dpp_pending_fav_v1)
// antes de mandar al OAuth de Google, así al volver se guarda solo. Se monta global en el provider.
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

const PENDING_KEY = "dpp_pending_fav_v1";

export default function AuthPrompt() {
  const { enabled, promptCard, closeAuthPrompt, login } = useAuth();
  const open = enabled && !!promptCard;

  // Bloqueo de scroll + cierre con Escape mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") closeAuthPrompt(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open, closeAuthPrompt]);

  if (!open) return null;
  const card = promptCard || {};
  const nombre = card.nombre ? `«${card.nombre}»` : "este proyecto";

  const continuar = () => {
    try { if (card && card.slug) localStorage.setItem(PENDING_KEY, JSON.stringify(card)); } catch {}
    login(typeof window !== "undefined" ? window.location.href : undefined);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Ingresar para guardar">
      <div className="absolute inset-0 scrim-soft" onClick={closeAuthPrompt} />
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[26px] text-secondary icon-fill" aria-hidden="true">favorite</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Guardá tus favoritos</h2>
        <p className="text-on-surface-variant text-[14px] mb-5">
          Ingresá con Google para guardar {nombre} en tu selección y verlo desde cualquier dispositivo. Sin contraseñas.
        </p>
        <button
          type="button"
          onClick={continuar}
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-primary-container text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">login</span>
          Continuar con Google
        </button>
        <button type="button" onClick={closeAuthPrompt} className="mt-3 w-full min-h-[44px] text-[14px] text-on-surface-variant hover:text-primary transition-colors">
          Ahora no
        </button>
      </div>
    </div>
  );
}
