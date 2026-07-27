import Link from "next/link";
import { getDesarrollos, featuredImage, acf } from "../lib/wp";
import { BARRIO_PAGE, BARRIO_ORDEN } from "../lib/barrios";
import { toNumber as num } from "../lib/format";
import { SITE } from "../lib/constants";
import Container from "./_ui/Container";
import ProjectCard from "./_ui/ProjectCard";

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

  // Tiles por barrio: conteo real + imagen representativa.
  const tiles = BARRIO_ORDEN.map((b) => {
    const enBarrio = mapped.filter((m) => m.topBarrio === b);
    const conImg = enBarrio.find((m) => m.img);
    return { name: b, count: enBarrio.length, href: BARRIO_PAGE[b], img: conImg ? conImg.img : null };
  }).filter((t) => t.count > 0);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[620px] md:h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${HERO_IMG}')` }} />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative z-10 w-full max-w-container-max px-margin-mobile md:px-margin-desktop text-center md:text-left">
          <span className="inline-block text-link-gold font-bold tracking-widest uppercase mb-4 text-label-caps font-label-caps">
            Análisis independiente · {mapped.length} proyectos en pozo · CABA
          </span>
          <h1 className="text-on-primary font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-3xl mb-10">
            Encontrá tu departamento en pozo en Buenos Aires
          </h1>
          <form action="/desarrollos-inmobiliarios/" className="bg-surface p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:flex-1 space-y-2">
              <label htmlFor="hero-barrio" className="text-on-surface-variant font-label-caps text-label-caps uppercase">Barrio</label>
              <select id="hero-barrio" name="barrio" aria-label="Elegir barrio" className="w-full border border-outline-variant rounded p-3 text-on-surface outline-none appearance-none bg-white">
                <option value="">Todos los barrios</option>
                <option>Palermo</option><option>Caballito</option><option>Belgrano</option>
                <option>Núñez</option><option>Puerto Madero</option><option>Villa Urquiza</option><option>Colegiales</option>
              </select>
            </div>
            <button className="w-full md:w-auto bg-primary-container text-on-primary font-bold px-8 py-4 rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 font-label-caps">
              <span className="material-symbols-outlined">search</span> BUSCAR PROYECTOS
            </button>
          </form>
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

      {/* Explorá por barrio */}
      <section className="py-16 md:py-20 bg-surface-container-low">
        <Container>
          <h2 className="font-headline-md text-headline-md text-primary mb-10 text-center">Explorá por barrio</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {tiles.map((b) => (
              <Link key={b.name} href={b.href} className="relative group h-44 md:h-56 rounded-xl overflow-hidden block">
                {b.img ? (
                  <img src={b.img} alt={b.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
