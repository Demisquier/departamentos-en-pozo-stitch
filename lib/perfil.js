// lib/perfil.js — Perfil ÚNICO del usuario (unifica Mi Plan + chats + WhatsApp gate).
// Todo lo que Valentina captura (nombre, WhatsApp, email, zona/presupuesto/ambientes)
// se escribe en la MISMA clave que usa Mi Plan: "dpp_perfil_v1". Así hay UN solo lead /
// perfil por usuario: si ya te conocemos, no re-preguntamos y te saludamos por tu nombre.
// Client-only (usa localStorage). Best-effort: nunca rompe si no hay storage.

const KEY = "dpp_perfil_v1";

export function readPerfil() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

// Merge NO destructivo: conserva contactados/descartes (memoria del plan) y lo ya cargado.
// Solo pisa un campo si el nuevo valor tiene contenido. Emite evento para que Mi Plan repinte.
export function writePerfil(patch = {}) {
  if (typeof window === "undefined") return {};
  let base = {};
  try { base = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  const next = { ...base };
  Object.keys(patch).forEach((k) => {
    const v = patch[k];
    if (v === undefined || v === null) return;
    if (typeof v === "string" && !v.trim()) return;
    next[k] = typeof v === "string" ? v.trim() : v;
  });
  next.ts = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  try { window.dispatchEvent(new Event("dpp-perfil-updated")); } catch {}
  return next;
}

export function primerNombre(s) {
  const t = String(s || "").trim().split(/\s+/)[0] || "";
  if (t.length < 2 || t.length > 20) return "";
  if (/[0-9@]/.test(t)) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// WhatsApp válido = al menos 6 dígitos. Enmascarado para mostrar sin exponer todo el número.
export function wppValido(s) { return ((String(s || "").match(/\d/g) || []).length >= 6); }
export function mailValido(s) { return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(String(s || "")); }
export function maskWpp(s) {
  const d = String(s || "").replace(/\D/g, "");
  if (d.length < 4) return s;
  return "•••• " + d.slice(-4);
}

// Envía el lead al pipeline (contacto@ vía /api/lead) Y persiste el perfil unificado.
// origen: "explorar-ia" | "chat-ia" | ... — se refleja en el mail y en el Sheet.
export async function enviarLead({ nombre = "", whatsapp = "", email = "", proyecto = "", proyectoSlug = "", origen = "chat-ia", track } = {}) {
  const subj = origen === "explorar-ia" ? "Nuevo lead (Explorar IA)" : "Nuevo lead (chat IA)";
  const origenLabel = origen === "explorar-ia" ? "Explorar IA" : "Chat IA";
  try {
    await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mail: { _subject: subj, _template: "table", _captcha: "false", Nombre: nombre || "—", WhatsApp: whatsapp || "—", Email: email || "—", "Proyecto de interés": proyecto || "—", Origen: origenLabel },
        sheet: { origen, tipo: "chat", nombre, email, whatsapp, proyecto, proyectoSlug },
      }),
    });
  } catch {}
  writePerfil({ nombre, whatsapp, email });
  try { if (typeof track === "function") track("lead", { tipo: "chat", origen, proyecto }); } catch {}
  return true;
}
