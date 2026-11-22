// /inmobiliarias-que-venden-proyectos-en-pozo/ — Comercializadoras de proyectos en pozo/en construcción,
// rankeadas por cantidad de proyectos que venden (dato propio). Ataca "inmobiliaria de proyectos en construcción".
import Link from "next/link";
import Container from "../_ui/Container";
import JsonLd from "../_ui/JsonLd";
import Faq from "../_ui/Faq";
import { SITE } from "../../lib/wp";
import { inmobiliariaSlugPorNombre } from "../../lib/content";
import { sellosInmoDeNombre } from "../../lib/sellos";
import { catalogoConSellos, mesAnio } from "../../lib/statsPozo";

export const revalidate = 86400;
const URL = `${SITE}/inmobiliarias-que-venden-proyectos-en-pozo/`;
const limpia = (s) => String(s || "").replace(/\(.*?\)/g, "").replace(/^com\.?\s*/i, "").trim();

async function ranking() {
  const items = await catalogoConSellos();
  const m = new Map();
  for (const i of items) {
    const c = limpia(i.comercializadora);
    if (!c || c.length < 3) continue;
    const k = c.toLowerCase();
    if (!m.has(k)) m.set(k, { nombre: c, n: 0, barrios: {} });
    const r = m.get(k); r.n++; if (i.barrio) r.barrios[i.barrio] = (r.barrios[i.barrio] || 0) + 1;
  }
  const lista = [...m.values()].filter((r) => r.n >= 2).sort((a, b) => b.n - a.n).slice(0, 60);
  for (const r of lista) {
    try { r.slug = await inmobiliariaSlugPorNombre(r.nombre); } catch (e) { r.slug = null; }
    const s = sellosInmoDeNombre(r.nombre);
    r.matricula = !!(s && (s.sellos || []).some((x) => x.tipo === "matricula"));
    r.topBarrios = Object.entries(r.barrios).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b]) => b);
  }
  return { lista, total: items.length };
}

export async function generateMetadata() {
  const { lista } = await ranking();
  return {
    title: { absolute: `Inmobiliarias que Venden Proyectos en Pozo en CABA (${new Date().getFullYear()})` },
    description: `Las ${lista.length} inmobiliarias que más proyectos en pozo y en construcción comercializan en CABA y GBA: cuántos venden, en qué barrios y matrícula verificada.`,
    alternates: { canonical: URL },
  };
}

export default async function ComercializadorasPage() {
  const { lista } = await ranking();
  const mes = mesAnio();
  const faq = [
    ["¿Qué inmobiliarias venden departamentos en pozo?", `Según nuestro catálogo (${mes}), las comercializadoras con más proyectos en pozo activos son ${lista.slice(0, 5).map((r) => r.nombre).join(", ")}. La tabla muestra cuántos proyectos vende cada una y en qué barrios.`],
    ["¿El comprador paga comisión al comprar en pozo?", "Depende del proyecto. En muchos emprendimientos la comisión la absorbe la desarrolladora; en otros el comprador paga honorarios a la inmobiliaria. Preguntalo antes de reservar y pedilo por escrito."],
    ["¿Conviene comprar directo a la desarrolladora o por inmobiliaria?", "El precio suele ser el mismo. La inmobiliaria comercializadora suele tener la información de disponibilidad, planos y formas de pago al día; lo importante es verificar su matrícula y la trayectoria de la desarrolladora."],
    ["¿Qué es una comercializadora de proyectos en pozo?", "Es la inmobiliaria que la desarrolladora elige para vender las unidades de un emprendimiento: gestiona consultas, reservas y boletos. No construye: la responsabilidad de la obra es de la desarrolladora."],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "ItemList", name: "Inmobiliarias que venden proyectos en pozo",
      itemListElement: lista.slice(0, 30).map((r, k) => ({ "@type": "ListItem", position: k + 1, name: r.nombre, ...(r.slug ? { url: `${SITE}/inmobiliaria/${r.slug}/` } : {}) })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];

  return (
    <Container as="main" className="py-10 md:py-14 max-w-5xl">
      <JsonLd data={schema} />
      <p className="font-label-caps text-label-caps text-link-gold uppercase tracking-widest">Comercializadoras · {mes}</p>
      <h1 className="font-headline-md text-headline-md text-primary mt-2">Inmobiliarias que venden proyectos en pozo y en construcción en CABA</h1>
      <div className="mt-6 border-l-4 border-link-gold bg-surface-container-low p-5 rounded-r-xl">
        <p className="text-body-lg text-primary"><strong>Respuesta rápida:</strong> {lista.length} inmobiliarias comercializan 2 o más proyectos en pozo de nuestro catálogo. Las que más venden hoy: {lista.slice(0, 3).map((r) => `${r.nombre} (${r.n})`).join(", ")}. Comprar por la comercializadora o directo a la desarrolladora suele tener el mismo precio.</p>
      </div>

      <div className="overflow-x-auto border border-outline-variant rounded-xl mt-8">
        <table className="w-full text-[14px]">
          <thead className="bg-surface-container-low text-on-surface-variant"><tr>{["#", "Inmobiliaria", "Proyectos en pozo", "Barrios principales", "Matrícula"].map((h) => <th key={h} className="text-left font-medium px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {lista.map((r, k) => (
              <tr key={r.nombre} className="border-t border-outline-variant">
                <td className="px-3 py-2 text-on-surface-variant">{k + 1}</td>
                <td className="px-3 py-2">{r.slug ? <Link href={`/inmobiliaria/${r.slug}/`} className="text-primary font-medium hover:underline">{r.nombre}</Link> : <span className="text-primary font-medium">{r.nombre}</span>}</td>
                <td className="px-3 py-2 font-semibold">{r.n}</td>
                <td className="px-3 py-2 text-on-surface-variant">{r.topBarrios.join(", ")}</td>
                <td className="px-3 py-2">{r.matricula ? <span className="text-link-gold font-medium">✓ Verificada</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12.5px] text-on-surface-variant mt-2">Fuente: comercializadora informada en cada ficha activa. Matrícula verificada en el padrón CUCICBA. Actualizado {mes}.</p>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {[["Mejores inmobiliarias de CABA", "/mejores-inmobiliarias-caba/"], ["Desarrolladoras y constructoras en CABA", "/desarrolladoras-inmobiliarias-en-capital-federal/"], ["¿Sos inmobiliaria? Publicá tus proyectos", "/soy-inmobiliaria/"]].map(([t, h]) => (
          <Link key={h} href={h} className="block rounded-xl border border-outline-variant p-4 hover:border-link-gold font-semibold text-primary">{t} →</Link>
        ))}
      </div>
      <Faq items={faq} title="Preguntas frecuentes" />
    </Container>
  );
}
