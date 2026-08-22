import { getPageBySlug, getRankMathSchema, getDesarrolladoras, getDesarrollos, acf, buildMeta, SITE } from "../../lib/wp";
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
  ["¿Qué empresas constructoras de departamentos tienen los mejores precios?", "El mejor precio es el que resulta competitivo para el m² del barrio con una estructura de pago clara y sin costos ocultos. Compará precio por m² entre proyectos de la misma zona, revisá la forma de ajuste (CAC o dólar) y qué incluye la unidad. Un precio muy por debajo del mercado suele ser una señal de alerta, no una ganga."],
  ["¿Cómo elegir una constructora con buena ubicación de proyectos?", "Evaluá el barrio por conectividad, servicios, demanda sostenida y valorización proyectada, y confirmá que la documentación de dominio del terreno esté en regla. Una buena ubicación se refleja en la coherencia entre el precio y el entorno. En el catálogo podés filtrar desarrollos por barrio para comparar opciones concretas."],
  // AEO ampliada: preguntas de entidad/definición aún no cubiertas (dev vs constructora, escala, verificación legal, comprar directo).
  ["¿Cuántas desarrolladoras con obra en pozo hay en CABA?", "Este directorio reúne más de 190 desarrolladoras con actividad en pozo en CABA, GBA e interior, ordenadas por criterios verificables. El número real fluctúa con cada lanzamiento y cada obra que se entrega; por eso el listado se actualiza y podés filtrarlo por barrio para ver quién construye cerca tuyo."],
  ["¿Qué diferencia hay entre una desarrolladora y una constructora?", "La desarrolladora estructura el negocio: consigue el terreno, arma el fideicomiso, define el producto y comercializa las unidades. La constructora ejecuta la obra física. Muchas veces es la misma empresa o un grupo asociado, pero al comprar en pozo evaluás al equipo completo, no solo a quién levanta las paredes."],
  ["¿Conviene comprarle a una desarrolladora grande o a una boutique?", "No hay una respuesta única. Una desarrolladora grande suele dar espalda financiera y volumen de obra entregada; una boutique, cercanía y proyectos más cuidados. Lo decisivo no es el tamaño sino la trayectoria comprobable, el cumplimiento de plazos y una estructura legal clara. Evaluá esos criterios en ambos casos."],
  ["¿Cómo verifico que una desarrolladora existe legalmente?", "Pedí la razón social y el CUIT, confirmá su inscripción en los registros correspondientes y quién es el fiduciario del fideicomiso que administra tu dinero. Verificá también que el dominio del terreno esté a nombre del fideicomiso o de la empresa. Todo esto figura por escrito en la documentación del proyecto."],
  ["¿Puedo comprar en pozo directamente a la desarrolladora sin inmobiliaria?", "Sí. Podés comprar directo a la desarrolladora: es ella quien responde por la entrega, la calidad y la estructura legal, con o sin intermediario. La inmobiliaria aporta asesoramiento y comparación de opciones, pero no reemplaza el análisis de la empresa que construye. Elegí según cuánto acompañamiento necesites."],
];

