// lib/mailer.js — Envío de correo saliente desde contacto@ vía SMTP (DonWeb), con nodemailer.
// Toda la config sensible va por variables de entorno en Vercel (nada hardcodeado):
//   SMTP_HOST  -> servidor SMTP de DonWeb (ej: cXXXXXX.ferozo.com)
//   SMTP_PORT  -> 465 (SSL) por defecto
//   SMTP_USER  -> contacto@departamentosenpozo.com.ar (default)
//   SMTP_PASS  -> contraseña del buzón contacto@ (la cargás en Vercel)
//   MAIL_FROM  -> dirección remitente (default = SMTP_USER)
// El remitente real de TODOS los mails pasa a ser contacto@ (no más gmail personal).
import nodemailer from "nodemailer";

const DEFAULT_USER = "contacto@departamentosenpozo.com.ar";
let _t = null;

function transport() {
  if (_t) return _t;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER || DEFAULT_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !pass) return null; // sin credenciales -> no configurado
  _t = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465=SSL, 587=STARTTLS
    auth: { user, pass },
    // tolera certificados del server compartido de DonWeb
    tls: { rejectUnauthorized: false },
  });
  return _t;
}

export function smtpReady() {
  return !!transport();
}

// Envía un mail desde contacto@. Devuelve { ok, id } o lanza si falla.
export async function sendMail({ to, subject, html, text, replyTo, bcc, fromName }) {
  const t = transport();
  if (!t) throw new Error("SMTP no configurado (faltan SMTP_HOST/SMTP_PASS)");
  const addr = process.env.MAIL_FROM || process.env.SMTP_USER || DEFAULT_USER;
  const from = `${fromName || "Departamentos en Pozo"} <${addr}>`;
  const info = await t.sendMail({
    from,
    to,
    subject: subject || "",
    text: text || "",
    html: html || undefined,
    replyTo: replyTo || DEFAULT_USER,
    bcc: bcc || undefined,
    headers: {
      "List-Unsubscribe": "<mailto:" + DEFAULT_USER + "?subject=BAJA>",
      "Auto-Submitted": "auto-generated",
    },
  });
  return { ok: true, id: info && info.messageId };
}
