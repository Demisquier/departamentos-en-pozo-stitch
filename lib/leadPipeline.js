// lib/leadPipeline.js — Pipeline de leads 100% en Vercel (reemplaza el doPost del Apps Script).
// Por cada lead: 1) dedup  2) guarda fila en la planilla (mismas columnas, mapeadas por encabezado)
// 3) manda el lead DESDE contacto@ al destino (inmobiliaria > desarrolladora > contacto@)
// 4) te manda la copia interna con el ruteo y, si falta el contacto de la inmobiliaria, un link
//    para cargarlo una sola vez  5) manda el mail de "similares" al interesado (máx. 1 cada 7 días).
import crypto from "node:crypto";
import { sheetsReady, tabs, getValues, appendRow } from "./googleSheets";
import { sendMail, resendReady } from "./resend";
import { resolverDestino, CONTACTO } from "./leadRouting";

export const SITE = "https://departamentosenpozo.com.ar";

// Dos variantes del modo Vercel (LEADS_PIPELINE=vercel):
//  • Con service account (GOOGLE_SA_*): Vercel escribe la planilla directo.
//  • Sin service account ("híbrido", sin claves): la fila la sigue guardando el Apps Script
//    (con su dedup y su mail de similares), y Vercel hace el ruteo + el mail al destino.
//    Se le manda `_vercel: true` para que el Apps Script NO mande su mail viejo de ruteo.
export const SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbxQYPNfcKOdHuATx7f7XvXKFPJ7eVvmD7EJwJmSqN4C6PXZIauk59dOgwQE3nMlYvZf0Q/exec";
export function pipelineVercelActivo() {
  return process.env.LEADS_PIPELINE === "vercel" && resendReady();
}

// Token HMAC para el link "cargar contacto" (sólo lo genera el server, con MAIL_SECRET).
export function firmar(nombre) {
  return crypto.createHmac("sha256", String(process.env.MAIL_SECRET || "x")).update("inmo:" + nombre).digest("hex").slice(0, 32);
}
export function linkCargarContacto(nombre, proyecto) {
  return SITE + "/api/inmo-contacto?n=" + encodeURIComponent(nombre) + "&p=" + encodeURIComponent(proyecto || "") + "&t=" + firmar(nombre);
}

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hnorm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

// Encabezado de la planilla -> campo del lead.
function campoDe(h) {
  const k = hnorm(h);
  if (/^(fecha|timestamp|date|hora)/.test(k)) return "fecha";
  if (/^(email|mail|correo)/.test(k)) return "email";
  if (/^(whatsapp|wpp|telefono|tel|celular)/.test(k)) return "whatsapp";
  if (/^(proyectoslug|slug)/.test(k)) return "proyectoSlug";
  if (/^(ruteado|ruteo|destino|enviadoa|derivado)/.test(k)) return "destino";
  if (/^(interes|objetivo)/.test(k)) return "interes";
  if (/^(mensaje|consulta|comentario)/.test(k)) return "mensaje";
  if (/^(zonas|zona|barrio)/.test(k)) return "zonas";
  for (const f of ["origen", "tipo", "nombre", "proyecto", "ambientes", "presupuesto", "desarrolladora", "comercializadora"]) if (k.startsWith(f)) return f;
  return null;
}