// Bloque visible "cómo elegir constructora por atributo" (captura el cluster conversacional
// de IA: miles de impresiones en GSC con 0 clics para "empresas constructoras de departamentos
// con [plazos/precios/reputación/materiales/ubicación]"). Se renderiza como sección extra.
const CLUSTER_HTML = `
<h2 id="como-elegir-constructora-por-atributo">Cómo elegir una empresa constructora de departamentos según lo que priorizás</h2>
<p>No todas las <strong>empresas constructoras de departamentos</strong> son iguales, y lo que hace "buena" a una desarrolladora depende de qué estés priorizando: puede ser el cumplimiento de plazos, el precio, la reputación o la calidad de los materiales. En la práctica, "constructora" y "desarrolladora" se usan como sinónimos —aunque técnicamente la desarrolladora estructura el negocio y la constructora ejecuta la obra—, y en un proyecto en pozo lo que te importa es evaluar al equipo completo. Esta guía te muestra, atributo por atributo, en qué fijarte concretamente y qué señales objetivas distinguen a una empresa seria.</p>
<table>
  <thead><tr><th>Si priorizás…</th><th>En qué fijarte</th><th>Señales de una buena constructora</th></tr></thead>
  <tbody>
    <tr><td>Cumplimiento de plazos</td><td>Historial de obras entregadas y desvíos reales entre fecha prometida y posesión.</td><td>Lista verificable de emprendimientos terminados, avance de obra fotografiado y cláusulas de plazo con penalidades en el boleto.</td></tr>
    <tr><td>Precios competitivos</td><td>Precio por m² comparado con el barrio, forma de ajuste (CAC, dólar) y qué está incluido.</td><td>Estructura de pago clara, anticipo y cuotas sin costos ocultos, y comparables de mercado que respaldan el valor.</td></tr>
    <tr><td>Buena reputación</td><td>Trayectoria, referencias de compradores anteriores y presencia en registros y directorios.</td><td>Antigüedad demostrable, testimonios reales, ausencia de litigios graves y respuesta a reclamos.</td></tr>
    <tr><td>Calidad de materiales</td><td>Pliego de especificaciones técnicas y terminaciones prometidas por escrito.</td><td>Memoria descriptiva detallada, marcas de aberturas/sanitarios especificadas y visita a obras ya entregadas.</td></tr>
    <tr><td>Ubicación de los proyectos</td><td>Barrio, conectividad, valorización proyectada y entorno del emprendimiento.</td><td>Proyectos en zonas con demanda sostenida, dominio en regla y coherencia entre precio y ubicación.</td></tr>
    <tr><td>Experiencia y trayectoria</td><td>Cantidad de metros construidos y años en el mercado.</td><td>Portfolio con obras finalizadas verificables, equipo técnico identificable y continuidad de la marca.</td></tr>
    <tr><td>Atención al cliente</td><td>Claridad en la comunicación y respaldo posventa.</td><td>Respuestas por escrito, contrato transparente, canal de posventa formal y acompañamiento durante la obra.</td></tr>
    <tr><td>Variedad de proyectos y tipologías</td><td>Mix de unidades (monoambientes, 2 y 3 ambientes) y estado de obra disponible.</td><td>Oferta diversa en distintos barrios y etapas, con fichas técnicas completas por tipología.</td></tr>
  </tbody>
</table>
<p>La constante en todos los atributos es la misma: pedir <strong>fideicomiso</strong> con rendición de cuentas, revisar el cumplimiento de la <strong>ley de prehorizontalidad</strong> y visitar <strong>obras ya entregadas</strong> antes de firmar. En el <a href="/desarrollos-inmobiliarios/">catálogo de desarrollos</a> vas a encontrar desarrolladoras con proyectos verificados; para evaluar en profundidad, leé <a href="/como-evaluar-una-desarrolladora-de-pozo-senales-de-confianza-y-red-flags/">cómo evaluar una desarrolladora de pozo</a>; y para ver avances reales, mirá los <a href="/videos-de-emprendimientos-en-pozo/">videos de emprendimientos en pozo por barrio</a>.</p>
`;

// Bloque metodología / E-E-A-T (señal de independencia y confianza para Google/IA) +
// micro-glosario para AEO (definiciones de fideicomiso, fiduciario, CAC, prehorizontalidad).
const METODOLOGIA_HTML = `
<h2 id="metodologia">Cómo armamos este directorio (y por qué es independiente)</h2>
<p>Este listado no es un ranking pago ni un puñado de reseñas. Ordenamos las desarrolladoras por criterios <strong>verificables</strong> y transparentes:</p>
<ul>
  <li><strong>Trayectoria comprobable:</strong> años en el mercado y metros entregados, cuando el dato es público. Un buen punto de partida son las <a href="/8-desarrolladoras-de-departamentos-en-pozo-en-caba-con-proyectos-entregados/">desarrolladoras con proyectos ya entregados en CABA</a>.</li>
  <li><strong>Estructura legal declarada:</strong> tipo de fideicomiso o esquema de comercialización del proyecto insignia. Ante la duda, aprendé <a href="/como-verificar-un-fideicomiso-inmobiliario-antes-de-comprar-en-pozo/">cómo verificar un fideicomiso antes de comprar</a>.</li>
  <li><strong>Presencia real:</strong> sitio oficial activo y proyectos identificables en barrios concretos de CABA, GBA e interior.</li>
</ul>
<p>No cobramos por aparecer, no vendemos posiciones y no recibimos comisión por derivar consultas. Los datos son de fuentes públicas y <strong>no están validados por las empresas</strong>; si detectás un error, cualquier desarrolladora puede <a href="/soy-desarrolladora/">actualizar su ficha</a>. Conocé nuestras <a href="/creditos-y-fuentes/">fuentes y créditos</a>.</p>
<h3 id="glosario-pozo">Glosario rápido del pozo</h3>
<dl>
  <dt>Fideicomiso</dt><dd>Contrato por el que un fiduciario administra el patrimonio de la obra (terreno y aportes) separado de las cuentas de la desarrolladora, y lo destina exclusivamente a construir y entregar las unidades.</dd>
  <dt>Fiduciario</dt><dd>La persona o entidad que administra el fideicomiso y responde por el buen uso de los fondos. Debe estar identificado en el contrato; es a quién le reclamás la rendición de cuentas.</dd>
  <dt>CAC</dt><dd>Índice de la Cámara Argentina de la Construcción que mide la evolución del costo de obra. Ajusta las cuotas en los fideicomisos al costo. Podés estimar su impacto con el <a href="/simulador-cuota-cac-pozo/">simulador de cuota CAC</a>.</dd>
  <dt>Prehorizontalidad</dt><dd>Régimen legal (Código Civil y Comercial, ex ley 19.724) que protege al comprador de una unidad en pozo antes de que exista el reglamento de propiedad horizontal. Repasá la <a href="/prehorizontalidad-y-ley-19724-la-proteccion-legal-al-comprar-en-pozo/">ley de prehorizontalidad</a>.</dd>
</dl>
`;

