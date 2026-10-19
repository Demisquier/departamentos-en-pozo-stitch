// app/api/lead/route.js — Proxy server-side ÚNICO para todos los leads del sitio.
// El cliente postea acá (mismo origen) con { sheet?, mail? }. Honeypot + rate-limit.
// Dos modos (switch por env, sin tocar el front):
//  • LEADS_PIPELINE=vercel (+ service account configurada): todo corre acá — planilla vía Sheets
//    API, ruteo inmobiliaria > desarrolladora > contacto@, copia interna y similares (lib/leadPipeline).
//    El Apps Script deja de intervenir en los leads → sin doble mail y sin depender de su redeploy.
//  • Por defecto: reenvía al webhook del Apps Script (comportamiento histórico).
import { pipelineVercelActivo, procesarLead, SHEET_WEBHOOK } from "../../../lib/leadPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;


// Rate-limit best-effort en memoria (por instancia serverless).
const HITS = new Map();
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 8;
function limited(ip) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 5000) HITS.clear();
  return arr.length > MAX_PER_WINDOW;
}

// Dedup: misma persona (WhatsApp o email) + mismo proyecto dentro de 12 h = 1 solo lead.
// Evita que la desarrolladora reciba 2-3 mails cuando alguien usa "quiero info" + WhatsApp
// + chat en la misma ficha. Best-effort en memoria (por instancia; Fluid reutiliza instancias).
const SEEN = new Map();
const DEDUP_MS = 12 * 3600 * 1000;
function dedupKey(s) {
  const wa = String(s.whatsapp || "").replace(/\D/g, "").slice(-8);
  const em = String(s.email || "").trim().toLowerCase();
  const who = wa.length >= 8 ? "w" + wa : em ? "e" + em : "";
  if (!who) return "";
  const proj = String(s.proyectoSlug || s.proyecto || s.mensaje || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  return who + "|" + proj;
}
function esDuplicado(s) {
  const k = dedupKey(s);
  if (!k) return false;
  const now = Date.now();
  if (SEEN.size > 5000) for (const [kk, t] of SEEN) if (now - t > DEDUP_MS) SEEN.delete(kk);
  const prev = SEEN.get(k);
  if (prev && now - prev < DEDUP_MS) return true;
  SEEN.set(k, now);
  return false;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  // Honeypot: si viene relleno (bot), fingimos éxito y no hacemos nada.
  if (body && (body._gotcha || (body.sheet && body.sheet._gotcha))) return Response.json({ ok: true });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "0";
  if (limited(ip)) return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const sheet = body && typeof body.sheet === "object" ? body.sheet : null;
  const mail = body && typeof body.mail === "object" ? body.mail : null;
  if (!sheet && !mail) return Response.json({ ok: false, error: "empty" }, { status: 422 });

  // Validación mínima: un lead de contacto necesita al menos email o whatsapp.
  const email = ((sheet && sheet.email) || (mail && (mail.Email || mail._replyto)) || "").toString().trim();
  const whatsapp = ((sheet && sheet.whatsapp) || (mail && mail.WhatsApp) || "").toString().trim();
  const isIntake = sheet && sheet.tipo === "intake";
  if (!isIntake && !email && !whatsapp) return Response.json({ ok: false, error: "missing_contact" }, { status: 422 });
  if (!sheet) return Response.json({ ok: true }); // sólo "mail" (legacy FormSubmit, desactivado)
  if (!isIntake && esDuplicado(sheet)) return Response.json({ ok: true, dedup: true });

  // Modo Vercel: pipeline propio.
  if (pipelineVercelActivo()) {
    try {
      const r = await procesarLead(sheet);
      return Response.json({ ok: true, modo: "vercel", destino: r.destino || null });
    } catch (e) {
      // Si algo inesperado falla, no perdemos el lead: cae al Apps Script como red de seguridad.
      console.error("leadPipeline", e && e.message);
    }
  }

  // Modo histórico: Apps Script (guarda en la planilla + rutea + manda mails).
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(SHEET_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(sheet),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return Response.json({ ok: r.ok }, { status: r.ok ? 200 : 502 });
  } catch {
    clearTimeout(t);
    return Response.json({ ok: false, error: "network" }, { status: 502 });
  }
}
