'use client';
import { useEffect } from 'react';

// Red de seguridad global: si una imagen externa no carga (aviso dado de baja, hotlink, 404)
// se oculta en vez de mostrar el ícono roto. Si la imagen es la principal de una tarjeta o
// galería (contenedor con data-img-slot), el contenedor queda con su fondo de color.
export default function ImgFallback() {
  useEffect(() => {
    const hide = (img) => {
      if (!img || img.dataset.fallbackDone || img.hasAttribute('data-own-fallback')) return;
      img.dataset.fallbackDone = '1';
      const slot = img.closest('[data-img-slot="galeria"]');
      if (slot) { slot.style.display = 'none'; return; }
      img.style.visibility = 'hidden';
    };
    const onErr = (e) => { const t = e.target; if (t && t.tagName === 'IMG') hide(t); };
    document.addEventListener('error', onErr, true);
    // Imágenes que fallaron antes de hidratar.
    document.querySelectorAll('img').forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.src) hide(img); });
    return () => document.removeEventListener('error', onErr, true);
  }, []);
  return null;
}
