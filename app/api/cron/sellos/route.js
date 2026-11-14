// Chequeo automático mensual de los sellos de desarrolladoras (Vercel Cron, ver vercel.json).
// 1) BCRA: re-consulta la Central de Deudores de cada CUIT con sello de solidez.
// 2) Evidencia: verifica que las URLs de fuentes sigan respondiendo.
// 3) Vencimientos: avisa los sellos que vencen en los próximos 45 días (los vencidos ya se ocultan solos).
// Manda un informe a contacto@ y devuelve el JSON. No modifica datos: los cambios se aplican en la
// revalidación semestral (mayo y noviembre), que este mismo informe recuerda.
import fs from "fs";
import path from "path";
import { sendMail } from "../../../../lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONTACTO = "contacto@departamentosenpozo.com.ar";

function autorizado(req) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (process.env.MAIL_SECRET && url.searchParams.get("secret") === process.env.MAIL_SECRET) return true;
  // Sin CRON_SECRET configurado, aceptamos solo la invocación del cron de Vercel.
  if (!process.env.CRON_SECRET && /vercel-cron/i.test(req.headers.get("user-agent") || "")) return true;
  return false;
}

const leer = (f) => { try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", f), "utf8")); } catch (e) { return {}; } };

async function conTimeout(url, opts = {}, ms = 8000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal, redirect: "follow" }); } finally { clearTimeout(t); }
}

export async function GET(req) {
  if (!autorizado(req)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const _inmo = (leer("sellos-inmobiliarias.json").inmobiliarias) || {};
  const sellos = { ...((leer("sellos-desarrolladoras.json").desarrolladoras) || {}) };
  for (const [k, v] of Object.entries(_inmo)) sellos["inmo:" + k] = v;
  const _c = leer("sellos-cuits.json");
  const cuits = { ...(_c.cuits || {}) };
  for (const [k, v] of Object.entries(_c.cuits_inmobiliarias || {})) cuits["inmo:" + k] = v;
  const hoy = new Date();
  const hoyIso = hoy.toISOString().slice(0, 10);
  const en45 = new Date(hoy.getTime() + 45 * 864e5).toISOString().slice(0, 10);

  // 1) BCRA
  const bcra = [];
  for (const [slug, c] of Object.entries(cuits)) {
    try {
      const r = await conTimeout(`https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/${c.cuit}`, { headers: { accept: "application/json" } });
      if (r.status === 404) { bcra.push({ slug, ok: true, nota: "sin deudas registradas" }); continue; }
      const j = await r.json();
      const per = (j.results && j.results.periodos && j.results.periodos[0]) || null;
      const peor = per ? Math.max(...per.entidades.map((e) => e.situacion || 1)) : null;
      bcra.push({ slug, ok: peor === 1 || peor === null, periodo: per && per.periodo, peor });
    } catch (e) { bcra.push({ slug, ok: null, nota: "no se pudo consultar: " + e.message }); }
  }

  // 2) URLs de evidencia
  const urls = [];
  for (const [slug, d] of Object.entries(sellos)) for (const s of d.sellos || []) for (const e of s.evidencia || []) for (const u of e.fuentes || []) urls.push({ slug, u });
  const rotas = [];
  for (let i = 0; i < urls.length; i += 8) {
    await Promise.all(urls.slice(i, i + 8).map(async ({ slug, u }) => {
      if (/bcra\.gob\.ar/.test(u)) return;
      try {
        let r = await conTimeout(u, { method: "HEAD", headers: { "user-agent": "Mozilla/5.0 DPP-sellos-check" } });
        if (r.status === 405 || r.status === 403) r = await conTimeout(u, { headers: { "user-agent": "Mozilla/5.0 DPP-sellos-check" } });
        if (r.status >= 400) rotas.push({ slug, u, status: r.status });
      } catch (e) { rotas.push({ slug, u, status: "sin respuesta" }); }
    }));
  }

  // 3) Vencimientos
  const vencen = [], vencidos = [];
  for (const [slug, d] of Object.entries(sellos)) {
    if (d.vence && d.vence < hoyIso) vencidos.push({ slug, vence: d.vence });
    else if (d.vence && d.vence <= en45) vencen.push({ slug, vence: d.vence });
  }

  const alertasBcra = bcra.filter((b) => b.ok === false);
  const mes = hoy.getMonth() + 1;
  const tocaSemestral = mes === 5 || mes === 11;
  const informe = { fecha: hoyIso, desarrolladoras: Object.keys(sellos).length, bcra, alertasBcra, urlsRevisadas: urls.length, rotas, vencen, vencidos, tocaSemestral };

  const li = (arr, f) => arr.length ? "<ul>" + arr.map((x) => `<li>${f(x)}</li>`).join("") + "</ul>" : "<p>Ninguno.</p>";
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1c2431;max-width:640px">
    <h2 style="margin:0 0 8px">Chequeo mensual de sellos · ${hoyIso}</h2>
    <p>${Object.keys(sellos).length} desarrolladoras con sello · ${urls.length} fuentes revisadas · ${bcra.length} CUIT consultados en el BCRA.</p>
    ${tocaSemestral ? '<p style="background:#fff7e0;border:1px solid #e8c766;padding:10px;border-radius:8px"><b>Este mes toca la revalidación semestral.</b> Pedile a Claude: "revalidá los sellos de desarrolladoras" (criterios en Tarea-revalidar-sellos-semestral.md).</p>' : ""}
    <h3>⚠ BCRA: ya no están en situación normal (sacar sello de solidez)</h3>${li(alertasBcra, (b) => `${b.slug}: situación ${b.peor} (período ${b.periodo})`)}
    <h3>Fuentes que no responden (revisar evidencia)</h3>${li(rotas, (r) => `${r.slug}: <a href="${r.u}">${r.u}</a> (${r.status})`)}
    <h3>Sellos que vencen en 45 días</h3>${li(vencen, (v) => `${v.slug}: vence ${v.vence}`)}
    <h3>Sellos vencidos (ya ocultos en el sitio)</h3>${li(vencidos, (v) => `${v.slug}: venció ${v.vence}`)}
  </div>`;
  const hayNovedades = alertasBcra.length || rotas.length || vencen.length || vencidos.length || tocaSemestral;
  let mail = "sin novedades: no se envió";
  if (hayNovedades || new URL(req.url).searchParams.get("forzarMail") === "1") {
    try { await sendMail({ to: CONTACTO, subject: `[Sellos] Chequeo mensual ${hoyIso}${alertasBcra.length ? " · ⚠ BCRA" : ""}`, html, fromName: "Departamentos en Pozo" }); mail = "enviado"; }
    catch (e) { mail = "error: " + e.message; }
  }
  return Response.json({ ok: true, mail, ...informe });
}
