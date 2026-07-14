import { getPageBySlug, getRankMathSchema } from "../../lib/wp";
import DirEnhancer from "./DirEnhancer";
import TocNav from "./TocNav";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

// Hub de desarrolladoras: el contenido autoritativo vive en WordPress (Top 13 con
// datos sourced, directorio +200, tabla, checklist, FAQ y recursos). Acá solo lo
// renderizamos + reactivamos sus filtros (DirEnhancer). Sin directorios duplicados.
export default async function HubDesarrolladorasPage() {
  let page = null;
  try {
    page = await getPageBySlug("desarrolladoras-inmobiliarias-en-capital-federal");
  } catch (e) {
    page = null;
  }
  const rmSchema = await getRankMathSchema("/desarrolladoras-inmobiliarias-en-capital-federal/");

  return (
    <>
      {rmSchema.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <TocNav />

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
        {page?.content?.rendered ? (
          <div
            className="wp-content prose max-w-none text-body-md text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: page.content.rendered }}
          />
        ) : (
          <div className="text-center py-24">
            <h1 className="font-headline-md text-headline-md text-primary mb-3">Desarrolladoras en Capital Federal</h1>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Estamos actualizando este directorio. Mientras tanto, explorá el catálogo de proyectos en pozo por barrio.
            </p>
            <a href="/desarrollos-inmobiliarios/" className="inline-block mt-5 text-link-gold underline underline-offset-4">
              Ver catálogo de desarrollos →
            </a>
          </div>
        )}
      </main>

      <DirEnhancer />
    </>
  );
}
