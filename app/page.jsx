import Link from "next/link";
import { getDestacados, featuredImage, acf } from "../lib/wp";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCm7wX467tQZzCnTZFh1bq2QB_-QgICYRg6SajKGUOCcTPQBZNAaFWdTBuLiwg6wlBqotlt40BBjgfjNRdUkMxl2OIgytOQ7pmoJ6ZZukdW10mpZwZiybVWqKGy0UaPiJBcRjvwtoIetg0Owjwx-iOCidVsqKP81usEoMPj0_l4JyZACIKIE_NzgHvVn43cjIRqObxowuaOtGOSYG87fiAWJ2kqD1IGe_6rT8IH-OOiqv614ufMIdNrWw";

const BARRIOS = [
  { name: "Palermo", proyectos: "12 Proyectos", href: "/desarrolladoras-inmobiliarias-en-palermo/" },
  { name: "Recoleta", proyectos: "5 Proyectos", href: "/desarrolladoras-inmobiliarias-en-recoleta/" },
  { name: "Puerto Madero", proyectos: "3 Proyectos", href: "/desarrolladoras-inmobiliarias-en-puerto-madero/" },
  { name: "Belgrano", proyectos: "8 Proyectos", href: "/desarrolladoras-inmobiliarias-en-belgrano/" },
];

function price(node) {
  const p = acf(node, "precio_desde");
  if (!p) return "Consultar";
  const num = Number(String(p).replace(/[^\d]/g, ""));
  return num ? `USD ${num.toLocaleString("es-AR")}` : String(p);
}

