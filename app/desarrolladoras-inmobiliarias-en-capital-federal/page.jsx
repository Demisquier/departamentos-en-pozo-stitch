import Link from "next/link";
import { getPageBySlug } from "../../lib/wp";

export const dynamicParams = !process.env.EXPORT;

// Directorio estático (estética Stitch). Si más adelante hay data estructurada
// en WP, se puede reemplazar por getDesarrollos()/taxonomía de desarrolladora.
const DESARROLLADORAS = [
  {
    monograma: "AZ",
    nombre: "Azcuy",
    badge: "Premium",
    trayectoria: "+30 años",
    desc: "Líderes en diseño contemporáneo y sustentabilidad. Su serie Donna redefine el estándar de vida en Caballito con terminaciones de clase mundial.",
    proyectos: "12 Proyectos activos",
  },
  {
    monograma: "NC",
    nombre: "NorthBaires",
    badge: "High-End",
    trayectoria: "+45 años",
    desc: "Especialistas en emprendimientos de gran escala y lujo. Responsables de icónicos desarrollos en las zonas más exclusivas de Buenos Aires.",
    proyectos: "8 Proyectos activos",
  },
  {
    monograma: "AR",
    nombre: "Argencons",
    badge: "Luxury",
    trayectoria: "+15 años",
    desc: 'Creadores de la marca Quartier. Pioneros en el concepto de "Full Amenities" en Argentina, garantizando valor y calidad constructiva.',
    proyectos: "5 Proyectos activos",
  },
  {
    monograma: "CR",
    nombre: "Criar",
    badge: "Boutique",
    trayectoria: "+20 años",
    desc: "Enfoque en arquitectura de autor y detalles artesanales. Proyectos que dialogan armónicamente con el tejido urbano tradicional de Belgrano R.",
    proyectos: "4 Proyectos activos",
  },
  {
    monograma: "CO",
    nombre: "Consultatio",
    badge: "Innovation",
    trayectoria: "+25 años",
    desc: "Bajo la visión de Eduardo Costantini, desarrollan hitos urbanos que integran arte, naturaleza y arquitectura de vanguardia como Oceana.",
    proyectos: "6 Proyectos activos",
  },
  {
    monograma: "AT",
    nombre: "Atlas",
    badge: "Lifestyle",
    trayectoria: "+10 años",
    desc: "Desarrollos dinámicos enfocados en el nuevo usuario urbano. Espacios flexibles y tecnológicos en los barrios con mayor crecimiento joven.",
    proyectos: "7 Proyectos activos",
  },
];

const ZONAS = ["Todas", "Palermo", "Belgrano", "Puerto Madero", "Recoleta"];

export default async function HubDesarrolladorasPage() {
  let page = null;
  try {
    page = await getPageBySlug("desarrolladoras-inmobiliarias-en-capital-federal");
  } catch (e) {
    page = null;
  }
  const title = page?.title?.rendered || "Desarrolladoras Verificadas en CABA";

  return (
    <>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        {/* Header Section */}
        <div className="mb-12 border-l-4 border-link-gold pl-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span className="text-label-caps font-label-caps text-secondary uppercase">Selección editorial</span>
          </div>
          <h1
            className="font-headline-md text-headline-md md:text-display-lg text-primary-container mb-4"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Un catálogo curado de las firmas que están transformando el horizonte urbano de Buenos Aires con excelencia
            arquitectónica y respaldo financiero.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 border-b border-outline-variant pb-8">
          <div className="flex flex-wrap gap-3">
            {ZONAS.map((z, i) => (
              <button
                key={z}
                className={
                  i === 0
                    ? "px-5 py-2 bg-primary-container text-on-primary text-label-caps font-label-caps transition-all"
                    : "px-5 py-2 border border-outline text-on-surface-variant text-label-caps font-label-caps hover:border-secondary hover:text-secondary transition-all"
                }
              >
                {z}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant border-b border-outline-variant px-2 py-1">
            <span className="material-symbols-outlined">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-body-md placeholder:text-on-surface-variant"
              placeholder="Buscar por nombre..."
              type="text"
            />
          </div>
        </div>

        {/* Contenido real de WP (envuelto en estética Stitch) */}
        {page?.content?.rendered ? (
          <div
            className="prose max-w-none font-body-md text-body-md text-on-surface-variant mb-16"
            dangerouslySetInnerHTML={{ __html: page.content.rendered }}
          />
        ) : null}

        {/* Developers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {DESARROLLADORAS.map((d) => (
            <div
              key={d.nombre}
              className="bg-white border border-outline-variant flex flex-col luxury-shadow group hover:border-secondary transition-all duration-500"
            >
              <div className="p-8 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-surface-container flex items-center justify-center border border-outline-variant">
                    <span className="font-headline-sm text-headline-sm text-primary-container">{d.monograma}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-label-caps font-label-caps text-secondary border border-secondary px-3 py-1 rounded-full uppercase">
                      {d.badge}
                    </span>
                    <span className="text-label-caps font-label-caps text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
                      {d.trayectoria}
                    </span>
                  </div>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-3">{d.nombre}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 line-clamp-3">{d.desc}</p>
                <div className="mt-auto pt-6 border-t border-outline-variant flex justify-between items-center">
                  <span className="text-label-caps font-label-caps text-primary-container">{d.proyectos}</span>
                  <Link className="flex items-center gap-2 text-secondary font-bold hover:gap-4 transition-all" href="/desarrollos-inmobiliarios/">
                    VER PROYECTOS
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-20 flex justify-center">
          <button className="bg-primary-container text-on-primary px-12 py-4 font-label-caps text-label-caps hover:bg-black transition-all luxury-shadow">
            CARGAR MÁS DESARROLLADORAS
          </button>
        </div>
      </main>

      {/* Trust Banner Section */}
      <section className="bg-primary-container text-on-primary py-24 mt-20 overflow-hidden relative">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-headline-md text-headline-md mb-6 leading-tight">
                Garantía de Transparencia y Respaldo Financiero
              </h2>
              <p className="font-body-lg text-body-lg text-on-primary-container mb-8">
                Cada desarrolladora en nuestro directorio ha sido sometida a un riguroso proceso de validación por parte
                de nuestro equipo legal y técnico, asegurando la viabilidad de cada proyecto publicado.
              </p>
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-3xl">verified_user</span>
                  <div>
                    <p className="font-bold text-label-caps">Diligencia Debida</p>
                    <p className="text-sm opacity-70">Auditoría legal completa</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-3xl">analytics</span>
                  <div>
                    <p className="font-bold text-label-caps">Track Record</p>
                    <p className="text-sm opacity-70">Historial de entregas</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-96 border border-on-primary-fixed-variant">
              <div
                className="absolute inset-0 bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-1000 opacity-60"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDh7jfLwx71eKHHd4u5huNC6UM8wrAADCaioUWO2wFfdLGvvqjLwyFHsX38bWecJbcEXETJjyUBMFfPUwV61R7_EGKBifAG6pRh-A0BvWe7X7GvMdx4gqoSU5yV73zFtFvJYz9dHPFpUPpyMo0qKomyCxFeD_RfEe4vm8Z-wKuyjGNFbYjZ5AdL0Ut_eoa0IvOvWqKLtlKVgS6Xy8tfBGCERwUHFS8oWAAfdkyGiTplLtzUEd1kSC6GiA')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container to-transparent" />
              <div className="absolute bottom-8 left-8 border-l-2 border-secondary pl-4">
                <p className="text-headline-sm font-headline-sm italic">
                  &quot;La confianza se construye sobre cimientos sólidos.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
