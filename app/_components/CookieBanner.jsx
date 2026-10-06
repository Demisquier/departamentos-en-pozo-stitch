"use client";
// Banner de cookies + Google Consent Mode v2.
// Criterio: Argentina no exige opt-in previo para analítica → por defecto se mide (no perdemos
// datos de growth) y el usuario puede rechazar. Para visitantes de la UE/UK/CH el default es
// "denied" (lo define el script de GA en layout.jsx) hasta que acepten. Publicidad: siempre denied.
import { useEffect, useState } from "react";

const KEY = "dpp_cookies_v1";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch {}
  }, []);
  if (!show) return null;

  const elegir = (v) => {
    try { localStorage.setItem(KEY, v); } catch {}
    try { window.gtag && window.gtag("consent", "update", { analytics_storage: v === "aceptado" ? "granted" : "denied" }); } catch {}
    setShow(false);
  };

  return (
    <div role="dialog" aria-label="Uso de cookies"
      className="fixed z-[95] left-3 right-3 bottom-20 md:bottom-4 md:right-auto md:max-w-md rounded-xl border border-outline-variant bg-surface shadow-lg p-4">
      <p className="text-[13px] text-on-surface leading-snug">
        Usamos cookies de analítica para entender cómo se usa el sitio y mejorarlo. No usamos cookies publicitarias.{" "}
        <a href="/politica-de-privacidad/" className="underline text-secondary">Más info</a>
      </p>
      <div className="mt-3 flex gap-2 justify-end">
        <button onClick={() => elegir("rechazado")} className="px-4 py-2 rounded border border-outline-variant text-[13px] text-primary hover:bg-surface-container">Rechazar</button>
        <button onClick={() => elegir("aceptado")} className="px-4 py-2 rounded bg-primary-container text-on-primary text-[13px] font-medium hover:opacity-90">Aceptar</button>
      </div>
    </div>
  );
}
