import Link from "next/link";
import { SELLOS_DEF, METODOLOGIA_URL, fechaLarga } from "../../lib/sellos";

// Chips de sellos (compacto). data = objeto de lib/sellos (con .sellos). Si no hay sellos, no renderiza nada.
export function SellosChips({ data, className = "" }) {
  if (!data || !data.sellos || !data.sellos.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {data.sellos.map((s) => {
        const def = SELLOS_DEF[s.tipo];
        if (!def) return null;
        return (
          <Link key={s.tipo} href={METODOLOGIA_URL} title={`${def.label}: ${s.resumen}`}
            className="inline-flex items-center gap-1 text-[11px] font-label-caps uppercase tracking-wider bg-green-700/10 text-green-800 px-2.5 py-1 rounded-md hover:bg-green-700/20">
            <span className="material-symbols-outlined text-[15px]">{def.icon}</span>{def.label}
          </Link>
        );
      })}
    </div>
  );
}

// Bloque con evidencia y fuentes (para la página de la desarrolladora y los rankings).
export function SellosDetalle({ data, titulo = true }) {
  if (!data || !data.sellos || !data.sellos.length) return null;
  return (
    <section className="rounded-xl border border-green-700/25 bg-green-700/[0.03] p-5 md:p-6">
      {titulo && (
        <h2 className="font-headline-sm text-[19px] text-primary flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-green-800">verified</span> Sellos de confianza de {data.nombre}
        </h2>
      )}
      <p className="text-[12px] text-on-surface-variant mb-4">
        Verificado en {fechaLarga(data.verificado)} · se revalida cada 6 meses · <Link href={METODOLOGIA_URL} className="underline">cómo verificamos</Link>
      </p>
      <div className="space-y-4">
        {data.sellos.map((s) => {
          const def = SELLOS_DEF[s.tipo];
          if (!def) return null;
          return (
            <div key={s.tipo}>
              <p className="font-medium text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-green-800">{def.icon}</span>
                <Link href={def.url} className="hover:underline">{def.label}</Link>
                <span className="text-on-surface-variant font-normal text-[14px]">— {s.resumen}</span>
              </p>
              <ul className="mt-1.5 ml-7 space-y-1 text-[13px] text-on-surface-variant list-disc">
                {(s.evidencia || []).map((e, i) => (
                  <li key={i}>
                    {e.texto}
                    {(e.fuentes || []).length ? (
                      <span> · Fuente{e.fuentes.length > 1 ? "s" : ""}:{" "}
                        {e.fuentes.slice(0, 3).map((u, j) => {
                          let host = u; try { host = new URL(u).hostname.replace(/^www\./, ""); } catch (x) {}
                          return <a key={j} href={u} target="_blank" rel="nofollow noopener" className="underline mr-1.5">{host}</a>;
                        })}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
