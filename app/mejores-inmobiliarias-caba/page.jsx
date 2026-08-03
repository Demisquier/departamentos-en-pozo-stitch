import Link from "next/link";
import { getPageBySlug, getRankMathSchema, getInmobiliarias, buildMeta, SITE } from "../../lib/wp";
import { ZONA_INMO_LABEL } from "../../lib/barrios";
import DirectorioInmo from "./DirectorioInmo";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";

// FAQ extra (long-tail) que se agregan al FAQPage + se muestran abajo.
const FAQ_EXTRA = [
  ["¿Cómo elegir una inmobiliaria en CABA?", "Priorizá la matrícula CUCICBA vigente (verificable gratis en el padrón del colegio), la experiencia comprobable en la zona y el tipo de operación que necesitás, y la transparencia de datos. Desconfiá de rankings de 'mejores' sin criterio publicado."],
  ["¿Qué le conviene preguntar a una inmobiliaria antes de firmar?", "Número de matrícula, si representa al vendedor o al comprador, cómo se calcula y quién paga la comisión, y —si comprás en pozo— quién es la desarrolladora, la estructura del fideicomiso y el avance de obra real."],
  ["¿Conviene una inmobiliaria de mi barrio o una grande?", "Depende de la operación: una inmobiliaria de zona suele conocer mejor los precios y la oferta del barrio; una de red grande puede tener más cartera. En ambos casos, lo verificable (matrícula y experiencia) pesa más que el tamaño."],
];

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

const MARKER = "<!--DIRECTORIO-->";

export async function generateMetadata() {
  const page = await getPageBySlug("mejores-inmobiliarias-caba");
  const m = buildMeta(page, "/mejores-inmobiliarias-caba/", "website");
  // Meta description propia (antes se derivaba del contenido). Keyword + diferencial (matrícula) + año.
  return {
    ...m,
    description:
      "Directorio de las mejores inmobiliarias de CABA con matrícula CUCICBA verificada. Buscá por zona (Palermo, Belgrano, Núñez, Puerto Madero y más), sin ranking pago ni comisión. Análisis independiente 2026.",
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

  // FAQ = base + extra (long-tail). Se usa tanto para el schema como para el bloque visible.
  const FAQ_BASE = [
    ["¿Cuáles son las mejores inmobiliarias de CABA?", "No hay una respuesta objetiva porque no existe información pública sobre operaciones cerradas ni satisfacción de clientes. Lo verificable es la matrícula CUCICBA vigente, la experiencia comprobable y la transparencia de datos."],
    ["¿Es obligatorio que una inmobiliaria tenga matrícula en CABA?", "El ejercicio del corretaje inmobiliario en la Ciudad de Buenos Aires está regulado y requiere matrícula de CUCICBA, verificable gratis en el padrón público del colegio."],
    ["¿Qué diferencia hay entre una inmobiliaria y una desarrolladora?", "La inmobiliaria intermedia la venta; la desarrolladora concibe, financia y construye el emprendimiento. En una compra en pozo, el riesgo de entrega depende de la desarrolladora."],
    ["¿Cobran por aparecer en este listado?", "No. No cobramos por aparecer, no vendemos posiciones y no recibimos comisión por derivar consultas."],
  ];
  const faqAll = [...FAQ_BASE, ...FAQ_EXTRA];

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
                <h2 className="font-headline-sm text-headline-sm text-primary mb-2">Inmobiliarias por barrio</h2>
                <p className="text-on-surface-variant mb-4 text-[15px]">Explorá el directorio filtrado por zona, con matrícula CUCICBA verificable:</p>
                <div className="flex flex-wrap gap-2.5">
                  {barrios.map((k) => (
                    <Link key={k} href={`/mejores-inmobiliarias-en-${k}/`} className="px-4 py-2 rounded-full border border-outline-variant text-primary text-[14px] hover:border-secondary hover:text-secondary transition-colors">
                      Inmobiliarias en {ZONA_INMO_LABEL[k]}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ extra (long-tail) — mismo contenido que el FAQPage del schema. */}
            <section className="mt-12">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Cómo elegir tu inmobiliaria</h2>
              <div className="space-y-3">
                {FAQ_EXTRA.map(([q, a]) => (
                  <details key={q} className="group border border-outline-variant rounded-lg p-5 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer font-semibold text-primary">{q}<span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span></summary>
                    <p className="mt-3 text-on-surface-variant leading-relaxed">{a}</p>
                  </details>
                ))}
              </div>
            </section>

            <p className="text-[12px] text-on-surface-variant mt-8">Actualizado agosto 2026 · Directorio de análisis independiente. La matrícula de cada inmobiliaria se verifica en el padrón público de CUCICBA.</p>
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
