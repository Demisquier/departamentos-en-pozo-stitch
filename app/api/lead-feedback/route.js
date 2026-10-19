// app/api/lead-feedback/route.js — Loop con la desarrolladora/inmobiliaria.
// Links firmados del mail del lead: "Ya lo contacté" / "No pude" / "Cambiar a dónde recibo".
// Cada clic te llega a contacto@ como "[Feedback lead]" (asunto filtrable en Gmail) → tasa de
// contacto por desarrolladora. "Cambiar" abre el formulario firmado para cargar el nuevo destino.
import { firmarFeedback, firmar } from "../../../lib/leadPipeline";
import { sendMail, resendReady } from "../../../lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTACTO = "contacto@departamentosenpozo.com.ar";
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const page = (body) => new Response(
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
  '<title>Departamentos en Pozo</title><body style="font-family:Arial,sans-serif;max-width:460px;margin:40px auto;padding:0 16px;color:#1c2431">' + body + "</body>",
  { headers: { "Content-Type": "text/html; charset=utf-8" } });

const TXT = { contactado: "Ya lo contacté", no: "No pude contactarlo", cambiar: "Quiere cambiar el destino" };

export async function GET(req) {
  const u = new URL(req.url);
  const a = u.searchParams.get("a") || "", id = u.searchParams.get("id") || "", to = u.searchParams.get("to") || "";
  const n = u.searchParams.get("n") || "", p = u.searchParams.get("p") || "", t = u.searchParams.get("t") || "";
  if (!TXT[a] || !id || !to || t !== firmarFeedback(id, a, to)) return page("<p>Link inválido o vencido.</p>");

  if (resendReady()) {
    await sendMail({ to: CONTACTO, subject: "[Feedback lead] " + (n || to) + ": " + TXT[a] + " — " + (p || "proyecto"),
      html: "<p><b>" + esc(n) + "</b> &lt;" + esc(to) + "&gt; respondió: <b>" + TXT[a] + "</b><br>Proyecto: " + esc(p) + "<br>Lead id: " + esc(id) + "</p>" }).catch(() => {});
  }

  if (a === "cambiar") {
    const url = "/api/inmo-contacto?n=" + encodeURIComponent(n || to) + "&p=" + encodeURIComponent(p) + "&t=" + firmar(n || to);
    return Response.redirect(new URL(url, u.origin), 302);
  }
  const extra = a === "no"
    ? "<p>Gracias por avisar. Si el contacto que dejó no funciona, respondé el mail original y lo revisamos.</p>"
    : "<p>¡Gracias! Nos ayuda a seguir enviándote consultas de calidad.</p>";
  return page('<h2 style="color:#0f1f3d">Registrado ✓</h2>' + extra +
    '<p style="font-size:13px;color:#5b6675">¿Querés recibir las consultas en otro mail o WhatsApp? Respondé el mail del lead y lo cambiamos.</p>');
}
