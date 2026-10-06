// lib/leadRouting.js — Decide a quién le llega cada lead (fuente única, migrada del Apps Script).
// Prioridad: 1) INMOBILIARIA que comercializa el proyecto (si tenemos su email)
//            2) DESARROLLADORA (ruteo por slug o por nombre)  ← también cuando hay inmobiliaria
//               identificada pero sin contacto (opción a: el lead se atiende igual, rápido)
//            3) contacto@ (sin destinatario cargado)
// Los contactos de inmobiliarias salen de: ruteo histórico (data/ruteo-leads.json), contactos
// verificados (data/inmobiliaria-contactos.json) y los que cargás una vez desde el mail de copia
// (pestaña "ContactosInmo" de la planilla, Estado = aprobado).
import RUTEO from "../data/ruteo-leads.json";
import CONTACTOS from "../data/inmobiliaria-contactos.json";
import { getDesarrollos } from "./wp";
import { mapDesarrollos } from "./catalogo";
import { sheetsReady, getValues, ensureTab } from "./googleSheets";

export const CONTACTO = "contacto@departamentosenpozo.com.ar";
export const TAB_CONTACTOS = "ContactosInmo";
export const HEAD_CONTACTOS = ["Nombre", "Email", "WhatsApp", "Estado", "Fecha", "Fuente", "Proyectos"];

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
// Palabras genéricas que no identifican a la firma ("Dost Propiedades" == "DÖST").
const GEN = /\b(propiedades|propiedad|bienes raices|bienes|raices|inmobiliaria|inmobiliario|brokers|broker|real estate|negocios inmobiliarios|grupo|desarrollos|sa|srl|s a|group|profesionales inmobiliarios|centro inmobiliario)\b/g;
export const coreName = (s) => norm(String(s || "").replace(/re\s*\/\s*max/gi, "remax").replace(/\(.*?\)/g, " ").split(/[\/;]/)[0]).replace(GEN, " ").replace(/\s+/g, "");
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());

// Índice estático nombre-de-firma -> email (se arma una vez por instancia).
let _static = null;
function staticIndex() {
  if (_static) return _static;
  const idx = {};
  const add = (name, email) => { const k = coreName(name); if (k.length >= 3 && isEmail(email) && !idx[k]) idx[k] = email.trim(); };
  const c = (CONTACTOS && CONTACTOS.contactos) || {};
  for (const [n, v] of Object.entries(c)) add(n, v.email); // verificados primero
  for (const [k, v] of Object.entries(RUTEO.devs || {})) add(v.nombre || k, v.email);
  for (const v of Object.values(RUTEO.slugs || {})) {
    if (v.dev && !/\(|com\./i.test(v.dev)) add(v.dev, v.email);
    if (v.comercial && v.dev) { const m = v.dev.match(/com\.?\s*([^)]+)\)/i); if (m) add(m[1], v.comercial); }
  }
  // Índice por dominio: "info@sarropucheta.com" -> clave "sarropucheta" (para firmas cuyo mail
  // quedó cargado bajo el nombre de la desarrolladora/proyecto).
  const dom = {};
  const allMails = [...Object.values(RUTEO.devs || {}).map((v) => v.email), ...Object.values(RUTEO.slugs || {}).flatMap((v) => [v.email, v.comercial])];
  for (const e of allMails) {
    if (!isEmail(e)) continue;
    const d = e.split("@")[1].toLowerCase().split(".")[0].replace(/[^a-z0-9]/g, "");
    if (d.length >= 5 && !/^(gmail|hotmail|yahoo|outlook|live|icloud)$/.test(d) && !dom[d]) dom[d] = e.trim();
  }
  idx.__dom = dom;
  _static = idx;
  return idx;
}
// Franquicias: cada oficina es distinta → nunca inferir el mail por nombre/dominio.
const FRANQUICIA = /^(remax|century21|coldwellbanker|kellerwilliams|engelvolkers|sothebys)/;
function porDominio(nombre) {
  const k = coreName(nombre);
  if (k.length < 5 || FRANQUICIA.test(k)) return "";
  const dom = staticIndex().__dom;
  if (dom[k]) return dom[k];
  // Prefijo sólo con nombres largos (evita falsos positivos tipo "building" ↔ "buildingsa").
  if (k.length >= 7) for (const [d, e] of Object.entries(dom)) if (d.length >= 7 && (d.startsWith(k) || k.startsWith(d))) return e;
  return "";
}

