"use client";
// app/_auth/GuardarBtn.jsx — Botón "Guardar" (corazón) para fichas y cards.
// Con sesión → togglea el favorito en la cuenta (nube). Sin sesión → abre el modal de login
// (AuthPrompt), que recuerda el proyecto y lo guarda solo al volver del OAuth.
//   card: dato denormalizado que se guarda ({slug, nombre, barrio, precio, img, href}).
//   variant "icon" (default): flotante circular para la esquina de las cards.
//   variant "full": botón con texto para la ficha.
import { useAuth } from "./AuthProvider";

export default function GuardarBtn({ card, variant = "icon", className = "" }) {
  const { isSaved, toggleFavorito, enabled, user, openAuthPrompt } = useAuth();
  if (!card?.slug) return null;
  const saved = isSaved(card.slug);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (enabled && !user) { openAuthPrompt(card); return; } // pedir login antes de guardar
    toggleFavorito(card);
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center gap-2 rounded border px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider transition-all ${saved ? "border-secondary bg-secondary-container text-primary" : "border-outline-variant text-primary hover:border-secondary"} ${className}`}
      >
        <span className={`material-symbols-outlined text-[20px] ${saved ? "icon-fill text-secondary" : ""}`}>favorite</span>
        {saved ? "Guardado" : "Guardar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Quitar de mi selección" : "Guardar en mi selección"}
      aria-pressed={saved}
      className={`absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 shadow hover:bg-white active:scale-95 transition ${className}`}
    >
      <span className={`material-symbols-outlined text-[20px] ${saved ? "icon-fill text-secondary" : "text-primary"}`}>
        favorite
      </span>
    </button>
  );
}
