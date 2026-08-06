import { getPageBySlug, getRankMathSchema, getDesarrolladoras, buildMeta, SITE } from "../../lib/wp";
import DirectorioDevs from "./DirectorioDevs";
import DirEnhancer from "./DirEnhancer";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";

// FAQ del hub para el FAQPage schema (RankMath no detecta las <h3> del contenido WP).
const HUB_FAQ = [
  ["¿Cuáles son las mejores desarrolladoras de Buenos Aires?", "No existe un ranking objetivo porque no hay datos públicos de operaciones ni satisfacción. Lo verificable es la trayectoria (obras entregadas), la estructura legal del proyecto (fideicomiso al costo, precio cerrado) y el cumplimiento de plazos. Este directorio ordena por criterios comprobables, no por opinión ni pago."],
  ["¿Qué es un fideicomiso al costo?", "Es la estructura legal más común en el pozo argentino: el comprador financia la construcción y paga el costo real de la obra más honorarios, con las cuotas en pesos ajustadas por un índice de la construcción (CAC). Traslada al comprador el riesgo de costo, a cambio de un precio de entrada menor."],
  ["¿Por qué la desarrolladora importa más que la inmobiliaria al comprar en pozo?", "Porque cuando comprás algo que todavía no existe, quien responde por la entrega en fecha, la calidad y la estructura legal es la desarrolladora, no el intermediario que te muestra la unidad. Su trayectoria es el principal mitigante del riesgo de entrega."],
  ["¿Cómo evaluar una desarrolladora antes de invertir?", "Revisá obras entregadas y cumplimiento de plazos, el tipo de fideicomiso y quién es el fiduciario, el avance de obra real, y el precio por m² frente al usado terminado de la zona. Pedí el boleto modelo y la carpeta de ventas."],
  ["¿Cobran por aparecer en este directorio?", "No. No cobramos por aparecer, no vendemos posiciones ni recibimos comisión por derivar consultas. Es un directorio de análisis independiente."],
  // AEO: preguntas con el fraseo de asistentes IA (miles de impresiones en GSC, 0 clics).
  ["¿Qué empresa constructora de departamentos tiene mejor cumplimiento de plazos?", "No existe una única mejor: el cumplimiento se mide caso por caso. Una desarrolladora confiable te muestra obras ya entregadas con la fecha prometida y la fecha real de posesión. Pedí ese historial y priorizá a quien tenga entregas verificables por sobre quien solo promete."],
  ["¿Cómo sé si una desarrolladora tiene buena reputación?", "Chequeá datos públicos, no autoreseñas: razón social, antigüedad, reclamos en Defensa del Consumidor y opiniones de compradores que ya escrituraron. Visitar una obra habitada de la misma empresa es la señal más fuerte de todas."],
  ["¿Qué desarrolladora de departamentos conviene en CABA?", "Conviene la que mejor cumple tus criterios verificables: plazos cumplidos, precio por m² razonable para el barrio, fideicomiso claro y obras entregadas. No la más publicitada. Este directorio está ordenado por esos criterios para que compares por tu cuenta."],
  ["¿Qué tengo que pedir antes de comprar en pozo para reducir el riesgo?", "Pedí la lista de obras entregadas con fechas, el pliego de especificaciones técnicas y el contrato de fideicomiso con fiduciario identificado. Recordá que quien responde por la entrega del pozo es la desarrolladora, no el portal ni el aviso."],
];

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

// Metadata propia (antes heredaba el título genérico del layout). Usa el título/desc
// de la página WP + canonical, igual que el resto del sitio.
export async function generateMetadata() {
  const page = await getPageBySlug("desarrolladoras-inmobiliarias-en-capital-federal");
  const m = buildMeta(page, "/desarrolladoras-inmobiliarias-en-capital-federal/", "website");
  // Meta description propia (antes se derivaba del contenido).
  return {
    ...m,
    description:
      "Directorio de las mejores desarrolladoras inmobiliarias de Buenos Aires 2026: desarrolladoras con obra en pozo por barrio, trayectoria, estructura de fideicomiso y proyecto insignia. Análisis independiente, sin ranking pago.",
  };
}

// Hub de desarrolladoras. El contenido editorial (intro, tabla, checklist, FAQ, recursos)
// vive en WordPress. El DIRECTORIO en sí ahora sale del CPT `desarrolladora` renderizado
// server-side (DirectorioDevs). En el contenido WP dejamos el marcador <!--DIRECTORIO-->
// donde antes estaban los dos listados viejos; acá lo reemplazamos por el componente.
const MARKER = "<!--DIRECTORIO-->";

export default async function HubDesarrolladorasPage() {
  let page = null;
  try {
    page = await getPageBySlug("desarrolladoras-inmobiliarias-en-capital-federal");
  } catch (e) {
    page = null;
  }
  const rmSchema = await getRankMathSchema("/desarrolladoras-inmobiliarias-en-capital-federal/");

  let devs = [];
  try {
    devs = await getDesarrolladoras();
  } catch (e) {
    devs = [];
  }

  // Schema estructurado propio (el hub no traía ItemList/FAQ/Breadcrumb).
  const extraSchema = [
    {
      "@context": "https://schema.org", "@type": "ItemList", name: "Mejores desarrolladoras inmobiliarias en Buenos Aires",
      numberOfItems: devs.length,
      itemListElement: devs.map((d, i) => ({
        "@type": "ListItem", position: i + 1,
        item: { "@type": "Organization", name: d.nombre, areaServed: "Ciudad Autónoma de Buenos Aires", ...(d.web ? { url: d.web.startsWith("http") ? d.web : `https://${d.web}` } : {}) },
      })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Desarrolladoras en CABA", item: `${SITE}/desarrolladoras-inmobiliarias-en-capital-federal/` },
      ],
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: HUB_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  const html = page?.content?.rendered || "";
  // Si el contenido WP tiene el marcador Y hay datos en el CPT, partimos y montamos el
  // directorio nuevo en el medio. Si no, renderizamos el contenido completo (fallback
  // seguro: nunca dejamos la página sin su directorio).
  const useCpt = html.includes(MARKER) && devs.length > 0;
  const [before, after] = useCpt ? html.split(MARKER) : [html, ""];

  return (
    <>
      <JsonLd data={[...rmSchema, ...extraSchema]} />

      <Container as="main" className="py-10 md:py-14">
        {html ? (
          <>
            <div
              className="wp-content prose max-w-none text-body-md text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: before }}
            />
            {useCpt && <DirectorioDevs devs={devs} chipsComoLinks />}
            {after && (
              <div
                className="wp-content prose max-w-none text-body-md text-on-surface-variant"
                dangerouslySetInnerHTML={{ __html: after }}
              />
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-3">Desarrolladoras en Capital Federal</h1>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Estamos actualizando este directorio. Mientras tanto, explorá el catálogo de proyectos en pozo por barrio.
            </p>
            <a href="/desarrollos-inmobiliarios/" className="inline-block mt-5 text-secondary underline underline-offset-4">
              Ver catálogo de desarrollos →
            </a>
          </div>
        )}
      </Container>

      {/* Mientras no exista el marcador en WP, se sigue mostrando el directorio viejo:
          reactivamos sus filtros. Una vez que el directorio nuevo toma el control, no. */}
      {!useCpt && <DirEnhancer />}
    </>
  );
}
