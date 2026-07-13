import { getPageBySlug } from "../../lib/wp";

const SLUG = "indice-precios-pozo-caballito-2026";

export async function generateMetadata() {
  const page = await getPageBySlug(SLUG);
  const clean = (page?.title?.rendered || "Índice de precios Caballito 2026")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&");
  return { title: `${clean} — Departamentos en Pozo` };
}

export default async function IndicePreciosPage() {
  let page = null;
  try {
    page = await getPageBySlug(SLUG);
  } catch (e) {
    page = null;
  }

  const titleHtml = page?.title?.rendered || "Índice de precios Caballito 2026";
  const bodyHtml = page?.content?.rendered || "";

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
      {/* Header Section */}
      <section className="mb-16 border-b border-outline-variant pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-3xl">
            <span className="text-label-caps font-label-caps text-secondary mb-4 block uppercase">
              Reporte de Mercado Trimestral
            </span>
            <h1
              className="text-display-lg-mobile md:text-display-lg font-display-lg text-primary mb-4 leading-tight"
              dangerouslySetInnerHTML={{ __html: titleHtml }}
            />
            <div className="flex flex-wrap gap-6 text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <span className="text-body-md italic">Reporte 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span className="text-body-md italic">
                  Fuente: Análisis Interno Real Estate Analytics
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="border border-secondary text-secondary px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">download</span>
              <span className="font-label-md uppercase tracking-wider">PDF</span>
            </button>
            <button className="bg-secondary text-white px-4 py-2 flex items-center gap-2 rounded-lg hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined">share</span>
              <span className="font-label-md uppercase tracking-wider">Citar</span>
            </button>
          </div>
        </div>
      </section>

      {/* Contenido real de WordPress (datos/tablas) con estética Stitch.
          No se inventan cifras: se renderiza el cuerpo tal cual viene de WP. */}
      <section className="mb-20">
        <div
          className="prose prose-lg max-w-none
            text-on-surface-variant leading-relaxed
            prose-headings:font-headline-sm prose-headings:text-primary
            prose-h2:text-headline-md prose-h2:mt-14 prose-h2:mb-6
            prose-h3:text-headline-sm prose-h3:mt-10 prose-h3:mb-4
            prose-p:font-body-md prose-p:text-body-md prose-p:mb-6
            prose-a:text-link-gold prose-a:font-bold prose-a:no-underline hover:prose-a:underline
            prose-strong:text-primary
            prose-table:w-full prose-table:text-left prose-table:border-collapse
            prose-table:border prose-table:border-outline-variant prose-table:rounded-xl prose-table:overflow-hidden prose-table:bg-white
            prose-thead:bg-surface-container
            prose-th:px-6 prose-th:py-4 prose-th:text-label-caps prose-th:font-label-caps prose-th:uppercase prose-th:tracking-wider prose-th:text-on-surface
            prose-td:px-6 prose-td:py-5 prose-td:text-on-surface-variant prose-td:border-t prose-td:border-outline-variant
            prose-li:font-body-md prose-li:text-body-md prose-li:mb-2
            prose-img:my-8"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </section>

      {/* Methodology & Disclaimer */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter border-t border-outline-variant pt-12">
        <div>
          <h2 className="text-label-caps font-label-caps text-secondary mb-4 uppercase">
            Metodología de Relevamiento
          </h2>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            El Índice de Precios se construye mediante el análisis ponderado de proyectos activos en
            el barrio de Caballito, Ciudad Autónoma de Buenos Aires. Se consideran valores de lista
            &quot;cash&quot; (contado) para unidades de 1 y 2 ambientes, ajustados por superficie
            cubierta y balcón (incidencia 50%). La muestra excluye cocheras y amenities
            extraordinarios para normalizar la base comparativa.
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-lg">
          <h2 className="text-label-caps font-label-caps text-on-surface-variant mb-4 uppercase">
            Disclaimer &amp; Términos
          </h2>
          <p className="text-body-md text-on-surface-variant italic leading-relaxed text-sm">
            Este reporte es meramente informativo y no constituye una oferta de venta ni
            asesoramiento financiero. Los precios están sujetos a cambios según la dinámica del
            mercado y la disponibilidad de stock en cada desarrollo. Departamentos en Pozo no se
            responsabiliza por variaciones en las listas de precios oficiales de los desarrolladores.
          </p>
        </div>
      </section>
    </main>
  );
}
