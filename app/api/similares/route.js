// app/api/similares/route.js — Devuelve proyectos "similares" a uno dado (para el mail de
// recomendación automatizado). Similar = parecido en TODO: barrio, precio, ambientes,
// entrega y financiación. GET ?slug=<slug>&limit=4  → { proyecto, similares:[cards] }.
// Sin deps nuevas: reusa el catálogo real (loadCatalogo) y el shape de card (cardFrom).
import { loadCatalogo, cardFrom, fichaUrl } from "../../../lib/ia";
import { SITE } from "../../../lib/wp";

export const runtime = "nodejs";
export const revalidate = 3600;

const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const barrioBase = (b) => norm(b).split(/\s+/)[0] || ""; // "palermo hollywood" -> "palermo"

// Puntúa qué tan parecido es `c` al proyecto objetivo `t` (mismo criterio en todos los ejes).
function score(t, c) {
  let s = 0;
  const tb = barrioBase(t.barrio), cb = barrioBase(c.barrio);
  if (tb && cb) {
    if (norm(t.barrio) === norm(c.barrio)) s += 6;      // mismo barrio granular
    else if (tb === cb) s += 4;                          // misma base (Palermo Soho ~ Palermo Hollywood)
  }
  // Precio "desde": cuanto más cerca, más puntos.
  if (t.precioDesde && c.precioDesde) {
    const d = Math.abs(t.precioDesde - c.precioDesde) / t.precioDesde;
    if (d <= 0.15) s += 5; else if (d <= 0.3) s += 3; else if (d <= 0.5) s += 1; else s -= 1;
  }
  // Ambientes: solapamiento de tipologías.
  const ta = new Set((t.ambientesNums || []).map((x) => String(x).replace(/\D/g, "")));
  const ca = (c.ambientesNums || []).map((x) => String(x).replace(/\D/g, ""));
  if (ta.size && ca.some((x) => ta.has(x))) s += 3;
  // Entrega: mismo año (o ±1).
  if (t.entregaAnio && c.entregaAnio) {
    const dd = Math.abs(t.entregaAnio - c.entregaAnio);
    if (dd === 0) s += 2; else if (dd === 1) s += 1;
  }
  // Financiación: mismo esquema.
  if (t.financiacion && c.financiacion) s += 1;
  // Pequeño bonus por tener imagen/precio (mejor card).
  if (c.imagen) s += 0.5;
  if (c.precioDesde) s += 0.3;
  return s;
}

export async function GET(req) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  const q = (url.searchParams.get("nombre") || url.searchParams.get("q") || "").trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "4", 10) || 4, 1), 8);
  const cat = await loadCatalogo();
  // Resuelve el proyecto objetivo por slug; si no hay, por nombre (para leads que traen el
  // nombre pero no el slug). Match exacto y, si no, por inclusión normalizada.
  let target = slug ? cat.find((x) => x.slug === slug) : null;
  if (!target && q) {
    const nq = norm(q);
    target = cat.find((x) => norm(x.nombre) === nq) ||
             cat.find((x) => { const n = norm(x.nombre); return n && (n.includes(nq) || nq.includes(n)); });
  }
  if (!target) {
    return Response.json({ error: "not_found", slug, nombre: q, similares: [] }, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
  }
  const ranked = cat
    .filter((x) => x.slug && x.slug !== slug)
    .map((c) => ({ c, s: score(target, c) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => cardFrom(x.c));

  const out = {
    proyecto: {
      slug: target.slug, nombre: target.nombre, barrio: target.barrio || "",
      precioDesde: target.precioDesde || null, url: fichaUrl(target.slug),
    },
    similares: ranked,
    site: SITE,
  };
  return Response.json(out, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
}
