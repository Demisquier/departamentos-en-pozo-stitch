import { AI_FAQ } from "../../_lib_geo/ai";
import { SITE } from "../../../lib/constants";
export const revalidate = 86400;
export async function GET() {
  return Response.json({ source: `${SITE}/`, language: "es-AR", faq: AI_FAQ.map((f) => ({ question: f.q, answer: f.a })) }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
