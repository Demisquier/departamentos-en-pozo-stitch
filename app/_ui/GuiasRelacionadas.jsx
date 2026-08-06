import Link from 'next/link';

// Guías evergreen de decisión de compra en pozo (slugs verificados en posts.json).
// Bloque de interlinking al pie de los listados (pilar + landings por barrio).
const GUIAS = [
  ['que-es-un-desarrollo-inmobiliario-y-como-invertir-en-pozo', '¿Qué es un desarrollo inmobiliario y cómo invertir en pozo?'],
  ['conviene-invertir-en-pozo-2026-roi-riesgos-y-como-decidir', '¿Conviene invertir en pozo en 2026? ROI y riesgos'],
  ['que-revisar-antes-de-comprar-en-pozo-checklist-due-diligence', 'Qué revisar antes de comprar: checklist de due diligence'],
  ['riesgos-de-comprar-en-pozo-9-riesgos-reales-y-como-bajarlos-sin-humo', '9 riesgos reales de comprar en pozo y cómo bajarlos'],
  ['comprar-en-pozo-en-caba-vs-usados', 'Comprar en pozo vs. usado: qué conviene'],
  ['invertir-en-pozo-cuanto-se-gana-y-como-calcular-la-rentabilidad-paso-a-paso', 'Cuánto se gana en pozo y cómo calcular la rentabilidad'],
];

export default function GuiasRelacionadas({ titulo = 'Guías para invertir en pozo' }) {
  return (
    <section className="mt-12 pt-8 border-t border-outline-variant">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-4">{titulo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {GUIAS.map(([slug, t]) => (
          <Link key={slug} href={`/${slug}/`} className="group flex items-start gap-3 border border-outline-variant rounded-xl p-4 hover:border-secondary transition-colors">
            <span className="material-symbols-outlined text-link-gold text-[20px] mt-0.5">menu_book</span>
            <span className="text-[14px] text-primary group-hover:text-secondary leading-snug">{t}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
