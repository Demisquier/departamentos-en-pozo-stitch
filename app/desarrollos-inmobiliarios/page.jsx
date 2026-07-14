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

// Coordenadas por proyecto (geocodificadas de la dirección real, dentro de CABA).
const COORDS = {"newbery-place-colegiales":[-34.573241,-58.441764],"via-cramer-colegiales":[-34.573406,-58.447746],"live-belgrano-colegiales":[-34.569116,-58.455134],"virrey-aviles-2805-colegiales":[-34.569336,-58.455507],"bawilsa-36-villa-urquiza":[-34.579258,-58.490431],"smart-point-villa-urquiza-villa-urquiza":[-34.569996,-58.488349],"ando-villa-urquiza":[-34.579169,-58.486792],"rivera-mystic-villa-urquiza":[-34.570823,-58.485885],"osten-tower-i-puerto-madero":[-34.620011,-58.360436],"sofitel-residences-madero-puerto-madero":[-34.603236,-58.364129],"be-boulevard-puerto-madero":[-34.612292,-58.361931],"unica-puerto-madero":[-34.619691,-58.362627],"osten-tower-ii-puerto-madero":[-34.619400,-58.361100],"paz-boulevard-nunez":[-34.551649,-58.467854],"amenna-nunez":[-34.552498,-58.468283],"altos-de-ruiz-huidobro-nunez":[-34.544298,-58.471130],"aura-nunez-nunez":[-34.541053,-58.471047],"sucre-garden-belgrano":[-34.562115,-58.451882],"novo-belgrano-belgrano":[-34.556286,-58.463094],"aurea-belgrano":[-34.561270,-58.458929],"zeta-belgrano":[-34.564399,-58.444149],"neuhaus-directorio-caballito":[-34.627698,-58.431634],"life-caballito-caballito":[-34.616648,-58.438650],"suka-caballito":[-34.620590,-58.441392],"met-alto-residences-caballito":[-34.621500,-58.439000],"vera-lyria-caballito":[-34.622901,-58.434450],"vera-nubia-caballito":[-34.626906,-58.437654],"rio4-caballito":[-34.619800,-58.442500],"donna-grigia-caballito":[-34.629360,-58.450402],"donna-ambra-caballito":[-34.625048,-58.440463],"donna-salvia-caballito":[-34.626354,-58.451107],"donna-zaffira-caballito":[-34.626458,-58.449669],"donna-gioia-caballito":[-34.625278,-58.427522],"nice-cordoba-palermo":[-34.580336,-58.424524],"nice-hollywood-palermo-hollywood":[-34.581699,-58.434498],"paseo-plaza-thames-palermo-soho":[-34.588986,-58.432717],"piet-gascon-palermo-soho":[-34.594599,-58.423026],"casa-aer-palermo-soho":[-34.591659,-58.425841],"haaus-palermo-soho":[-34.592601,-58.432262],"central-acuna-palermo":[-34.596014,-58.421586],"nice-plaza-palermo-botanico":[-34.580402,-58.408713],"humboldt-1545-palermo-hollywood":[-34.586103,-58.436686],"haaus-ii-palermo-soho":[-34.592727,-58.432129],"tenca-palermo-hollywood":[-34.575787,-58.434386],"palacio-cabrera-palermo-hollywood":[-34.585241,-58.438609],"sens-luxury-homes-palermo-hollywood":[-34.583567,-58.429509]};

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
    const coord = COORDS[node.slug] || null;

    return {
      slug: node.slug,
      lat: coord ? coord[0] : null,
      lng: coord ? coord[1] : null,
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
