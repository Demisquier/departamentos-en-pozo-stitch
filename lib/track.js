// lib/track.js — Eventos del funnel a GA4 (gtag) + dataLayer. Best-effort: si GA todavía no
// cargó (lazyOnload) o no está, no rompe nada. Eventos clave del embudo de captación:
//   chat_open · chat_email · lead · alerta_email · login · favorito_guardado · ver_listado · filtro_catalogo
export function track(event, params = {}) {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, params);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, ...params });
    }
  } catch {}
}
