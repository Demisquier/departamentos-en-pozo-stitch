// /api/track — recibe eventos de métricas del navegador (impresiones de cards, visitas a ficha,
// clics de WhatsApp) en lote y los suma en Supabase. Sin datos personales: sólo slug + tipo.
import { registrarMetricas } from "../../../lib/metricas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor/i;

export async function POST(req) {
  const ua = req.headers.get("user-agent") || "";
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
  let body = null;
  try { body = JSON.parse(await req.text()); } catch (e) { return new Response(null, { status: 204 }); }
  const ev = Array.isArray(body && body.e) ? body.e.slice(0, 300) : [];
  await registrarMetricas(ev);
  return new Response(null, { status: 204 });
}
