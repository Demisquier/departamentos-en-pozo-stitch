// EsquemaPago — plan de pago estructurado (Server Component).
// Diferenciador vs. portales: el esquema de pago como TIMELINE de etapas, no prosa.
// `pasos`: array [{ etapa, detalle }] (dato estructurado real, nunca inventado).
// `textoLibre`: fallback al esquema_cuotas de texto plano cuando no hay estructura.
// Si no hay ni pasos ni texto → no renderiza nada.
export default function EsquemaPago({ pasos, textoLibre }) {
  const tienePasos = Array.isArray(pasos) && pasos.length > 0;
  if (!tienePasos && !textoLibre) return null;

  return (
    <div className="mb-8">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-link-gold">payments</span> Plan de pago
      </h2>

      {tienePasos ? (
        <ol className="relative border-l border-outline-variant ml-2">
          {pasos.map((p, i) => (
            <li key={i} className="ml-6 pb-5 last:pb-0 relative">
              <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-link-gold ring-4 ring-surface" />
              <p className="font-label-caps text-label-caps text-primary">{p.etapa}</p>
              {p.detalle && <p className="text-body-md text-on-surface-variant mt-0.5">{p.detalle}</p>}
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-xl border border-outline-variant bg-surface-container/40 p-5">
          <p className="text-body-md text-on-surface-variant">{textoLibre}</p>
        </div>
      )}

      <p className="text-[12px] text-on-surface-variant mt-3">
        En pozo, las cuotas en pesos suelen ajustarse por un índice de la construcción (CAC u otro). Confirmá el
        plan vigente, los refuerzos y el saldo a la posesión con la comercializadora antes de firmar.
      </p>
    </div>
  );
}
