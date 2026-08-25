// app/api/proyecto/[slug]/route.js — Devuelve la ficha COMPLETA de un proyecto (JSON) para
// que el modal de Mi Plan (DetalleModal) muestre galería, descripción, amenities y esquema de
// pago SIN que el usuario salga a la ficha. Server-side: lee el mismo dato que la página /[slug].
import { NextResponse } from "next/server";
import { getDesarrolloBySlug, featuredImage, proxyImage, fixImgs, acf } from "../../../../lib/wp";
import { toNumber, expandComercializa } from "../../../../lib/format";

export const revalidate = 3600;

function acfAny(node, keys) {
  for (const k of keys) { const v = acf(node, k); if (v != null && String(v).trim() !== "") return v; }
  return null;
}
function parseAmenities(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((a) => (typeof a === "string" ? a : a?.amenity || a?.nombre || a?.label || a?.value || "")).filter(Boolean);
  return String(raw).split(/[,\n;]/).map((s) => s.trim()).filter(Boolean);
}
function fmtFecha(v) {
  const s = String(v || "");
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  let y, m;
  if (/^\d{8}$/.test(s)) { y = s.slice(0, 4); m = parseInt(s.slice(4, 6), 10); }
  else if (/^\d{6}$/.test(s)) { y = s.slice(0, 4); m = parseInt(s.slice(4, 6), 10); }
  else return v ? String(v) : "";
  return (m >= 1 && m <= 12) ? `${MESES[m - 1]} ${y}` : `${y}`;
}
function fmtTipologias(v) {
  if (!v) return "";
  const arr = Array.isArray(v) ? v : String(v).split(",");
  const map = { "1_ambiente": "1", "2_ambientes": "2", "3_ambientes": "3", "4_ambientes": "4", "4_mas": "4+", "5_mas": "5+" };
  const nums = arr.map((x) => map[String(x).trim()] || String(x).replace(/_/g, " ").trim()).filter(Boolean);
  return nums.length ? nums.join(", ") + " amb" : "";
}
function toPercent(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace("%", "").replace(",", ".").trim());
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function GET(_req, { params }) {
  try {
    const d = await getDesarrolloBySlug(params.slug);
    if (!d) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const tituloRaw = d.title?.rendered || "Proyecto";
    const nombre = tituloRaw.split("—")[0].trim() || tituloRaw;
    const barrio = (tituloRaw.split("—")[1] || "").trim() || acf(d, "barrio") || "Buenos Aires";
    const direccion = acfAny(d, ["direccion", "direccion_completa"]) || `${barrio}, CABA`;
    const estado = acfAny(d, ["estado", "pozo_estado", "estado_obra"]);
    const etapaTxt = String(estado || "").toLowerCase();
    const etapa = /termin|entreg/.test(etapaTxt) ? "Terminado" : /construc/.test(etapaTxt) ? "En construcción" : "En pozo";

    const precioDesde = toNumber(acfAny(d, ["precio_desde"])) || null;
    const precioM2 = toNumber(acfAny(d, ["precio_m2"])) || null;
    const entrega = fmtFecha(acfAny(d, ["fecha_entrega", "entrega"]));
    const tipologias = fmtTipologias(acfAny(d, ["tipologias", "ambientes"]));
    const desarrolladora = expandComercializa(acfAny(d, ["desarrolladora", "constructora"])) || null;
    const ajuste = acfAny(d, ["ajuste", "ajuste_cuotas"]) || null;
    const cuotaEstim = acfAny(d, ["cuota_estimada"]) || null;
    const anticipoRaw = acfAny(d, ["anticipo"]);
    const anticipoNum = toNumber(anticipoRaw);
    const anticipo = anticipoNum ? `USD ${anticipoNum.toLocaleString("es-AR")}` : (anticipoRaw ? String(anticipoRaw) : null);
    const cuotasRaw = acfAny(d, ["esquema_cuotas"]);
    const cuotas = cuotasRaw && !/^\s*(a\s+)?consultar/i.test(String(cuotasRaw)) ? String(cuotasRaw) : null;
    const amenities = parseAmenities(acf(d, "amenities"));
    const avance = toPercent(acfAny(d, ["avance_obra", "avance", "porcentaje_obra"]));

    const imagen = featuredImage(d);
    const contenido = fixImgs(d.content?.rendered || "");
    const galeriaRaw = Array.isArray(d.galeria) ? d.galeria : (Array.isArray(acf(d, "galeria")) ? acf(d, "galeria") : []);
    const galeriaImgs = galeriaRaw.map((u) => proxyImage(u)).filter(Boolean);
    const contentImgs = [...contenido.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
    const galeria = [imagen, ...galeriaImgs, ...contentImgs].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);

    return NextResponse.json({
      slug: params.slug, nombre, barrio, direccion, etapa, entrega, tipologias, desarrolladora,
      precioDesde, precioM2, anticipo, cuotas, cuotaEstim, ajuste, avance,
      amenities, galeria, descripcionHtml: contenido,
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
