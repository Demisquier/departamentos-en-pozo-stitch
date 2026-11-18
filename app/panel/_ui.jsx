import Link from "next/link";
import { fmtPct } from "./_datos";

const n = (v) => Number(v || 0).toLocaleString("es-AR");

export function Kpis({ t }) {
  const items = [
    ["Impresiones", n(t.imp), "veces que una tarjeta se vio en un listado"],
    ["Visitas a ficha", n(t.vis), ""],
    ["CTR", fmtPct(t.ctr), "visitas ÷ impresiones"],
    ["Clics WhatsApp", n(t.wa), ""],
    ["Leads", n(t.leads), "formularios y chat"],
    ["CR", fmtPct(t.cr), "(leads + WhatsApp) ÷ visitas"],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
      {items.map(([k, v, h]) => (
        <div key={k} className="rounded-xl border border-outline-variant p-4 bg-surface">
          <p className="text-[11px] font-label-caps uppercase tracking-wider text-on-surface-variant">{k}</p>
          <p className="text-[24px] font-headline-sm text-primary mt-1">{v}</p>
          {h && <p className="text-[11px] text-on-surface-variant mt-0.5">{h}</p>}
        </div>
      ))}
    </div>
  );
}

export function Rangos({ base, dias, extra = "" }) {
  return (
    <div className="flex gap-2 mb-6">
      {["7", "30", "90"].map((d) => (
        <Link key={d} href={`${base}?d=${d}${extra}`} className={`px-3 py-1.5 rounded-full border text-[13px] ${String(dias) === d ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant text-primary"}`}>Últimos {d} días</Link>
      ))}
    </div>
  );
}

export function TablaProyectos({ rows, limite = 200 }) {
  const ord = [...rows].sort((a, b) => (b.leads + b.wa) - (a.leads + a.wa) || b.vis - a.vis || b.imp - a.imp).slice(0, limite);
  if (!ord.length) return <p className="text-on-surface-variant text-[14px]">Todavía no hay datos en este período.</p>;
  return (
    <div className="overflow-x-auto border border-outline-variant rounded-xl">
      <table className="w-full text-[13px]">
        <thead className="bg-surface-container-low text-on-surface-variant">
          <tr>{["Proyecto", "Impr.", "Visitas", "CTR", "WhatsApp", "Leads", "CR"].map((h) => <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody>
          {ord.map((r) => (
            <tr key={r.slug} className="border-t border-outline-variant/60">
              <td className="px-3 py-2"><a href={`/desarrollos-inmobiliarios/${r.slug}/`} target="_blank" rel="noopener" className="text-primary hover:underline">{r.nombre}</a>{r.barrio ? <span className="text-on-surface-variant"> · {r.barrio}</span> : null}</td>
              <td className="px-3 py-2">{n(r.imp)}</td><td className="px-3 py-2">{n(r.vis)}</td><td className="px-3 py-2">{fmtPct(r.ctr)}</td>
              <td className="px-3 py-2">{n(r.wa)}</td><td className="px-3 py-2 font-medium text-primary">{n(r.leads)}</td><td className="px-3 py-2">{fmtPct(r.cr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Serie({ serie }) {
  if (!serie || !serie.length) return null;
  const max = Math.max(1, ...serie.map((s) => Number(s.visitas) || 0));
  return (
    <div className="mb-8">
      <p className="text-[12px] font-label-caps uppercase tracking-wider text-on-surface-variant mb-2">Visitas por día</p>
      <div className="flex items-end gap-1 h-28 border-b border-outline-variant">
        {serie.map((s) => (
          <div key={s.dia} title={`${s.dia}: ${s.visitas} visitas · ${s.leads} leads`} className="flex-1 bg-link-gold/70 hover:bg-link-gold rounded-t" style={{ height: `${Math.max(3, (100 * (Number(s.visitas) || 0)) / max)}%` }} />
        ))}
      </div>
    </div>
  );
}
