// ProyectosDestacados — bloque de 6 fichas (server) para páginas con mucho tráfico y poca
// conversión (directorio de desarrolladoras, guías). Por qué: en GA4 las landings con cards de
// proyectos convierten ~15% vs ~2% del directorio y ~0,5% de las guías (90 días a nov-2026).
import Link from "next/link";
import ProjectCard from "./ProjectCard";
import { catalogoConSellos } from "../../lib/statsPozo";
import { BARRIO_CATALOGO, matchBarrioCatalogo } from "../../lib/barrios";

export default async function ProyectosDestacados({ titulo = "Proyectos en pozo destacados", barrioSlug = null, n = 6, verMas = "/desarrollos-inmobiliarios/" }) {
  let items = [];
  try { items = await catalogoConSellos(); } catch (e) { return null; }
  let pool = barrioSlug && BARRIO_CATALOGO[barrioSlug] ? items.filter((i) => matchBarrioCatalogo(i.barrio, barrioSlug)) : items;
  if (pool.length < 3) pool = items;
  const top = pool.filter((i) => i.imagen)
    .sort((a, b) => (Number(!!(b.sellos && b.sellos.length)) - Number(!!(a.sellos && a.sellos.length))) || (Number(!!b.precioDesde) - Number(!!a.precioDesde)))
    .slice(0, n);
  if (!top.length) return null;
  return (
    <section className="my-10">
      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 className="font-headline-sm text-headline-sm text-primary">{titulo}</h2>
        <Link href={verMas} className="text-secondary text-[14px] font-medium hover:underline whitespace-nowrap">Ver todos →</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 not-prose">
        {top.map((i) => (
          <ProjectCard key={i.slug} slug={i.slug} nombre={i.nombre} barrio={i.barrio} direccion={i.direccion} precioDesde={i.precioDesde} precioM2={i.precioM2} img={i.imagen} etapa={i.etapa} ambientes={i.ambientes} entrega={i.entrega} desarrolladora={i.desarrolladora} sellos={i.sellos} destacado={!!(i.sellos && i.sellos.length)} />
        ))}
      </div>
    </section>
  );
}
