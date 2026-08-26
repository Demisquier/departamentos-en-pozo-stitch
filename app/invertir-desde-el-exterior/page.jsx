// app/invertir-desde-el-exterior/page.jsx — Landing para el segmento EXTERIOR / expat.
// Los leads reales muestran una porción relevante de números +54 del exterior (+41, +44, +1 786):
// argentinos y extranjeros que invierten en pozo a distancia. Su miedo #1 es comprar sin ver la
// obra → nuestro diferencial (análisis independiente + acompañamiento remoto) rinde al máximo acá.
// Página estática, indexable, con FAQPage schema. CTA principal → asesor (Sofía).
import Link from "next/link";
import Container from "../_ui/Container";
import PageHeader from "../_ui/PageHeader";
import Breadcrumb from "../_ui/Breadcrumb";
import JsonLd from "../_ui/JsonLd";
import AlertaCTA from "../_ui/AlertaCTA";
import { SITE } from "../../lib/constants";

export const metadata = {
  title: "Invertir en pozo en Buenos Aires desde el exterior | Departamentos en Pozo",
  description:
    "Guía para argentinos en el exterior e inversores extranjeros que quieren comprar un departamento en pozo en CABA a distancia: cómo funciona, formas de pago, seguimiento de obra y análisis independiente del proyecto.",
  alternates: { canonical: "/invertir-desde-el-exterior/" },
  keywords: [
    "invertir en pozo desde el exterior",
    "comprar departamento en Argentina desde afuera",
    "inversión inmobiliaria Buenos Aires expatriados",
    "argentinos en el exterior invertir en pozo",
    "comprar en pozo a distancia CABA",
  ],
};

const FAQ = [
  {
    q: "¿Puedo comprar un departamento en pozo sin estar en Argentina?",
    a: "Sí. Gran parte del proceso —reserva, revisión del boleto y los pagos— se puede hacer de forma remota, con poder a un apoderado de confianza para las firmas presenciales. Te acompañamos en cada paso y te explicamos qué se resuelve a distancia y qué requiere presencia.",
  },
  {
    q: "¿Cómo se paga desde el exterior?",
    a: "La mayoría de los proyectos en pozo operan en dólares, con un anticipo y cuotas. Las formas de pago (transferencia, esquema de cuotas y ajustes) varían según la desarrolladora; te ayudamos a entender y comparar cada esquema antes de decidir. No somos asesores financieros: te damos la información para que decidas informado.",
  },
  {
    q: "¿Cómo sigo el avance de la obra a distancia?",
    a: "Cada ficha muestra la etapa de obra y la fecha de entrega estimada, y te pasamos las novedades y reportes de avance que nos llegan de la desarrolladora. La idea es que tengas visibilidad aunque no puedas ir a la obra.",
  },
  {
    q: "El mayor riesgo de comprar sin ver la obra, ¿cómo lo cubren?",
    a: "Con análisis independiente: evaluamos la desarrolladora (su track record y proyectos entregados), el proyecto y el precio contra el barrio, antes de que pongas un peso. No vendemos un proyecto puntual, así que podemos decirte cuándo algo no cierra.",
  },
  {
    q: "¿Ustedes son una inmobiliaria?",
    a: "No. Somos un equipo de análisis independiente de proyectos en pozo. No cobramos comisión al comprador: nuestro objetivo es que elijas bien, no venderte cualquier cosa.",
  },
];

