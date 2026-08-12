"use client";

// app/reels/ReelsGrid.jsx — Grid de reels/videos de emprendimientos en pozo con filtro por barrio.
// Patrón "facade": mostramos la miniatura (liviana) + botón play; el iframe pesado del video sólo
// se monta cuando el usuario hace click en la card. Así la página carga rápido aunque haya N videos.
// Filtro por barrio: chips estilo sitio (bg-primary activo / borde inactivo). Sólo aparecen los
// barrios que tienen al menos un video → si filtrás por Villa Urquiza ves sólo esos emprendimientos.
import { useState, useMemo } from "react";
import { barrioNombre } from "../../lib/barrios";
import { track } from "../../lib/track";

// Miniatura por plataforma (sin cargar el player).
function thumbOf(r) {
  if (r.platform === "youtube") return `https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg`;
  return null; // IG/TikTok no exponen thumbnail directo → usamos placeholder navy.
}

// URL del embed según plataforma.
function embedSrc(r) {
  if (r.platform === "youtube") return `https://www.youtube.com/embed/${r.videoId}?autoplay=1&rel=0`;
  if (r.platform === "instagram") return `https://www.instagram.com/reel/${r.videoId}/embed`;
  if (r.platform === "tiktok") return `https://www.tiktok.com/embed/v2/${r.videoId}`;
  return null;
}

const PLAT_LABEL = { youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok" };

function ReelCard({ r }) {
  const [play, setPlay] = useState(false);
  const thumb = thumbOf(r);
  const zona = barrioNombre(r.barrio);

  return (
    <div className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-video bg-primary-container">
        {play ? (
          <iframe
            src={embedSrc(r)}
            title={r.title}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => { setPlay(true); track("reel_play", { videoId: r.videoId, barrio: r.barrio, platform: r.platform }); }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            aria-label={`Reproducir: ${r.title}`}
          >
            {thumb ? (
              <img src={thumb} alt={r.title} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-fixed-dim">
                <span className="material-symbols-outlined text-5xl">smart_display</span>
              </div>
            )}
            <span className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors" />
            <span className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/90 text-primary shadow-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl" style={{ marginLeft: 2 }}>play_arrow</span>
            </span>
            <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">{PLAT_LABEL[r.platform] || "VIDEO"}</span>
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="serif text-headline-sm text-primary leading-tight">{r.title}</h3>
        <p className="text-on-surface-variant text-[13px] flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>{zona}
        </p>
        {(r.proyecto || r.dev) && (
          <p className="text-[11px] text-on-surface-variant mt-2 truncate">
            {r.proyecto ? r.proyecto : ""}{r.proyecto && r.dev ? " · " : ""}{r.dev ? `${r.dev}` : ""}
          </p>
        )}
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-3 pt-3 border-t border-outline-variant text-secondary font-label-caps text-[11px] tracking-widest inline-flex items-center gap-1 hover:gap-2 transition-all"
        >
          VER EN {PLAT_LABEL[r.platform]?.toUpperCase() || "LA FUENTE"} <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </a>
      </div>
    </div>
  );
}

export default function ReelsGrid({ reels = [] }) {
  const [barrio, setBarrio] = useState("todos");

  // Barrios presentes en el dataset (con al menos 1 video), ordenados por cantidad desc.
  const barrios = useMemo(() => {
    const count = {};
    for (const r of reels) count[r.barrio] = (count[r.barrio] || 0) + 1;
    return Object.keys(count)
      .sort((a, b) => count[b] - count[a] || barrioNombre(a).localeCompare(barrioNombre(b)))
      .map((slug) => ({ slug, nombre: barrioNombre(slug), n: count[slug] }));
  }, [reels]);

  const visibles = useMemo(
    () => (barrio === "todos" ? reels : reels.filter((r) => r.barrio === barrio)),
    [reels, barrio]
  );

  return (
    <div>
      {/* Filtro por barrio */}
      <div className="flex flex-wrap gap-2 mb-8">
        <FiltChip active={barrio === "todos"} onClick={() => setBarrio("todos")}>
          Todos <span className="opacity-70">({reels.length})</span>
        </FiltChip>
        {barrios.map((b) => (
          <FiltChip key={b.slug} active={barrio === b.slug} onClick={() => setBarrio(b.slug)}>
            {b.nombre} <span className="opacity-70">({b.n})</span>
          </FiltChip>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="text-on-surface-variant py-10">No hay videos para este barrio todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibles.map((r) => (
            <ReelCard key={r.videoId} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function FiltChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary px-4 py-2 text-[13px] font-semibold transition-colors"
          : "inline-flex items-center gap-1.5 rounded-full border border-outline-variant text-on-surface-variant px-4 py-2 text-[13px] font-medium hover:border-primary hover:text-primary transition-colors"
      }
    >
      {children}
    </button>
  );
}
