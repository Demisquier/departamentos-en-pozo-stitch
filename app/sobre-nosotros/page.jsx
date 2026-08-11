import Link from "next/link";
import { getPageBySlug, getDesarrollos, getDesarrolladoras } from "../../lib/wp";
import { BARRIO_ORDEN } from "../../lib/barrios";
import { SITE, LOGO_URL } from "../../lib/constants";
import Button from "../_ui/Button";
import JsonLd from "../_ui/JsonLd";

// E-E-A-T: identidad y autoridad del equipo detrás del análisis. Líder real con perfil verificable.
const LINKEDIN_LIDER = "https://ar.linkedin.com/in/demiansquiersky";
const PERSONA_LIDER = {
  "@type": "Person",
  "@id": `${SITE}/#demian-squiersky`,
  name: "Demian Squiersky",
  jobTitle: "Fundador · Líder de producto",
  description:
    "Más de 10 años en real estate digital. Lideró producto en Zonaprop y QuintoAndar, los portales inmobiliarios líderes de Latinoamérica.",
  url: LINKEDIN_LIDER,
  sameAs: [LINKEDIN_LIDER],
};
const SCHEMA = [
  { "@context": "https://schema.org", "@type": "AboutPage", name: "Sobre nosotros — Departamentos en Pozo", url: `${SITE}/sobre-nosotros/` },
  {
    "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE}/#org`,
    name: "Departamentos en Pozo", url: SITE, logo: LOGO_URL,
    description: "Portal de análisis independiente de inversión en departamentos en pozo (preventa) en CABA.",
    founder: PERSONA_LIDER, sameAs: [LINKEDIN_LIDER],
  },
  { "@context": "https://schema.org", ...PERSONA_LIDER, worksFor: { "@type": "Organization", "@id": `${SITE}/#org`, name: "Departamentos en Pozo", url: SITE } },
];

export const metadata = {
  title: "Nosotros | Departamentos en Pozo",
  alternates: { canonical: `${SITE}/sobre-nosotros/` },
  description:
    "Análisis independiente de inversión en departamentos en pozo en CABA. Conocé nuestra metodología, criterios y por qué no somos una inmobiliaria.",
};

// Bloque de marca reutilizable (reemplaza los placeholders externos). Navy + bronce.
function Marca({ frase }) {
  return (
    <div className="aspect-[4/5] relative bg-primary-container rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center">
      <div className="text-center px-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl border-2 border-link-gold flex items-center justify-center">
          <span className="material-symbols-outlined text-link-gold text-[40px]">apartment</span>
        </div>
        {frase && <p className="text-white font-headline-sm text-headline-sm italic leading-snug">{frase}</p>}
      </div>
    </div>
  );
}

