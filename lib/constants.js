// lib/constants.js — Constantes globales del sitio (URL, marca, IDs, interlinking).
// Fuente única: evita hardcodear el dominio / la marca / los IDs en cada página.

export const SITE = "https://departamentosenpozo.com.ar";
export const BRAND = "Departamentos en Pozo";
export const GA_ID = "G-G2FM2450HS";
export const CONTACT_EMAIL = "contacto@departamentosenpozo.com.ar";
// Logo canónico absoluto para schema (publisher.logo, Organization). Antes se usaba
// SITE + "/logo.png" que daba 404. Apunta al asset real en /public.
export const LOGO_URL = `${SITE}/wp-content/uploads/logo.png`;

// IDs de los desarrollos destacados en la home (snippet 23 de WP).
export const DESTACADOS_IDS = [9660, 9659, 9661, 9657, 9658, 9652];

// Bloque "Seguí explorando": links a las secciones money (interlinking).
// Formato [título, descripción, href] — igual que el markup original de [slug]/page.jsx.
export const MONEY_LINKS = [
  ["Desarrolladoras en Capital Federal", "Directorio de desarrolladoras activas en pozo, barrio por barrio.", "/desarrolladoras-inmobiliarias-en-capital-federal/"],
  ["Mejores inmobiliarias de CABA", "Cómo elegir una inmobiliaria con matrícula verificada.", "/mejores-inmobiliarias-caba/"],
  ["Proyectos en pozo", "Fichas de emprendimientos con precio, obra y ubicación.", "/desarrollos-inmobiliarios/"],
  ["Guía para invertir en pozo", "El marco completo para comprar en preventa sin errores.", "/guia-invertir-departamentos-en-pozo-argentina/"],
];
