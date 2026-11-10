// lib/alertaLead.js — Alta de ALERTA de lanzamientos desde cualquier superficie del sitio (cliente).
// TODAS las altas van por /api/lead con el mismo shape, así llegan a la planilla que lee el job:
//   sheet = { origen:"Alerta", tipo:"alerta_lanzamiento", email, zonas, presupuesto, ambientes,
//             mensaje, fuente, nombre?, whatsapp?, referencia? }
// · zonas: texto libre con barrios separados por coma, o "abierto" (todo CABA).
// · presupuesto: USD máximo (número como string) o "".
// · ambientes: "2" | "2,3" | "4+" | "".
// · fuente: superficie que generó el alta (post_lead | ficha | listado | alertas_form | chat | banner).
// · referencia: proyecto de contexto (NO se manda como proyecto/proyectoSlug para que el pipeline
//   no lo trate como lead derivable a la desarrolladora ni lo deduplique contra el lead original).
// Evento GA4: alerta_lead { fuente, zonas }.
import { track } from "./track";

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function leerEmailPerfil() {
  try { return (JSON.parse(localStorage.getItem("dpp_perfil_v1") || "{}").email || "").trim(); } catch { return ""; }
}

// Presupuesto "≈ precio del proyecto": tope = precio + 15%, redondeado a miles.
export function presupuestoDesdePrecio(precio) {
  const n = Number(precio);
  if (!n || !isFinite(n)) return "";
  return String(Math.round((n * 1.15) / 1000) * 1000);
}

export async function crearAlerta({ email, zonas = "", presupuesto = "", ambientes = "", mensaje = "", fuente = "", nombre = "", whatsapp = "", referencia = "" } = {}) {
  const em = String(email || "").trim();
  if (!EMAIL_RE.test(em)) return { ok: false, error: "email" };
  const z = String(zonas || "").trim() || "abierto";
  const sheet = {
    origen: "Alerta",
    tipo: "alerta_lanzamiento",
    email: em,
    zonas: z,
    presupuesto: presupuesto ? String(presupuesto) : "",
    ambientes: ambientes ? String(ambientes) : "",
    mensaje: mensaje || ("Alerta de lanzamientos · " + (z === "abierto" ? "todo CABA" : z) + (presupuesto ? " · hasta USD " + Number(presupuesto).toLocaleString("es-AR") : "") + (ambientes ? " · " + ambientes + " amb" : "")),
    fuente: fuente || "",
  };
  if (nombre) sheet.nombre = String(nombre).trim();
  if (whatsapp) sheet.whatsapp = String(whatsapp).trim();
  if (referencia) sheet.referencia = String(referencia).trim();
  try {
    const prev = JSON.parse(localStorage.getItem("dpp_perfil_v1") || "{}");
    if (!prev.email) localStorage.setItem("dpp_perfil_v1", JSON.stringify({ ...prev, email: em }));
  } catch {}
  track("alerta_lead", { fuente: fuente || "", zonas: z });
  try {
    const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheet }) });
    return { ok: r.ok };
  } catch {
    return { ok: false, error: "network" };
  }
}
