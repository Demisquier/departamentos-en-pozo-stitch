import Link from "next/link";
import { SITE } from "../../lib/wp";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import AlertasForm from "./AlertasForm";

export const metadata = {
  title: "Alertas de lanzamientos en pozo en CABA | Acceso anticipado",
  description:
    "Recibi por email los nuevos proyectos en pozo que encajan con tu barrio, presupuesto y etapa de obra. Acceso anticipado antes de que salgan a los portales. Gratis.",
  alternates: { canonical: `${SITE}/alertas-de-lanzamientos-en-pozo/` },
};

const FAQ = [
  ["¿Que son las alertas de lanzamientos?", "Es un aviso por email que te llega cuando aparece un proyecto nuevo en pozo que encaja con lo que buscas: barrio, rango de inversion y etapa de obra. En vez de revisar portales todos los dias, te enteras apenas hay algo relevante."],
  ["¿Tiene costo?", "No. La suscripcion es gratuita y no cobramos por avisarte. Somos un analisis independiente: no vendemos posiciones ni cobramos por aparecer."],
  ["¿Cada cuanto me van a escribir?", "Solo cuando hay algo que realmente encaja con tu busqueda. No enviamos spam ni newsletters de relleno. Podes darte de baja en cualquier momento."],
  ["¿Por que conviene enterarse antes?", "En pozo, los mejores precios y unidades suelen colocarse en el pre-lanzamiento, antes de que el proyecto llegue a los portales. Enterarte primero te da margen para analizar y decidir sin apuro."],
];

export default function AlertasPage() {
  const schema = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Alertas de lanzamientos", item: `${SITE}/alertas-de-lanzamientos-en-pozo/` },
    ]},
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <div className="min-h-screen">
      <JsonLd data={schema} />

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-primary-container">
        <div className="absolute inset-0 z-0 brightness-50 bg-primary-container" />
        <Container className="relative z-10 py-20 text-center">
          <span className="font-label-caps text-secondary-fixed tracking-widest block mb-4 uppercase">
            Acceso anticipado
          </span>
          <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg text-white max-w-3xl mx-auto">
            Enterate primero de los proyectos en pozo que te importan
          </h1>
          <p className="text-white/85 text-body-lg max-w-2xl mx-auto mt-6">
            Deja tu email y te avisamos cuando aparece un lanzamiento que encaja con tu barrio, tu presupuesto y la etapa de obra que buscas. Antes de que salga a los portales.
          </p>
        </Container>
      </section>

      {/* Form + valor */}
      <Container as="section" className="py-16 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7">
            <AlertasForm />
          </div>

          <div className="lg:col-span-5">
            <div className="bg-surface-container-low rounded-lg border border-outline-variant p-8 h-full">
              <h2 className="text-headline-sm font-headline-sm text-primary mb-6">Como funciona</h2>
              <ol className="space-y-6">
                {[
                  ["Contanos que buscas", "Barrio, rango de inversion y etapa de obra. Solo lo esencial."],
                  ["Nosotros filtramos", "Analizamos los lanzamientos nuevos y descartamos el ruido."],
                  ["Te avisamos cuando encaja", "Recibis un email directo, sin spam, cuando aparece algo relevante."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[15px]">{i + 1}</span>
                    <div>
                      <p className="font-bold text-primary mb-1">{t}</p>
                      <p className="text-on-surface-variant text-body-md">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-8 pt-6 border-t border-outline-variant flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary">verified_user</span>
                <p className="text-on-surface-variant text-body-md">
                  Analisis independiente: no cobramos por aparecer ni vendemos posiciones en ningun ranking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* FAQ + disclaimer */}
      <section className="bg-white border-t border-outline-variant py-16">
        <Container className="max-w-3xl">
          <div className="wp-content">
            <h2 id="faq">Preguntas frecuentes</h2>
            <Faq items={FAQ} className="!mt-4" />

            <p className="mt-8">
              Mientras tanto, revisa el <Link href="/desarrollos-inmobiliarios/">catalogo de desarrollos en pozo</Link>, el <Link href="/indice-precios-pozo-caba-por-barrio/">indice de precios por barrio</Link> y el <Link href="/simulador-cuota-cac-pozo/">simulador de cuota con ajuste CAC</Link>.
            </p>

            <p style={{ border: "1px solid #fbbf24", background: "#fef3c7", padding: "14px 18px", margin: "24px 0", borderRadius: "4px", fontSize: "0.92em" }}>
              <strong>Aviso:</strong> Este servicio es informativo y no constituye asesoramiento financiero, legal ni impositivo. Los avisos no son recomendaciones de compra. Verifica siempre las condiciones de cada proyecto y consulta con un profesional matriculado antes de invertir.
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
