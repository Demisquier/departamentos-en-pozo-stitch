// /api/panel/link — manda a contacto@ (destino fijo) el link privado del panel de métricas
// y los links por empresa. No expone nada en la respuesta: el link solo llega a la bandeja propia.
import { sendMail } from "../../../../lib/resend";
import { panelUrl, metricasActivas } from "../../../../lib/metricas";

export const dynamic = "force-dynamic";
const CONTACTO = "contacto@departamentosenpozo.com.ar";
let ultimo = 0;

export async function GET() {
  const url = panelUrl();
  if (!url) return Response.json({ ok: false, error: "sin_secreto" }, { status: 500 });
  if (Date.now() - ultimo < 60e3) return Response.json({ ok: true, enviado: "ya enviado hace <1 min" });
  ultimo = Date.now();
  const html = `<p>Link privado del panel de métricas (no compartir):</p><p><a href="${url}">${url}</a></p>` +
    `<p>Desde el panel, la columna "Reporte" tiene el link privado de cada desarrolladora/inmobiliaria.</p>` +
    `<p style="color:#666">Almacenamiento: ${metricasActivas() ? "Google Sheets (pestaña Metricas) ✓" : "⚠ Google Sheets no configurado"}</p>`;
  await sendMail({ to: CONTACTO, subject: "🔑 Link del panel de métricas", html });
  return Response.json({ ok: true, enviado: "contacto@" });
}