export default async function SobreNosotrosPage() {
  const page = await getPageBySlug("sobre-nosotros");
  const titulo = page?.title?.rendered || "Sobre nosotros";

  // Conteos DINÁMICOS desde el dato (nada hardcodeado): si mañana entran/salen
  // proyectos o desarrolladoras, estas cifras se actualizan solas.
  let desarrollos = [], desarrolladoras = [];
  try { desarrollos = await getDesarrollos(); } catch {}
  try { desarrolladoras = await getDesarrolladoras(); } catch {}
  const nProyectos = desarrollos.length;
  const nDevs = desarrolladoras.length;
  // Barrios de CABA con al menos un proyecto (mismo criterio que la home).
  const barriosConObra = new Set();
  desarrollos.forEach((node) => {
    const t = (node.title?.rendered || "").replace(/&amp;/g, "&");
    const b = (t.split("—")[1] || "").trim();
    const top = b.startsWith("Palermo") ? "Palermo" : b;
    if (top && BARRIO_ORDEN.includes(top)) barriosConObra.add(top);
  });
  const nBarrios = barriosConObra.size;

  return (
    <div className="overflow-x-hidden">
      <JsonLd data={SCHEMA} />
      {/* Hero */}
      <header className="relative py-28 md:py-36 flex items-center overflow-hidden bg-primary-container">
        <div className="absolute inset-0 hero-gradient z-10" />
        <div className="relative z-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
          <div className="max-w-2xl">
            <span className="text-secondary-fixed font-label-caps tracking-[0.2em] mb-4 block">
              INDEPENDENCIA &amp; CRITERIO
            </span>
            <h1
              className="text-white font-display-lg text-display-lg mb-6 leading-tight"
              dangerouslySetInnerHTML={{ __html: titulo }}
            />
            <p className="text-on-primary-container font-body-lg text-body-lg max-w-xl">
              Somos un portal de análisis independiente de departamentos en pozo en CABA. No vendemos, no
              intermediamos y no cobramos comisión. Publicamos el dato que necesitás para decidir por vos mismo.
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {[
              [String(nProyectos), "PROYECTOS RELEVADOS"],
              [String(nBarrios), "BARRIOS DE CABA"],
              [String(nDevs), "DESARROLLADORAS RELEVADAS"],
              ["100%", "INDEPENDIENTE"],
            ].map(([n, l]) => (
              <div key={l} className="p-8 border border-outline-variant rounded-lg flex flex-col justify-center items-center text-center">
                <span className="text-secondary font-display-lg text-display-lg mb-2">{n}</span>
                <span className="font-label-caps text-on-surface-variant text-[12px]">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="py-24 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 w-full">
              <Marca frase="&laquo;El dato correcto, con su fuente, antes que el dato que conviene.&raquo;" />
            </div>
            <div className="flex-1 space-y-8">
              <span className="text-secondary font-label-caps tracking-widest">NUESTRO ADN</span>
              <h2 className="text-primary font-headline-md text-headline-md">
                Un portal de análisis, no una inmobiliaria más.
              </h2>
              <p className="text-on-surface-variant text-body-lg">
                Departamentos en Pozo nació para ordenar un mercado opaco: comparar desarrolladoras, precios por m²
                y potencial de cada proyecto, barrio por barrio, con datos verificables y fuente a la vista. No
                comercializamos unidades ni cobramos por aparecer. Si un dato no nos consta, lo dejamos en blanco
                antes que inventarlo.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container">verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Análisis independiente</h4>
                    <p className="text-on-surface-variant">
                      Evaluamos cada desarrollo con criterio propio, sin ataduras a ninguna marca ni comisión de por medio.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container">query_stats</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Foco en pozo y pre-construcción</h4>
                    <p className="text-on-surface-variant">
                      Especializados en la etapa temprana: fideicomiso, boleto, anticipo, ajuste CAC y la brecha frente al terminado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo / E-E-A-T: identidad y autoridad */}
      <section className="py-24 bg-white">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-secondary font-label-caps tracking-widest block mb-4">QUIÉNES LO HACEN</span>
            <h2 className="text-primary font-headline-md text-headline-md">
              Un equipo de especialistas en real estate, liderado por Demian Squiersky.
            </h2>
            <p className="text-on-surface-variant text-body-lg mt-4">
              Combinamos experiencia de portal, análisis de mercado y estructura legal para que cada dato que publicamos tenga criterio detrás.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-gutter items-start">
            {/* Líder */}
            <div className="md:col-span-1 border border-outline-variant rounded-xl p-8 bg-surface">
              <div className="w-16 h-16 rounded-full bg-primary-container text-white flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[30px]">badge</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary">Demian Squiersky</h3>
              <p className="text-secondary font-label-caps text-[12px] tracking-wide mb-3">Fundador · Líder de producto</p>
              <p className="text-on-surface-variant text-[14px] leading-relaxed">
                Más de 10 años en real estate digital. Lideró producto en <strong>Zonaprop</strong> y <strong>QuintoAndar</strong>, los
                portales inmobiliarios líderes de Latinoamérica. Esa experiencia de portal, puesta al servicio de un análisis
                independiente de pozo.
              </p>
              <a href={LINKEDIN_LIDER} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 mt-4 text-[13px] text-secondary underline underline-offset-2 hover:no-underline">
                Perfil profesional en LinkedIn →
              </a>
            </div>
            {/* Disciplinas del equipo */}
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-gutter">
              {[
                ["insights", "Análisis de mercado", "Relevamos precio, brecha vs. usado y potencial de cada zona, proyecto por proyecto."],
                ["gavel", "Estructura legal", "Leemos la letra chica: fideicomiso, boleto, anticipo y las garantías que protegen al inversor."],
                ["query_stats", "Producto & datos", "Ordenamos la información dispersa del pozo en fichas comparables y verificables."],
                ["apartment", "Obra y desarrolladoras", "Seguimos el avance de obra y la trayectoria de entregas de cada desarrolladora."],
              ].map(([icon, t, d]) => (
                <div key={t} className="border border-outline-variant rounded-xl p-6">
                  <span className="material-symbols-outlined text-secondary text-[26px]">{icon}</span>
                  <h4 className="font-bold text-primary mt-2">{t}</h4>
                  <p className="text-on-surface-variant text-[14px] mt-1">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metodología */}
      <section className="py-24 bg-primary-container text-white">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-secondary-fixed font-label-caps tracking-widest block mb-4">
              METODOLOGÍA DE ANÁLISIS
            </span>
            <h2 className="font-display-lg text-display-lg">
              Analizamos cada proyecto con los mismos tres criterios.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">01</span>
              <h3 className="font-headline-sm text-headline-sm">Trayectoria y entregas</h3>
              <p className="text-on-primary-container">
                Revisamos el historial de la desarrolladora: obras entregadas, cumplimiento de plazos y estructura de fideicomiso.
              </p>
            </div>
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">02</span>
              <h3 className="font-headline-sm text-headline-sm">Estructura legal</h3>
              <p className="text-on-primary-container">
                Analizamos la letra chica: tipo de fideicomiso, boleto, anticipo y las garantías que protegen al inversor.
              </p>
            </div>
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">03</span>
              <h3 className="font-headline-sm text-headline-sm">Precio y brecha</h3>
              <p className="text-on-primary-container">
                Comparamos el precio por m² en pozo contra el terminado de la zona y mostramos la brecha real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compromiso */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-primary font-display-lg text-display-lg">
              Nuestro compromiso es tu decisión informada.
            </h2>
            <p className="text-on-surface-variant text-body-lg">
              No somos comercializadores. Nuestro modelo prioriza la transparencia: te damos las herramientas y los
              datos para que decidas vos, no para venderte un proyecto.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Comparación objetiva de desarrolladoras, precios y brecha pozo vs terminado.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Datos verificables, con fuente y fecha a la vista en cada ficha.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Sin comisiones ni posiciones a la venta: no cobramos por aparecer.</span>
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-2xl bg-primary-container p-10 text-center">
              <span className="material-symbols-outlined text-link-gold text-[56px] mb-4">gavel</span>
              <p className="text-white font-headline-sm text-headline-sm italic leading-snug">
                &laquo;La seguridad jurídica es el cimiento de cada análisis que publicamos.&raquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="bg-primary-container p-12 md:p-20 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-white font-display-lg text-display-lg mb-4">
                ¿Estás evaluando comprar en pozo?
              </h2>
              <p className="text-on-primary-container text-body-lg">
                Explorá el catálogo de proyectos analizados o escribinos si querés que sumemos uno.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap gap-4">
              <Button as={Link} variant="gold" href="/desarrollos-inmobiliarios/" className="inline-block px-8 py-4 font-bold shadow-xl">
                Ver proyectos
              </Button>
              <Link className="inline-block border border-white/40 text-white px-8 py-4 rounded font-bold hover:bg-white/10 transition-all" href="/contacto/">
                Contacto
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
              <span className="material-symbols-outlined icon-fill text-[200px]">apartment</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
import Link from "next/link";
import { getPageBySlug } from "../../lib/wp";
import { SITE } from "../../lib/constants";
import Button from "../_ui/Button";

export const metadata = {
  title: "Nosotros | Departamentos en Pozo",
  alternates: { canonical: `${SITE}/sobre-nosotros/` },
  description:
    "Análisis independiente de inversión en departamentos en pozo en CABA. Conocé nuestra metodología, criterios y por qué no somos una inmobiliaria.",
};

// Bloque de marca reutilizable (reemplaza los placeholders externos). Navy + bronce.
function Marca({ frase }) {
  return (
    <div className="aspect-[4/5] relative bg-primary-container rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center">
      <div className="text-center px-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl border-2 border-link-gold flex items-center justify-center">
          <span className="material-symbols-outlined text-link-gold text-[40px]">apartment</span>
        </div>
        {frase && <p className="text-white font-headline-sm text-headline-sm italic leading-snug">{frase}</p>}
      </div>
    </div>
  );
}

export default async function SobreNosotrosPage() {
  const page = await getPageBySlug("sobre-nosotros");
  const titulo = page?.title?.rendered || "Sobre nosotros";

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <header className="relative py-28 md:py-36 flex items-center overflow-hidden bg-primary-container">
        <div className="absolute inset-0 hero-gradient z-10" />
        <div className="relative z-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
          <div className="max-w-2xl">
            <span className="text-secondary-fixed font-label-caps tracking-[0.2em] mb-4 block">
              INDEPENDENCIA &amp; CRITERIO
            </span>
            <h1
              className="text-white font-display-lg text-display-lg mb-6 leading-tight"
              dangerouslySetInnerHTML={{ __html: titulo }}
            />
            <p className="text-on-primary-container font-body-lg text-body-lg max-w-xl">
              Somos un portal de análisis independiente de departamentos en pozo en CABA. No vendemos, no
              intermediamos y no cobramos comisión. Publicamos el dato que necesitás para decidir por vos mismo.
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {[
              ["46", "PROYECTOS ANALIZADOS"],
              ["9", "BARRIOS DE CABA"],
              ["+200", "DESARROLLADORAS RELEVADAS"],
              ["100%", "INDEPENDIENTE"],
            ].map(([n, l]) => (
              <div key={l} className="p-8 border border-outline-variant rounded-lg flex flex-col justify-center items-center text-center">
                <span className="text-secondary font-display-lg text-display-lg mb-2">{n}</span>
                <span className="font-label-caps text-on-surface-variant text-[12px]">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="py-24 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 w-full">
              <Marca frase="&laquo;El dato correcto, con su fuente, antes que el dato que conviene.&raquo;" />
            </div>
            <div className="flex-1 space-y-8">
              <span className="text-secondary font-label-caps tracking-widest">NUESTRO ADN</span>
              <h2 className="text-primary font-headline-md text-headline-md">
                Un portal de análisis, no una inmobiliaria más.
              </h2>
              <p className="text-on-surface-variant text-body-lg">
                Departamentos en Pozo nació para ordenar un mercado opaco: comparar desarrolladoras, precios por m²
                y potencial de cada proyecto, barrio por barrio, con datos verificables y fuente a la vista. No
                comercializamos unidades ni cobramos por aparecer. Si un dato no nos consta, lo dejamos en blanco
                antes que inventarlo.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container">verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Análisis independiente</h4>
                    <p className="text-on-surface-variant">
                      Evaluamos cada desarrollo con criterio propio, sin ataduras a ninguna marca ni comisión de por medio.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container">query_stats</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Foco en pozo y pre-construcción</h4>
                    <p className="text-on-surface-variant">
                      Especializados en la etapa temprana: fideicomiso, boleto, anticipo, ajuste CAC y la brecha frente al terminado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metodología */}
      <section className="py-24 bg-primary-container text-white">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-secondary-fixed font-label-caps tracking-widest block mb-4">
              METODOLOGÍA DE ANÁLISIS
            </span>
            <h2 className="font-display-lg text-display-lg">
              Analizamos cada proyecto con los mismos tres criterios.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">01</span>
              <h3 className="font-headline-sm text-headline-sm">Trayectoria y entregas</h3>
              <p className="text-on-primary-container">
                Revisamos el historial de la desarrolladora: obras entregadas, cumplimiento de plazos y estructura de fideicomiso.
              </p>
            </div>
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">02</span>
              <h3 className="font-headline-sm text-headline-sm">Estructura legal</h3>
              <p className="text-on-primary-container">
                Analizamos la letra chica: tipo de fideicomiso, boleto, anticipo y las garantías que protegen al inversor.
              </p>
            </div>
            <div className="space-y-4 border-l border-on-primary-container pl-6 py-4">
              <span className="text-link-gold font-display-lg opacity-30">03</span>
              <h3 className="font-headline-sm text-headline-sm">Precio y brecha</h3>
              <p className="text-on-primary-container">
                Comparamos el precio por m² en pozo contra el terminado de la zona y mostramos la brecha real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compromiso */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-primary font-display-lg text-display-lg">
              Nuestro compromiso es tu decisión informada.
            </h2>
            <p className="text-on-surface-variant text-body-lg">
              No somos comercializadores. Nuestro modelo prioriza la transparencia: te damos las herramientas y los
              datos para que decidas vos, no para venderte un proyecto.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Comparación objetiva de desarrolladoras, precios y brecha pozo vs terminado.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Datos verificables, con fuente y fecha a la vista en cada ficha.</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-link-gold">check_circle</span>
                <span>Sin comisiones ni posiciones a la venta: no cobramos por aparecer.</span>
              </li>
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-2xl bg-primary-container p-10 text-center">
              <span className="material-symbols-outlined text-link-gold text-[56px] mb-4">gavel</span>
              <p className="text-white font-headline-sm text-headline-sm italic leading-snug">
                &laquo;La seguridad jurídica es el cimiento de cada análisis que publicamos.&raquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-surface">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="bg-primary-container p-12 md:p-20 rounded-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-white font-display-lg text-display-lg mb-4">
                ¿Estás evaluando comprar en pozo?
              </h2>
              <p className="text-on-primary-container text-body-lg">
                Explorá el catálogo de proyectos analizados o escribinos si querés que sumemos uno.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap gap-4">
              <Button as={Link} variant="gold" href="/desarrollos-inmobiliarios/" className="inline-block px-8 py-4 font-bold shadow-xl">
                Ver proyectos
              </Button>
              <Link className="inline-block border border-white/40 text-white px-8 py-4 rounded font-bold hover:bg-white/10 transition-all" href="/contacto/">
                Contacto
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
              <span className="material-symbols-outlined icon-fill text-[200px]">apartment</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
