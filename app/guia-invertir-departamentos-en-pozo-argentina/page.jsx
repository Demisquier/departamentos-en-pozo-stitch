import { getPageBySlug } from "../../lib/wp";

const SLUG = "guia-invertir-departamentos-en-pozo-argentina";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAm3I54cCpPCTixFSyjhwytAdCDMhI08nqmH5lK642xLRax8G3CwX7ytsBybz4zC5Nmph6jMUoKLGvYX8XLbGnb8TbE8ehWinWyRb6qAlTAy2nRh5HYmVQGnjKvfoT3uwamMTDLx5oEXyeyprGnoHa1fHqKTtVWJ5SoXJ0C2F_1jV4zTndfXRMZ1uezqQZvsFaqgmb2z0sa0iJXQF9qURH48KkCQ0QE9VPi5ihdwwjZGucgyIbmNJby-A";

export async function generateMetadata() {
  const page = await getPageBySlug(SLUG);
  const clean = (page?.title?.rendered || "Cómo invertir en departamentos en pozo en Argentina 2026")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&");
  return { title: `${clean} — Departamentos en Pozo` };
}

export default async function GuiaPillarPage() {
  let page = null;
  try {
    page = await getPageBySlug(SLUG);
  } catch (e) {
    page = null;
  }

  const titleHtml =
    page?.title?.rendered || "La Guía Definitiva para Invertir en Pozos en Argentina.";
  const bodyHtml = page?.content?.rendered || "";

  return (
    <main>
      {/* Editorial Hero Section */}
      <section className="relative bg-primary-container text-on-primary overflow-hidden border-b border-outline-variant">
        <div className="grid grid-cols-1 md:grid-cols-12 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop min-h-[70vh] items-center">
          <div className="md:col-span-7 py-12 md:py-24 z-10">
            <div className="inline-block border border-link-gold px-3 py-1 mb-6">
              <span className="font-label-caps text-label-caps text-link-gold tracking-widest uppercase">
                Inversión 2026
              </span>
            </div>
            <h1
              className="font-display-lg text-display-lg-mobile md:text-display-lg mb-8 leading-tight"
              dangerouslySetInnerHTML={{ __html: titleHtml }}
            />
            <p className="font-body-lg text-body-lg text-on-primary-container max-w-2xl mb-10">
              Descubra las estrategias de capitalización más sólidas para el mercado inmobiliario
              argentino de 2026. Analizamos ciclos económicos, marcos legales y zonas con mayor
              proyección.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                className="bg-link-gold text-on-primary px-8 py-4 font-label-caps text-label-caps hover:brightness-110 transition-all uppercase"
                href="#contenido"
              >
                Comenzar Guía
              </a>
              <div className="flex items-center gap-2 text-on-primary-container">
                <span className="material-symbols-outlined">schedule</span>
                <span className="text-label-md font-label-md">Lectura: 15 min</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-5 relative h-full min-h-[400px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${HERO_IMG}')` }}
            />
          </div>
        </div>
        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-link-gold opacity-50" />
      </section>

      {/* Main Content with Sidebar Navigation */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Sticky Sidebar Nav */}
        <aside className="hidden md:block md:col-span-3">
          <div className="sticky top-28">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-6">
              Contenido
            </h3>
            <nav className="flex flex-col gap-4 text-label-md font-label-md border-l border-outline-variant">
              <a
                className="pl-4 py-1 text-on-surface hover:text-link-gold transition-all border-l-2 border-transparent -ml-[1px]"
                href="#contenido"
              >
                Guía completa
              </a>
            </nav>

            {/* Lead Magnet Card */}
            <div className="mt-12 p-6 bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-link-gold mb-4 text-3xl">
                download
              </span>
              <h4 className="font-headline-sm text-headline-sm mb-4">Planilla de Cálculo ROI</h4>
              <p className="text-label-md font-label-md text-on-primary-container mb-6">
                Calcule la rentabilidad neta de su inversión proyectada a 36 meses.
              </p>
              <button className="w-full py-3 border border-link-gold text-link-gold font-label-caps text-label-caps hover:bg-link-gold hover:text-on-primary transition-all uppercase">
                Descargar Gratis
              </button>
            </div>
          </div>
        </aside>

        {/* Pillar Content Body — contenido real de WordPress con estética Stitch */}
        <article className="col-span-1 md:col-span-9" id="contenido">
          <div
            className="prose prose-lg max-w-none
              text-on-surface-variant leading-relaxed
              prose-headings:font-headline-md prose-headings:text-primary
              prose-h2:text-headline-md prose-h2:mt-14 prose-h2:mb-6 prose-h2:scroll-mt-28
              prose-h3:text-headline-sm prose-h3:mt-10 prose-h3:mb-4
              prose-p:font-body-lg prose-p:text-body-lg prose-p:mb-6
              prose-a:text-link-gold prose-a:no-underline hover:prose-a:underline
              prose-strong:text-primary
              prose-blockquote:bg-surface-container prose-blockquote:border-l-4
              prose-blockquote:border-link-gold prose-blockquote:not-italic prose-blockquote:p-8
              prose-table:w-full prose-table:text-left prose-table:border-collapse
              prose-th:font-label-caps prose-th:text-label-caps prose-th:uppercase prose-th:text-primary prose-th:py-4
              prose-td:py-6 prose-td:text-on-surface-variant
              prose-li:font-body-md prose-li:text-body-md prose-li:mb-2
              prose-img:my-8"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </article>
      </div>

      {/* Final CTA Section */}
      <section className="bg-primary-container py-20 mt-12 relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center">
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-primary mb-6">
            Invierta con Inteligencia. Invierta en el Futuro.
          </h2>
          <p className="text-body-lg text-on-primary-container max-w-2xl mx-auto mb-10">
            Acceda a nuestro catálogo exclusivo de preventas con precios preferenciales para
            inversores certificados.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-6">
            <a
              href="/desarrollos-inmobiliarios/"
              className="bg-link-gold text-on-primary px-10 py-5 font-label-caps text-label-caps hover:brightness-110 transition-all uppercase tracking-widest"
            >
              Ver Catálogo 2026
            </a>
            <a
              href="/contacto/"
              className="border border-on-primary text-on-primary px-10 py-5 font-label-caps text-label-caps hover:bg-on-primary hover:text-primary-container transition-all uppercase tracking-widest"
            >
              Hablar con un Experto
            </a>
          </div>
        </div>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-link-gold opacity-5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary opacity-5 blur-[80px] rounded-full" />
      </section>
    </main>
  );
}
