import { getDesarrollos, SITE } from "../../lib/wp";
import { mapDesarrollos } from "../../lib/catalogo";

// Feed público del catálogo (JSON) para consumo por agentes de IA / integraciones.
// ISR 1h: siempre refleja el catálogo actual sin redeploy.
export const revalidate = 3600;
export const dynamic = "force-static";

export async function GET() {
  let items = [];
  try { items = mapDesarrollos(await getDesarrollos(2000)); } catch (e) { items = []; }

  const data = {
    fuente: "Departamentos en Pozo",
    descripcion: "Inventario de proyectos en pozo (preventa / pre-construcción) en CABA y GBA, Argentina. Análisis independiente, sin pauta.",
    sitio: SITE,
    actualizado: new Date().toISOString(),
    moneda: "USD",
    total: items.length,
    proyectos: items.map((p) => ({
      nombre: p.nombre,
      slug: p.slug,
      barrio: p.barrio || null,
      direccion: p.direccion || null,
      precio_desde_usd: p.precioDesde || null,
      precio_m2_usd: p.precioM2 || null,
      tipologias: p.ambientes || null,
      entrega: p.entrega || null,
      entrega_anio: p.entregaAnio || null,
      financiacion_en_cuotas: !!p.financiacion,
      desarrolladora: p.desarrolladora || null,
      etapa: p.etapa || null,
      lat: p.lat || null,
      lng: p.lng || null,
      url: `${SITE}/desarrollos-inmobiliarios/${p.slug}/`,
    })),
  };

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}
