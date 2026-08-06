// app/_ui/Faq.jsx — Acordeón de preguntas frecuentes canónico (Server Component).
// Antes este MISMO markup (<details> con borde, chevron material-symbols y respuesta) estaba
// copiado y pegado en corralones, mejores-inmobiliarias y otras páginas, con pequeñas diferencias
// de padding/redondeo → inconsistencia. Ahora un solo componente para todo el sitio.
//   - items: array de [pregunta, respuesta].
//   - title: título de sección opcional (usa SectionTitle).
//   - sub:   bajada opcional del título.
import SectionTitle from "./SectionTitle";

export default function Faq({ items = [], title, sub, className = "" }) {
  if (!items.length) return null;
  return (
    <section className={className ? `mt-12 ${className}` : "mt-12"}>
      {title && <SectionTitle sub={sub}>{title}</SectionTitle>}
      <div className="space-y-3">
        {items.map(([q, a]) => (
          <details key={q} className="group border border-outline-variant rounded-lg p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between cursor-pointer font-semibold text-primary gap-4">
              {q}
              <span className="material-symbols-outlined transition-transform group-open:rotate-180 shrink-0">expand_more</span>
            </summary>
            <p className="mt-3 text-on-surface-variant leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
