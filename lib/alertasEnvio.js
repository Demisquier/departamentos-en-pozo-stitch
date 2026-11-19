// lib/alertasEnvio.js — Alertas de lanzamientos desde Vercel (reemplaza al Apps Script, que dejó de enviar).
// Por qué: los suscriptores se anotan pero no recibían nada. Cómo: lee suscriptores (filas "Alerta" de la
// planilla de leads) + "Bajas" + "Alertas enviadas" con la service account, arma cada mail con
// /api/alerta-email (misma plantilla), y envía desde contacto@ (Resend). Nunca repite proyectos,
// máx. 1 mail cada capDias por persona. Gate: data/config-alertas.json → envioAutomatico.
import CONFIG from "../data/config-alertas.json";
import { sheetsReady, tabs, getValues, ensureTab, appendRows } from "./googleSheets";
import { sendMail } from "./resend";
import { GET as armarAlerta } from "../app/api/alerta-email/route";

const SENT = "Alertas enviadas";
const BAJAS = "Bajas";
const CONTACTO = "contacto@departamentosenpozo.com.ar";
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const num = (x) => { const n = parseInt(String(x || "").replace(/[^0-9]/g, ""), 10); return isNaN(n) ? 0 : n; };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function suscriptores() {
  const tab = process.env.LEADS_SHEET_TAB || (await tabs())[0];
  const data = await getValues(tab + "!A1:Z");
  if (!data.length) return [];
  const head = data[0].map(norm);
  const col = (...ns) => { for (const n of ns) { const i = head.indexOf(norm(n)); if (i >= 0) return i; } return -1; };
  const cE = col("email"), cO = col("origen"), cT = col("tipo"), cZ = col("zonas", "zona"), cP = col("presupuesto"), cA = col("ambientes");
  const out = new Map();
  for (const r of data.slice(1)) {
    const esAlerta = /alerta/.test(norm(r[cO])) || /alerta/.test(norm(cT >= 0 ? r[cT] : ""));
    if (!esAlerta) continue;
    const email = String(r[cE] || "").trim().toLowerCase();
    if (!EMAIL.test(email) || /prueba|test|example/.test(email)) continue;
    if (!out.has(email)) out.set(email, { email, zonas: [], presu: 0, amb: [] });
    const s = out.get(email);
    const z = String(cZ >= 0 ? r[cZ] : "").trim(); if (z && !s.zonas.includes(z)) s.zonas.push(z);
    const p = num(cP >= 0 ? r[cP] : ""); if (p > s.presu) s.presu = p;
    const a = String(cA >= 0 ? r[cA] : "").trim(); if (a && !s.amb.includes(a)) s.amb.push(a);
  }
  return [...out.values()];
}

async function bajas() {
  const list = await tabs();
  if (!list.includes(BAJAS)) return new Set();
  const v = await getValues(BAJAS + "!A1:D");
  return new Set(v.flat().map((x) => String(x || "").trim().toLowerCase()).filter((x) => EMAIL.test(x)));
}

async function enviados() {
  await ensureTab(SENT, ["fecha", "email", "proyectoId", "slug", "tipo"]);
  const v = await getValues(SENT + "!A2:E");
  const m = new Map();
  for (const [f, e, id, slug] of v) {
    const k = String(e || "").toLowerCase(); if (!k) continue;
    if (!m.has(k)) m.set(k, { slugs: new Set(), ult: 0, maxId: 0 });
    const x = m.get(k); x.slugs.add(String(slug || ""));
    const t = Date.parse(f) || 0; if (t > x.ult) x.ult = t;
    if (num(id) > x.maxId) x.maxId = num(id);
  }
  return m;
}

async function armar(sub, desde, excluir) {
  let zonas = sub.zonas.join(", ") || "abierto";
  if (/abierto|me da igual|indistinto|todos|otro|no se/.test(norm(zonas))) zonas = "abierto";
  const q = new URLSearchParams({ limit: "5", email: sub.email, zonas, desde: String(desde || 0), excluir: [...excluir].slice(-300).join(",") });
  if (sub.presu) q.set("precioMax", String(sub.presu));
  if (sub.amb.length) q.set("ambientes", sub.amb.join(","));
  const r = await armarAlerta(new Request("https://departamentosenpozo.com.ar/api/alerta-email?" + q.toString()));
  return r.json();
}

