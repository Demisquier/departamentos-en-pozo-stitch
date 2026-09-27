// app/publica-tu-proyecto/page.jsx — Landing para la OFERTA: desarrolladoras y comercializadoras
// que quieren publicar (o actualizar) su proyecto en pozo en el portal. Nace de que la oferta ya
// nos escribe sola (Ginevra/Madero Harbour, KOT). CTA sin backend: mail directo a contacto@
// (no depende del webhook de Apps Script). Página estática, indexable, con FAQPage schema.
import Link from "next/link";
import Container from "../_ui/Container";
import PageHeader from "../_ui/PageHeader";
import Breadcrumb from "../_ui/Breadcrumb";
import JsonLd from "../_ui/JsonLd";
import { SITE, CONTACT_EMAIL } from "../../lib/constants";

export const metadata = {
  title: "Publicá tu Proyecto en Pozo | Portal para Desarrolladoras y Comercializadoras",
  description:
    "¿Sos desarrolladora o comercializadora? Publicá o actualizá tu proyecto en pozo en Departamentos en Pozo y recibí consultas de compradores directo a tu equipo. Tráfico orgánico creciente, sin costo.",
  alternates: { canonical: "/publica-tu-proyecto/" },
  keywords: [
    "publicar proyecto en pozo",
    "portal para desarrolladoras inmobiliarias",
    "sumar emprendimiento en pozo a portal",
    "publicar emprendimiento inmobiliario CABA",
    "comercializar proyecto en pozo",
  ],
};

const MAILTO =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent("Quiero publicar mi proyecto en Departamentos en Pozo")}` +
  `&body=${encodeURIComponent(
    "Hola, les escribo de una desarrolladora / comercializadora y queremos publicar (o actualizar) nuestro proyecto.\n\n" +
      "Proyecto:\nBarrio:\nEstado de obra / entrega:\nWeb o material:\nContacto (nombre, mail, WhatsApp):\n\n" +
      "¡Gracias!"
  )}`;

const FAQ = [
  {
    q: "¿Tiene costo publicar mi proyecto?",
    a: "No. Publicar y mantener actualizada tu ficha no tiene costo. Somos un portal de análisis independiente: no cobramos comisión al comprador ni tarifa de publicación básica.",
  },
  {
    q: "¿Cómo me llegan las consultas?",
    a: "Cada ficha tiene CTAs de contacto (formulario y WhatsApp). Cuando alguien consulta por tu proyecto, la consulta se rutea directo a tu equipo de comercialización, con los datos del interesado.",
  },
  {
    q: "¿Qué necesitan de mí para armar la ficha?",
    a: "Un brief o material del proyecto: nombre y ubicación, tipologías, precio y financiación, avance de obra y fecha de entrega, renders o fotos, y el contacto de comercialización. Con eso armamos o corregimos la ficha.",
  },
  {
    q: "Mi proyecto ya aparece pero con datos desactualizados. ¿Lo pueden corregir?",
    a: "Sí. Pasanos la información actualizada y la corregimos. La idea es que tu ficha esté siempre al día y con el mejor contenido posible.",
  },
  {
    q: "¿Son una inmobiliaria o compiten con mi comercialización?",
    a: "No. No vendemos ni cobramos comisión: publicamos y analizamos proyectos en pozo y derivamos las consultas a quien comercializa. Sumamos un canal de demanda, no competimos con tu equipo.",
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

export default function PublicaTuProyectoPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE}/publica-tu-proyecto/#webpage`,
      name: "Publicá tu proyecto en pozo",
      url: `${SITE}/publica-tu-proyecto/`,
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
          items={[{ name: "Inicio", href: "/" }, { name: "Publicá tu proyecto" }]}
        />
        <p className="font-label-caps text-label-caps tracking-widest text-link-gold mb-3">Para desarrolladoras y comercializadoras</p>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-4xl">
          Publicá tu proyecto en pozo y llegá a compradores calificados
        </h1>
        <p className="mt-5 text-on-primary/80 font-body-lg text-body-lg max-w-2xl">
          Sumá tu emprendimiento a Departamentos en Pozo: un portal de proyectos en pozo en CABA y GBA
          con tráfico orgánico creciente. Las consultas de tu proyecto llegan directo a tu equipo de
          comercialización, sin costo de publicación.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={MAILTO} className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary text-white px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">mail</span> Publicar mi proyecto
          </a>
          <Link href="/soy-desarrolladora/" className="inline-flex items-center justify-center gap-2 rounded-full border border-on-primary/40 text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:bg-on-primary/10 transition-all">
            <span className="material-symbols-outlined text-[18px]">edit_note</span> Completar el formulario
          </Link>
        </div>
      </PageHeader>

      <Container className="py-12 md:py-14 space-y-12">
        <Bloque icon="trending_up" titulo="Por qué publicar con nosotros">
          <p>
            <strong className="text-primary">Demanda calificada.</strong> Recibimos personas que ya están
            buscando comprar en pozo en CABA y GBA, filtradas por barrio, presupuesto y tipología. No es
            tráfico frío: es gente en modo compra.
          </p>
          <p>
            <strong className="text-primary">Tráfico orgánico creciente.</strong> El portal viene escalando en
            Google mes a mes con contenido y páginas por barrio y por desarrolladora. Publicar suma a tu
            proyecto a ese flujo, sin que dependas solo de los portales pagos.
          </p>
          <p>
            <strong className="text-primary">Independiente y sin costo.</strong> No cobramos comisión ni tarifa
            de publicación básica: nuestro objetivo es tener el mejor catálogo posible y derivarte las
            consultas. Sumamos un canal, no competimos con tu comercialización.
          </p>
        </Bloque>

        <Bloque icon="how_to_reg" titulo="Cómo funciona">
          <p><strong className="text-primary">1. Nos pasás el material.</strong> Un brief del proyecto: ubicación, tipologías, precio y financiación, avance de obra, entrega, renders y el contacto de comercialización.</p>
          <p><strong className="text-primary">2. Armamos (o corregimos) la ficha.</strong> La publicamos con buen contenido, foto y datos claros, y la mantenemos actualizada con lo que nos vayas pasando.</p>
          <p><strong className="text-primary">3. Recibís las consultas.</strong> Cada consulta de tu proyecto se rutea directo a tu equipo, con los datos del interesado, para que tu comercial cierre.</p>
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
        </section>

        <div className="rounded-2xl bg-primary-container text-on-primary p-7 md:p-9 md:flex md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-headline-md text-headline-md serif mb-2">¿Sumamos tu proyecto?</h2>
            <p className="text-on-primary/85 text-[15.5px] max-w-xl">Escribinos con el material de tu emprendimiento y lo publicamos. Si preferís, coordinamos una call para conocernos y responder tus dudas.</p>
          </div>
          <a href={MAILTO} className="mt-5 md:mt-0 shrink-0 inline-flex items-center gap-2 rounded-full bg-surface text-primary px-7 py-3.5 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">mail</span> Escribir a contacto@
          </a>
        </div>
      </Container>
    </article>
  );
}
