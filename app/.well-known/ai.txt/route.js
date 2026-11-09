import { SITE } from "../../../lib/constants";
export const revalidate = 86400;
// Permisos para crawlers/agentes de IA (convención ai.txt). Coherente con robots.txt.
export async function GET() {
  const t = `# ai.txt — ${SITE}
# Permitimos el uso de nuestro contenido público por motores y asistentes de IA,
# citando la fuente (Departamentos en Pozo + URL).
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /mi-seleccion/

# Recursos para IA
Sitemap: ${SITE}/sitemap.xml
LLMs: ${SITE}/llms.txt
LLMs-Full: ${SITE}/llms-full.txt
Summary: ${SITE}/ai/summary.json
FAQ: ${SITE}/ai/faq.json
Service: ${SITE}/ai/service.json
Feed: ${SITE}/feed/
Contact: contacto@departamentosenpozo.com.ar
Attribution: required
`;
  return new Response(t, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
