import Link from "next/link";
import { getDesarrollos, featuredImage, acf } from "../lib/wp";
import { BARRIO_PAGE, BARRIO_ORDEN, BARRIO_CATALOGO, matchBarrioCatalogo } from "../lib/barrios";
import { toNumber as num } from "../lib/format";
import { SITE, BRAND, LOGO_URL, CONTACT_EMAIL } from "../lib/constants";
import Container from "./_ui/Container";
import ProjectCard from "./_ui/ProjectCard";
import HomeBuscador from "./_ui/HomeBuscador";
import JsonLd from "./_ui/JsonLd";
import MiPlanHome from "./_components/MiPlanHome";

// Schema de ENTIDAD para el home: consolida "Departamentos en Pozo" como Organization/WebSite
// (ancla a la que apunta cada publisher del resto del sitio) — clave para Google y buscadores IA.
const ENTITY_SCHEMA = [
  {
    "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE}/#organization`,
    name: BRAND, url: `${SITE}/`,
    logo: { "@type": "ImageObject", url: LOGO_URL },
    description: "Portal de análisis independiente de inversión en departamentos en pozo (preventa) en CABA y GBA: directorio de desarrolladoras, proyectos, precios por m² y guías.",
    contactPoint: { "@type": "ContactPoint", email: CONTACT_EMAIL, contactType: "customer support", areaServed: "AR", availableLanguage: "Spanish" },
  },
  {
    "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE}/#website`,
    name: BRAND, url: `${SITE}/`, inLanguage: "es-AR",
    publisher: { "@id": `${SITE}/#organization` },
  },
];

export const revalidate = 600;

// Metadata propia de la home (antes heredaba el título genérico del layout).
export const metadata = {
  title: "Invertir en Departamentos en Pozo 2026: Análisis Independiente CABA y GBA | Departamentos en Pozo",
  description:
    "Portal de análisis independiente de inversión en departamentos en pozo (preventa) en CABA y GBA: directorio de desarrolladoras, proyectos, precios por m² y guías para invertir con criterio.",
  alternates: { canonical: `${SITE}/` },
  openGraph: {
    type: "website",
    title: "Invertir en Departamentos en Pozo 2026: Análisis Independiente CABA y GBA",
    description:
      "Directorio de desarrolladoras, proyectos en pozo, precios por m² y guías. Análisis independiente para inversores.",
    url: `${SITE}/`,
    siteName: "Departamentos en Pozo",
    locale: "es_AR",
  },
};

// Imagen real del sitio (antes era un placeholder de Stitch en lh3.googleusercontent).
const HERO_IMG = "/wp-content/uploads/2026/05/emprendimientos-pozo-ba-hero.jpg";

