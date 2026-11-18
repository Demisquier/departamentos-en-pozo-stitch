// Revisión diaria de la bandeja contacto@ (Vercel Cron vía /api/cron/diario).
// Lee los mails NO LEÍDOS de los últimos 3 días por IMAP (mismas credenciales SMTP del sitio) y:
//  - Marca como leídos los avisos automáticos que no requieren nada (copias de leads, alertas,
//    feedback de leads, newsletters/portales).
//  - Detecta lo que SÍ requiere acción: respuestas de personas, rebotes, altas de inmobiliarias,
//    pedidos de baja. Esos quedan sin leer y se resumen en un único mail a contacto@.
// Si no hay nada para hacer, no manda nada.
import { ImapFlow } from "imapflow";
import { sendMail } from "../../../../lib/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONTACTO = "contacto@departamentosenpozo.com.ar";

function autorizado(req) {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (process.env.MAIL_SECRET && url.searchParams.get("secret") === process.env.MAIL_SECRET) return true;
  if (!process.env.CRON_SECRET && /vercel-cron/i.test(req.headers.get("user-agent") || "")) return true;
  return false;
}

const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Asuntos de avisos propios que no requieren acción.
const AUTO_PROPIO = /^\s*(\[Lead\]|\[Alerta\]|\[Feedback lead\]|Tu alerta está activa|Nueva consulta por|Chequeo de leads)/i;
const ACCION_PROPIA = /^\s*(\[Alta inmobiliaria\]|⚠)/i;
const NEWSLETTER = /(zonaprop|argenprop|mercadolibre|medium\.com|linkedin|noreply|no-reply|newsletter|notifications?@|news@|mailchimp|hubspot)/i;
const BAJA = /\b(dar de baja|baja de la publicaci|retir(ar|en) la publicaci|no (hemos )?autoriza|eliminar (el|la) (aviso|publicaci|ficha))/i;

function clasificar(m) {
  const from = (m.from || "").toLowerCase();
  const subj = m.subject || "";
  if (/mailer-daemon|postmaster/.test(from)) return { tipo: "rebote", accion: "Rebote: hay que corregir el email de destino." };
  if (from.includes(CONTACTO)) {
    if (ACCION_PROPIA.test(subj)) return { tipo: "accion", accion: /Alta inmobiliaria/i.test(subj) ? "Alta de inmobiliaria: verificar matrícula y aprobar." : "Aviso con advertencia: revisar." };
    if (AUTO_PROPIO.test(subj)) return { tipo: "auto" };
    return { tipo: "auto" };
  }
  if (NEWSLETTER.test(from)) return { tipo: "auto" };
  if (BAJA.test(subj + " " + (m.snippet || ""))) return { tipo: "accion", accion: "Pide la BAJA de una publicación: bajarla y responder." };
  return { tipo: "accion", accion: "Respuesta de una persona: leer y responder." };
}

export async function GET(req) {
  if (!autorizado(req)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const host = process.env.IMAP_HOST || String(process.env.SMTP_HOST || "").replace(/^smtp\./, "imap.");
  const user = process.env.IMAP_USER || process.env.SMTP_USER || CONTACTO;
  const pass = process.env.IMAP_PASS || process.env.SMTP_PASS;
  if (!host || !pass) return Response.json({ ok: false, error: "IMAP no configurado (IMAP_HOST/IMAP_PASS o SMTP_*)" }, { status: 500 });

  const client = new ImapFlow({ host, port: Number(process.env.IMAP_PORT || 993), secure: true, auth: { user, pass }, logger: false });
  const acciones = [], autoUids = [];
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date(Date.now() - 3 * 864e5);
      const uids = await client.search({ seen: false, since }, { uid: true });
      if (uids && uids.length) {
        for await (const msg of client.fetch(uids.slice(-150), { envelope: true, uid: true, bodyParts: ["TEXT"] }, { uid: true })) {
          const env = msg.envelope || {};
          const from = env.from && env.from[0] ? `${env.from[0].name || ""} <${env.from[0].address || ""}>` : "";
          let snippet = "";
          try { snippet = Buffer.from(msg.bodyParts.get("TEXT") || "").toString("utf8").replace(/<[^>]+>/g, " ").replace(/=\r?\n/g, "").replace(/\s+/g, " ").slice(0, 400); } catch (e) {}
          const m = { from, subject: env.subject || "(sin asunto)", snippet, date: env.date };
          const c = clasificar(m);
          if (c.tipo === "auto") autoUids.push(msg.uid);
          else acciones.push({ ...m, ...c });
        }
        if (autoUids.length) await client.messageFlagsAdd(autoUids, ["\\Seen"], { uid: true });
      }
    } finally { lock.release(); }
    await client.logout();
  } catch (e) {
    try { await client.logout(); } catch (x) {}
    try { await sendMail({ to: CONTACTO, subject: "⚠ Revisión diaria de mails: no pude leer la bandeja", html: `<p>Error IMAP: ${esc(e.message)}</p><p>Pedile a Claude que lo revise.</p>` }); } catch (x) {}
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }

  if (acciones.length) {
    const html = `<p><b>${acciones.length} mail(s) en contacto@ requieren algo</b> (quedan sin leer en la bandeja). Ya marqué como leídos ${autoUids.length} avisos automáticos.</p><ol>` +
      acciones.map((a) => `<li style="margin-bottom:10px"><b>${esc(a.accion)}</b><br>De: ${esc(a.from)}<br>Asunto: ${esc(a.subject)}<br><span style="color:#5b6675">${esc(a.snippet.slice(0, 250))}…</span></li>`).join("") +
      `</ol><p>Pedile a Claude: “resolvé los accionables de los mails de hoy”.</p>`;
    try { await sendMail({ to: CONTACTO, subject: `[Accionables] ${acciones.length} mail(s) para resolver`, html }); } catch (e) {}
  }
  return Response.json({ ok: true, accionables: acciones.length, marcadosLeidos: autoUids.length, acciones: acciones.map(({ from, subject, accion }) => ({ from, subject, accion })) });
}
