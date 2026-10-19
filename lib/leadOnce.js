// lib/leadOnce.js — Envío de lead con dedup en el navegador.
// Misma persona (WhatsApp/email) + mismo proyecto en 12 h → no se reenvía (la desarrolladora
// recibe 1 solo mail aunque el usuario use "quiero info", WhatsApp y chat en la misma ficha).
// Complementa el dedup server-side de /api/lead.
const KEY = "dpp_leads_enviados_v1";
const TTL = 12 * 3600 * 1000;

function clave(s) {
  const wa = String(s.whatsapp || "").replace(/\D/g, "").slice(-8);
  const em = String(s.email || "").trim().toLowerCase();
  const who = wa.length >= 8 ? "w" + wa : em ? "e" + em : "";
  if (!who) return "";
  return who + "|" + String(s.proyectoSlug || s.proyecto || s.mensaje || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
}

export async function postLead(body) {
  const s = (body && body.sheet) || {};
  const k = clave(s);
  let mapa = {};
  try { mapa = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
  const now = Date.now();
  if (k && mapa[k] && now - mapa[k] < TTL) return { ok: true, dedup: true };
  const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (k && r.ok) {
    try {
      for (const kk of Object.keys(mapa)) if (now - mapa[kk] > TTL) delete mapa[kk];
      mapa[k] = now;
      localStorage.setItem(KEY, JSON.stringify(mapa));
    } catch {}
  }
  return r;
}
