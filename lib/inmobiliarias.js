// Resuelve el contacto de la inmobiliaria/comercializadora que trabaja un proyecto.
// Cadena: slug del proyecto -> comercializadora (overrides harvesteados) -> contacto verificado.
// Sólo devuelve contacto cuando hay EMAIL confirmado (los pendientes tienen email: "").
import COMERCIALIZADORA_OVERRIDES from '../data/comercializadora-overrides.json';
import CONTACTOS from '../data/inmobiliaria-contactos.json';

// Normaliza para matchear nombres con tildes/mayúsculas/espacios distintos.
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca tildes
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Index normalizado del JSON de contactos (una sola vez).
const _idx = (() => {
  const map = {};
  const c = (CONTACTOS && CONTACTOS.contactos) || {};
  for (const k of Object.keys(c)) map[norm(k)] = { nombre: k, ...c[k] };
  return map;
})();

// Dado el NOMBRE de la comercializadora, devuelve su contacto o null.
export function contactoDeInmobiliaria(nombre) {
  if (!nombre) return null;
  const hit = _idx[norm(nombre)];
  return hit || null;
}

// Dado el SLUG del proyecto, resuelve comercializadora -> contacto con email confirmado.
// Devuelve { nombre, email, whatsapp, web } o null (no hay inmobiliaria mapeada o sin email).
export function inmobiliariaDelProyecto(slug) {
  if (!slug) return null;
  const com = COMERCIALIZADORA_OVERRIDES && COMERCIALIZADORA_OVERRIDES[slug];
  if (!com) return null; // no sabemos qué inmobiliaria la trabaja -> fallback dev
  const c = contactoDeInmobiliaria(com);
  if (!c || !c.email) return null; // inmobiliaria sin email verificado -> fallback dev
  return { nombre: c.nombre || com, email: c.email, whatsapp: c.whatsapp || '', web: c.web || '' };
}
