import Link from "next/link";
import { getPageBySlug, getRankMathSchema } from "../../lib/wp";
import HubFiltros from "./HubFiltros";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

// Directorio editorial de firmas activas en CABA. `zonas` = barrios donde tienen
// desarrollos conocidos (para el filtro). Sin métricas no verificables.
const DESARROLLADORAS = [
  {
    monograma: "AZ",
    nombre: "Azcuy",
    badge: "Premium",
    desc: "Diseño contemporáneo y sustentabilidad. Su serie Donna redefinió el estándar de vida en Caballito con terminaciones de alta gama.",
    zonas: ["Caballito", "Villa Crespo"],
  },
  {
    monograma: "CO",
    nombre: "Consultatio",
    badge: "Innovation",
    desc: "Bajo la visión de Eduardo Costantini, desarrollan hitos urbanos que integran arte, naturaleza y arquitectura de vanguardia, como Oceana en Puerto Madero.",
    zonas: ["Puerto Madero", "Núñez"],
  },
  {
    monograma: "AR",
    nombre: "Argencons",
    badge: "Luxury",
    desc: 'Creadores de la marca Quartier. Pioneros del concepto "Full Amenities" en Argentina, con foco en calidad constructiva y valor de reventa.',
    zonas: ["Palermo", "Belgrano", "Puerto Madero"],
  },
  {
    monograma: "NC",
    nombre: "NorthBaires",
    badge: "High-End",
    desc: "Especialistas en emprendimientos de gran escala y lujo en las zonas más consolidadas del norte de la ciudad.",
    zonas: ["Belgrano", "Núñez"],
  },
  {
    monograma: "CR",
    nombre: "Criar",
    badge: "Boutique",
    desc: "Arquitectura de autor y detalles artesanales. Proyectos que dialogan con el tejido urbano tradicional de Belgrano y Colegiales.",
    zonas: ["Belgrano", "Colegiales"],
  },
  {
    monograma: "AT",
    nombre: "Atlas",
    badge: "Lifestyle",
    desc: "Desarrollos dinámicos para el nuevo usuario urbano: espacios flexibles y tecnológicos en barrios de mayor crecimiento joven.",
    zonas: ["Villa Urquiza", "Caballito"],
  },
];

export default async function HubDesarrolladorasPage() {
  let page = null;
  try {
    page = await getPageBySlug("desarrolladoras-inmobiliarias-en-capital-federal");
  } catch (e) {
    page = null;
  }
  const title = page?.title?.rendered || "Desarrolladoras verificadas en CABA";
  const rmSchema = await getRankMathSchema("/desarrolladoras-inmobiliarias-en-capital-federal/");

  return (
    <>
      {rmSchema.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        {/* Header */}
        <div className="mb-10 border-l-4 border-link-gold pl-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-label-caps font-label-caps text-secondary uppercase">Selección editorial</span>
          </div>
          <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary-container mb-4" dangerouslySetInnerHTML={{ __html: title }} />
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Un catálogo curado de las firmas que están transformando el horizonte urbano de Buenos Aires. Filtrá por barrio o buscá por nombre.
          </p>
        </div>

        {/* Contenido real de WP (análisis del hub) */}
        {page?.content?.rendered ? (
          <div className="prose max-w-none font-body-md text-body-md text-on-surface-variant mb-12" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
        ) : null}

        {/* Directorio interactivo (filtro + búsqueda reales) */}
        <HubFiltros firmas={DESARROLLADORAS} />

        <div className="mt-16 text-center">
          <Link href="/desarrollos-inmobiliarios/" className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-12 py-4 font-label-caps text-label-caps hover:bg-black transition-all luxury-shadow">
            Ver todos los proyectos en pozo
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </main>

      {/* Trust Banner */}
      <section className="bg-primary-container text-on-primary py-24 mt-20 overflow-hidden relative">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline-md text-headline-md mb-6 leading-tight">Análisis independiente, no comercialización</h2>
              <p className="font-body-lg text-body-lg text-on-primary-container mb-8">
                No somos inmobiliaria ni desarrolladora. Evaluamos cada firma y proyecto con datos públicos y de la comercializadora, para darte una lectura objetiva antes de invertir.
              </p>
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-3xl">verified_user</span>
                  <div>
                    <p className="font-bold text-label-caps">Criterio editorial</p>
                    <p className="text-sm opacity-70">Firmas con trayectoria comprobable</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-3xl">analytics</span>
                  <div>
                    <p className="font-bold text-label-caps">Track record</p>
                    <p className="text-sm opacity-70">Historial de obras entregadas</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-96 border border-on-primary-fixed-variant">
              <div className="absolute inset-0 bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-1000 opacity-60" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDh7jfLwx71eKHHd4u5huNC6UM8wrAADCaioUWO2wFfdLGvvqjLwyFHsX38bWecJbcEXETJjyUBMFfPUwV61R7_EGKBifAG6pRh-A0BvWe7X7GvMdx4gqoSU5yV73zFtFvJYz9dHPFpUPpyMo0qKomyCxFeD_RfEe4vm8Z-wKuyjGNFbYjZ5AdL0Ut_eoa0IvOvWqKLtlKVgS6Xy8tfBGCERwUHFS8oWAAfdkyGiTplLtzUEd1kSC6GiA')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container to-transparent" />
              <div className="absolute bottom-8 left-8 border-l-2 border-secondary pl-4">
                <p className="text-headline-sm font-headline-sm italic">&quot;La confianza se construye sobre cimientos sólidos.&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
