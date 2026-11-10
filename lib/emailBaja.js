// lib/emailBaja.js — Baja en un clic (unsubscribe) para los mails a compradores.
// Link firmado con HMAC-SHA256 (MAIL_SECRET, mismo secreto que lib/leadPipeline `firmar`):
//   https://departamentosenpozo.com.ar/api/email/baja/?e=<email>&t=<token>
// El token sólo lo puede generar el server (o el Apps Script, que conoce MAIL_SECRET):
//   token = hex(HMAC_SHA256(MAIL_SECRET, "baja:" + email.trim().toLowerCase())).slice(0, 32)
import crypto from "node:crypto";

export const SITE = "https://departamentosenpozo.com.ar";
export const MAILTO_BAJA = "mailto:contacto@departamentosenpozo.com.ar?subject=BAJA";

export function normEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function tokenBaja(email) {
  return crypto
    .createHmac("sha256", String(process.env.MAIL_SECRET || "x"))
    .update("baja:" + normEmail(email))
    .digest("hex")
    .slice(0, 32);
}

// Comparación en tiempo constante (evita timing attacks sobre el token).
export function verificarBaja(email, token) {
  const e = normEmail(email);
  const t = String(token || "");
  if (!e || e.indexOf("@") < 0 || t.length !== 32) return false;
  const ok = tokenBaja(e);
  try { return crypto.timingSafeEqual(Buffer.from(ok), Buffer.from(t)); } catch { return false; }
}

export function urlBaja(email) {
  const e = normEmail(email);
  if (!e || e.indexOf("@") < 0) return "";
  return SITE + "/api/email/baja/?e=" + encodeURIComponent(e) + "&t=" + tokenBaja(e);
}

// Valor del header List-Unsubscribe (RFC 2369 + RFC 8058): URL https + mailto de respaldo.
export function listUnsubscribeHeaders(url) {
  const u = String(url || "").trim();
  if (!/^https:\/\//i.test(u)) return { "List-Unsubscribe": "<" + MAILTO_BAJA + ">" };
  return {
    "List-Unsubscribe": "<" + u + ">, <" + MAILTO_BAJA + ">",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
