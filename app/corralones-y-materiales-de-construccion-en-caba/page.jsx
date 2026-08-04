import Link from "next/link";
import { getCorralones, SITE } from "../../lib/wp";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Breadcrumb from "../_ui/Breadcrumb";
import AlertaCTA from "../_ui/AlertaCTA";
import DirectorioCorralones from "./DirectorioCorralones";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

export const metadata = {
  title: "Corralones y materiales de construccion en CABA y GBA | Directorio",
  description:
    "Directorio independiente de corralones, homecenters y fabricantes de materiales en CABA y GBA. Filtra por tipo y zona. Como elegir y comprar sin pagar de mas.",
  alternates: { canonical: `${SITE}/corralones-y-materiales-de-construccion-en-caba/` },
};

const FAQ = [
  ["¿Conviene comprar en corralon de barrio o en homecenter?", "Depende del rubro. Para el grueso pesado (cemento, cal, ladrillos, hierro) el corralon de barrio suele ganar por precio y flete. Para ferreteria, herramientas y terminaciones, el homecenter compite por variedad y financiacion."],
  ["¿El costo de materiales sigue al ajuste CAC?", "En buena medida si: el indice CAC mide el costo de construir, y los materiales son su componente principal. El mismo indice que ajusta las cuotas en pozo mueve el presupuesto de tu obra."],
  ["¿Cobran por aparecer en este directorio?", "No. No cobramos por aparecer ni recibimos comision por derivar consultas. Ordena por criterios verificables."],
];

export default async function CorralonesPage() {
  let items = [];
  try { items = await getCorralones(); } catch (e) { items = []; }

  const schema = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Corralones y materiales", item: `${SITE}/corralones-y-materiales-de-construccion-en-caba/` },
    ]},
    { "@context": "https://schema.org", "@type": "ItemList", name: "Corralones y proveedores de materiales en CABA y GBA",
      numberOfItems: items.length,
      itemListElement: items.map((d, i) => ({ "@type": "ListItem", position: i + 1,
        item: { "@type": "Organization", name: d.nombre, areaServed: d.zona, ...(d.web ? { url: d.web } : {}) } })),
    },
    { "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <>
      <JsonLd data={schema} />
      <Container as="main" className="py-10 md:py-14">
        <Breadcrumb tone="light" sep="/" className="mb-4" items={[
          { name: "Inicio", href: "/" },
          { name: "Corralones y materiales" },
        ]} />

        <h1 className="font-headline-lg text-headline-lg md:text-display-sm text-primary mb-3 max-w-3xl">
          Corralones y materiales de construccion en CABA y GBA
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mb-8">
          Directorio independiente de corralones, homecenters y fabricantes de materiales, util para quien encara una obra o refaccion. No cobramos por aparecer: solo listamos proveedores con presencia verificable.
        </p>

        <div className="wp-content max-w-none mb-6">
          <h2 id="como-elegir">Como elegir corralon y comprar sin pagar de mas</h2>
          <p>El precio de los materiales se mueve casi tanto como el costo de construir (el mismo indice CAC que ajusta las cuotas en pozo). Comprar bien es parte del retorno de la obra: pedi tres presupuestos por los rubros pesados, compara precio puesto en obra (no en mostrador) y separa lo que conviene en corralon de barrio de lo que conviene en homecenter.</p>
          <table>
            <thead><tr><th>Que mirar</th><th>Como verificarlo</th><th>Señal de alerta</th></tr></thead>
            <tbody>
              <tr><td>Precio puesto en obra</td><td>Pedi el total con flete y descarga incluidos</td><td>Precio "de lista" sin aclarar envio ni minimos</td></tr>
              <tr><td>Stock y plazo</td><td>Confirma disponibilidad y fecha por escrito</td><td>"Lo conseguimos" sin fecha ni seña</td></tr>
              <tr><td>Cobertura de zona</td><td>Verifica que entreguen en tu barrio y el flete</td><td>Flete "a coordinar" sin monto</td></tr>
              <tr><td>Comprobante</td><td>Exigi factura: respalda garantia y deduce</td><td>Solo remito o precio "en negro"</td></tr>
            </tbody>
          </table>
        </div>

        <DirectorioCorralones items={items} />

        <div className="wp-content max-w-none mt-4">
          <p><em>Nota de sourcing: se listan proveedores con sitio oficial verificable. Se excluyeron marcas sin presencia clara en CABA/GBA. No publicamos direcciones ni telefonos: confirmalos en cada sitio oficial.</em></p>

          <h2 id="faq">Preguntas frecuentes</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group border border-outline-variant rounded-lg p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-primary">{q}<span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span></summary>
              <p className="mt-3 text-on-surface-variant leading-relaxed">{a}</p>
            </details>
          ))}
        </div>

        <AlertaCTA titulo="¿Vas a construir o invertir en pozo?" texto="Activá una alerta y te avisamos cuando aparezca un nuevo proyecto en pozo que encaje con tu busqueda, antes de que salga a los portales." cta="Activar mi alerta" />

        <p className="text-[12px] text-on-surface-variant mt-6 border-t border-outline-variant pt-4">
          Actualizado agosto 2026 · Directorio de analisis independiente. Precios, stock y cobertura de cada proveedor pueden variar: verifica en la fuente oficial antes de comprar. No constituye asesoramiento comercial.
        </p>
      </Container>
    </>
  );
}