function fechaAR(d = new Date()) {
  const p = new Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(d);
  const g = (t) => (p.find((x) => x.type === t) || {}).value || "";
  return `${g("day")}/${g("month")}/${g("year")} ${g("hour")}:${g("minute")}:${g("second")}`;
}
function parseFecha(s) {
  const m = String(s || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime() : NaN;
}

let _tab = null;
async function leadsTab() {
  if (process.env.LEADS_SHEET_TAB) return process.env.LEADS_SHEET_TAB;
  if (!_tab) _tab = (await tabs())[0];
  return _tab;
}

function mailLead(lead, dest) {
  const filas = [["Nombre", lead.nombre], ["Email", lead.email], ["WhatsApp", lead.whatsapp], ["Proyecto", lead.proyecto],
    ["Consulta", lead.mensaje], ["Interés", lead.interes || lead.objetivo], ["Presupuesto", lead.presupuesto],
    ["Zonas / ambientes", [lead.zonas, lead.ambientes].filter(Boolean).join(" / ")]].filter(([, v]) => v);
  const proyecto = lead.proyecto || "un proyecto";
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1c2431;max-width:560px">' +
    "<p>Hola, equipo de " + esc(dest.nombre) + ":</p>" +
    "<p>Una persona consultó por <b>" + esc(proyecto) + "</b> en Departamentos en Pozo (sitio independiente de análisis de proyectos en pozo) y dejó sus datos:</p>" +
    '<table style="border-collapse:collapse">' + filas.map(([k, v]) => '<tr><td style="padding:3px 12px 3px 0;color:#5b6675">' + esc(k) + "</td><td><b>" + esc(v) + "</b></td></tr>").join("") + "</table>" +
    "<p>Pueden escribirle directamente mencionando que consultó por Departamentos en Pozo.</p>" +
    '<p style="font-size:13px;color:#5b6675">¿Querés que la ficha de ' + esc(proyecto) + ' esté completa y validada? Respondé este mail.</p>' +
    '<p>Saludos,<br>Equipo Departamentos en Pozo<br><a href="' + SITE + '">departamentosenpozo.com.ar</a></p>' +
    '<p style="font-size:11px;color:#98a0ab">Recibís este aviso porque figurás como comercializador/desarrollador de ' + esc(proyecto) + ". Para no recibirlos, respondé BAJA.</p></div>";
  const text = "Hola, equipo de " + dest.nombre + ":\n\nUna persona consultó por " + proyecto + " en Departamentos en Pozo y dejó sus datos:\n\n" +
    filas.map(([k, v]) => "  • " + k + ": " + v).join("\n") + "\n\nPueden escribirle directamente mencionando que consultó por Departamentos en Pozo.\n\nEquipo Departamentos en Pozo\n" + SITE;
  return { subject: "Nueva consulta por " + proyecto + " — Departamentos en Pozo", html, text };
}

function mailInterno(lead, dest, notas) {
  const tipoTxt = { inmobiliaria: "INMOBILIARIA", desarrolladora: "DESARROLLADORA", contacto: "SIN DESTINATARIO (sólo vos)" }[dest.tipo];
  let aviso = "";
  if (dest.sinContactoInmo && dest.tipo !== "inmobiliaria") {
    const link = linkCargarContacto(dest.comercializadora, lead.proyecto);
    aviso = '<div style="background:#fff7e0;border:1px solid #e8c766;padding:12px;border-radius:8px;margin:12px 0">' +
      "⚠ Este proyecto lo comercializa <b>" + esc(dest.comercializadora) + "</b>, pero no tenemos su contacto: el lead salió a " + (dest.tipo === "desarrolladora" ? "la desarrolladora" : "vos solo") + ".<br>" +
      '<a href="' + link + '" style="color:#0f1f3d;font-weight:bold">→ Cargar el contacto de ' + esc(dest.comercializadora) + " (una sola vez)</a>: desde ahí, todos sus leads le llegan directo.</div>";
  }
  const filas = Object.entries({ Nombre: lead.nombre, Email: lead.email, WhatsApp: lead.whatsapp, Proyecto: lead.proyecto, Origen: lead.origen, Tipo: lead.tipo, Consulta: lead.mensaje, Interés: lead.interes }).filter(([, v]) => v);
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1c2431;max-width:600px">' +
    "<p><b>Ruteado a " + tipoTxt + ":</b> " + esc(dest.nombre) + " &lt;" + esc(dest.to) + "&gt;" + (dest.comercializadora ? "<br>Comercializa: " + esc(dest.comercializadora) : "") + "</p>" +
    aviso + '<table style="border-collapse:collapse">' + filas.map(([k, v]) => '<tr><td style="padding:2px 12px 2px 0;color:#5b6675">' + esc(k) + "</td><td>" + esc(v) + "</td></tr>").join("") + "</table>" +
    (notas.length ? '<p style="color:#b42318">' + notas.map(esc).join("<br>") + "</p>" : "") + "</div>";
  return { subject: "[Lead] " + (lead.proyecto || "sin proyecto") + " → " + (dest.tipo === "contacto" ? "a cargar" : dest.nombre), html };
}

// Punto de entrada. lead = payload `sheet` del cliente.
export async function procesarLead(lead) {
  if (!sheetsReady()) return procesarLeadHibrido(lead);
  const notas = [];
  const tab = await leadsTab().catch(() => null);
  let headers = [], rows = [];
  try {
    const vals = await getValues(tab + "!A:Z");
    headers = vals[0] || [];
    rows = vals.slice(1);
  } catch (e) { notas.push("No pude leer la planilla: " + e.message); }
  const col = (f) => headers.findIndex((h) => campoDe(h) === f);
  const iE = col("email"), iW = col("whatsapp"), iP = col("proyecto"), iF = col("fecha");
  const email = String(lead.email || "").trim().toLowerCase(), wa = String(lead.whatsapp || "").replace(/\D/g, "");

  // 1) Dedup: mismo contacto + mismo proyecto en las últimas 15 filas -> no reenviar.
  const recientes = rows.slice(-15);
  const dup = recientes.some((r) => {
    const mismo = (email && iE >= 0 && String(r[iE] || "").trim().toLowerCase() === email) || (wa && iW >= 0 && String(r[iW] || "").replace(/\D/g, "") === wa);
    return mismo && iP >= 0 && String(r[iP] || "") === String(lead.proyecto || "");
  });
  if (dup) return { ok: true, duplicado: true };

  // Similares: ¿ya recibió uno en los últimos 7 días? (cualquier lead suyo en ese período)
  const semana = Date.now() - 7 * 864e5;
  const leadPrevio = email && iE >= 0 && rows.some((r) => String(r[iE] || "").trim().toLowerCase() === email && (iF < 0 || !(parseFecha(r[iF]) < semana)));

  // 2) Ruteo
  // Alertas / intake de desarrolladoras / leads sin proyecto: no se derivan, sólo te llegan a vos.
  const derivable = lead.tipo !== "intake" && (lead.proyectoSlug || lead.proyecto);
  const dest = derivable ? await resolverDestino(lead)
    : { to: CONTACTO, tipo: "contacto", nombre: "Departamentos en Pozo", comercializadora: "", sinContactoInmo: false };

  // 3) Guardar fila (mismas columnas que ya usa la planilla)
  const valor = { ...lead, fecha: fechaAR(), destino: dest.tipo + ": " + dest.nombre + " <" + dest.to + ">", comercializadora: dest.comercializadora || "" };
  if (headers.length) {
    try { await appendRow(tab, headers.map((h) => { const f = campoDe(h); return f ? String(valor[f] ?? "") : ""; })); }
    catch (e) { notas.push("⚠ No se guardó en la planilla: " + e.message); }
  }

  // 4) Mails
  const envios = [];
  if (dest.tipo !== "contacto") {
    const m = mailLead(lead, dest);
    envios.push(sendMail({ to: dest.to, subject: m.subject, html: m.html, text: m.text, replyTo: CONTACTO }).catch((e) => notas.push("Falló envío a destino: " + e.message)));
  }
  await Promise.all(envios);
  const mi = mailInterno(lead, dest, notas);
  const tareas = [sendMail({ to: CONTACTO, subject: mi.subject, html: mi.html, replyTo: lead.email || CONTACTO }).catch(() => {})];

  // 5) Similares al interesado
  if (email && !leadPrevio && (lead.proyectoSlug || lead.proyecto)) {
    tareas.push((async () => {
      const u = SITE + "/api/similares?limit=4&" + (lead.proyectoSlug ? "slug=" + encodeURIComponent(lead.proyectoSlug) : "nombre=" + encodeURIComponent(lead.proyecto)) + (lead.nombre ? "&lead=" + encodeURIComponent(String(lead.nombre).split(/\s+/)[0]) : "");
      const r = await fetch(u).then((x) => x.json()).catch(() => null);
      if (r && r.emailHtml && (r.similares || []).length) await sendMail({ to: email, subject: r.emailSubject, html: r.emailHtml, text: r.emailText, replyTo: CONTACTO });
    })().catch(() => {}));
  }
  await Promise.all(tareas);
  return { ok: true, destino: dest.tipo };
}


// Modo híbrido: el Apps Script guarda la fila (y dedup + similares); Vercel rutea y avisa.
async function procesarLeadHibrido(lead) {
  const derivable = lead.tipo !== "intake" && (lead.proyectoSlug || lead.proyecto);
  const dest = derivable ? await resolverDestino(lead)
    : { to: CONTACTO, tipo: "contacto", nombre: "Departamentos en Pozo", comercializadora: "", sinContactoInmo: false };
  const notas = [];
  // 1) Guardar en la planilla vía Apps Script (respeta su dedup de 2 min).
  let gs = null;
  try {
    const r = await fetch(SHEET_WEBHOOK, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...lead, _vercel: true, destino: dest.tipo + ": " + dest.nombre + " <" + dest.to + ">" }) });
    gs = await r.json().catch(() => null);
  } catch (e) { notas.push("⚠ No se pudo guardar en la planilla (Apps Script): " + e.message); }
  if (gs && (gs.dedup || gs.empty)) return { ok: true, duplicado: true };
  // 2) Mail al destino + copia interna.
  if (dest.tipo !== "contacto") {
    const m = mailLead(lead, dest);
    await sendMail({ to: dest.to, subject: m.subject, html: m.html, text: m.text, replyTo: CONTACTO }).catch((e) => notas.push("Falló envío a destino: " + e.message));
  }
  const mi = mailInterno(lead, dest, notas);
  await sendMail({ to: CONTACTO, subject: mi.subject, html: mi.html, replyTo: lead.email || CONTACTO }).catch(() => {});
  return { ok: true, destino: dest.tipo, modo: "hibrido" };
}
