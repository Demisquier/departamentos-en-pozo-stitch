// lib/googleSheets.js — Cliente mínimo de Google Sheets vía service account (sin dependencias).
// Por qué: saca la persistencia de leads del Apps Script (cuyo redeploy está bloqueado) y la
// pasa a Vercel. Cómo: firma un JWT RS256 con la clave de la service account (crypto nativo de
// Node), lo cambia por un access token OAuth y llama a la API REST de Sheets.
// Env: GOOGLE_SA_EMAIL, GOOGLE_SA_KEY (private_key del JSON), LEADS_SHEET_ID.
import crypto from "node:crypto";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API = "https://sheets.googleapis.com/v4/spreadsheets/";
let _tok = null; // { token, exp } cacheado por instancia serverless

export function sheetsReady() {
  return !!(process.env.GOOGLE_SA_EMAIL && process.env.GOOGLE_SA_KEY && process.env.LEADS_SHEET_ID);
}

const b64url = (b) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

async function token() {
  const now = Math.floor(Date.now() / 1000);
  if (_tok && _tok.exp - 60 > now) return _tok.token;
  // Vercel guarda los saltos de línea de la clave como "\n" literales: los restauramos.
  const key = String(process.env.GOOGLE_SA_KEY || "").replace(/\\n/g, "\n");
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: process.env.GOOGLE_SA_EMAIL, scope: SCOPE,
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const sig = crypto.createSign("RSA-SHA256").update(header + "." + claim).sign(key);
  const jwt = header + "." + claim + "." + b64url(sig);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("google_token " + r.status + " " + (j.error || ""));
  _tok = { token: j.access_token, exp: now + (j.expires_in || 3600) };
  return _tok.token;
}

async function call(path, opts = {}) {
  const t = await token();
  const r = await fetch(API + process.env.LEADS_SHEET_ID + path, {
    ...opts,
    headers: { Authorization: "Bearer " + t, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("sheets " + r.status + " " + ((j.error && j.error.message) || ""));
  return j;
}

const q = (range) => encodeURIComponent(range);

// Títulos de las pestañas de la planilla (la primera es la de Leads si no se configura otra).
export async function tabs() {
  const j = await call("?fields=sheets.properties.title");
  return (j.sheets || []).map((s) => s.properties.title);
}

export async function getValues(range) {
  const j = await call("/values/" + q(range));
  return j.values || [];
}

export async function appendRow(tab, row) {
  return call("/values/" + q(tab + "!A1") + ":append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS", {
    method: "POST",
    body: JSON.stringify({ values: [row] }),
  });
}

// Crea una pestaña si no existe (con encabezados). Idempotente.
export async function ensureTab(title, headers) {
  const list = await tabs();
  if (list.includes(title)) return;
  await call(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }) });
  if (headers && headers.length) await appendRow(title, headers);
}
