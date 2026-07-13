import Link from "next/link";
import { getPageBySlug } from "../../lib/wp";

export const dynamicParams = !process.env.EXPORT;

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

// Deriva el nombre visible del barrio a partir del slug.
function barrioNombre(slug) {
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

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAuiEC2Dyv8drYP2sOhcV_Hghkm4wCHq8Ppo4MTGGsKAFyM9KXxd5xSLg0vNA4MK-jNMXAvN5EI59V5a99GV_YD4JHygK3X9YF7x1uTQYv6ukmQxZAe0YReMqQjaUpEvEWKeF4tdecIXHHdlItxrpfbAh6lKYVKA9QFzFs6HqsfCxdJIpcZaCZipJvk0vPd2OyV30OGoZJ6Aiu1d-RuPl-16aIQmCR9qVxEQR2goVP0uib3qtKbyEtFFw";

// TODO: precios reales por barrio (datos del cliente). Placeholders "[cargar]".
const ZONAS_M2 = [
  { zona: "[cargar]", valor: "[cargar]", tendencia: "[cargar]" },
  { zona: "[cargar]", valor: "[cargar]", tendencia: "[cargar]" },
  { zona: "[cargar]", valor: "[cargar]", tendencia: "[cargar]" },
  { zona: "[cargar]", valor: "[cargar]", tendencia: "[cargar]" },
];

const PROYECTOS = [
  {
    dev: "North Atlantic Corp",
    nombre: "The Heritage Residences",
    desc: "Ubicado en el corazón de Soho, este proyecto integra arte y habitabilidad con amenities de clase mundial.",
    desde: "DESDE USD 280.000",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAOEdlFbfXBUEguw8PFlhYVuJn6M2ExitDtMxNxED1J-iECOb1jHdQX3xQgDFlRQqvzRRBnFoI7SrcXwk4UdtGcF5ono4vRIQq65Y6RTA7AHqMzf4WGnK40sEkjPrNN2km0GnRKWk_CffLJaDoJnEnwDnzqkDBAuuBpgnAK4sC7LoVISI-mUFTMaNDUbHrbNB_kJqnREmCP0dH27nFbyn4VzZNb84Knit8fQLsQYfNduiyhnQVLcd2vgw",
  },
  {
    dev: "Studio Urbano",
    nombre: "Iconic Tower Palermo",
    desc: "Una torre de 35 pisos con vistas panorámicas al río y acabados importados de la más alta gama.",
    desde: "DESDE USD 450.000",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkhYmBJm7VyHrqDF-boxXXjqcFuKm8lnKk0NJ5TbMiryvbBJtZ_6NTMbaYNsTmvLSRazvzLzUDkVNLjiWI6FaJwbqjjdUmGWF5BwfW7j8uyDfdqS6o4S8C2GnpxRSF-3jLIrlDkSWPfYP6rcSt_MF4Wb1D6_6DcQ1usqIk5hTzjvQ7YY453c1XNxumZs8T2LjHCDUN2w_AoI6ZiJ7c1UYZclSZiunArSeHCCmVZaARQjfpwvWr4Yltpg",
  },
  {
    dev: "Eco-Developments",
    nombre: "Vertex Boutique",
    desc: "Arquitectura sostenible en una calle arbolada, diseñado para el inversor joven.",
    desde: "DESDE USD 195.000",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnWREh074or1S0Rf4RWHHeVk-7bVTAq33Wl1eQFFSX-TjC8s8MA6JysDSKKLcmifFsh1eCG9_gw9WAglagbweIvLWymymlONfn-NlbYsMHJjEvQ2REKj3HM2L_j1sMgj2nugmDW6dIBjQrNE5l5BxtIxEVmDLpHHZQOpFJ53vfpiLwSpmbeQwVsk0LMH9NMliNtkcywufhtNnIFNI1Sdv3bd5nQGSmcIK3-oq1A3gKDfmtR91BUOuDTg",
  },
];

const FAQ = [
  {
    q: "¿Cuál es el beneficio de comprar en preventa hoy?",
    a: 'Comprar en la etapa de "pozo" permite acceder a valores entre un 15% y 20% inferiores al valor de mercado terminado. Dada la constante valorización del suelo, esta brecha suele ampliarse hacia la entrega de la unidad.',
  },
  {
    q: "¿Qué micro-barrio ofrece mayor retorno por alquiler?",
    a: "Las zonas con mayor oferta gastronómica y comercial lideran el mercado de alquiler temporario (Airbnb). Para alquileres a largo plazo de alta gama, las áreas residenciales premium ofrecen los yields más estables con inquilinos corporativos.",
  },
  {
    q: "¿Cómo es la financiación estándar?",
    a: "La mayoría de los proyectos requieren un anticipo del 30% al 40% en dólares, y el saldo se pesifica y se ajusta mensualmente por el Índice de la Cámara Argentina de la Construcción (CAC) hasta la entrega de la llave.",
  },
];

export default async function GuiaBarrioPage({ params }) {
  const barrio = barrioNombre(params.barrio);

  let page = null;
  try {
    page = await getPageBySlug("desarrolladoras-inmobiliarias-en-" + params.barrio);
  } catch (e) {
    page = null;
  }
  const title = page?.title?.rendered || `${barrio}: El Epicentro de la Plusvalía Inmobiliaria`;

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-end">
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{ backgroundImage: `url('${HERO_IMG}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent" />
        </div>
        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop pb-20 max-w-container-max mx-auto text-on-primary">
          <div className="max-w-3xl">
            <span className="text-label-caps text-secondary-fixed mb-4 block">GUÍA DE MERCADO</span>
            <h1
              className="text-display-lg-mobile md:text-display-lg font-display-lg mb-6 leading-tight"
              dangerouslySetInnerHTML={{ __html: title }}
            />
            <p className="text-body-lg mb-8 opacity-90 max-w-xl">
              Descubrí por qué {barrio} continúa liderando el mercado de proyectos en pozo, combinando lifestyle
              cosmopolita con una rentabilidad sostenida.
            </p>
            <Link
              href="/desarrollos-inmobiliarios/"
              className="bg-link-gold text-primary-container px-10 py-4 text-label-caps uppercase tracking-widest hover:brightness-110 transition-all inline-flex items-center gap-3"
            >
              Ver proyectos en {barrio}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Market Insight Section */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-5">
            <span className="text-label-caps text-secondary mb-4 block">ANÁLISIS ESTRATÉGICO</span>
            <h2 className="text-headline-md font-headline-md mb-6">
              Un mercado impulsado por la escasez y el prestigio.
            </h2>
            {page?.content?.rendered ? (
              <div
                className="prose max-w-none text-body-md text-on-surface-variant mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: page.content.rendered }}
              />
            ) : (
              <p className="text-body-md text-on-surface-variant mb-8 leading-relaxed">
                {barrio} no es solo un barrio; es un ecosistema financiero. Con una demanda constante de perfiles
                internacionales y ejecutivos locales, las unidades en pozo en esta zona aseguran una liquidez
                excepcional.
              </p>
            )}
            <div className="flex flex-wrap gap-8">
              <div>
                <span className="block text-headline-sm font-headline-sm text-primary">4.8%</span>
                <span className="text-label-caps text-on-surface-variant">Yield Promedio Anual</span>
              </div>
              <div>
                <span className="block text-headline-sm font-headline-sm text-primary">+12%</span>
                <span className="text-label-caps text-on-surface-variant">Plusvalía en Pozo</span>
              </div>
            </div>
          </div>
          <div className="lg:col-start-7 lg:col-span-6">
            <div className="bg-surface-container-low border border-outline-variant p-8">
              <h3 className="text-label-caps mb-6 text-primary border-b border-outline-variant pb-4">
                TABLA DE VALORES M² POR ZONA
              </h3>
              {/* TODO: precios reales por barrio (datos del cliente) */}
              <div className="space-y-4">
                {ZONAS_M2.map((z, i) => (
                  <div
                    key={i}
                    className={
                      i < ZONAS_M2.length - 1
                        ? "flex justify-between items-center py-2 border-b border-outline-variant/30"
                        : "flex justify-between items-center py-2"
                    }
                  >
                    <span className="font-medium">{z.zona}</span>
                    <div className="text-right">
                      <span className="block text-body-md font-bold">{z.valor}</span>
                      <span className="text-label-caps text-secondary">Tendencia: {z.tendencia}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-on-surface-variant italic font-light">
                *Valores promedio de unidades en etapa de preventa avanzada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developers Bento Grid */}
      <section className="bg-primary-container py-24">
        <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <span className="text-label-caps text-secondary-fixed mb-4 block">FIRMAS DE AUTOR</span>
            <h2 className="text-headline-md font-headline-md text-on-primary">Desarrolladoras que definen {barrio}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {PROYECTOS.map((p) => (
              <div key={p.nombre} className="bg-white p-1 rounded-xl overflow-hidden group">
                <div className="h-64 overflow-hidden relative">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('${p.img}')` }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white text-[10px] font-bold tracking-[0.2em] px-3 py-1 uppercase">
                      {p.dev}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-headline-sm font-headline-sm mb-2">{p.nombre}</h3>
                  <p className="text-body-md text-on-surface-variant mb-4">{p.desc}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                    <span className="text-label-caps font-bold">{p.desde}</span>
                    <Link
                      className="text-link-gold text-label-caps flex items-center gap-1 hover:gap-2 transition-all"
                      href="/desarrollos-inmobiliarios/"
                    >
                      Explorar <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-label-caps text-secondary mb-4 block">PREGUNTAS FRECUENTES</span>
          <h2 className="text-headline-md font-headline-md">Invertir en {barrio}</h2>
        </div>
        <div className="space-y-4">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group bg-surface-container-low border border-outline-variant rounded-lg p-6 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer">
                <h4 className="text-body-lg font-semibold text-primary">{f.q}</h4>
                <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="mt-4 text-on-surface-variant leading-relaxed">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-container text-on-primary py-20">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <h2 className="text-headline-md font-headline-md mb-6">¿Querés invertir en {barrio}?</h2>
          <p className="text-body-lg opacity-80 max-w-xl mx-auto mb-8">
            Accedé a un análisis independiente de los proyectos en pozo del barrio, sin costo para el inversor.
          </p>
          <Link
            href="/contacto/"
            className="bg-link-gold text-primary-container px-10 py-4 text-label-caps uppercase tracking-widest hover:brightness-110 transition-all inline-flex items-center gap-3"
          >
            Quiero más información
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