// Tabla comparativa por ESTRUCTURA LEGAL (eje no cubierto por CLUSTER_HTML, que compara
// atributos de decisión). Alto valor AEO: "fideicomiso al costo vs precio cerrado vs llave en mano".
const ESTRUCTURAS_HTML = `
<h2 id="estructuras-legales">Fideicomiso al costo, precio cerrado o llave en mano: cómo se estructura el pozo</h2>
<p>Antes de mirar la marca, entendé bajo qué esquema comprás: define quién asume el riesgo de costo y cómo se ajustan tus cuotas.</p>
<table>
  <thead><tr><th>Estructura</th><th>Cómo funciona</th><th>Quién asume el riesgo de costo</th><th>Para quién conviene</th></tr></thead>
  <tbody>
    <tr><td><strong>Fideicomiso al costo</strong></td><td>Pagás el costo real de la obra + honorarios; cuotas en pesos ajustadas por índice de la construcción (CAC).</td><td>El comprador (la cuota sube si sube el costo).</td><td>Quien busca precio de entrada bajo y tolera ajuste variable.</td></tr>
    <tr><td><strong>Precio cerrado</strong></td><td>Precio total pactado de antemano, con forma de pago definida (pesos o dólar).</td><td>La desarrolladora (absorbe el desvío de costos).</td><td>Quien prioriza previsibilidad sobre precio de entrada.</td></tr>
    <tr><td><strong>Llave en mano</strong></td><td>Comprás la unidad terminada o casi; menos exposición al riesgo de obra.</td><td>La desarrolladora, hasta la entrega.</td><td>Quien quiere mínimo riesgo y puede pagar más por m².</td></tr>
  </tbody>
</table>
<p>La estructura no reemplaza al análisis de la empresa: pedí siempre el contrato con <strong>fiduciario identificado</strong> y verificá el cumplimiento de la <a href="/prehorizontalidad-y-ley-19724-la-proteccion-legal-al-comprar-en-pozo/">ley de prehorizontalidad</a>. Profundizá en <a href="/fideicomiso-al-costo-vs-sociedad-anonima-en-pozo/">fideicomiso al costo vs. sociedad anónima</a> y estimá cuánto ajusta tu cuota con el <a href="/simulador-cuota-cac-pozo/">simulador de cuota CAC</a>. Para comparar precios por zona, mirá el <a href="/indice-precios-pozo-caba-por-barrio/">índice de precios del pozo por barrio</a>.</p>
<p>¿Y si algo sale mal? Conocé <a href="/que-pasa-si-quiebra-la-desarrolladora-en-pozo-como-proteger-tu-inversion/">qué pasa si quiebra la desarrolladora</a> y cómo proteger tu inversión. Podés comprar directo a la desarrolladora o con el respaldo de una de las <a href="/mejores-inmobiliarias-caba/">mejores inmobiliarias de CABA</a>. Y para no perderte los próximos proyectos, sumate a las <a href="/alertas-de-lanzamientos-en-pozo/">alertas de lanzamientos en pozo</a>.</p>
`;

