import Link from "next/link";
import { SITE } from "../../lib/wp";
import Container from "../_ui/Container";
import PageHeader from "../_ui/PageHeader";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import SimuladorCAC from "./SimuladorCAC";

export const metadata = {
  title: "Simulador de cuota con ajuste CAC en pozo | Departamentos en Pozo",
  description:
    "Simulá cómo evoluciona tu cuota en pozo si ajusta por CAC/ICC: monto financiado, cantidad de cuotas y ajuste mensual estimado. Estimación direccional, no una cotización.",
  alternates: { canonical: `${SITE}/simulador-cuota-cac-pozo/` },
};

const FAQ = [
  ["¿Cómo funciona el simulador de cuota CAC?", "Ingresás el monto a financiar en dólares, la cantidad de cuotas y un ajuste mensual estimado. El simulador proyecta cómo crece la cuota mes a mes aplicando ese ajuste de forma compuesta, y te muestra la cuota inicial, la final y el total. Es una estimación direccional, no una cotización oficial."],
  ["¿El CAC ajusta en pesos o en dólares?", "El CAC (Cámara Argentina de la Construcción) y el ICC miden el costo de construir y se aplican en pesos. El impacto real en dólares depende de cómo se mueva el tipo de cambio frente al índice: si el dólar sube más que el CAC, la cuota puede abaratarse en dólares, y al revés."],
  ["¿Qué ajuste mensual debería usar?", "No hay un número fijo: el CAC varía mes a mes. Mirá la serie reciente del índice antes de estimar y probá varios escenarios (uno optimista y uno de estrés) para ver cuánto aguanta tu flujo en el peor caso."],
];

export default function SimuladorPage() {
  const schema = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Simulador de cuota CAC", item: `${SITE}/simulador-cuota-cac-pozo/` },
    ]},
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <article>
      <JsonLd data={schema} />
      <PageHeader>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl">
          Simulador de cuota con ajuste CAC en pozo
        </h1>
      </PageHeader>

      <Container className="max-w-3xl py-12">
        <p className="text-body-lg text-on-surface-variant mb-8">
          En pozo, la cuota casi siempre <strong className="text-primary">ajusta por un índice de construcción</strong> (CAC o ICC). Estimá cómo evoluciona mes a mes según el monto financiado, el plazo y un ajuste mensual esperado. Sirve para no calcular tu capacidad de pago con la cuota inicial, que es el error más común.
        </p>

        <SimuladorCAC />

        <div className="wp-content mt-12">
          <h2 id="como-usarlo">Cómo usar el simulador</h2>
          <p>Cargá tres datos: el <strong>monto a financiar</strong> (el saldo que pagás en cuotas, no el precio total si diste anticipo), la <strong>cantidad de cuotas</strong> y un <strong>ajuste mensual estimado</strong>. El simulador aplica ese ajuste de forma compuesta y te muestra cómo la cuota crece con el tiempo, además del total pagado con y sin ajuste. La diferencia entre ambos totales es, justamente, lo que te cuesta el ajuste.</p>
          <h2 id="importante">Lo que tenés que tener en cuenta</h2>
          <ul>
            <li>Es una <strong>estimación direccional</strong>, no una cotización ni una tasación. Cada proyecto tiene su esquema real de anticipo, cuotas, refuerzos y saldo.</li>
            <li>El CAC/ICC se aplica <strong>en pesos</strong>: el resultado en dólares depende del tipo de cambio.</li>
            <li>Probá un escenario de ajuste alto para estresar tu flujo antes de firmar.</li>
          </ul>
          <p>Para entender el mecanismo del índice en profundidad, mirá la guía de <Link href="/ajuste-por-cac-en-departamentos-en-pozo-como-funciona-y-como-protegerte/">ajuste por CAC: cómo funciona y cómo protegerte</Link>, la comparación entre <Link href="/cuotas-fijas-en-pesos-vs-ajuste-cac-en-pozo-que-conviene/">cuotas fijas en pesos vs ajuste CAC</Link> y las <Link href="/opciones-de-financiacion-para-comprar-en-pozo/">opciones de financiación para comprar en pozo</Link>. Y aplicá el número a proyectos reales en el <Link href="/desarrollos-inmobiliarios/">catálogo de desarrollos</Link>.</p>

          <h2 id="faq">Preguntas frecuentes</h2>
        </div>

        <Faq items={FAQ} />

        <p className="aviso mt-8">
          <strong>Aviso:</strong> Esta información tiene carácter educativo y no constituye asesoramiento financiero, legal ni impositivo. Verificá siempre las condiciones reales de cada proyecto y consultá con un profesional matriculado antes de firmar o tomar decisiones de inversión.
        </p>
      </Container>
    </article>
  );
}