function Bloque({ icon, titulo, children }) {
  return (
    <section className="max-w-[72ch]">
      <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[22px] text-link-gold">{icon}</span>
        {titulo}
      </h2>
      <div className="text-on-surface-variant text-[15px] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function InvertirExteriorPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE}/invertir-desde-el-exterior/#webpage`,
      name: "Invertir en pozo en Buenos Aires desde el exterior",
      url: `${SITE}/invertir-desde-el-exterior/`,
      description: metadata.description,
      inLanguage: "es-AR",
      isPartOf: { "@id": `${SITE}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <article>
      <JsonLd data={jsonLd} />

      <PageHeader py="py-14 md:py-20">
        <Breadcrumb
          tone="dark"
          sep="›"
          ariaLabel="Migas de pan"
          className="mb-6"
          items={[{ name: "Inicio", href: "/" }, { name: "Invertir desde el exterior" }]}
        />
        <p className="font-label-caps text-label-caps tracking-widest text-link-gold mb-3">Para argentinos en el exterior e inversores extranjeros</p>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl">
          Invertí en pozo en Buenos Aires, aunque estés lejos
        </h1>
        <p className="mt-5 text-on-primary/80 font-body-lg text-body-lg max-w-2xl">
          Comprar en pozo a distancia da miedo: no ves la obra, no conocés a la desarrolladora, no
          sabés si el precio es justo. Nosotros hacemos ese análisis por vos —independiente y sin
          costo— y te acompañamos en todo el proceso, de punta a punta.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/asesor/" className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary text-white px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">forum</span> Hablá con un asesor
          </Link>
          <Link href="/desarrollos-inmobiliarios/" className="inline-flex items-center justify-center gap-2 rounded-full border border-on-primary/40 text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:bg-on-primary/10 transition-all">
            <span className="material-symbols-outlined text-[18px]">apartment</span> Ver proyectos
          </Link>
        </div>
      </PageHeader>

      <Container className="py-12 md:py-14 space-y-12">
        <Bloque icon="verified_user" titulo="Por qué invertir en pozo desde afuera">
          <p>
            Para el que cobra o ahorra en moneda fuerte, el pozo en Buenos Aires combina un
            <strong className="text-primary"> ticket de entrada accesible en dólares</strong>, la posibilidad de pagar en
            cuotas durante la obra y un potencial de revalorización entre el pozo y la entrega. El
            problema no es la oportunidad: es <strong className="text-primary">no poder estar acá para evaluarla</strong>.
          </p>
          <p>
            Ahí entramos nosotros. Somos análisis independiente: no representamos a una desarrolladora,
            así que podemos compararlas con criterio y decirte cuándo un proyecto no conviene.
          </p>
        </Bloque>

        <Bloque icon="real_estate_agent" titulo="Cómo lo hacemos con vos, a distancia">
          <p><strong className="text-primary">1. Análisis del proyecto y la desarrolladora.</strong> Revisamos track record, proyectos entregados, el barrio y el precio contra la zona, antes de que decidas.</p>
          <p><strong className="text-primary">2. Formas de pago claras.</strong> Te explicamos anticipo, cuotas y ajustes de cada proyecto para que compares manzanas con manzanas.</p>
          <p><strong className="text-primary">3. Seguimiento de obra.</strong> Etapa, fecha de entrega y novedades del avance, para que tengas visibilidad sin viajar.</p>
          <p><strong className="text-primary">4. Acompañamiento en el proceso.</strong> Coordinamos con la desarrolladora y te guiamos en reserva, boleto y las firmas que requieran apoderado.</p>
        </Bloque>

        <section className="max-w-[72ch]">
          <h2 className="font-headline-md text-headline-md serif text-primary mb-5">Preguntas frecuentes</h2>
          <div className="divide-y divide-outline-variant border-t border-outline-variant">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                  <span className="font-medium text-primary text-[15.5px]">{f.q}</span>
                  <span className="material-symbols-outlined text-[20px] text-secondary transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <p className="text-on-surface-variant text-[15px] leading-relaxed mt-2.5">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="text-[12.5px] text-on-surface-variant mt-6">
            La información de esta página es orientativa y no constituye asesoramiento financiero ni legal.
            Cada operación se define con la desarrolladora y los profesionales intervinientes.
          </p>
        </section>

        <div className="rounded-2xl bg-primary-container text-on-primary p-7 md:p-9 md:flex md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-headline-md text-headline-md serif mb-2">¿Empezamos por tu perfil?</h2>
            <p className="text-on-primary/85 text-[15.5px] max-w-xl">Contanos qué buscás y desde dónde comprás. Te armamos una selección a medida y te acompañamos por WhatsApp o mail, en tu huso horario.</p>
          </div>
          <Link href="/asesor/" className="mt-5 md:mt-0 shrink-0 inline-flex items-center gap-2 rounded-full bg-surface text-primary px-7 py-3.5 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">support_agent</span> Hablar con un asesor
          </Link>
        </div>

        <AlertaCTA
          titulo="Avisame de los próximos lanzamientos"
          texto="Te aviso por mail apenas entra un proyecto en pozo que encaje con lo que buscás, antes de que salga a los portales."
          contexto="Inversor del exterior"
        />
      </Container>
    </article>
  );
}
