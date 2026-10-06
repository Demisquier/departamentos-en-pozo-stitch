// app/api/lead-health/route.js — Chequeo del pipeline de leads (sin datos personales).
// Sirve para validar la service account ANTES de activar LEADS_PIPELINE=vercel.
import { sheetsReady, tabs, getValues } from "../../../lib/googleSheets";
import { resendReady } from "../../../lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const out = {
    modo: process.env.LEADS_PIPELINE === "vercel" ? (sheetsReady() ? "vercel (planilla directa)" : "vercel híbrido (planilla vía Apps Script)") : "apps-script",
    envSheets: sheetsReady(),
    envMail: resendReady(),
    sheetsOk: false,
    pestanas: [],
    encabezadosLeads: [],
  };
  if (out.envSheets) {
    try {
      out.pestanas = await tabs();
      const tab = process.env.LEADS_SHEET_TAB || out.pestanas[0];
      out.encabezadosLeads = ((await getValues(tab + "!A1:Z1"))[0]) || [];
      out.sheetsOk = true;
    } catch (e) { out.error = String(e.message || e).slice(0, 200); }
  }
  out.listoParaActivar = out.envMail && (!out.envSheets || (out.sheetsOk && out.encabezadosLeads.length > 0));
  return Response.json(out, { headers: { "Cache-Control": "no-store" } });
}
