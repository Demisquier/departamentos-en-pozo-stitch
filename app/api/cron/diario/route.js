// Cron diario único (Vercel): corre los chequeos diarios en serie.
//  1) /api/cron/leads-destino — que cada ficha tenga a quién derivarle el lead.
//  2) /api/cron/mails-diario  — revisión de la bandeja contacto@ (accionables).
//  3) alertas a suscriptores (gate: data/config-alertas.json).
//  4) compacta la pestaña Metricas (una fila por día+slug+tipo).
// Cada uno manda mail solo si encuentra algo para hacer.
import { GET as leadsDestino } from "../leads-destino/route";
import { GET as mailsDiario } from "../mails-diario/route";
import { compactarMetricas } from "../../../../lib/metricas";
import { correrAlertas } from "../../../../lib/alertasEnvio";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req) {
  const out = {};
  for (const [k, fn] of [["leadsDestino", leadsDestino], ["mailsDiario", mailsDiario]]) {
    try { const r = await fn(req); out[k] = await r.json(); } catch (e) { out[k] = { ok: false, error: e.message }; }
  }
  try { out.alertas = await correrAlertas("auto"); } catch (e) { out.alertas = { ok: false, error: e.message }; }
  try { out.metricas = await compactarMetricas(); } catch (e) { out.metricas = { ok: false, error: e.message }; }
  return Response.json(out);
}
