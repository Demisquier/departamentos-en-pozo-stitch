import Link from "next/link";
import { getPageBySlug, getRankMathSchema, getInmobiliarias, buildMeta, SITE } from "../../lib/wp";
import { ZONA_INMO_LABEL } from "../../lib/barrios";
import DirectorioInmo from "./DirectorioInmo";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import SectionTitle from "../_ui/SectionTitle";
import Faq from "../_ui/Faq";

// FAQ única (visible + FAQPage schema). 8 preguntas citables, respuesta directa en la
// 1ª oración (formato AEO). Fuente de verdad: el HTML editorial NO repite estas FAQ.
const FAQ_ALL = [
  ["¿Cuáles son las mejores inmobiliarias de CABA?", "No hay una respuesta objetiva porque no existe información pública sobre operaciones cerradas ni satisfacción de clientes. Lo verificable es la matrícula CUCICBA vigente, la especialización y la transparencia de datos; por eso este directorio ordena 176 firmas de Capital Federal por criterios comprobables y no por opinión ni pago."],
  ["¿Cómo sé si una inmobiliaria de CABA es de confianza?", "Verificá su matrícula CUCICBA en el padrón público y gratuito, pedí avisos y operaciones reales en tu zona y exigí por escrito quién paga la comisión y a quién representa. Desconfiá de rankings de 'mejores' sin criterio publicado y de las posiciones pagas."],
  ["¿Es obligatorio que una inmobiliaria tenga matrícula en CABA?", "Sí: el ejercicio del corretaje inmobiliario en la Ciudad de Buenos Aires está regulado y requiere matrícula de CUCICBA, verificable gratis en el padrón público del colegio."],
  ["¿Qué diferencia hay entre una inmobiliaria y una desarrolladora?", "La inmobiliaria intermedia la venta; la desarrolladora concibe, financia y construye el emprendimiento. En una compra en pozo, el riesgo de entrega depende de la desarrolladora, no de la inmobiliaria."],
  ["¿Conviene comprar en pozo por una inmobiliaria o directo a la desarrolladora?", "El precio suele ser el mismo porque la comisión ya está contemplada en el esquema del proyecto; la inmobiliaria te deja comparar varios proyectos, ir directo te da trato con quien construye. En ambos casos revisá la estructura legal antes de firmar."],
  ["¿Cómo elijo una inmobiliaria para comprar en pozo?", "Priorizá matrícula CUCICBA vigente, especialización comprobable en emprendimientos (no solo usados) y experiencia en tu barrio; que sepa leer el fideicomiso y el avance de obra pesa más que el tamaño de la marca."],
  ["¿Conviene una inmobiliaria de mi barrio o una red grande?", "Depende de la operación: la de zona conoce mejor precios y oferta local; la de red grande puede tener más cartera. En ambos casos, lo verificable (matrícula y experiencia) pesa más que el tamaño."],
  ["¿Cobran por aparecer en este listado?", "No. No cobramos por aparecer, no vendemos posiciones y no recibimos comisión por derivar consultas."],
];

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

const MARKER = "<!--DIRECTORIO-->";

export async function generateMetadata() {
  const page = await getPageBySlug("mejores-inmobiliarias-caba");
  const m = buildMeta(page, "/mejores-inmobiliarias-caba/", "website");
  // Title + meta description propios (antes se derivaban del contenido). Gancho de CTR:
  // cubre "mejores inmobiliarias caba", "listado de inmobiliarias en capital federal" y "por barrio".
  return {
    ...m,
    title: "Mejores inmobiliarias en CABA 2026: directorio con matrícula CUCICBA",
    description:
      "Directorio de inmobiliarias en CABA y Capital Federal con matrícula CUCICBA verificable y especialización en pozo. Buscá por barrio (Palermo, Belgrano, Núñez, Puerto Madero y más), sin ranking pago ni comisión. Análisis independiente 2026.",
  };
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

  // Barrios con ≥3 inmobiliarias → cluster de links internos (SEO) a las páginas por barrio.
  const zonaCount = {};
  for (const d of items) for (const k of String(d.zonasKey || "").split(/\s+/).filter(Boolean)) zonaCount[k] = (zonaCount[k] || 0) + 1;
  const barrios = Object.keys(zonaCount).filter((k) => zonaCount[k] >= 3 && ZONA_INMO_LABEL[k]).sort((a, b) => zonaCount[b] - zonaCount[a]);

  // FAQ = fuente única (visible + schema). Ver FAQ_ALL arriba.
  const faqAll = FAQ_ALL;

  // Schema propio: ItemList (con url y zona), FAQPage (base + extra) y BreadcrumbList.
  const extraSchema = [
    {
      "@context": "https://schema.org", "@type": "ItemList", name: "Mejores inmobiliarias en Capital Federal",
      numberOfItems: items.length,
      itemListElement: items.map((d, i) => ({
        "@type": "ListItem", position: i + 1,
        item: { "@type": "RealEstateAgent", name: d.nombre, areaServed: "Ciudad Autónoma de Buenos Aires", ...(d.web ? { url: d.web.startsWith("http") ? d.web : `https://${d.web}` } : {}) },
      })),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: faqAll.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Inmobiliarias en CABA", item: `${SITE}/mejores-inmobiliarias-caba/` },
      ],
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

            {/* Cluster interno: links REALES a las páginas por barrio (SEO + navegación). */}
            {barrios.length > 0 && (
              <section className="mt-12 pt-8 border-t border-outline-variant">
                <SectionTitle sub="Explorá el directorio filtrado por zona, con matrícula CUCICBA verificable:">Inmobiliarias por barrio</SectionTitle>
                <div className="flex flex-wrap gap-2.5">
                  {barrios.map((k) => (
                    <Link key={k} href={`/mejores-inmobiliarias-en-${k}/`} className="px-4 py-2 rounded-full border border-outline-variant text-primary text-[14px] hover:border-secondary hover:text-secondary transition-colors">
                      Inmobiliarias en {ZONA_INMO_LABEL[k]}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ visible — misma fuente que el FAQPage del schema (FAQ_ALL). */}
            <Faq items={FAQ_ALL} title="Preguntas frecuentes" />

            <p className="text-[12px] text-on-surface-variant mt-8">Actualizado agosto 2026 · Directorio de análisis independiente. La matrícula de cada inmobiliaria se verifica en el padrón público de CUCICBA.</p>
          </>
        ) : (
          <div className="text-center py-24">
            <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-3">Mejores inmobiliarias en CABA</h1>
            <p className="text-on-surface-variant max-w-xl mx-auto">Estamos actualizando este directorio.</p>
          </div>
        )}
      </Container>
    </>
  );
}
