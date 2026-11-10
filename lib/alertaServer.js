// lib/alertaServer.js — Alta de alerta desde el SERVER (ej. chat IA cuando el usuario deja su email
// para una alerta). Mismo destino que /api/lead: pipeline Vercel si está activo; si no, el webhook
// del Apps Script (SHEET_WEBHOOK). Mismo shape que lib/alertaLead (cliente).
import { pipelineVercelActivo, procesarLead, SHEET_WEBHOOK } from "./leadPipeline";

export async function guardarAlertaServer({ email, zonas = "", presupuesto = "", ambientes = "", mensaje = "", fuente = "chat", nombre = "", whatsapp = "" }) {
  const em = String(email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return { ok: false, error: "email" };
  const sheet = {
    origen: "Alerta", tipo: "alerta_lanzamiento", email: em,
    zonas: String(zonas || "").trim() || "abierto",
    presupuesto: presupuesto ? String(presupuesto) : "",
    ambientes: ambientes ? String(ambientes) : "",
    mensaje: mensaje || "Alerta creada desde el chat", fuente,
  };
  if (nombre) sheet.nombre = nombre;
  if (whatsapp) sheet.whatsapp = whatsapp;
  if (pipelineVercelActivo()) {
    try { await procesarLead(sheet); return { ok: true, sheet }; } catch (e) { /* cae al webhook */ }
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(SHEET_WEBHOOK, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(sheet), signal: ctrl.signal });
    return { ok: r.ok, sheet };
  } catch {
    return { ok: false, error: "network", sheet };
  } finally {
    clearTimeout(t);
  }
}
