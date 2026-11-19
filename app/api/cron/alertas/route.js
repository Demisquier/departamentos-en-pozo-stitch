// /api/cron/alertas — corre las alertas a suscriptores (lo llama /api/cron/diario).
//   ?modo=dry → solo calcula (no envía ni manda resumen). Auth: CRON_SECRET / ?secret=MAIL_SECRET / vercel-cron.
import { correrAlertas } from "../../../../lib/alertasEnvio";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function autorizado(req) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (process.env.MAIL_SECRET && url.searchParams.get("secret") === process.env.MAIL_SECRET) return true;
  if (!process.env.CRON_SECRET && /vercel-cron/i.test(req.headers.get("user-agent") || "")) return true;
  return false;
}

export async function GET(req) {
  const modo = new URL(req.url).searchParams.get("modo") === "dry" ? "dry" : "auto";
  if (!autorizado(req)) {
    // Sin auth: solo el cálculo en seco (sin datos personales en la respuesta).
    if (modo !== "dry") return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try { return Response.json(await correrAlertas(modo)); }
  catch (e) { return Response.json({ ok: false, error: e.message }, { status: 500 }); }
}
