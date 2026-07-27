// lib/barrios.js — Fuente ÚNICA de verdad de los barrios.
// Modelo canónico (una lista de objetos) + mapas/derivados para no romper los usos
// actuales. Reemplaza los ~8 mapas dispersos (BARRIO_CPT, BARRIO_NOMBRE, BARRIO_LABEL,
// BARRIO_URL, BARRIO_PAGE, BARRIO_ORDEN, BARRIOS, barrioNombre) que estaban en
// app/[slug], app/desarrolladoras-inmobiliarias-en-[barrio], app/page.jsx, DirectorioDevs,
// DirectorioInmo, Footer y novedades. CERO cambio de URLs, nombres ni SEO.

// Barrios con página propia /desarrolladoras-inmobiliarias-en-{slug}/.
//  - slug:    segmento de la URL de la página.
//  - nombre:  título visible ("Colegiales y Chacarita").
//  - cptKey:  clave con la que se guarda el barrio en el CPT (dev_barrios_key / barriosKey).
//  - aliases: otras claves del CPT que también apuntan a esta misma página (barrios agrupados).
//  - enHome + orden: si aparece (y en qué posición) en el bloque "Explorá por barrio" de la home.
// El ORDEN de este array = el orden visible del footer y del bloque "por barrio" de
// novedades (BARRIOS_PAGINA). El orden de la home es independiente (campo `orden`).
export const BARRIOS = [
  { slug: "palermo",              nombre: "Palermo",                cptKey: "palermo",       enHome: true, orden: 1 },
  { slug: "belgrano",             nombre: "Belgrano",               cptKey: "belgrano",      enHome: true, orden: 3 },
  { slug: "caballito",            nombre: "Caballito",              cptKey: "caballito",     enHome: true, orden: 2 },
  { slug: "nunez",                nombre: "Núñez",                  cptKey: "nunez",         enHome: true, orden: 5 },
  { slug: "puerto-madero",        nombre: "Puerto Madero",          cptKey: "puerto-madero", enHome: true, orden: 4 },
  { slug: "recoleta",             nombre: "Recoleta",               cptKey: "recoleta" },
  { slug: "villa-urquiza",        nombre: "Villa Urquiza",          cptKey: "villa-urquiza" },
  { slug: "colegiales-chacarita", nombre: "Colegiales y Chacarita", cptKey: "colegiales", aliases: ["chacarita"] },
  { slug: "saavedra-coghlan",     nombre: "Saavedra y Coghlan",     cptKey: "saavedra",   aliases: ["coghlan"] },
];

const bySlug = Object.fromEntries(BARRIOS.map((b) => [b.slug, b]));

// slug de página → clave del CPT.  (colegiales-chacarita → "colegiales", saavedra-coghlan → "saavedra")
export const BARRIO_CPT = Object.fromEntries(BARRIOS.map((b) => [b.slug, b.cptKey]));

// slug de página → nombre visible.
export const BARRIO_NOMBRE = Object.fromEntries(BARRIOS.map((b) => [b.slug, b.nombre]));

// Lista de slugs de página (para generateStaticParams de la ruta [barrio]).
export const BARRIOS_SLUGS = BARRIOS.map((b) => b.slug);

// [nombre, slug] de las 9 páginas de barrio (footer + bloque "por barrio" de novedades).
export const BARRIOS_PAGINA = BARRIOS.map((b) => [b.nombre, b.slug]);

// Barrios de la home: nombre → URL de la página, y el orden de aparición.
const enHome = BARRIOS.filter((b) => b.enHome).sort((a, b) => a.orden - b.orden);
export const BARRIO_PAGE = Object.fromEntries(
  enHome.map((b) => [b.nombre, `/desarrolladoras-inmobiliarias-en-${b.slug}/`])
);
export const BARRIO_ORDEN = enHome.map((b) => b.nombre);

// clave del CPT (o alias) → slug de página. Con esto los chips del hub son links navegables.
export const BARRIO_URL = Object.fromEntries(
  BARRIOS.flatMap((b) => [[b.cptKey, b.slug], ...(b.aliases || []).map((a) => [a, b.slug])])
);

// slug → nombre. Default "Buenos Aires"; title-case para slugs desconocidos.
export function barrioNombre(slug) {
  if (!slug) return "Buenos Aires";
  if (bySlug[slug]) return bySlug[slug].nombre;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Etiqueta por clave (token) de barrio del CPT — chips del directorio de DESARROLLADORAS.
// Incluye claves sueltas sin página propia (colegiales, chacarita, saavedra, coghlan, retiro).
// Sirve a la vez de label y de WHITELIST de chips: agregar/quitar claves cambia qué chips
// se muestran, así que se mantiene idéntico al mapa original.
export const BARRIO_LABEL = {
  palermo: "Palermo", belgrano: "Belgrano", caballito: "Caballito", nunez: "Núñez",
  "puerto-madero": "Puerto Madero", "puerto madero": "Puerto Madero", recoleta: "Recoleta",
  "villa-urquiza": "Villa Urquiza", "villa urquiza": "Villa Urquiza", colegiales: "Colegiales",
  chacarita: "Chacarita", saavedra: "Saavedra", coghlan: "Coghlan", retiro: "Retiro",
};

// Etiqueta por clave de ZONA del directorio de INMOBILIARIAS. Vocabulario DISTINTO al de
// desarrolladoras (cubre barrios sin página de devs, ej. Almagro / Villa Devoto) y también
// funciona como whitelist de chips → se mantiene como mapa propio para no cambiar los chips.
export const ZONA_INMO_LABEL = {
  palermo: "Palermo", belgrano: "Belgrano", caballito: "Caballito", nunez: "Núñez",
  "puerto-madero": "Puerto Madero", recoleta: "Recoleta", "villa-urquiza": "Villa Urquiza",
  colegiales: "Colegiales", "barrio-norte": "Barrio Norte", almagro: "Almagro",
  "las-canitas": "Las Cañitas", "villa-devoto": "Villa Devoto", "palermo-chico": "Palermo Chico",
};
