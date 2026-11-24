// app/api/buscar-ia/route.js — Búsqueda semántica (GPT) env-gated, grounded en el catálogo.
// GET  → { ready }.
// POST { q } → { resultados:[{slug,nombre,barrio,precioDesde,imagen,url,motivo}] }.
// Sin OPENAI_API_KEY: 200 { needsKey:true }. Errores → 200 { error:true, resultados:[] }.
import { hasKey, loadCatalogo, prefiltrar, cardFrom, openaiChat, filtroDuro } from "../../../lib/ia";

// Caché en memoria por consulta normalizada (instancia caliente): repetir una búsqueda es instantáneo.
const CACHE = new Map();
const CACHE_TTL = 6 * 3600e3;

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
  const ck = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  const hitC = CACHE.get(ck);
  if (hitC && Date.now() - hitC.t < CACHE_TTL) return Response.json(hitC.v);

  try {
    const catalogo = await loadCatalogo();
    const byId = new Map(catalogo.map((p) => [p.slug, p]));
    // QA nov-2026: 80 candidatos + motivos largos tardaba ~11 s. Ahora 40 candidatos filtrados por
    // barrio/tope, motivo de pocas palabras y salida acotada.
    const cand = filtroDuro(prefiltrar(catalogo, q, 60), q, catalogo).slice(0, 40);
    const lista = cand
      .map((p) => {
        const precio = p.precioDesde ? `USD ${p.precioDesde}` : (p.precioM2 ? `USD ${p.precioM2}/m2` : "s/precio");
        return `${p.slug} | ${p.nombre} | ${p.barrio || "s/barrio"} | ${p.ambientes || "s/tipo"} | ${precio}`;
      })
      .join("\n");

    const sys = `Sos un motor de búsqueda semántica para un catálogo de departamentos en pozo (CABA/GBA). Te doy una CONSULTA en lenguaje natural y una LISTA de proyectos (formato: slug | nombre | barrio | tipologías | precio). Elegí los mejores ~12 matches semánticos para la consulta. Usá SOLO slugs de la lista, no inventes. Respondé JSON: {"resultados":[{"slug":"...","motivo":"máximo 8 palabras, en español"}]}. Ordená del mejor al peor.`;
    const usr = `CONSULTA: ${q}\n\nLISTA:\n${lista}`;

    const raw = await openaiChat(
      [{ role: "system", content: sys }, { role: "user", content: usr }],
      { jsonMode: true, temperature: 0.2, maxTokens: 450 }
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

    const v = { resultados };
    if (resultados.length) { CACHE.set(ck, { t: Date.now(), v }); if (CACHE.size > 300) CACHE.delete(CACHE.keys().next().value); }
    return Response.json(v);
  } catch {
    return Response.json({ error: true, resultados: [] });
  }
}
