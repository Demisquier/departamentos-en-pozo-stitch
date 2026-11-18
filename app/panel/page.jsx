// /panel?k=CLAVE — Panel interno: rendimiento por desarrolladora/inmobiliaria y por proyecto.
import { notFound } from "next/navigation";
import Container from "../_ui/Container";
import { cargarPanel, RANGOS, fmtPct } from "./_datos";
import { Kpis, Rangos, TablaProyectos } from "./_ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel — Departamentos en Pozo", robots: { index: false, follow: false } };

const n = (v) => Number(v || 0).toLocaleString("es-AR");

export default async function Panel({ searchParams }) {
  const k = searchParams && searchParams.k;
  if (!process.env.PANEL_KEY || k !== process.env.PANEL_KEY) notFound();
  const dias = RANGOS[searchParams.d] || 30;
  let data;
  try { data = await cargarPanel(dias); } catch (e) {
    return <Container as="main" className="py-10"><h1 className="text-headline-sm text-primary">Panel</h1><p className="mt-4 text-on-surface-variant">No pude leer las métricas: {String(e.message)}</p></Container>;
  }
  const { total, empresas, proyectos, desde, hasta } = data;
  const emp = [...empresas].sort((a, b) => (b.leads + b.wa) - (a.leads + a.wa) || b.vis - a.vis);
  const bajoCtr = proyectos.filter((p) => p.imp >= 50 && (p.ctr || 0) < 1.5).sort((a, b) => b.imp - a.imp).slice(0, 12);
  const sinLead = proyectos.filter((p) => p.vis >= 15 && p.leads + p.wa === 0).sort((a, b) => b.vis - a.vis).slice(0, 12);
  const kq = `&k=${encodeURIComponent(k)}`;

  return (
    <Container as="main" className="py-8 md:py-10 max-w-7xl">
      <h1 className="font-headline-md text-headline-md text-primary">Panel de rendimiento</h1>
      <p className="text-on-surface-variant text-[14px] mb-5">{desde} → {hasta} · datos propios del sitio (sin bots)</p>
      <Rangos base="/panel" dias={dias} extra={kq} />
      <Kpis t={total} />

      <h2 className="font-headline-sm text-headline-sm text-primary mb-3">Por desarrolladora / inmobiliaria</h2>
      <div className="overflow-x-auto border border-outline-variant rounded-xl mb-10">
        <table className="w-full text-[13px]">
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>{["Empresa", "Fichas", "Impr.", "Visitas", "CTR", "WhatsApp", "Leads", "CR", "Reporte"].map((h) => <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {emp.map((e) => (
              <tr key={e.slug} className="border-t border-outline-variant/60">
                <td className="px-3 py-2 text-primary">{e.nombre}</td><td className="px-3 py-2">{e.fichas}</td>
                <td className="px-3 py-2">{n(e.imp)}</td><td className="px-3 py-2">{n(e.vis)}</td><td className="px-3 py-2">{fmtPct(e.ctr)}</td>
                <td className="px-3 py-2">{n(e.wa)}</td><td className="px-3 py-2 font-medium text-primary">{n(e.leads)}</td><td className="px-3 py-2">{fmtPct(e.cr)}</td>
                <td className="px-3 py-2"><a className="text-secondary underline" href={`/panel/empresa/${e.slug}?t=${e.token}`} target="_blank" rel="noopener">link privado</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="rounded-xl border border-outline-variant p-5">
          <h3 className="font-headline-sm text-[18px] text-primary mb-1">Mucha vista, pocos clics</h3>
          <p className="text-[12px] text-on-surface-variant mb-3">≥50 impresiones y CTR &lt; 1,5%: revisar foto de portada, precio o nombre.</p>
          <ul className="text-[13px] space-y-1">{bajoCtr.length ? bajoCtr.map((p) => <li key={p.slug}><a href={`/desarrollos-inmobiliarios/${p.slug}/`} target="_blank" rel="noopener" className="text-primary hover:underline">{p.nombre}</a> — {n(p.imp)} impr., CTR {fmtPct(p.ctr)}</li>) : <li className="text-on-surface-variant">Nada por ahora.</li>}</ul>
        </div>
        <div className="rounded-xl border border-outline-variant p-5">
          <h3 className="font-headline-sm text-[18px] text-primary mb-1">Visitas sin contacto</h3>
          <p className="text-[12px] text-on-surface-variant mb-3">≥15 visitas y 0 leads/WhatsApp: revisar precio, info faltante o fotos.</p>
          <ul className="text-[13px] space-y-1">{sinLead.length ? sinLead.map((p) => <li key={p.slug}><a href={`/desarrollos-inmobiliarios/${p.slug}/`} target="_blank" rel="noopener" className="text-primary hover:underline">{p.nombre}</a> — {n(p.vis)} visitas</li>) : <li className="text-on-surface-variant">Nada por ahora.</li>}</ul>
        </div>
      </div>

      <h2 className="font-headline-sm text-headline-sm text-primary mb-3">Por proyecto</h2>
      <TablaProyectos rows={proyectos} />
    </Container>
  );
}
