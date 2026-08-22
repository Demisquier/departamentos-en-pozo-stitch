import Link from "next/link";
import { getCorralones, SITE } from "../../lib/wp";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Breadcrumb from "../_ui/Breadcrumb";
import AlertaCTA from "../_ui/AlertaCTA";
import Faq from "../_ui/Faq";
import DirectorioCorralones from "./DirectorioCorralones";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

export const metadata = {
  title: "Corralones y materiales de construcción en CABA y GBA | Directorio 2026",
  description:
    "Directorio independiente de corralones, homecenters y fabricantes de materiales en CABA y GBA. Filtrá por rubro y zona, y aprendé a comprar sin pagar de más.",
  alternates: { canonical: `${SITE}/corralones-y-materiales-de-construccion-en-caba/` },
};

const FAQ = [
  ["¿Conviene comprar en corralón de barrio o en homecenter?", "Depende del rubro. Para el grueso pesado (cemento, cal, ladrillos, hierro) el corralón de barrio suele ganar por precio y flete corto. Para ferretería, herramientas y terminaciones, el homecenter compite por variedad, marcas y financiación en cuotas."],
  ["¿El costo de materiales sigue al ajuste CAC?", "En buena medida sí: el índice CAC mide el costo de construir y los materiales son su componente principal. El mismo índice que ajusta las cuotas de un departamento en pozo mueve el presupuesto de tu obra."],
  ["¿Cobran por aparecer en este directorio?", "No. No cobramos por aparecer ni recibimos comisión por derivar consultas. Ordenamos por criterios verificables, no por pago."],
  ["¿Qué es el precio \"puesto en obra\" y por qué importa?", "Es el precio total con flete y descarga incluidos, no el de mostrador. Es el único número comparable entre proveedores: un precio de lista más barato puede terminar más caro una vez que sumás el envío y los mínimos de compra."],
  ["¿Los corralones venden online y con envío a obra?", "Cada vez más. Varios corralones de CABA y GBA tienen tienda online con entrega en obra, lo que permite comparar precios a la vista y obtener comprobante. Conviene confirmar el stock real y el plazo de entrega antes de pagar."],
  ["¿Conviene comprarle al fabricante directo?", "Solo tiene sentido con volumen o cuando necesitás una especificación técnica puntual (una abertura a medida, un sistema de construcción en seco). Para cantidades chicas, el corralón o el homecenter suelen ser más ágiles; el fabricante te deriva a su red de distribuidores."],
  ["¿Cómo impacta el dólar y la inflación en el precio de los materiales?", "Muchos insumos (hierro, aluminio, sanitarios importados) siguen al dólar y al costo de reposición. Por eso los presupuestos suelen tener validez corta, a veces de 24 a 72 horas. Pedí el presupuesto por escrito con fecha de vencimiento y evaluá anticipar la compra de los rubros que más suben."],
  ["¿Por qué exigir factura al comprar materiales?", "La factura respalda la garantía, permite deducir el gasto y protege ante faltantes o defectos. Un precio \"en negro\" o solo con remito suele ser más barato de entrada, pero te deja sin respaldo si algo sale mal."],
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

        <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-3 max-w-3xl">
          Corralones y materiales de construcción en CABA y GBA (2026)
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl mb-8">
          Directorio independiente de corralones, homecenters y fabricantes de materiales, útil para quien encara una obra o refacción. No cobramos por aparecer: solo listamos proveedores con presencia verificable, ordenados por criterios comprobables.
        </p>

        <DirectorioCorralones items={items} />

        <div className="wp-content max-w-none mt-12">
          <p>Comprar materiales bien puede definir el margen de una obra tanto como el precio del terreno. El costo de construir en Argentina se mueve casi tanto como el índice CAC —el mismo que ajusta las cuotas de un departamento en pozo— y los materiales son su componente principal. Este directorio reúne corralones de barrio, homecenters y fabricantes con presencia verificable en CABA y GBA, para que compares proveedores por rubro y zona antes de pedir presupuesto. Si querés ver cuánto pesa ese ajuste, podés <Link href="/simulador-cuota-cac-pozo/">simular cómo el CAC mueve una cuota en pozo</Link> o leer <Link href="/ajuste-por-cac-en-departamentos-en-pozo-como-funciona-y-como-protegerte/">cómo funciona el ajuste por CAC y cómo protegerte</Link>.</p>

          <h2 id="tipos">¿Corralón de barrio, homecenter o fabricante? Cuándo conviene cada uno</h2>
          <p>No todos los proveedores sirven para lo mismo. Elegir según el rubro es la forma más simple de no pagar de más:</p>
          <ul>
            <li><strong>Corralón (de barrio u online):</strong> gana en el grueso pesado —cemento, cal, ladrillos, hierro, arena— por precio y flete corto. Muchos ya venden online con envío a obra.</li>
            <li><strong>Retail / Homecenter:</strong> variedad, financiación en cuotas y terminaciones (sanitarios, cerámicos, ferretería, deco). Conviene para el detalle y para comparar marcas.</li>
            <li><strong>Fabricante:</strong> comprar en origen o ubicar al distribuidor oficial para volumen o especificación técnica (aberturas, construcción en seco, cemento, sanitarios, calefacción).</li>
          </ul>

          <h2 id="como-elegir">Cómo elegir corralón y comprar sin pagar de más</h2>
          <p>El precio de los materiales se mueve casi tanto como el costo de construir (el mismo índice CAC que ajusta las cuotas en pozo). Comprar bien es parte del retorno de la obra: pedí tres presupuestos por los rubros pesados, compará el precio puesto en obra (no el de mostrador) y separá lo que conviene en corralón de barrio de lo que conviene en homecenter. La misma lógica de costo total que aplica a una obra vale para un departamento en pozo: mirá <Link href="/cuanto-cuesta-comprar-en-pozo-costos-ocultos-y-como-armar-el-costo-total/">cómo armar el costo total y detectar los costos ocultos</Link>.</p>
          <table>
            <thead><tr><th>Qué mirar</th><th>Cómo verificarlo</th><th>Señal de alerta</th></tr></thead>
            <tbody>
              <tr><td>Precio puesto en obra</td><td>Pedí el total con flete y descarga incluidos</td><td>Precio "de lista" sin aclarar envío ni mínimos</td></tr>
              <tr><td>Stock y plazo</td><td>Confirmá disponibilidad y fecha por escrito</td><td>"Lo conseguimos" sin fecha ni seña</td></tr>
              <tr><td>Cobertura de zona</td><td>Verificá que entreguen en tu barrio y el flete</td><td>Flete "a coordinar" sin monto</td></tr>
              <tr><td>Comprobante</td><td>Exigí factura: respalda garantía y deduce</td><td>Solo remito o precio "en negro"</td></tr>
            </tbody>
          </table>

          <h3 id="online-vs-mostrador">Compra online vs. mostrador</h3>
          <p>Cada vez más corralones venden con tienda online y envío a obra. La ventaja es clara: el precio queda a la vista, es comparable entre proveedores y viene con comprobante. El riesgo es confiar en el stock publicado sin confirmarlo: antes de pagar, verificá disponibilidad real y plazo de entrega, sobre todo en los rubros pesados que se agotan por camión.</p>

          <h2 id="tabla-comparativa">Tabla comparativa por tipo de proveedor</h2>
          <p>Orientativa por tipo de proveedor, no por marca. Sirve para decidir dónde comprar cada rubro antes de pedir presupuesto:</p>
          <table>
            <thead><tr><th>Criterio</th><th>Corralón de barrio / online</th><th>Homecenter / retail</th><th>Fabricante</th></tr></thead>
            <tbody>
              <tr><td>Mejor para</td><td>Grueso pesado (cemento, cal, ladrillo, hierro)</td><td>Terminaciones, sanitarios, ferretería, deco</td><td>Volumen o especificación técnica</td></tr>
              <tr><td>Precio</td><td>Suele ser el más bajo en pesado</td><td>Medio; compensa con cuotas y promos</td><td>En origen; requiere volumen</td></tr>
              <tr><td>Financiación</td><td>Limitada (efectivo o transferencia)</td><td>Cuotas con tarjeta</td><td>Vía distribuidor</td></tr>
              <tr><td>Flete</td><td>Corto y económico si es de zona</td><td>Propio, con mínimos de compra</td><td>Según logística</td></tr>
              <tr><td>Comprobante</td><td>Factura (confirmar)</td><td>Factura siempre</td><td>Factura siempre</td></tr>
            </tbody>
          </table>

          <p><em>Nota de sourcing: se listan proveedores con sitio oficial verificable. Se excluyeron marcas sin presencia clara en CABA/GBA. No publicamos direcciones ni teléfonos: confirmalos en cada sitio oficial. Los datos de financiación y flete por proveedor no están cargados: la tabla es orientativa por tipo, no por marca.</em></p>

          <h2 id="faq">Preguntas frecuentes</h2>
        </div>

        <Faq items={FAQ} />

        <div className="wp-content max-w-none mt-12">
          <h2 id="segui-leyendo">Seguí leyendo</h2>
          <ul>
            <li><Link href="/simulador-cuota-cac-pozo/">Simulador de cuota y ajuste CAC en pozo</Link> — cómo el mismo índice que mueve los materiales ajusta la cuota de un departamento.</li>
            <li><Link href="/dolar-construccion-y-pozo-como-afectan-al-precio-final-y-que-mirar-en-el-ajuste/">Dólar, construcción y pozo</Link> — por qué el precio de los insumos sigue al dólar y al costo de reposición.</li>
            <li><Link href="/que-revisar-antes-de-comprar-en-pozo-checklist-due-diligence/">Checklist de due diligence antes de comprar en pozo</Link> — la misma mentalidad de verificación que aplica a proveedores.</li>
            <li><Link href="/guia-invertir-departamentos-en-pozo-argentina/">Guía para invertir en departamentos en pozo</Link> — si en vez de construir preferís comprar terminado o en obra.</li>
            <li><Link href="/desarrollos-inmobiliarios/">Catálogo de desarrollos en pozo</Link> y <Link href="/alertas-de-lanzamientos-en-pozo/">alertas de nuevos lanzamientos</Link>.</li>
          </ul>
          <p><strong>Otros directorios:</strong> <Link href="/desarrolladoras-inmobiliarias-en-capital-federal/">desarrolladoras inmobiliarias en Capital Federal</Link> · <Link href="/mejores-inmobiliarias-caba/">mejores inmobiliarias en CABA</Link>.</p>
        </div>

        <AlertaCTA titulo="¿Vas a construir o invertir en pozo?" texto="Activá una alerta y te avisamos cuando aparezca un nuevo proyecto en pozo que encaje con tu búsqueda, antes de que salga a los portales." cta="Activar mi alerta" />

        <p className="text-[12px] text-on-surface-variant mt-6 border-t border-outline-variant pt-4">
          Actualizado agosto 2026 · Directorio de análisis independiente. Precios, stock y cobertura de cada proveedor pueden variar: verificá en la fuente oficial antes de comprar. No constituye asesoramiento comercial.
        </p>
      </Container>
    </>
  );
}
