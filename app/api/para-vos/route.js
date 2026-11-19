// /api/para-vos — Catálogo compacto para "Mi Plan" en la home (lo pide el navegador SOLO si el
// usuario ya tiene señales: guardados, fichas vistas o perfil). Cacheado 1 h en el CDN.
import { NextResponse } from "next/server";
import { getDesarrollos } from "../../../lib/wp";
import { mapDesarrollos } from "../../../lib/catalogo";
import { conSellos } from "../../../lib/sellos";

export const revalidate = 3600;

export async function GET() {
  try {
    const raw = await getDesarrollos();
    const ids = new Map((raw || []).map((d) => [d.slug, Number(d.id) || 0]));
    const items = conSellos(mapDesarrollos(raw || []))
      .filter((i) => i.imagen)
      .map((i) => ({
        s: i.slug, n: i.nombre, b: i.barrio, p: i.precioDesde ?? null, m2: i.precio ?? null,
        img: i.imagen, amb: i.ambientesNums || [], e: i.entrega || "", id: ids.get(i.slug) || 0,
        sel: i.sellos && i.sellos.length ? i.sellos : undefined,
      }));
    return NextResponse.json({ items }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (e) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
