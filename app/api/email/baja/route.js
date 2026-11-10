// app/api/email/baja/route.js — Baja en un clic de los mails a compradores.
//   GET  /api/email/baja/?e=<email>&t=<token>  → valida el token, registra la baja y muestra
//        una página simple "Listo, no te vamos a mandar más mails".
//   POST /api/email/baja/?e=<email>&t=<token>  → one-click RFC 8058 (lo dispara Gmail/Yahoo/etc.
//        con body "List-Unsubscribe=One-Click"). Mismo efecto, responde texto plano.
// Ambos reenvían al webhook del Apps Script (SHEET_WEBHOOK) un POST JSON
//   { tipo: "baja", email, origen: "baja", via: "get"|"one-click", fecha }
// que el Apps Script guarda en la pestaña "Bajas" (suppression list de todos los flujos).
// Token inválido → 400.
import { verificarBaja, normEmail } from "../../../../lib/emailBaja";
import { SHEET_WEBHOOK } from "../../../../lib/leadPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function registrarBaja(email, via) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(SHEET_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ tipo: "baja", email, origen: "baja", via, fecha: new Date().toISOString() }),
      signal: ctrl.signal,
    });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

function pagina(titulo, texto, status = 200) {
  const html =
'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<meta name="robots" content="noindex,nofollow"><title>' + esc(titulo) + ' | Departamentos en Pozo</title></head>' +
'<body style="margin:0;padding:0;background:#eef1f6;font-family:Arial,Helvetica,sans-serif">' +
'<div style="max-width:520px;margin:48px auto;padding:0 16px">' +
'<div style="background:#0f1f3d;border-radius:16px 16px 0 0;padding:22px 24px">' +
'<div style="color:#c19a3e;font-size:12px;letter-spacing:2px;font-weight:bold">DEPARTAMENTOS EN POZO</div></div>' +
'<div style="background:#ffffff;border-radius:0 0 16px 16px;padding:26px 24px">' +
'<h1 style="font-family:Georgia,\'Times New Roman\',serif;color:#0f1f3d;font-size:24px;line-height:1.25;margin:0 0 12px 0">' + esc(titulo) + '</h1>' +
'<p style="color:#1c2431;font-size:15px;line-height:1.6;margin:0 0 18px 0">' + texto + '</p>' +
'<a href="https://departamentosenpozo.com.ar/" style="display:inline-block;background:#0f1f3d;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:11px 20px;border-radius:8px">Ir al sitio</a>' +
'</div></div></body></html>';
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function params(req) {
  const u = new URL(req.url);
  return { email: normEmail(u.searchParams.get("e")), token: (u.searchParams.get("t") || "").trim() };
}

export async function GET(req) {
  // GET NO da de baja: muestra un botón de confirmación (POST). Así los escáneres de links
  // corporativos (Outlook SafeLinks, antivirus) no disparan bajas no deseadas.
  const { email, token } = params(req);
  if (!verificarBaja(email, token)) {
    return pagina("Link inválido", "Este link de baja no es válido o está incompleto. Si querés dejar de recibir mails, respondé <b>BAJA</b> a cualquiera de nuestros correos.", 400);
  }
  const action = "/api/email/baja/?e=" + encodeURIComponent(email) + "&t=" + encodeURIComponent(token);
  return pagina("¿Dejar de recibir mails?", "Vas a dar de baja <b>" + esc(email) + "</b> de nuestras recomendaciones y alertas.</p>" +
    '<form method="POST" action="' + esc(action) + '" style="margin:0 0 14px 0"><button type="submit" style="background:#c19a3e;color:#0f1f3d;border:0;font-size:15px;font-weight:bold;padding:12px 22px;border-radius:8px;cursor:pointer">Confirmar baja</button></form><p style="margin:0">');
}

export async function POST(req) {
  const { email, token } = params(req);
  if (!verificarBaja(email, token)) {
    return new Response("invalid_token", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  // RFC 8058: el body es "List-Unsubscribe=One-Click" (form-urlencoded). Lo leemos sólo para
  // registrar la vía; no lo exigimos (algunos clientes mandan multipart o vacío).
  let body = "";
  try { body = await req.text(); } catch {}
  const via = /List-Unsubscribe=One-Click/i.test(body) ? "one-click" : "post";
  const ok = await registrarBaja(email, via);
  if (via === "post") {
    return ok
      ? pagina("Listo, no te vamos a mandar más mails", "Dimos de baja <b>" + esc(email) + "</b> de nuestras recomendaciones y alertas. Si fue un error, podés volver a activar tus alertas cuando quieras desde el sitio.")
      : pagina("No pudimos procesar la baja", "Tuvimos un problema técnico. Probá de nuevo en un rato o respondé <b>BAJA</b> a cualquiera de nuestros correos.", 502);
  }
  return new Response(ok ? "ok" : "error", { status: ok ? 200 : 502, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
