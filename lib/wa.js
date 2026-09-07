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
// Devuelve { phone, esDelDev }. Siempre trae un phone (dev o fallback).
export function waParaDev(devName) {
  const key = normDev(devName);
  const map = _load();
  const hit = key && map[key];
  return { phone: hit || WA_FALLBACK, esDelDev: !!hit };
}
