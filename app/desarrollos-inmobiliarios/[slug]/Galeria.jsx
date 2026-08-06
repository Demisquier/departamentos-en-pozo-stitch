"use client";
import { useState, useEffect, useCallback } from "react";

// Galería mosaico estilo Zillow + lightbox con zoom, navegación y teclado.
export default function Galeria({ images = [], nombre = "Proyecto" }) {
  const imgs = (images || []).filter(Boolean);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);

  const show = useCallback((i) => { setIdx(i); setZoom(false); setOpen(true); }, []);
  const close = useCallback(() => { setOpen(false); setZoom(false); }, []);
  const next = useCallback(() => { setZoom(false); setIdx((i) => (i + 1) % imgs.length); }, [imgs.length]);
  const prev = useCallback(() => { setZoom(false); setIdx((i) => (i - 1 + imgs.length) % imgs.length); }, [imgs.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, close, next, prev]);

  const Tile = ({ src, alt, i }) =>
    src ? (
      <button type="button" onClick={() => show(i)} className="group w-full h-full block relative overflow-hidden cursor-zoom-in" aria-label={`Ampliar foto ${i + 1}`}>
        <img src={src} alt={alt} loading={i === 0 ? "eager" : "lazy"} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </button>
    ) : (
      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
        <span className="material-symbols-outlined text-outline-variant text-4xl">image</span>
      </div>
    );

  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 mb-6 rounded-xl overflow-hidden relative" style={{ minHeight: "340px" }}>
        <div className="md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto relative"><Tile src={imgs[0]} alt={nombre} i={0} /></div>
        <div className="hidden md:block relative"><Tile src={imgs[1]} alt={`${nombre} 2`} i={1} /></div>
        <div className="hidden md:block relative"><Tile src={imgs[2]} alt={`${nombre} 3`} i={2} /></div>
        <div className="hidden md:block relative"><Tile src={imgs[3]} alt={`${nombre} 4`} i={3} /></div>
        <div className="hidden md:block relative"><Tile src={imgs[4]} alt={`${nombre} 5`} i={4} /></div>
        {imgs.length > 0 && (
          <button type="button" onClick={() => show(0)} className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 hover:bg-white transition-colors">
            <span className="material-symbols-outlined text-[18px] text-primary">photo_library</span>
            <span className="text-[13px] font-medium text-primary">Ver {imgs.length} foto{imgs.length > 1 ? "s" : ""}</span>
          </button>
        )}
      </section>

      {open && imgs.length > 0 && (
        // Tocar CUALQUIER zona oscura del overlay cierra (onClick={close} en la raíz).
        // Solo la imagen, las flechas y las miniaturas detienen la propagación para no cerrar
        // por accidente. Así en mobile no queda "atrapado": el 90% de la pantalla cierra.
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.94)" }} onClick={close}>
          {/* Botón CERRAR flotante: glifo unicode (siempre renderiza, sin depender de la
              fuente de íconos), target grande, alto contraste, por encima de todo. */}
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar galería"
            className="fixed top-3 right-3 z-[120] flex items-center gap-2 h-11 pl-4 pr-3 rounded-full bg-white text-primary shadow-lg hover:bg-white/90 active:scale-95 transition"
          >
            <span className="text-[15px] font-semibold">Cerrar</span>
            <span className="text-[20px] leading-none">✕</span>
          </button>

          <div className="flex items-center px-4 py-3 text-white/90 shrink-0">
            <span className="text-[14px] font-medium">{idx + 1} / {imgs.length}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); setZoom((z) => !z); }} className="ml-auto mr-14 p-2 hover:bg-white/10 rounded-full text-[22px] leading-none" aria-label="Zoom">
              {zoom ? "－" : "＋"}
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-auto px-2">
            {imgs.length > 1 && (
              <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 md:left-6 z-10 w-11 h-11 flex items-center justify-center bg-white/15 hover:bg-white/30 rounded-full text-white text-[30px] leading-none" aria-label="Anterior">‹</button>
            )}
            <img
              src={imgs[idx]}
              alt={`${nombre} — foto ${idx + 1}`}
              referrerPolicy="no-referrer"
              onClick={(e) => { e.stopPropagation(); setZoom((z) => !z); }}
              className={`select-none transition-transform duration-300 ${zoom ? "max-w-none max-h-none w-auto h-auto scale-150 cursor-zoom-out" : "max-w-[92vw] max-h-[74vh] object-contain cursor-zoom-in"}`}
            />
            {imgs.length > 1 && (
              <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 md:right-6 z-10 w-11 h-11 flex items-center justify-center bg-white/15 hover:bg-white/30 rounded-full text-white text-[30px] leading-none" aria-label="Siguiente">›</button>
            )}
          </div>

          {imgs.length > 1 && (
            <div className="shrink-0 flex gap-2 justify-center p-3 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
              {imgs.map((src, i) => (
                <button key={i} type="button" onClick={() => { setZoom(false); setIdx(i); }} className={`h-14 w-20 rounded overflow-hidden shrink-0 border-2 transition-all ${i === idx ? "border-link-gold" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={src} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
