import { getDesarrollos, featuredImage, acf, SITE } from '../../lib/wp';
import CatalogoFiltros from './CatalogoFiltros';

// ISR: la lista se regenera sola con los datos de WP (además del revalidate del fetch).
export const revalidate = 600;

export const metadata = {
  title: 'Departamentos en pozo en CABA: 46 proyectos | Departamentos en Pozo',
  description:
    'Catálogo de departamentos en pozo (preventa) en CABA: precio por m², desarrolladora, tipologías, avance y entrega. Compará proyectos por barrio con análisis independiente.',
  alternates: { canonical: `${SITE}/desarrollos-inmobiliarios/` },
};

function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}
// fecha_entrega "20270901" -> "09/2027"
function fmtFecha(v) {
  const s = String(v || '');
  if (/^\d{8}$/.test(s)) return `${s.slice(4, 6)}/${s.slice(0, 4)}`;
  return v ? String(v) : '';
}
// tipologias ["1_ambiente","2_ambientes","4_mas"] -> "1, 2, 4+ amb" + array de nums
function tipologias(v) {
  if (!v) return { label: '', nums: [] };
  const arr = Array.isArray(v) ? v : String(v).split(',');
  const map = { '1_ambiente': '1', '2_ambientes': '2', '3_ambientes': '3', '4_ambientes': '4', '4_mas': '4+', '5_mas': '5+' };
  const nums = arr.map((x) => map[String(x).trim()] || String(x).replace(/_/g, ' ').trim()).filter(Boolean);
  return { label: nums.length ? nums.join(', ') + ' amb' : '', nums };
}
function acfAny(node, keys) {
  for (const k of keys) {
    const val = acf(node, k);
    if (val != null && String(val).trim() !== '') return val;
  }
  return null;
}

export default async function CatalogoPage() {
  const items = await getDesarrollos();

  const mapped = (items || []).map((node) => {
    const tituloRaw = node.title?.rendered || 'Proyecto';
    const nombre = tituloRaw.split('—')[0].trim() || tituloRaw;
    // El barrio confiable viene del título ("Nombre — Barrio"); fallback a ACF/meta.
    const barrio = (tituloRaw.split('—')[1] || '').trim() || acfAny(node, ['barrio', 'pozo_barrio']) || '';
    const direccion = acfAny(node, ['direccion']) || '';

    const precioNum = toNumber(acfAny(node, ['precio_m2', 'precio_desde']));
    const tip = tipologias(acfAny(node, ['tipologias', 'ambientes']));
    const entrega = fmtFecha(acfAny(node, ['fecha_entrega', 'entrega']));
    const desarrolladora = acfAny(node, ['desarrolladora', 'constructora']) || '';
    const etapaRaw = acfAny(node, ['estado_obra', 'obra', 'pozo_estado']) || '';
    const etapa = /construc/i.test(String(etapaRaw)) ? 'En construcción' : 'En pozo';

    return {
      slug: node.slug,
      nombre,
      barrio,
      direccion,
      precio: precioNum,
      precioLabel: precioNum ? `USD ${precioNum.toLocaleString('es-AR')}` : 'Consultar',
      ambientes: tip.label,
      ambientesNums: tip.nums,
      entrega,
      desarrolladora,
      etapa,
      imagen: featuredImage(node),
    };
  });

  // Orden base: los que tienen precio y render primero (fichas más completas arriba).
  mapped.sort((a, b) => (Number(!!b.imagen) - Number(!!a.imagen)) || (Number(b.precio != null) - Number(a.precio != null)));

  // Schema ItemList (SEO): lista de todos los proyectos con URL, imagen y precio si existe.
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Departamentos en pozo en CABA',
    numberOfItems: mapped.length,
    itemListElement: mapped.map((i, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE}/desarrollos-inmobiliarios/${i.slug}/`,
      name: i.nombre,
    })),
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <div className="mb-8">
        <h1 className="font-headline-md text-headline-md md:text-display-lg serif text-primary max-w-2xl leading-tight">
          Departamentos en pozo en CABA: {mapped.length} proyectos
        </h1>
        <p className="mt-4 text-on-surface-variant font-body-lg text-body-lg max-w-2xl">
          Catálogo con análisis independiente: precio por m², desarrolladora, tipologías, avance y entrega.
          Compará proyectos barrio por barrio antes de invertir.
        </p>
      </div>

      <CatalogoFiltros items={mapped} />
    </main>
  );
}
