// TipologiasTabla — tabla de unidades/tipologías (Server Component).
// Estándar de calidad de Argenprop/NewHomeSource: unidad × unidad con m², precio y disponibilidad.
// `unidades`: array [{ tipologia, sup_total, sup_cubierta, precio, disponibilidad }] — dato real, nunca inventado.
// Si no hay unidades cargadas, no renderiza nada (la ficha ya muestra las tipologías como chips).
function fmtUSD(v) {
  const n = typeof v === 'number' ? v : parseFloat(String(v || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? `USD ${n.toLocaleString('es-AR')}` : (v ? String(v) : 'Consultar');
}

export default function TipologiasTabla({ unidades }) {
  if (!Array.isArray(unidades) || unidades.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-link-gold">table_rows</span> Tipologías y unidades
      </h2>
      <div className="overflow-x-auto rounded-xl border border-outline-variant">
        <table className="w-full text-[14px] border-collapse">
          <thead>
            <tr className="bg-surface-container text-on-surface-variant text-left">
              <th className="px-4 py-3 font-label-caps text-label-caps">Tipología</th>
              <th className="px-4 py-3 font-label-caps text-label-caps">Sup. total</th>
              <th className="px-4 py-3 font-label-caps text-label-caps">Sup. cubierta</th>
              <th className="px-4 py-3 font-label-caps text-label-caps">Precio desde</th>
              <th className="px-4 py-3 font-label-caps text-label-caps">Disponibilidad</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((u, i) => (
              <tr key={i} className="border-t border-outline-variant">
                <td className="px-4 py-3 text-primary font-medium">{u.tipologia || '—'}</td>
                <td className="px-4 py-3 text-on-surface-variant">{u.sup_total ? `${u.sup_total} m²` : '—'}</td>
                <td className="px-4 py-3 text-on-surface-variant">{u.sup_cubierta ? `${u.sup_cubierta} m²` : '—'}</td>
                <td className="px-4 py-3 text-primary">{fmtUSD(u.precio)}</td>
                <td className="px-4 py-3 text-on-surface-variant">{u.disponibilidad || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
