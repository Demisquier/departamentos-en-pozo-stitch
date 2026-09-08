// lib/wa.js — Resuelve el WhatsApp de la desarrolladora/comercializadora de una ficha.
// Match por nombre normalizado contra data/dev-whatsapp.json. Si no hay, cae a la línea
// del sitio (Demi) para que TODA ficha tenga botón de WhatsApp funcionando.
import fs from "node:fs";
import path from "node:path";

export const WA_FALLBACK = "5491134502704"; // línea Departamentos en Pozo

let _map = null;
function _load() {
  if (_map) return _map;
  try {
    _map = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "dev-whatsapp.json"), "utf8"));
  } catch { _map = {}; }
  return _map;
}
export function normDev(name) {
  let s = (name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/\([^)]*\)/g, "");
  s = s.replace(/^\s*com(ercializa)?\.?\s+/i, "");
  s = s.split(/[—/,]| comercializa| desarrolla/i)[0];
  s = s.replace(/\b(propiedades|inmobiliaria|inmobiliarios?|desarrollos?|developers?|bienes raices|negocios inmobiliarios|real estate|group|grupo|arquitectos?|asesores|construcciones?|constructora|realty|brokers?|sas?|srl)\b/gi, "");
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
// Extrae comercializadoras candidatas del nombre ("Dev (comercializa X)", "Dev — com. Y").
function _candidatos(name) {
  const out = [];
  const parens = (String(name || "").match(/\(([^)]*)\)/g) || []).map((p) => p.slice(1, -1));
  for (let p of parens) {
    p = p.replace(/^\s*(com\.?|comercializa|diseno|diseño|construye|l[ií]nea)\s+/i, "");
    for (const part of p.split(/[\/;]| y /)) out.push(part.trim());
  }
  const m = String(name || "").match(/com(?:ercializa)?\.?\s+([^(]+)/i);
  if (m) out.push(m[1].trim());
  return out.filter(Boolean);
}
// Devuelve { phone, esDelDev }. Siempre trae un phone (dev o fallback).
export function waParaDev(devName) {
  const map = _load();
  const key = normDev(devName);
  let hit = key && map[key];
  if (!hit) {
    for (const c of _candidatos(devName)) {
      const ck = normDev(c);
      if (ck && map[ck]) { hit = map[ck]; break; }
    }
  }
  return { phone: hit || WA_FALLBACK, esDelDev: !!hit };
}