// Match dev↔proyecto replicado de getDesarrolladoraBySlug (lib/content.js): cruce por
// nombre normalizado (sacando sufijos legales/genéricos) ∪ slugs curados, con blocklist de
// brokers. Se calcula en el SERVER para pasar proyectosCount/obraActiva ya resueltos a la
// card (el client NO puede importar lib/wp ni lib/catalogo sin arrastrar fs y romper el build).
const _DEV_DROP = /\b(sa|srl|group|grupo|desarrollos?|desarrolladora|developers?|construcciones?|constructora|inmobiliaria|propiedades|negocios|inversiones|inversora|proyectos?|arquitectura|arquitectos|urban|urbano|urbana|co|and|com|de|del|la|el|los|las)\b/g;
function _normDev(str) {
  return String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(_DEV_DROP, " ").replace(/\s+/g, " ").trim();
}
const _BROKERS = new Set(["toribio achaval", "mel", "lepore", "remax", "re max", "interwin", "soldati", "tizado", "baigun", "coldwell banker", "coldwell", "bullrich", "izrastzoff", "predial", "miranda bosch", "oslan", "besso", "mikaelian", "lincoln"].map(_normDev));
const _OBRA_ACTIVA = /pozo|obra|construc/i;

// Enriquece cada dev con proyectosCount (curados ∪ match por nombre) y obraActiva
// (≥1 ficha en pozo/obra/construcción). Un solo barrido del catálogo por dev.
function enrichDevs(devs, allP) {
  return devs.map((d) => {
    const set = new Map();
    for (const p of allP) if ((d.proyectosSlug || []).includes(p.slug)) set.set(p.slug, p);
    const devN = _normDev(d.nombre);
    if (devN.length >= 3 && !_BROKERS.has(devN)) {
      for (const p of allP) {
        if (set.has(p.slug)) continue;
        const pN = _normDev(acf(p, "desarrolladora"));
        if (!pN || _BROKERS.has(pN)) continue;
        if (pN === devN || (devN.length >= 5 && pN.includes(devN)) || (pN.length >= 5 && devN.includes(pN))) set.set(p.slug, p);
      }
    }
    const proyectos = [...set.values()];
    const obraActiva = proyectos.some((p) => _OBRA_ACTIVA.test(String(acf(p, "estado_obra") ?? acf(p, "obra") ?? acf(p, "pozo_estado") ?? "")));
    return { ...d, proyectosCount: proyectos.length, obraActiva };
  });
}

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
  // Enriquecemos en el server: proyectosCount (match curado ∪ por nombre) + obraActiva,
  // para que la card los reciba resueltos sin importar lib/catalogo/lib/wp (rompe el build).
  let allDesarrollos = [];
  try {
    allDesarrollos = await getDesarrollos();
  } catch (e) {
    allDesarrollos = [];
  }
  devs = enrichDevs(devs, allDesarrollos);

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

        {/* Bloque AEO "elegir constructora por atributo": captura el cluster de IA (constructoras de departamentos). */}
        <section
          className="wp-content prose max-w-none text-body-md text-on-surface-variant mt-12"
          dangerouslySetInnerHTML={{ __html: CLUSTER_HTML }}
        />

        {/* Metodología / E-E-A-T + micro-glosario (independencia del directorio + definiciones AEO). */}
        <section
          className="wp-content prose max-w-none text-body-md text-on-surface-variant mt-12"
          dangerouslySetInnerHTML={{ __html: METODOLOGIA_HTML }}
        />

        {/* Estructura legal del pozo: fideicomiso al costo / precio cerrado / llave en mano (eje nuevo). */}
        <section
          className="wp-content prose max-w-none text-body-md text-on-surface-variant mt-12"
          dangerouslySetInnerHTML={{ __html: ESTRUCTURAS_HTML }}
        />

        {/* CTA para desarrolladoras: nuestros datos son públicos y no están validados; invitamos a actualizar. */}
        <aside className="mt-12 border border-outline-variant rounded-2xl p-6 md:flex md:items-center md:justify-between gap-6 bg-surface-container-low">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary mb-1">¿Sos una de estas desarrolladoras?</h2>
            <p className="text-on-surface-variant text-[14px]">Nuestros datos son públicos y no están validados. Actualizá tu ficha, sumá un proyecto o conversemos.</p>
          </div>
          <a href="/soy-desarrolladora/" className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">apartment</span> Actualizar mis datos
          </a>
        </aside>
      </Container>

      {/* Mientras no exista el marcador en WP, se sigue mostrando el directorio viejo:
          reactivamos sus filtros. Una vez que el directorio nuevo toma el control, no. */}
      {!useCpt && <DirEnhancer />}
    </>
  );
}
