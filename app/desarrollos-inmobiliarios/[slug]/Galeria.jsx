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
        <img src={src} alt={alt} loading={i === 0 ? "eager" : "lazy"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
        <div className="fixed inset-0 z-[100] bg-black/92 flex flex-col" onClick={close}>
          <div className="flex items-center justify-between px-4 py-3 text-white/90 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-[14px] font-medium">{idx + 1} / {imgs.length}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setZoom((z) => !z)} className="p-2 hover:bg-white/10 rounded-full" aria-label="Zoom">
                <span className="material-symbols-outlined">{zoom ? "zoom_out" : "zoom_in"}</span>
              </button>
              <button type="button" onClick={close} className="p-2 hover:bg-white/10 rounded-full" aria-label="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-auto px-2" onClick={(e) => e.stopPropagation()}>
            {imgs.length > 1 && (
              <button type="button" onClick={prev} className="absolute left-2 md:left-6 z-10 p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white" aria-label="Anterior">
                <span className="material-symbols-outlined text-[28px]">chevron_left</span>
              </button>
            )}
            <img
              src={imgs[idx]}
              alt={`${nombre} — foto ${idx + 1}`}
              onClick={() => setZoom((z) => !z)}
              className={`select-none transition-transform duration-300 ${zoom ? "max-w-none max-h-none w-auto h-auto scale-150 cursor-zoom-out" : "max-w-[92vw] max-h-[78vh] object-contain cursor-zoom-in"}`}
            />
            {imgs.length > 1 && (
              <button type="button" onClick={next} className="absolute right-2 md:right-6 z-10 p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white" aria-label="Siguiente">
                <span className="material-symbols-outlined text-[28px]">chevron_right</span>
              </button>
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
