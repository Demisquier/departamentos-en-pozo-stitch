import Link from "next/link";
import { getDesarrollos, featuredImage, acf } from "../lib/wp";

export const revalidate = 600;

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCm7wX467tQZzCnTZFh1bq2QB_-QgICYRg6SajKGUOCcTPQBZNAaFWdTBuLiwg6wlBqotlt40BBjgfjNRdUkMxl2OIgytOQ7pmoJ6ZZukdW10mpZwZiybVWqKGy0UaPiJBcRjvwtoIetg0Owjwx-iOCidVsqKP81usEoMPj0_l4JyZACIKIE_NzgHvVn43cjIRqObxowuaOtGOSYG87fiAWJ2kqD1IGe_6rT8IH-OOiqv614ufMIdNrWw";

// Barrios con página de desarrolladoras (para las tiles).
const BARRIO_PAGE = {
  Palermo: "/desarrolladoras-inmobiliarias-en-palermo/",
  Belgrano: "/desarrolladoras-inmobiliarias-en-belgrano/",
  Caballito: "/desarrolladoras-inmobiliarias-en-caballito/",
  "Núñez": "/desarrolladoras-inmobiliarias-en-nunez/",
  "Puerto Madero": "/desarrolladoras-inmobiliarias-en-puerto-madero/",
};
const BARRIO_ORDEN = ["Palermo", "Caballito", "Belgrano", "Puerto Madero", "Núñez"];

function num(v) {
  if (v == null) return null;
  const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

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
              <label className="text-on-surface-variant font-label-caps text-label-caps uppercase">Barrio</label>
              <select name="barrio" className="w-full border border-outline-variant rounded p-3 text-on-surface outline-none appearance-none bg-white">
                <option value="">Todos los barrios</option>
                <option>Palermo</option><option>Caballito</option><option>Belgrano</option>
                <option>Núñez</option><option>Puerto Madero</option><option>Villa Urquiza</option><option>Colegiales</option>
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
        </div>
      </section>

      {/* Proyectos Destacados */}
      <section className="py-16 md:py-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Proyectos destacados</h2>
            <p className="text-on-surface-variant max-w-xl text-body-lg font-body-lg">
              Una selección de oportunidades en pozo con precio de referencia, desarrolladora y ubicación.
            </p>
          </div>
          <Link className="text-link-gold font-bold flex items-center gap-2 hover:underline font-label-caps whitespace-nowrap" href="/desarrollos-inmobiliarios/">
            VER TODOS <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {destacados.map((d) => (
            <Link key={d.slug} href={`/desarrollos-inmobiliarios/${d.slug}/`} className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
                {d.img ? (
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={d.img} alt={`${d.nombre} — ${d.barrio}`} loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-outline-variant text-4xl">image</span></div>
                )}
                <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">EN POZO</span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="serif text-headline-sm text-primary leading-tight">{d.nombre}</h3>
                <p className="text-on-surface-variant text-[13px] flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>{d.barrio}
                </p>
                <div className="mt-4 pt-4 border-t border-outline-variant flex items-end justify-between">
                  <div>
                    <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant block">DESDE</span>
                    {d.precio ? (
                      <span className="text-primary font-headline-sm text-headline-sm">USD {d.precio.toLocaleString("es-AR")}<span className="text-[13px] text-on-surface-variant"> /m²</span></span>
                    ) : (
                      <span className="text-on-surface-variant font-headline-sm text-headline-sm">Consultar</span>
                    )}
                  </div>
                  <span className="text-link-gold font-label-caps text-[11px] tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">VER <span className="material-symbols-outlined text-[16px]">arrow_forward</span></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Explorá por barrio */}
      <section className="py-16 md:py-20 bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
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
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 md:py-24 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
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
      </section>
    </>
  );
}
