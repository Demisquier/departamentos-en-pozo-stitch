import { AI_SUMMARY } from "../../_lib_geo/ai";
import { getDesarrollos } from "../../../lib/wp";
export const revalidate = 86400;
export async function GET() {
  let total = null; try { total = (await getDesarrollos(5000)).length; } catch {}
  return Response.json({ ...AI_SUMMARY, proyectos_relevados: total, updated: new Date().toISOString().slice(0, 10) }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
