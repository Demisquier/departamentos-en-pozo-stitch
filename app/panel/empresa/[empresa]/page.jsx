// /panel/empresa/{slug}?t=TOKEN — Reporte privado para cada desarrolladora/inmobiliaria.
// Sólo ve sus propios proyectos. El token es un HMAC del server (no adivinable).
import { notFound } from "next/navigation";
import Container from "../../../_ui/Container";
import { cargarEmpresa, RANGOS } from "../../_datos";
import { Kpis, Rangos, TablaProyectos, Serie } from "../../_ui";
import { tokenEmpresa } from "../../../../lib/metricas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reporte de rendimiento — Departamentos en Pozo", robots: { index: false, follow: false } };

export default async function ReporteEmpresa({ params, searchParams }) {
  const slug = params.empresa;
  const t = searchParams && searchParams.t;
  if (!process.env.PANEL_KEY || !t || t !== tokenEmpresa(slug)) notFound();
  const dias = RANGOS[searchParams.d] || 30;
  let data;
  try { data = await cargarEmpresa(slug, dias); } catch (e) { data = null; }
  if (!data) notFound();
  const sinDatos = data.fichas.filter((f) => !data.proyectos.some((p) => p.slug === f.slug));
  const filas = [...data.proyectos, ...sinDatos.map((f) => ({ slug: f.slug, nombre: f.nombre, barrio: f.barrio, imp: 0, vis: 0, wa: 0, leads: 0, ctr: null, cr: null }))];
  return (
    <Container as="main" className="py-8 md:py-10 max-w-6xl">
      <p className="text-[12px] font-label-caps uppercase tracking-wider text-link-gold">Reporte de rendimiento · Departamentos en Pozo</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-1">{data.nombre}</h1>
      <p className="text-on-surface-variant text-[14px] mb-5">{data.desde} → {data.hasta} · {data.fichas.length} proyecto{data.fichas.length === 1 ? "" : "s"} publicados</p>
      <Rangos base={`/panel/empresa/${slug}`} dias={dias} extra={`&t=${t}`} />
      <Kpis t={data.total} />
      <Serie serie={data.serie} />
      <h2 className="font-headline-sm text-headline-sm text-primary mb-3">Tus proyectos</h2>
      <TablaProyectos rows={filas} />
      <p className="text-[12px] text-on-surface-variant mt-6">Impresiones: veces que la tarjeta del proyecto se vio en un listado. Visitas: aperturas de la ficha. Leads: consultas por formulario o chat, que te llegaron directo por mail. Excluye robots. ¿Querés mejorar tus resultados o actualizar datos y fotos? Escribinos a contacto@departamentosenpozo.com.ar.</p>
    </Container>
  );
}
