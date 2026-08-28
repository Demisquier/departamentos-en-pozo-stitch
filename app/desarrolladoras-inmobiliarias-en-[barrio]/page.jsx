import Link from "next/link";
import { getPageBySlug, getRankMathSchema, getDesarrollos, getDesarrolladoras, featuredImage, acf } from "../../lib/wp";
import CalcInversion from "./CalcInversion";
import DirectorioDevs from "../desarrolladoras-inmobiliarias-en-capital-federal/DirectorioDevs";
import { BARRIO_CPT, BARRIOS_SLUGS, barrioNombre, BARRIO_CATALOGO } from "../../lib/barrios";
import { deaccent, toNumber as num } from "../../lib/format";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Button from "../_ui/Button";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

export function generateStaticParams() {
  return BARRIOS_SLUGS.map((barrio) => ({ barrio }));
}

// Base de matcheo (primer token del barrio, sin acentos) para filtrar proyectos reales.
function barrioBase(slug) {
  const first = (slug || "").split("-")[0];
  const map = { nunez: "nunez", puerto: "puerto madero", villa: "villa urquiza", colegiales: "colegiales", saavedra: "saavedra" };
  return (map[first] || first).toLowerCase();
}

// Quita del HTML de WP lo que rompe o no aplica en headless: <script>, <iframe>, descargas .pdf.
function sanitizeWp(html) {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<a[^>]*href=["'][^"']*\.pdf[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "")
    .replace(/<[^>]*class=["'][^"']*(calculadora|calculator|descargar-pdf|pdf-download)[^"']*["'][\s\S]*?<\/[^>]+>/gi, "");
}

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAuiEC2Dyv8drYP2sOhcV_Hghkm4wCHq8Ppo4MTGGsKAFyM9KXxd5xSLg0vNA4MK-jNMXAvN5EI59V5a99GV_YD4JHygK3X9YF7x1uTQYv6ukmQxZAe0YReMqQjaUpEvEWKeF4tdecIXHHdlItxrpfbAh6lKYVKA9QFzFs6HqsfCxdJIpcZaCZipJvk0vPd2OyV30OGoZJ6Aiu1d-RuPl-16aIQmCR9qVxEQR2goVP0uib3qtKbyEtFFw";

const FAQ = [
  {
    q: "¿Cuál es el beneficio de comprar en preventa hoy?",
    a: 'Comprar en la etapa de "pozo" permite acceder a valores por debajo del valor de mercado terminado. Dada la valorización del suelo, esa brecha suele ampliarse hacia la entrega de la unidad, aunque no está garantizada.',
  },
  {
    q: "¿Cómo es la financiación estándar?",
    a: "La mayoría de los proyectos requieren un anticipo del 30% al 40% en dólares, y el saldo se pesifica y se ajusta mensualmente por el Índice de la Cámara Argentina de la Construcción (CAC) hasta la entrega.",
  },
  {
    q: "¿Qué conviene verificar antes de invertir en pozo?",
    a: "El track record de la desarrolladora, la estructura legal (fideicomiso al costo, escritura), el avance de obra real y el precio por m² comparado con el usado terminado de la zona.",
  },
];

export default async function GuiaBarrioPage({ params }) {
  const barrio = barrioNombre(params.barrio);
  const catSlug = BARRIO_CATALOGO[BARRIO_CPT[params.barrio]] ? BARRIO_CPT[params.barrio] : null;
  const base = barrioBase(params.barrio);

  let page = null;
  try {
    page = await getPageBySlug("desarrolladoras-inmobiliarias-en-" + params.barrio);
  } catch (e) {
    page = null;
  }
  const title = page?.title?.rendered || `${barrio}: proyectos en pozo y desarrolladoras`;
  const rmSchema = await getRankMathSchema(`/desarrolladoras-inmobiliarias-en-${params.barrio}/`);

  // Proyectos REALES del barrio (desde el CPT, mismo criterio que el catálogo).
  let items = [];
  try { items = await getDesarrollos(); } catch (e) { items = []; }
  const proyectos = (items || [])
    .map((n) => {
      const t = (n.title?.rendered || "Proyecto").replace(/&amp;/g, "&");
      const nombre = t.split("—")[0].trim() || t;
      const barrioProj = (t.split("—")[1] || "").trim();
      return { slug: n.slug, nombre, barrio: barrioProj, precio: num(acf(n, "precio_m2")), img: featuredImage(n) };
    })
    .filter((p) => deaccent(p.barrio).includes(base));

  const precios = proyectos.map((p) => p.precio).filter(Boolean);
  const minP = precios.length ? Math.min(...precios) : null;
  const maxP = precios.length ? Math.max(...precios) : null;
  const avgP = precios.length ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length) : null;
  const fmt = (n) => (n ? "USD " + n.toLocaleString("es-AR") : "Consultar");

  const destacados = proyectos.filter((p) => p.img).slice(0, 6);
  const contenido = sanitizeWp(page?.content?.rendered);

  // Directorio de DESARROLLADORAS del barrio (CPT), pre-filtrado. Reemplaza las listas
  // hechas a mano SOLO en los barrios que tienen desarrolladoras cargadas; en los que
  // todavía no (0 devs) se conserva el contenido WP para no dejar la página fina.
  const cptKey = BARRIO_CPT[params.barrio] || (params.barrio || "").split("-")[0];
  let devsBarrio = [];
  try {
    const all = await getDesarrolladoras();
    devsBarrio = (all || []).filter((d) => (d.barriosKey || "").split(/\s+/).includes(cptKey));
  } catch (e) { devsBarrio = []; }
  const usaDirectorio = devsBarrio.length > 0;

  return (
    <main>
      <JsonLd data={rmSchema} />

      {/* Preload del hero (imagen LCP) para pintar antes. */}
      <link rel="preload" as="image" href={HERO_IMG} fetchPriority="high" />
      {/* Hero */}
      <section className="relative h-[70vh] flex items-end">
        <div className="absolute inset-0 z-0">
          <img src={HERO_IMG} alt="" aria-hidden="true" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/85 to-transparent" />
        </div>
        <Container className="relative z-10 w-full pb-16 text-on-primary">
          <div className="max-w-3xl">
            <span className="text-label-caps text-secondary-fixed mb-4 block">GUÍA DE MERCADO · {barrio.toUpperCase()}</span>
            <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg mb-5 leading-tight" dangerouslySetInnerHTML={{ __html: title }} />
            <p className="text-body-lg mb-8 opacity-90 max-w-xl">
              Análisis independiente de {proyectos.length} proyecto{proyectos.length === 1 ? "" : "s"} en pozo en {barrio}: precio por m², desarrolladora y financiación.
            </p>
            <Button as={Link} variant="gold" href={catSlug ? `/desarrollos-inmobiliarios-en-${catSlug}/` : "/desarrollos-inmobiliarios/"} className="px-10 py-4 text-label-caps uppercase tracking-widest inline-flex items-center gap-3">
              Ver los {proyectos.length} desarrollos inmobiliarios en pozo en {barrio}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Button>
          </div>
        </Container>
      </section>

      {/* Barra de datos reales */}
      <section className="bg-surface-container-low border-b border-outline-variant py-8">
        <Container className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div><span className="block text-headline-sm font-headline-sm text-primary">{proyectos.length}</span><span className="text-label-caps text-on-surface-variant">Proyectos relevados</span></div>
          <div><span className="block text-headline-sm font-headline-sm text-primary">{fmt(minP)}</span><span className="text-label-caps text-on-surface-variant">Precio/m² desde</span></div>
          <div><span className="block text-headline-sm font-headline-sm text-primary">{fmt(avgP)}</span><span className="text-label-caps text-on-surface-variant">Promedio /m²</span></div>
          <div><span className="block text-headline-sm font-headline-sm text-primary">{fmt(maxP)}</span><span className="text-label-caps text-on-surface-variant">Máximo /m²</span></div>
        </Container>
      </section>

      {/* Barrios CON desarrolladoras cargadas: directorio pre-filtrado (fuente única = hub). */}
      {usaDirectorio && (
        <Container>
          <DirectorioDevs devs={devsBarrio} barrioFijo={cptKey} tituloBarrio={barrio} />
        </Container>
      )}

      {/* Barrios SIN desarrolladoras aún: se conserva el análisis WP para no dejar la página fina. */}
      {!usaDirectorio && contenido && (
        <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
          <span className="text-label-caps text-secondary mb-3 block">ANÁLISIS DEL BARRIO</span>
          <div className="prose max-w-none text-body-md text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: contenido }} />
        </section>
      )}

      {/* Proyectos reales del barrio */}
      {destacados.length > 0 && (
        <section className="bg-primary-container py-20">
          <Container>
            <div className="mb-12 text-center">
              <span className="text-label-caps text-secondary-fixed mb-3 block">PROYECTOS EN POZO</span>
              <h2 className="text-headline-md font-headline-md text-on-primary">Desarrollos inmobiliarios en pozo en {barrio}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {destacados.map((p) => (
                <Link key={p.slug} href={`/desarrollos-inmobiliarios/${p.slug}/`} className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all">
                  <div className="h-56 overflow-hidden relative">
                    <img src={p.img} alt={`${p.nombre} — ${p.barrio}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 bg-primary/90 text-white text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase">En pozo</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-headline-sm font-headline-sm mb-1 leading-tight">{p.nombre}</h3>
                    <p className="text-[13px] text-on-surface-variant flex items-center gap-1 mb-4"><span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>{p.barrio}</p>
                    <div className="flex justify-between items-end pt-4 border-t border-outline-variant">
                      <div><span className="block text-[10px] uppercase tracking-widest text-on-surface-variant">Desde</span><span className="font-bold text-primary">{p.precio ? `USD ${p.precio.toLocaleString("es-AR")}/m²` : "Consultar"}</span></div>
                      <span className="text-secondary text-label-caps flex items-center gap-1 group-hover:gap-2 transition-all">Ver <span className="material-symbols-outlined text-sm">chevron_right</span></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {catSlug && (
              <div className="text-center mt-10">
                <Link href={`/desarrollos-inmobiliarios-en-${catSlug}/`} className="inline-flex items-center gap-2 text-secondary-fixed font-label-caps uppercase tracking-widest hover:gap-3 transition-all">
                  Ver todos los desarrollos inmobiliarios en pozo en {barrio}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            )}
          </Container>
        </section>
      )}

      {/* Calculadora funcional */}
      <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <CalcInversion precioM2Default={avgP || 2500} barrio={barrio} />
      </section>

      {/* FAQ */}
      <section className="pb-20 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-label-caps text-secondary mb-3 block">PREGUNTAS FRECUENTES</span>
          <h2 className="text-headline-md font-headline-md">Invertir en {barrio}</h2>
        </div>
        <div className="space-y-4">
          {FAQ.map((f) => (
            <details key={f.q} className="group bg-surface-container-low border border-outline-variant rounded-lg p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer">
                <h4 className="text-body-lg font-semibold text-primary">{f.q}</h4>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">expand_more</span>
              </summary>
              <div className="mt-4 text-on-surface-variant leading-relaxed">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-container text-on-primary py-20">
        <Container className="text-center">
          <h2 className="text-headline-md font-headline-md mb-6">¿Querés invertir en {barrio}?</h2>
          <p className="text-body-lg opacity-80 max-w-xl mx-auto mb-8">Accedé a un análisis independiente de los proyectos en pozo del barrio, sin costo para el inversor.</p>
          <Button as={Link} variant="gold" href="/contacto/" className="px-10 py-4 text-label-caps uppercase tracking-widest inline-flex items-center gap-3">
            Quiero más información
            <span className="material-symbols-outlined">arrow_forward</span>
          </Button>
        </Container>
      </section>
    </main>
  );
}
