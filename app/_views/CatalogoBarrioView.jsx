import Link from "next/link";
import { SITE } from "../../lib/wp";
import { NEARBY_CATALOGO, BARRIO_CATALOGO, BARRIO_URL } from "../../lib/barrios";
import CatalogoFiltros from "../desarrollos-inmobiliarios/CatalogoFiltros";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import AlertaCTA from "../_ui/AlertaCTA";
import GuiasRelacionadas from "../_ui/GuiasRelacionadas";

export default function CatalogoBarrioView({ slug, label, items, intro, schema }) {
  const n = items.length;
  const devSlug = BARRIO_URL[slug] || null;
  const conPrecio = items.filter((i) => i.precioDesde || i.precioM2).length;

  // Stats de precio del listado (datos propios) para el resumen + el FAQ.
  const desdeArr = items.filter((i) => i.precioDesde).map((i) => i.precioDesde).sort((a, b) => a - b);
  const desde = desdeArr[0] || null;
  const m2Arr = items.filter((i) => i.precioM2).map((i) => i.precioM2).sort((a, b) => a - b);
  const medianaM2 = m2Arr.length ? m2Arr[Math.floor(m2Arr.length / 2)] : null;
  // Datos propios extra (answer-first + FAQ data-driven): precio "típico" (mediana desde),
  // cuántos proyectos financian en cuotas, y el rango de años de entrega.
  const medianaDesde = desdeArr.length ? desdeArr[Math.floor(desdeArr.length / 2)] : null;
  const conFinanciacion = items.filter((i) => i.financiacion).length;
  const entregaAnios = items.filter((i) => i.entregaAnio).map((i) => i.entregaAnio).sort((a, b) => a - b);
  const entregaMin = entregaAnios[0] || null;
  const entregaMax = entregaAnios[entregaAnios.length - 1] || null;
  const fmt = (x) => "USD " + Math.round(x).toLocaleString("es-AR");

  // FAQ con datos propios del barrio → captura long-tail/AEO. Se renderiza VISIBLE (matchea el schema).
  const faqBarrio = [
    [`¿Cuánto cuesta un departamento en pozo en ${label}?`,
     `En ${label} relevamos ${n} proyecto${n === 1 ? "" : "s"} en pozo${desde ? `, con precios desde ${fmt(desde)}` : ""}${medianaDesde && medianaDesde !== desde ? ` y un precio típico de ${fmt(medianaDesde)}` : ""}${medianaM2 ? ` (valor de referencia mediano de ${fmt(medianaM2)}/m²)` : ""}. El precio final depende del piso, la orientación, las amenities y el avance de obra.`],
    [`¿Conviene comprar en pozo en ${label}?`,
     `Comprar en pozo en ${label} suele tener un precio de entrada menor que el usado terminado de la zona, a cambio del riesgo de obra. Conviene verificar la trayectoria de la desarrolladora, la estructura legal (fideicomiso) y el índice de ajuste de las cuotas (CAC).`],
    [`¿Se puede comprar en pozo en ${label} en cuotas?`,
     `${conFinanciacion > 0 ? `Sí: ${conFinanciacion} de los ${n} proyectos en pozo de ${label} que relevamos ofrecen financiación en cuotas` : `Algunos proyectos en pozo de ${label} ofrecen financiación en cuotas`}, normalmente con un anticipo inicial y el saldo en cuotas durante la obra, ajustadas por el índice CAC de la construcción. El plan exacto lo confirma cada desarrolladora.`],
    [`¿Qué riesgos tiene comprar en pozo en ${label}?`,
     `Los principales son el avance de obra y los plazos de entrega${entregaMin ? ` (las entregas en ${label} van de ${entregaMin} a ${entregaMax || entregaMin})` : ""}, el ajuste de las cuotas por CAC y la estructura legal del proyecto (fideicomiso). Los mitigan la trayectoria de la desarrolladora y el estado de avance al momento de comprar.`],
    [`¿Qué desarrolladoras construyen en pozo en ${label}?`,
     `En este listado figuran los proyectos en pozo de ${label} con su desarrolladora, precio, tipologías y fecha de entrega, para comparar proyecto por proyecto con criterio propio.`],
  ];
  const faqSchema = [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqBarrio.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }];

  // GEO/AEO: WebPage con speakable apuntando al H1 + el resumen de datos propios (answer-first citable).
  const speakableSchema = [{ "@context": "https://schema.org", "@type": "WebPage", name: `Desarrollos en pozo en ${label}`, speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "#barrio-resumen"] } }];

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={speakableSchema} />

      <Container as="main" className="py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-on-surface-variant mb-5 flex flex-wrap gap-1.5" aria-label="Ruta de navegación">
          <Link href="/" className="hover:text-secondary">Inicio</Link>
          <span>/</span>
          <Link href="/desarrollos-inmobiliarios/" className="hover:text-secondary">Desarrollos inmobiliarios</Link>
          <span>/</span>
          <span className="text-primary">{label}</span>
        </nav>

        <div className="mb-8">
          <h1 className="font-headline-md text-headline-md md:text-display-lg serif text-primary max-w-2xl leading-tight">
            Desarrollos inmobiliarios en pozo en {label}: {n} proyecto{n === 1 ? "" : "s"}
          </h1>
          {(desde || medianaM2) && (
            <p id="barrio-resumen" className="mt-2 text-[14px] text-on-surface-variant">
              {n} proyecto{n === 1 ? "" : "s"} en pozo en {label}{desde ? ` · desde ${fmt(desde)}` : ""}{medianaDesde && medianaDesde !== desde ? ` · precio típico ${fmt(medianaDesde)}` : ""}{medianaM2 ? ` · mediana ${fmt(medianaM2)}/m²` : ""}{conFinanciacion ? ` · ${conFinanciacion} con financiación en cuotas` : ""}{entregaMin ? ` · entregas ${entregaMin}${entregaMax && entregaMax !== entregaMin ? `–${entregaMax}` : ""}` : ""}.
            </p>
          )}
          {intro && (
            <div
              className="mt-4 text-on-surface-variant font-body-lg text-body-lg max-w-2xl space-y-3 [&_a]:text-secondary [&_a]:underline [&_a]:underline-offset-2"
              dangerouslySetInnerHTML={{ __html: intro }}
            />
          )}
        </div>

        <CatalogoFiltros items={items} barrioFijo={label} />

        {/* Cierre: variante de keyword (desarrollos inmobiliarios) + enlaces a las otras capas. */}
        <section className="mt-12 pt-8 border-t border-outline-variant text-[15px] text-on-surface-variant">
          <h2 className="font-headline-sm text-headline-sm text-primary mb-3">Comprar un desarrollo inmobiliario en pozo en {label}</h2>
          <p>
            Estás viendo los {n} desarrollos inmobiliarios en pozo de {label}
            {conPrecio ? ` (${conPrecio} con precio publicado)` : ""}. Si comprás en preventa, el
            riesgo de entrega depende de quién construye: revisá también las{" "}
            <Link href={devSlug ? `/desarrolladoras-inmobiliarias-en-${devSlug}/` : "/desarrolladoras-inmobiliarias-en-capital-federal/"} className="text-secondary underline underline-offset-2">
              {devSlug ? `desarrolladoras inmobiliarias en ${label}` : "desarrolladoras de CABA"}
            </Link>{" "}
            y las{" "}
            <Link href="/mejores-inmobiliarias-caba/" className="text-secondary underline underline-offset-2">
              inmobiliarias con matrícula
            </Link>.
          </p>
        </section>

        {/* Barrios cercanos: interlinking hacia landings de barrios linderos. */}
        {(() => {
          const nearby = (NEARBY_CATALOGO[slug] || []).filter((k) => BARRIO_CATALOGO[k]);
          if (!nearby.length) return null;
          return (
            <section className="mt-10">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-3">Barrios cercanos</h2>
              <div className="flex flex-wrap gap-2.5">
                {nearby.map((k) => (
                  <Link key={k} href={`/desarrollos-inmobiliarios-en-${k}/`}
                    className="px-4 py-2 rounded-full border border-outline-variant text-primary text-[14px] hover:border-secondary hover:text-secondary transition-colors">
                    Desarrollos en pozo en {BARRIO_CATALOGO[k].label}
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* FAQ visible por barrio (matchea el FAQPage schema de arriba). */}
        <Faq items={faqBarrio} title={`Preguntas frecuentes — departamentos en pozo en ${label}`} />

        {/* Captura de alertas contextual al barrio. */}
        <AlertaCTA
          titulo={`¿Buscás un departamento en pozo en ${label}?`}
          texto={`Activá una alerta y te avisamos apenas se lance un nuevo proyecto en ${label} que encaje con tu presupuesto, antes de que salga a los portales.`}
          cta="Crear alerta gratis" contexto={label} />

        {/* Interlinking a las guías de decisión de compra. */}
        <GuiasRelacionadas />
      </Container>
    </>
  );
}
