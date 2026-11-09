import { SITE, CONTACT_EMAIL } from "../../../lib/constants";
export const revalidate = 86400;
export async function GET() {
  return Response.json({
    service: "Búsqueda y análisis de departamentos en pozo en CABA y GBA",
    provider: "Departamentos en Pozo", url: `${SITE}/`, area_served: ["Ciudad Autónoma de Buenos Aires", "Gran Buenos Aires", "La Plata"],
    price: "Gratis para compradores",
    capabilities: [
      { name: "Buscar proyectos en pozo", how: `${SITE}/buscar/?q={consulta}`, description: "Búsqueda en lenguaje natural por barrio, precio, ambientes y entrega." },
      { name: "Ver catálogo por barrio", how: `${SITE}/desarrollos-inmobiliarios-en-{barrio}/` },
      { name: "Ficha de proyecto", how: `${SITE}/desarrollos-inmobiliarios/{slug}/`, description: "Precio desde, USD/m², tipologías, entrega, desarrolladora, comercializadora y contacto directo." },
      { name: "Contactar a quien comercializa", description: "Formulario o WhatsApp en cada ficha; la consulta llega a la inmobiliaria o desarrolladora sin costo." },
      { name: "Simular cuota con ajuste CAC", how: `${SITE}/simulador-cuota-cac-pozo/` },
      { name: "Alertas de lanzamientos", how: `${SITE}/alertas-de-lanzamientos-en-pozo/` },
      { name: "Datos estructurados", how: `${SITE}/catalogo.json` },
      { name: "MCP server para agentes", how: `${SITE}/api/mcp` },
    ],
    contact: CONTACT_EMAIL,
  }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