export default async function HomePage() {
  let items = [];
  try { items = await getDesarrollos(); } catch (e) { items = []; }

  const mapped = (items || []).map((node) => {
    const t = (node.title?.rendered || "Proyecto").replace(/&amp;/g, "&");
    const nombre = t.split("—")[0].trim() || t;
    const barrio = (t.split("—")[1] || "").trim();
    const topBarrio = barrio.startsWith("Palermo") ? "Palermo" : barrio;
    return { slug: node.slug, nombre, barrio, topBarrio, precio: num(acf(node, "precio_m2")), img: featuredImage(node) };
  });

  // Destacados: con imagen y precio, variados por barrio, de mayor a menor precio.
  const destacados = [];
  const usados = new Set();
  for (const m of mapped.filter((x) => x.img && x.precio).sort((a, b) => b.precio - a.precio)) {
    if (usados.has(m.topBarrio)) continue;
    usados.add(m.topBarrio);
    destacados.push(m);
    if (destacados.length === 3) break;
  }
  while (destacados.length < 3) {
    const extra = mapped.find((x) => x.img && !destacados.includes(x));
    if (!extra) break;
    destacados.push(extra);
  }

  // Tiles "Desarrolladoras por barrio": links a los directorios de desarrolladoras por barrio.
  const tiles = BARRIO_ORDEN.map((b) => {
    const enBarrio = mapped.filter((m) => m.topBarrio === b);
    const conImg = enBarrio.find((m) => m.img);
    return { name: b, count: enBarrio.length, href: BARRIO_PAGE[b], img: conImg ? conImg.img : null };
  }).filter((t) => t.count > 0);

  // Tiles "Desarrollos por barrio": links a las landings de CATÁLOGO por barrio
  // (/desarrollos-inmobiliarios-en-{slug}/). Solo barrios con >=3 proyectos.
  const catTiles = Object.keys(BARRIO_CATALOGO).map((k) => {
    const en = mapped.filter((m) => matchBarrioCatalogo(m.barrio, k));
    const conImg = en.find((m) => m.img);
    return { slug: k, name: BARRIO_CATALOGO[k].label, count: en.length, img: conImg ? conImg.img : null };
  }).filter((t) => t.count >= 3).sort((a, b) => b.count - a.count);

  return (
    <>
      <JsonLd data={ENTITY_SCHEMA} />
      {/* Preload del hero: arranca la descarga de la imagen LCP lo antes posible. */}
      <link rel="preload" as="image" href={HERO_IMG} fetchPriority="high" />
      {/* Hero */}
      <section className="relative h-[620px] md:h-[700px] flex items-center justify-center overflow-hidden">
        {/* Imagen LCP como <img> (no background-image): descubrible por el navegador y
            priorizable con fetchPriority. Antes tardaba ~12 s en pintar. */}
        <img src={HERO_IMG} alt="" aria-hidden="true" fetchPriority="high" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative z-10 w-full max-w-container-max px-margin-mobile md:px-margin-desktop text-center md:text-left">
          <span className="inline-block text-link-gold font-bold tracking-widest uppercase mb-4 text-label-caps font-label-caps">
            Análisis independiente · {mapped.length} proyectos en pozo · CABA y GBA
          </span>
          <h1 className="text-on-primary font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-3xl mb-10">
            Encontrá tu departamento en pozo en Buenos Aires
          </h1>
          <HomeBuscador />
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <Link href="/asesor/" className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary text-white px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">forum</span> Averiguá precio y cuota
            </Link>
            <span className="text-on-primary text-[13px] opacity-90">Te ayudamos a elegir, sin costo.</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary-container py-6 md:py-8 border-y border-on-primary-fixed-variant">
        <Container className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ["analytics", `${mapped.length} PROYECTOS RELEVADOS`],
            ["location_city", `${tiles.length}+ BARRIOS DE CABA`],
            ["verified", "ANÁLISIS INDEPENDIENTE"],
            ["savings", "SIN COSTO PARA EL COMPRADOR"],
          ].map(([ic, txt]) => (
            <div key={txt} className="flex items-center gap-3 text-on-primary">
              <span className="material-symbols-outlined text-link-gold">{ic}</span>
              <p className="text-label-caps font-label-caps">{txt}</p>
            </div>
          ))}
        </Container>
      </section>

      <MiPlanHome />

      {/* Proyectos Destacados */}
      <Container as="section" className="py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Proyectos destacados</h2>
            <p className="text-on-surface-variant max-w-xl text-body-lg font-body-lg">
              Una selección de oportunidades en pozo con precio de referencia, desarrolladora y ubicación.
            </p>
          </div>
          <Link className="text-secondary font-bold flex items-center gap-2 hover:underline font-label-caps whitespace-nowrap" href="/desarrollos-inmobiliarios/">
            VER TODOS <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {destacados.map((d) => (
            <ProjectCard key={d.slug} slug={d.slug} nombre={d.nombre} barrio={d.barrio} precio={d.precio} img={d.img} />
          ))}
        </div>
      </Container>


      {/* Desarrollos por barrio: catálogo de PROYECTOS por barrio */}
      <section className="py-16 md:py-20 bg-surface-container-low">
        <Container>
          <h2 className="font-headline-md text-headline-md text-primary mb-2 text-center">Desarrollos por barrio</h2>
          <p className="text-on-surface-variant text-center max-w-2xl mx-auto mb-10 text-body-lg font-body-lg">
            Explorá el catálogo de proyectos en pozo barrio por barrio, con precio, desarrolladora y entrega.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {catTiles.map((b) => (
              <Link key={b.slug} href={`/desarrollos-inmobiliarios-en-${b.slug}/`} className="relative group h-44 md:h-56 rounded-xl overflow-hidden block">
                {b.img ? (
                  <img src={b.img} alt={b.name} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-primary-container" />
                )}
                <div className="absolute inset-0 bg-primary/55 group-hover:bg-primary/40 transition-all duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-2">
                  <h4 className="font-headline-sm text-headline-sm">{b.name}</h4>
                  <p className="text-label-caps font-label-caps opacity-90 uppercase text-[11px]">{b.count} {b.count === 1 ? "proyecto" : "proyectos"}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Desarrolladoras por barrio: directorios de EMPRESAS por barrio */}
      <section className="py-16 md:py-20">
        <Container>
          <h2 className="font-headline-md text-headline-md text-primary mb-2 text-center">Desarrolladoras por barrio</h2>
          <p className="text-on-surface-variant text-center max-w-2xl mx-auto mb-10 text-body-lg font-body-lg">
            Directorio de las desarrolladoras con obra en cada barrio, para revisar quién construye antes de comprar.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {tiles.map((b) => (
              <Link key={b.name} href={b.href} className="relative group h-44 md:h-56 rounded-xl overflow-hidden block">
                {b.img ? (
                  <img src={b.img} alt={b.name} loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-primary-container" />
                )}
                <div className="absolute inset-0 bg-primary/55 group-hover:bg-primary/40 transition-all duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-2">
                  <h4 className="font-headline-sm text-headline-sm">{b.name}</h4>
                  <p className="text-label-caps font-label-caps opacity-90 uppercase text-[11px]">Ver desarrolladoras</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Herramientas y directorios */}
      <section id="herramientas" className="py-16 md:py-20 scroll-mt-24">
        <Container>
          <h2 className="font-headline-md text-headline-md text-primary mb-2 text-center">Herramientas y directorios</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-center mb-10 text-body-lg">
            Recursos independientes para decidir con criterio: simulá tu cuota, recibí alertas de lanzamientos y encontrá proveedores verificados.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              ["calculate", "Simulador de cuota CAC", "Proyectá cómo evoluciona tu cuota si ajusta por índice de construcción.", "/simulador-cuota-cac-pozo/"],
              ["notifications_active", "Alertas de lanzamientos", "Te avisamos por email cuando aparece un proyecto que encaja con tu búsqueda.", "/alertas-de-lanzamientos-en-pozo/"],
              ["storefront", "Corralones y materiales", "Directorio de corralones, homecenters y fabricantes para tu obra.", "/corralones-y-materiales-de-construccion-en-caba/"],
              ["domain", "Desarrolladoras en CABA", "Directorio de desarrolladoras con proyectos y track record.", "/desarrolladoras-inmobiliarias-en-capital-federal/"],
              ["real_estate_agent", "Inmobiliarias en CABA", "Directorio de inmobiliarias con matrícula CUCICBA verificable.", "/mejores-inmobiliarias-caba/"],
              ["menu_book", "Guías para invertir", "Todo lo que necesitás entender antes de comprar en pozo.", "/novedades/"],
            ].map(([ic, h, p, href]) => (
              <Link key={href} href={href} className="group block border border-outline-variant rounded-xl p-6 hover:border-secondary transition-colors">
                <span className="material-symbols-outlined text-3xl text-link-gold">{ic}</span>
                <h3 className="font-headline-sm text-[19px] text-primary mt-3 group-hover:text-secondary transition-colors flex items-center gap-2">
                  {h}
                  <span className="material-symbols-outlined text-[18px] opacity-60 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </h3>
                <p className="text-on-surface-variant text-body-md mt-1.5 leading-relaxed">{p}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Value Props */}
      <Container as="section" className="py-20 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          {[
            ["verified_user", "Análisis independiente", "No somos inmobiliaria. Evaluamos proyectos con datos y track record real."],
            ["apartment", "Desarrolladoras reales", "Priorizamos empresas con obras finalizadas y solidez comprobada."],
            ["map", "Cobertura CABA", "Relevamos barrio por barrio para traerte las mejores oportunidades."],
            ["currency_exchange", "Sin costo adicional", "Nuestro análisis es informativo y sin costo para el inversor final."],
          ].map(([ic, h, p]) => (
            <div key={h} className="space-y-3">
              <span className="material-symbols-outlined text-4xl text-link-gold">{ic}</span>
              <h3 className="font-headline-sm text-headline-sm text-primary">{h}</h3>
              <p className="text-on-surface-variant text-body-md font-body-md leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
