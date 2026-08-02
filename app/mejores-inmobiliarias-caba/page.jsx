import { getPageBySlug, getRankMathSchema, getInmobiliarias, buildMeta } from "../../lib/wp";
import DirectorioInmo from "./DirectorioInmo";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

const MARKER = "<!--DIRECTORIO-->";

export async function generateMetadata() {
  const page = await getPageBySlug("mejores-inmobiliarias-caba");
  return buildMeta(page, "/mejores-inmobiliarias-caba/", "website");
}

// Directorio de inmobiliarias: el contenido editorial (metodología, cómo verificar
// matrícula, inmobiliaria vs desarrolladora, FAQ) vive en WordPress. El DIRECTORIO sale
// del CPT `inmobiliaria` (DirectorioInmo), montado donde el contenido WP tiene el marcador.
export default async function InmobiliariasPage() {
  let page = null;
  try { page = await getPageBySlug("mejores-inmobiliarias-caba"); } catch (e) { page = null; }
  const rmSchema = await getRankMathSchema("/mejores-inmobiliarias-caba/");

  let items = [];
  try { items = await getInmobiliarias(); } catch (e) { items = []; }

  // Schema propio: las FAQ del contenido son <h3> plano (RankMath no las detecta).
  const extraSchema = [
    {
      "@context": "https://schema.org", "@type": "ItemList", name: "Inmobiliarias en Capital Federal",
      itemListElement: items.map((d, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "RealEstateAgent", name: d.nombre, areaServed: "Ciudad Autónoma de Buenos Aires" } })),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: [
        ["¿Cuáles son las mejores inmobiliarias de CABA?", "No hay una respuesta objetiva porque no existe información pública sobre operaciones cerradas ni satisfacción de clientes. Lo verificable es la matrícula CUCICBA vigente, la experiencia comprobable y la transparencia de datos."],
        ["¿Es obligatorio que una inmobiliaria tenga matrícula en CABA?", "El ejercicio del corretaje inmobiliario en la Ciudad de Buenos Aires está regulado y requiere matrícula de CUCICBA, verificable gratis en el padrón público del colegio."],
        ["¿Qué diferencia hay entre una inmobiliaria y una desarrolladora?", "La inmobiliaria intermedia la venta; la desarrolladora concibe, financia y construye el emprendimiento. En una compra en pozo, el riesgo de entrega depende de la desarrolladora."],
        ["¿Cobran por aparecer en este listado?", "No. No cobramos por aparecer, no vendemos posiciones y no recibimos comisión por derivar consultas."],
      ].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  const html = page?.content?.rendered || "";
  const useCpt = html.includes(MARKER) && items.length > 0;
  const [before, after] = useCpt ? html.split(MARKER) : [html, ""];

  return (
    <>
      <JsonLd data={[...rmSchema, ...extraSchema]} />

      <Container as="main" className="py-10 md:py-14">
        {html ? (
          <>
            <div className="wp-content prose max-w-none text-body-md text-on-surface-variant" dangerouslySetInnerHTML={{ __html: before }} />
            {useCpt && <DirectorioInmo items={items} chipsComoLinks />}
            {after && <div className="wp-content prose max-w-none text-body-md text-on-surface-variant" dangerouslySetInnerHTML={{ __html: after }} />}
          </>
        ) : (
          <div className="text-center py-24">
            <h1 className="font-headline-md text-headline-md text-primary mb-3">Mejores inmobiliarias en CABA</h1>
            <p className="text-on-surface-variant max-w-xl mx-auto">Estamos actualizando este directorio.</p>
          </div>
        )}
      </Container>
    </>
  );
}
