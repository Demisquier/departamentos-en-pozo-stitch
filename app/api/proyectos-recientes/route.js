// app/api/proyectos-recientes/route.js — Lista de proyectos ordenada por MÁS NUEVOS (id desc),
// para que el job de alertas (Apps Script) detecte lanzamientos nuevos y avise a los suscriptores.
//   ?desde=<id>  → sólo devuelve proyectos con id > desde (lo que el job todavía no procesó).
//   ?limit=<n>   → tope de resultados (default 50, máx 200).
import { NextResponse } from "next/server";
import { getDesarrollos, acf } from "../../../lib/wp";
import { toNumber } from "../../../lib/format";

export const revalidate = 3600;

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const desde = parseInt(url.searchParams.get("desde") || "0", 10) || 0;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);
    const all = await getDesarrollos();
    const items = (all || [])
      .map((d) => {
        const titulo = (d.title && d.title.rendered) || d.slug || "";
        const nombre = titulo.split("—")[0].trim() || titulo; // separa "Nombre — Barrio"
        const barrio = (titulo.split("—")[1] || "").trim() || acf(d, "barrio") || d.barrio || "";
        const precioDesde = toNumber(acf(d, "precio_desde")) || null;
        return { id: Number(d.id) || 0, slug: d.slug, nombre, barrio, precioDesde, url: `/desarrollos-inmobiliarios/${d.slug}/` };
      })
      .filter((x) => x.slug && x.id > desde);
    items.sort((a, b) => b.id - a.id);
    const maxId = items.length ? items[0].id : desde;
    return NextResponse.json(
      { count: items.length, maxId, items: items.slice(0, limit) },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