// Contactos cargados por vos (planilla). Cache 5 min.
let _learned = { at: 0, idx: {} };
export function invalidateLearned() { _learned.at = 0; }
async function learnedIndex() {
  if (!sheetsReady()) return {};
  if (Date.now() - _learned.at < 300000) return _learned.idx;
  try {
    await ensureTab(TAB_CONTACTOS, HEAD_CONTACTOS);
    const rows = await getValues(TAB_CONTACTOS + "!A2:D2000");
    const idx = {};
    for (const [nombre, email, , estado] of rows) {
      if (norm(estado) === "aprobado" && isEmail(email)) idx[coreName(nombre)] = email.trim(); // la última fila gana
    }
    _learned = { at: Date.now(), idx };
  } catch (e) { /* sin planilla: seguimos con el índice estático */ }
  return _learned.idx;
}

// Catálogo por slug (para saber comercializadora y desarrolladora del proyecto).
let _cat = null;
async function itemBySlug(slug) {
  if (!slug) return null;
  if (!_cat) {
    try { _cat = new Map(mapDesarrollos(await getDesarrollos(3000)).map((p) => [p.slug, p])); } catch { _cat = new Map(); }
  }
  return _cat.get(slug) || null;
}

// Resultado: { to, tipo: "inmobiliaria"|"desarrolladora"|"contacto", nombre, comercializadora, sinContactoInmo }
export async function resolverDestino(lead) {
  const slug = String(lead.proyectoSlug || "").trim();
  const item = await itemBySlug(slug);
  const ruta = RUTEO.slugs[slug] || null;
  const learned = await learnedIndex();
  const stat = staticIndex();

  // 1) Inmobiliaria
  let com = (item && item.comercializadora) || "";
  if (!com && ruta && ruta.comercial) { const m = String(ruta.dev || "").match(/com\.?\s*([^)]+)\)/i); com = m ? m[1].trim() : "Comercializadora"; }
  if (com) {
    const k = coreName(com);
    // Franquicias (RE/MAX & co): la marca sola nunca se rutea (cada oficina es distinta); una
    // oficina concreta ("RE/MAX Cosmopolita") sí, pero sólo por nombre exacto verificado, sin inferir dominio.
    const franq = FRANQUICIA.test(k);
    const franqGenerica = /^(remax|century21|coldwellbanker|kellerwilliams|engelvolkers|sothebys)$/.test(k);
    const email = learned[k] || (ruta && isEmail(ruta.comercial) ? ruta.comercial : "") ||
      (franqGenerica ? "" : franq ? stat[k] : stat[k] || porDominio(com));
    if (isEmail(email)) return { to: email, tipo: "inmobiliaria", nombre: com, comercializadora: com, sinContactoInmo: false };
  }
  const sinContactoInmo = !!com;

  // 2) Desarrolladora (opción a: también si hay inmobiliaria sin contacto)
  const devNombre = (item && item.desarrolladoraNombre) || String(lead.desarrolladora || "").replace(/\(.*$/, "").trim();
  if (ruta && isEmail(ruta.email)) return { to: ruta.email, tipo: "desarrolladora", nombre: ruta.dev || devNombre || "la desarrolladora", comercializadora: com, sinContactoInmo };
  const kd = coreName(devNombre);
  const devMail = learned[kd] || stat[kd] || (RUTEO.devs[norm(devNombre).replace(/ /g, "")] || {}).email;
  if (isEmail(devMail)) return { to: devMail, tipo: "desarrolladora", nombre: devNombre, comercializadora: com, sinContactoInmo };

  // 3) Fallback
  return { to: CONTACTO, tipo: "contacto", nombre: "Departamentos en Pozo", comercializadora: com, sinContactoInmo };
}
