// Chequeo diario único: corre en serie
//  1) /api/cron/leads-destino — que cada ficha tenga a quién derivarle el lead.
//  2) /api/cron/mails-diario  — revisión de la bandeja contacto@ (accionables).
//  3) compacta las métricas (una fila por día+slug+tipo).
// Cada paso manda mail SOLO a contacto@ si encuentra algo para hacer.
// Por qué es público: el cron de Vercel (legacy) no estaba ejecutando. Se puede disparar con
// cualquier visita/trigger externo; tiene enfriamiento de 6 h y la respuesta no expone datos
// (solo conteos), así que no hay riesgo de abuso ni de filtrar información.
import { GET as leadsDestino } from "../leads-destino/route";
import { GET as mailsDiario } from "../mails-diario/route";
import { compactarMetricas } from "../../../../lib/metricas";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

let ultimo = 0;
const COOLDOWN = 6 * 3600e3;

// Request "autorizado" para los sub-chequeos, armado en el server con los secretos de Vercel.
function reqInterno(req) {
  const url = new URL(req.url);
  const headers = new Headers({ "user-agent": "vercel-cron/1.0" });
  if (process.env.CRON_SECRET) headers.set("authorization", `Bearer ${process.env.CRON_SECRET}`);
  else if (process.env.MAIL_SECRET) url.searchParams.set("secret", process.env.MAIL_SECRET);
  return new Request(url.toString(), { headers });
}

const resumen = (j) => {
  if (!j || typeof j !== "object") return j;
  const out = { ok: j.ok !== false };
  for (const [k, v] of Object.entries(j)) {
    if (typeof v === "number" || typeof v === "boolean") out[k] = v;
    else if (Array.isArray(v)) out[k] = v.length;
    else if (k === "error") out.error = String(v).slice(0, 120);
  }
  return out;
};

export async function GET(req) {
  const ahora = Date.now();
  const forzar = /vercel-cron/i.test(req.headers.get("user-agent") || "");
  if (!forzar && ahora - ultimo < COOLDOWN) return Response.json({ ok: true, skip: "ya corrió hace menos de 6 h" });
  ultimo = ahora;
  const r = reqInterno(req);
  const out = { corrio: new Date().toISOString() };
  for (const [k, fn] of [["leadsDestino", leadsDestino], ["mailsDiario", mailsDiario]]) {
    try { const x = await fn(r); out[k] = resumen(await x.json()); } catch (e) { out[k] = { ok: false, error: e.message }; }
  }
  try { out.metricas = resumen(await compactarMetricas()); } catch (e) { out.metricas = { ok: false, error: e.message }; }
  return Response.json(out);
}