export default async function HomePage() {
  let destacados = [];
  try { destacados = await getDestacados(); } catch (e) { destacados = []; }

  return (
    <>
      {/* Hero */}
      <section className="relative h-[751px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${HERO_IMG}')` }} />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative z-10 w-full max-w-container-max px-margin-mobile md:px-margin-desktop text-center md:text-left">
          <span className="inline-block text-link-gold font-bold tracking-widest uppercase mb-4 text-label-caps font-label-caps">
            Desarrollos inmobiliarios en pozo · CABA y GBA
          </span>
          <h1 className="text-on-primary font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg max-w-3xl mb-12">
            Encontrá tu departamento en pozo en Buenos Aires
          </h1>
          {/* Search Box */}
          <form action="/desarrollos-inmobiliarios/" className="bg-surface p-6 md:p-8 rounded shadow-2xl max-w-4xl flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:flex-1 space-y-2">
              <label className="text-on-surface-variant font-label-caps text-label-caps uppercase">Barrio</label>
              <select name="barrio" className="w-full border-outline-variant rounded p-3 text-on-surface focus:ring-2 focus:ring-link-gold focus:border-primary-container outline-none appearance-none bg-white">
                <option value="">Todos los barrios</option>
                <option>Palermo</option><option>Caballito</option><option>Belgrano</option>
                <option>Núñez</option><option>Puerto Madero</option><option>Recoleta</option>
              </select>
            </div>
            <div className="w-full md:flex-1 space-y-2">
              <label className="text-on-surface-variant font-label-caps text-label-caps uppercase">Etapa de obra</label>
              <select name="etapa" className="w-full border-outline-variant rounded p-3 text-on-surface focus:ring-2 focus:ring-link-gold focus:border-primary-container outline-none appearance-none bg-white">
                <option value="">Cualquier etapa</option>
                <option>Lanzamiento</option><option>En construcción</option><option>Terminado</option>
              </select>
            </div>
            <button className="w-full md:w-auto bg-link-gold text-primary-container font-bold px-8 py-4 rounded hover:brightness-110 transition-all flex items-center justify-center gap-2 font-label-caps">
              <span className="material-symbols-outlined">search</span> BUSCAR PROYECTOS
            </button>
          </form>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary-container py-6 md:py-8 border-y border-on-primary-fixed-variant">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ["analytics", "25+ PROYECTOS ANALIZADOS"],
            ["location_city", "9 BARRIOS DE CABA"],
            ["verified", "ANÁLISIS INDEPENDIENTE"],
            ["savings", "SIN COSTO PARA EL COMPRADOR"],
          ].map(([ic, txt]) => (
            <div key={txt} className="flex items-center gap-3 text-on-primary">
              <span className="material-symbols-outlined text-link-gold">{ic}</span>
              <p className="text-label-caps font-label-caps">{txt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proyectos Destacados (datos reales de WP) */}
      <section className="py-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Proyectos destacados</h2>
            <p className="text-on-surface-variant max-w-xl text-body-lg font-body-lg">
              Selección exclusiva de las mejores oportunidades de inversión en pozo con respaldo de desarrolladoras consolidadas.
            </p>
          </div>
          <Link className="text-link-gold font-bold flex items-center gap-2 hover:underline font-label-caps" href="/desarrollos-inmobiliarios/">
            VER TODOS LOS PROYECTOS <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {destacados.slice(0, 3).map((d) => {
            const img = featuredImage(d);
            const barrio = acf(d, "barrio") || "CABA";
            const dir = acf(d, "direccion") || "";
            const title = (d.title?.rendered || "").replace(/&amp;/g, "&");
            return (
              <Link key={d.id} href={`/desarrollos-inmobiliarios/${d.slug}/`} className="bg-surface group cursor-pointer border border-outline-variant rounded overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {img ? <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={img} alt={title} /> : <div className="w-full h-full bg-surface-container" />}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-primary-container text-on-primary text-[10px] font-bold px-3 py-1 tracking-widest rounded uppercase font-label-caps">En Pozo</span>
                    <span className="bg-surface/90 text-primary text-[10px] font-bold px-3 py-1 tracking-widest rounded backdrop-blur uppercase font-label-caps">{barrio}</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary" dangerouslySetInnerHTML={{ __html: title }} />
                    <p className="text-on-surface-variant font-body-md text-body-md">{dir}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
                    <div>
                      <p className="text-on-surface-variant text-[12px] uppercase font-label-caps">Desde</p>
                      <p className="font-bold text-xl text-primary font-headline-sm">{price(d)}</p>
                    </div>
                    <span className="text-link-gold font-bold group-hover:translate-x-2 transition-transform duration-300 font-label-caps">VER PROYECTO →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Explorá por barrio */}
      <section className="py-20 bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <h2 className="font-headline-md text-headline-md text-primary mb-12 text-center">Explorá por barrio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {BARRIOS.map((b) => (
              <Link key={b.name} href={b.href} className="relative group h-48 md:h-64 rounded overflow-hidden cursor-pointer block">
                <div className="absolute inset-0 bg-primary-container" />
                <div className="absolute inset-0 bg-primary-container/40 group-hover:bg-primary-container/20 transition-all duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-on-primary">
                  <h4 className="font-headline-sm text-headline-sm">{b.name}</h4>
                  <p className="text-label-caps font-label-caps opacity-80 uppercase">{b.proyectos}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
          {[
            ["verified_user", "Análisis independiente", "No somos inmobiliaria. Evaluamos proyectos basándonos en datos y track record real."],
            ["apartment", "Desarrolladoras reales", "Solo listamos empresas con obras finalizadas y solidez financiera comprobada."],
            ["map", "Cobertura total", "Exploramos cada rincón de CABA y GBA para traerte las mejores oportunidades del mercado."],
            ["currency_exchange", "Sin costo adicional", "Nuestro análisis es informativo y sin costo para el inversor final."],
          ].map(([ic, h, p]) => (
            <div key={h} className="space-y-4">
              <span className="material-symbols-outlined text-4xl text-link-gold">{ic}</span>
              <h3 className="font-headline-sm text-headline-sm text-primary">{h}</h3>
              <p className="text-on-surface-variant text-body-md font-body-md leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
