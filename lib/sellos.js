// Sellos de confianza de desarrolladoras.
// Fuente única: data/sellos-desarrolladoras.json (solo datos verificados, con fuente y fecha).
// Regla: un sello vencido (campo "vence") NO se muestra. Lo que no está verificado no se muestra:
// nunca se muestra nada negativo ni "sin sello".
import fs from "fs";
import path from "path";

export const METODOLOGIA_URL = "/metodologia-sellos-desarrolladoras/";

export const SELLOS_DEF = {
  trayectoria: {
    label: "Trayectoria comprobada",
    icon: "apartment",
    corto: "Obras entregadas verificadas",
    criterio: "Al menos 3 obras terminadas informadas y al menos 1 cuya entrega confirma una fuente independiente (prensa o publicación de arquitectura).",
    url: "/desarrolladoras-con-obras-entregadas/",
  },
  premiada: {
    label: "Premiada",
    icon: "emoji_events",
    corto: "Premio verificado",
    criterio: "Premio o distinción a una obra construida, confirmado en el sitio del organizador o en prensa. No cuentan premios que solo figuran en la web de la empresa.",
    url: "/desarrolladoras-premiadas/",
  },
  matricula: {
    label: "Matrícula verificada",
    icon: "badge",
    corto: "Corredor matriculado",
    criterio: "Matrícula de corredor inmobiliario encontrada vigente en el padrón público oficial del colegio (CUCICBA en CABA) y vinculada a la inmobiliaria por nombre, nombre comercial o domicilio.",
    url: "/ranking-inmobiliarias-confiables/",
  },
  reconocida: {
    label: "Reconocida en el sector",
    icon: "emoji_events",
    corto: "Reconocimiento verificado",
    criterio: "Distinción o ranking sectorial independiente (por ejemplo, el Ranking de Calidad de Revista Mercado y Reporte Inmobiliario) confirmado en la publicación original.",
    url: "/ranking-inmobiliarias-confiables/",
  },
  solidez: {
    label: "Sin alertas financieras",
    icon: "account_balance",
    corto: "BCRA situación normal",
    criterio: "Sociedad identificada de forma verificable y en situación 1 (normal) en la Central de Deudores del BCRA en el último período informado.",
    url: "/ranking-desarrolladoras-confiables/",
  },
};

let _cache = null;
function load() {
  if (_cache) return _cache;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "sellos-desarrolladoras.json"), "utf8"));
    _cache = raw.desarrolladoras || {};
  } catch (e) { _cache = {}; }
  return _cache;
}

const hoy = () => new Date().toISOString().slice(0, 10);
const vigente = (d) => !d.vence || d.vence >= hoy();

// Desarrolladoras con al menos un sello vigente: [{slug, nombre, web, verificado, vence, sellos:[...] }]
export function todasConSellos() {
  const all = load();
  return Object.entries(all)
    .filter(([, d]) => vigente(d) && (d.sellos || []).length)
    .map(([slug, d]) => ({ slug, ...d }));
}

export function sellosDeSlug(slug) {
  const d = load()[slug];
  return d && vigente(d) ? d : null;
}

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");

// Por nombre (ej. desarrolladora de una ficha). Match estricto: igual o contenido con >4 letras.
export function sellosDeNombre(nombre) {
  const t = norm(nombre);
  if (!t) return null;
  for (const [slug, d] of Object.entries(load())) {
    if (!vigente(d)) continue;
    const n = norm(d.nombre);
    if (n && (n === t || (n.length > 4 && t.length > 4 && (t.includes(n) || n.includes(t))))) return { slug, ...d };
  }
  return null;
}

// Ranking: más sellos primero; desempate por cantidad de evidencias verificadas.
export function ranking(tipo) {
  const lista = todasConSellos().filter((d) => !tipo || d.sellos.some((s) => s.tipo === tipo));
  const peso = (d) => d.sellos.length * 100 + d.sellos.reduce((a, s) => a + (s.evidencia || []).length, 0);
  return lista.sort((a, b) => peso(b) - peso(a) || a.nombre.localeCompare(b.nombre, "es"));
}

export function fechaLarga(iso) {
  try { return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" }); } catch (e) { return iso; }
}

// ---------- Inmobiliarias ----------
let _cacheInmo = null;
function loadInmo() {
  if (_cacheInmo) return _cacheInmo;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "sellos-inmobiliarias.json"), "utf8"));
    _cacheInmo = raw.inmobiliarias || {};
  } catch (e) { _cacheInmo = {}; }
  return _cacheInmo;
}

export function inmoConSellos() {
  const peso = (d) => d.sellos.length * 100 + d.sellos.reduce((a, s) => a + (s.evidencia || []).length, 0);
  return Object.values(loadInmo()).filter((d) => vigente(d) && (d.sellos || []).length)
    .sort((a, b) => peso(b) - peso(a) || a.nombre.localeCompare(b.nombre, "es"));
}

export function sellosInmoDeNombre(nombre) {
  const t = norm(nombre).replace(/(propiedades|bienesraices|inmobiliaria|realestate|negociosinmobiliarios)$/g, "");
  if (!t || t.length < 3) return null;
  for (const d of Object.values(loadInmo())) {
    if (!vigente(d)) continue;
    const n = norm(d.nombre).replace(/(propiedades|bienesraices|inmobiliaria|realestate|negociosinmobiliarios)$/g, "");
    if (n && (n === t || (n.length > 4 && t.length > 4 && (t.startsWith(n) || n.startsWith(t))))) return d;
  }
  return null;
}

// Marca cada item del catálogo (salida de mapDesarrollos) con los sellos verificados de su
// desarrolladora y/o inmobiliaria. Server-only (lee JSON). Agrega: item.sellos = ["trayectoria", ...]
export function conSellos(items) {
  return (items || []).map((i) => {
    const d = i.desarrolladoraNombre ? sellosDeNombre(i.desarrolladoraNombre) : null;
    // A veces la inmobiliaria figura cargada como "desarrolladora": también la buscamos ahí.
    const m = (i.comercializadora ? sellosInmoDeNombre(i.comercializadora) : null) || (i.desarrolladoraNombre ? sellosInmoDeNombre(i.desarrolladoraNombre) : null);
    // La matrícula sola es un requisito legal básico: se muestra en la página de la inmobiliaria,
    // pero NO alcanza para marcar el proyecto con "sello de confianza" en listados y filtros.
    const tipos = [...new Set([...(d ? d.sellos.map((s) => s.tipo) : []), ...(m ? m.sellos.map((s) => s.tipo) : [])])].filter((t) => t !== "matricula");
    return tipos.length ? { ...i, sellos: tipos, selloDev: d ? d.nombre : null, selloInmo: m ? m.nombre : null } : i;
  });
}
