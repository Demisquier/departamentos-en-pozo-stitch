import { getPageBySlug, getRankMathSchema, getDesarrolladoras } from "../../lib/wp";
import DirectorioDevs from "./DirectorioDevs";
import DirEnhancer from "./DirEnhancer";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

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

  const html = page?.content?.rendered || "";
  // Si el contenido WP tiene el marcador Y hay datos en el CPT, partimos y montamos el
  // directorio nuevo en el medio. Si no, renderizamos el contenido completo (fallback
  // seguro: nunca dejamos la página sin su directorio).
  const useCpt = html.includes(MARKER) && devs.length > 0;
  const [before, after] = useCpt ? html.split(MARKER) : [html, ""];

  return (
    <>
      {rmSchema.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
        {html ? (
          <>
            <div
              className="wp-content prose max-w-none text-body-md text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: before }}
            />
            {useCpt && <DirectorioDevs devs={devs} />}
            {after && (
              <div
                className="wp-content prose max-w-none text-body-md text-on-surface-variant"
                dangerouslySetInnerHTML={{ __html: after }}
              />
            )}
          </>
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

      {/* Mientras no exista el marcador en WP, se sigue mostrando el directorio viejo:
          reactivamos sus filtros. Una vez que el directorio nuevo toma el control, no. */}
      {!useCpt && <DirEnhancer />}
    </>
  );
}
