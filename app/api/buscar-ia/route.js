// app/api/buscar-ia/route.js — Búsqueda semántica (GPT) env-gated, grounded en el catálogo.
// GET  → { ready }.
// POST { q } → { resultados:[{slug,nombre,barrio,precioDesde,imagen,url,motivo}] }.
// Sin OPENAI_API_KEY: 200 { needsKey:true }. Errores → 200 { error:true, resultados:[] }.
import { hasKey, loadCatalogo, prefiltrar, cardFrom, openaiChat } from "../../../lib/ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ready: hasKey() });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { body = {}; }
  const q = (body?.q || "").toString().trim().slice(0, 240);

  if (!hasKey()) return Response.json({ needsKey: true, resultados: [] });
  if (!q) return Response.json({ resultados: [] });

  try {
    const catalogo = await loadCatalogo();
    const byId = new Map(catalogo.map((p) => [p.slug, p]));
    const cand = prefiltrar(catalogo, q, 80);
    const lista = cand
      .map((p) => {
        const precio = p.precioDesde ? `USD ${p.precioDesde}` : (p.precioM2 ? `USD ${p.precioM2}/m2` : "s/precio");
        return `${p.slug} | ${p.nombre} | ${p.barrio || "s/barrio"} | ${p.ambientes || "s/tipo"} | ${precio}`;
      })
      .join("\n");

    const sys = `Sos un motor de búsqueda semántica para un catálogo de departamentos en pozo (CABA/GBA). Te doy una CONSULTA en lenguaje natural y una LISTA de proyectos (formato: slug | nombre | barrio | tipologías | precio). Elegí los mejores ~12 matches semánticos para la consulta. Usá SOLO slugs de la lista, no inventes. Respondé JSON: {"resultados":[{"slug":"...","motivo":"breve, en español, por qué encaja"}]}. Ordená del mejor al peor.`;
    const usr = `CONSULTA: ${q}\n\nLISTA:\n${lista}`;

    const raw = await openaiChat(
      [{ role: "system", content: sys }, { role: "user", content: usr }],
      { jsonMode: true, temperature: 0.2 }
    );

    let parsed = {};
    try { parsed = JSON.parse(raw || "{}"); } catch { parsed = {}; }
    const arr = Array.isArray(parsed?.resultados) ? parsed.resultados : [];

    const resultados = [];
    const seen = new Set();
    for (const r of arr) {
      const slug = r?.slug;
      if (!slug || seen.has(slug)) continue;
      const p = byId.get(slug);
      if (!p) continue;
      seen.add(slug);
      // Card sanitizada (dedupe por slug ya garantizado por `seen`; ambientes/entrega
      // normalizados) + el motivo semántico del LLM.
      resultados.push({ ...cardFrom(p), motivo: (r.motivo || "").toString().slice(0, 160) });
      if (resultados.length >= 12) break;
    }

    return Response.json({ resultados });
  } catch {
    return Response.json({ error: true, resultados: [] });
  }
}
