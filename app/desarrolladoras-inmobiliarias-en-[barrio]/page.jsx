import Link from "next/link";
import { getPageBySlug, getRankMathSchema, getDesarrollos, featuredImage, acf } from "../../lib/wp";
import CalcInversion from "./CalcInversion";

export const dynamicParams = !process.env.EXPORT;
export const revalidate = 600;

const BARRIOS = [
  "palermo",
  "caballito",
  "belgrano",
  "nunez",
  "puerto-madero",
  "recoleta",
  "villa-urquiza",
  "colegiales-chacarita",
  "saavedra-coghlan",
];

export function generateStaticParams() {
  return BARRIOS.map((barrio) => ({ barrio }));
}

function barrioNombre(slug) {
  if (!slug) return "Buenos Aires";
  const casos = {
    nunez: "Núñez",
    "puerto-madero": "Puerto Madero",
    "colegiales-chacarita": "Colegiales y Chacarita",
    "saavedra-coghlan": "Saavedra y Coghlan",
    "villa-urquiza": "Villa Urquiza",
  };
  if (casos[slug]) return casos[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Base de matcheo (primer token del barrio, sin acentos) para filtrar proyectos reales.
function barrioBase(slug) {
  const first = (slug || "").split("-")[0];
  const map = { nunez: "nunez", puerto: "puerto madero", villa: "villa urquiza", colegiales: "colegiales", saavedra: "saavedra" };
  return (map[first] || first).toLowerCase();
}
const deaccent = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function num(v) {
  if (v == null) return null;
  const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
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

  return (
    <main>
      {rmSchema.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* Hero */}
      <section className="relative h-[70vh] flex items-end">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${HERO_IMG}')` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/85 to-transparent" />
        </div>
        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop pb-16 max-w-container-max mx-auto text-on-primary">
          <div className="max-w-3xl">
            <span className="text-label-caps text-secondary-fixed mb-4 block">GUÍA DE MERCADO · {barrio.toUpperCase()}</span>
            <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg mb-5 leading-tight" dangerouslySetInnerHTML={{ __html: title }} />
            <p className="text-body-lg mb-8 opacity-90 max-w-xl">
              Análisis independiente de {proyectos.length} proyecto{proyectos.length === 1 ? "" : "s"} en pozo en {barrio}: precio por m², desarrolladora y financiación.
            </p>
            <Link href="/desarrollos-inmobiliarios/?barrio=" className="bg-link-gold text-primary-container px-10 py-4 text-label-caps uppercase tracking-widest hover:brightness-110 transition-all inline-flex items-center gap-3">
              Ver proyectos en {barrio}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Barra de datos reales */}
      <section className="bg-surface-container-low border-b border-outline-variant py-8">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div><span className="block text-headline-sm font-headline-sm text-primary">{proyectos.length}</span><span className="text-label-caps text-on-surface-variant">Proyectos relevados</span></div>
          <div><span className="block text-headline-sm font-headline-sm text-primary">{fmt(minP)}</span><span className="text-label-caps text-on-surface-variant">Precio/m² desde</span></div>
          <div><span className="block text-headline-sm font-headline-sm text-primary">{fmt(avgP)}</span><span className="text-label-caps text-on-surface-variant">Promedio /m²</span></div>
          <div><span className="block text-headline-sm font-headline-sm text-primary">{fmt(maxP)}</span><span className="text-label-caps text-on-surface-variant">Máximo /m²</span></div>
        </div>
      </section>

      {/* Análisis (contenido WP saneado) */}
      {contenido && (
        <section className="py-16 md:py-20 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto">
          <span className="text-label-caps text-secondary mb-3 block">ANÁLISIS DEL BARRIO</span>
          <div className="prose max-w-none text-body-md text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: contenido }} />
        </section>
      )}

      {/* Proyectos reales del barrio */}
      {destacados.length > 0 && (
        <section className="bg-primary-container py-20">
          <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="mb-12 text-center">
              <span className="text-label-caps text-secondary-fixed mb-3 block">PROYECTOS EN POZO</span>
              <h2 className="text-headline-md font-headline-md text-on-primary">Desarrollos en {barrio}</h2>
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
                      <span className="text-link-gold text-label-caps flex items-center gap-1 group-hover:gap-2 transition-all">Ver <span className="material-symbols-outlined text-sm">chevron_right</span></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
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
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <h2 className="text-headline-md font-headline-md mb-6">¿Querés invertir en {barrio}?</h2>
          <p className="text-body-lg opacity-80 max-w-xl mx-auto mb-8">Accedé a un análisis independiente de los proyectos en pozo del barrio, sin costo para el inversor.</p>
          <Link href="/contacto/" className="bg-link-gold text-primary-container px-10 py-4 text-label-caps uppercase tracking-widest hover:brightness-110 transition-all inline-flex items-center gap-3">
            Quiero más información
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