// modo: "auto" (según config) | "dry" (nunca envía) | "send" (envía aunque el config diga false)
export async function correrAlertas(modo = "auto") {
  if (!sheetsReady()) return { ok: false, error: "sheets_no_config" };
  const enviar = modo === "send" || (modo === "auto" && CONFIG.envioAutomatico === true);
  const cap = (CONFIG.capDias || 3) * 864e5, max = CONFIG.maxPorCorrida || 60;
  const [subs, sup, env] = await Promise.all([suscriptores(), bajas(), enviados()]);
  const plan = [], filas = [];
  for (const sub of subs) {
    if (plan.length >= max) break;
    if (sup.has(sub.email)) continue;
    const e = env.get(sub.email) || { slugs: new Set(), ult: 0, maxId: 0 };
    if (Date.now() - e.ult < cap) continue;
    const primera = !e.slugs.size;
    let d;
    try { d = await armar(sub, primera ? 0 : e.maxId, e.slugs); } catch (err) { continue; }
    if (!d || !d.count) continue;
    const subject = primera ? `Tu alerta está activa: ${d.total} proyecto${d.total === 1 ? "" : "s"} en pozo que encajan con tu búsqueda` : d.subject;
    plan.push({ email: sub.email, zonas: sub.zonas.join(", "), presu: sub.presu, count: d.count, total: d.total, subject, tipo: primera ? "bienvenida" : "alerta" });
    if (enviar) {
      try {
        await sendMail({ to: sub.email, subject, html: d.html, text: d.text || "", unsubscribe: d.unsubscribe, replyTo: CONTACTO });
        const ahora = new Date().toISOString();
        (d.slugs || []).forEach((s, i) => filas.push([ahora, sub.email, (d.ids || [])[i] || d.maxIdIncluidos || "", s, primera ? "bienvenida" : "alerta"]));
        plan[plan.length - 1].enviado = true;
      } catch (err) { plan[plan.length - 1].error = err.message; }
    }
  }
  if (filas.length) await appendRows(SENT, filas);
  // Resumen a contacto@ (solo si hay algo): enviado o pendiente de OK.
  if (plan.length && modo !== "dry") {
    const mask = (e) => e.replace(/^(.{2}).*(@.*)$/, "$1***$2");
    const li = plan.map((p) => `<li>${mask(p.email)} — ${p.zonas || "abierto"}${p.presu ? " · hasta USD " + p.presu.toLocaleString("es-AR") : ""}: <b>${p.count}</b> de ${p.total} (${p.tipo})${p.error ? " ⚠ " + p.error : ""}</li>`).join("");
    const html = enviar
      ? `<p>Alertas enviadas hoy: <b>${plan.filter((p) => p.enviado).length}</b> de ${subs.length} suscriptores.</p><ul>${li}</ul>`
      : `<p><b>${plan.length} suscriptor(es)</b> tienen proyectos para recibir, pero el envío automático está apagado (data/config-alertas.json → envioAutomatico:false). Con tu OK lo activo.</p><ul>${li}</ul>`;
    try { await sendMail({ to: CONTACTO, subject: enviar ? `[Alertas] ${plan.filter((p) => p.enviado).length} enviadas a suscriptores` : `[Alertas] ${plan.length} listas para enviar — esperan tu OK`, html }); } catch (e) {}
  }
  return { ok: true, enviar, suscriptores: subs.length, bajas: sup.size, plan: plan.length, enviados: plan.filter((p) => p.enviado).length };
}

// Registra una baja directo en la planilla (no depende del Apps Script).
export async function registrarBajaSheet(email, via = "get") {
  if (!sheetsReady()) return false;
  await ensureTab(BAJAS, ["fecha", "email", "origen", "via"]);
  await appendRows(BAJAS, [[new Date().toISOString(), String(email).toLowerCase(), "baja", via]]);
  return true;
}
