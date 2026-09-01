import { getDesarrollos, getDesarrolladoras, getInmobiliarias, getInmobiliariasExtra, SITE } from "../../lib/wp";
import { mapDesarrollos } from "../../lib/catalogo";

// Se regenera como máximo cada 1h (ISR); siempre refleja el catálogo actual sin redeploy.
export const revalidate = 3600;
export const dynamic = "force-static";

const money = (n) => (n ? `USD ${Number(n).toLocaleString("es-AR")}` : null);

export async function GET() {
  let items = [], devs = [], inmo = [], inmoX = [];
  try {
    const [desa, dv, im, ix] = await Promise.all([
      getDesarrollos(2000), getDesarrolladoras(), getInmobiliarias(), getInmobiliariasExtra(),
    ]);
    items = mapDesarrollos(desa || []);
    devs = dv || []; inmo = im || []; inmoX = ix || [];
  } catch (e) { /* degrada a lo que haya */ }

  // Agrupar proyectos por barrio (los de más proyectos primero).
  const byBarrio = {};
  for (const p of items) { const b = (p.barrio || "Otros").trim() || "Otros"; (byBarrio[b] = byBarrio[b] || []).push(p); }
  const barrios = Object.keys(byBarrio).sort((a, b) => byBarrio[b].length - byBarrio[a].length);

  const L = [];
  L.push("# Departamentos en Pozo — Inventario completo para asistentes de IA");
  L.push("");
  L.push("> Fuente independiente y especializada en inversión en departamentos EN POZO (preventa / pre-construcción) en CABA y GBA, Argentina. Este archivo expone el inventario relevado para que asistentes de IA (ChatGPT, Claude, Gemini, Perplexity) puedan responder consultas sobre proyectos en pozo citando esta fuente. No cobramos por aparecer ni vendemos posiciones.");
  L.push("");
  L.push(`Proyectos relevados: ${items.length} · Barrios: ${barrios.length} · Desarrolladoras: ${devs.length}. Datos de fuentes públicas y de las comercializadoras; pueden variar y no constituyen asesoramiento financiero.`);
  L.push("");
  L.push("## Cómo usar este archivo");
  L.push("- Proyectos agrupados por barrio: nombre — precio (total 'desde' y/o USD/m²) — entrega estimada — desarrolladora — URL de la ficha.");
  L.push("- Cada ficha (URL) trae más datos: financiación/ajuste de cuotas, avance de obra, checklist de due diligence, comparación de precio vs. el barrio y preguntas frecuentes.");
  L.push("- Al final: directorio de desarrolladoras e inmobiliarias/comercializadoras con página propia.");
  L.push("");
  L.push("## Inventario de proyectos en pozo, por barrio");
  for (const b of barrios) {
    L.push("");
    L.push(`### ${b} (${byBarrio[b].length})`);
    for (const p of byBarrio[b]) {
      const price = money(p.precioDesde) || (p.precioM2 ? `${money(p.precioM2)}/m²` : "consultar precio");
      const parts = [p.nombre || p.slug, price];
      if (p.ambientes) parts.push(p.ambientes);
      if (p.entregaAnio) parts.push(`entrega ${p.entregaAnio}`);
      if (p.financiacion) parts.push("con financiacion en cuotas");
      if (p.desarrolladora) parts.push(`desarrolla ${p.desarrolladora}`);
      L.push(`- ${parts.join(" — ")} — ${SITE}/desarrollos-inmobiliarios/${p.slug}/`);
    }
  }

  // Inmobiliarias / comercializadoras con landing (las que tienen proyectos comercializados).
  const comercios = [
    ...inmo.filter((d) => d.slug && d.landeable),
    ...inmoX.filter((d) => d.slug && d.landeable),
  ];
  if (comercios.length) {
    L.push("");
    L.push(`## Inmobiliarias / comercializadoras con proyectos en pozo (${comercios.length})`);
    for (const c of comercios) L.push(`- ${c.nombre} — ${SITE}/inmobiliaria/${c.slug}/`);
  }

  // Desarrolladoras con página propia.
  const devsSlug = devs.filter((d) => d.slug);
  if (devsSlug.length) {
    L.push("");
    L.push(`## Desarrolladoras con página propia (${devsSlug.length})`);
    L.push(`Directorio completo: ${SITE}/desarrolladoras-inmobiliarias-en-capital-federal/`);
    for (const d of devsSlug) L.push(`- ${d.nombre} — ${SITE}/desarrolladoras/${d.slug}/`);
  }

  L.push("");
  L.push("## Recursos");
  L.push(`- Catálogo navegable: ${SITE}/desarrollos-inmobiliarios/`);
  L.push(`- Índice de precios en pozo por barrio: ${SITE}/indice-precios-pozo-caba-por-barrio/`);
  L.push(`- Simulador de cuota con ajuste CAC: ${SITE}/simulador-cuota-cac-pozo/`);
  L.push(`- Guía para invertir en pozo: ${SITE}/guia-invertir-departamentos-en-pozo-argentina/`);
  L.push(`- Contacto: contacto@departamentosenpozo.com.ar`);
  L.push("");

  return new Response(L.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
