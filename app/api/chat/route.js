// app/api/chat/route.js — Chat del "Asesor IA" (GPT), env-gated y grounded en el catálogo real.
// GET  → health { ready }.
// POST { messages:[{role,content}], proyecto? } → { reply, sugeridos:[{slug,nombre,url}] }.
// Sin OPENAI_API_KEY: 200 { needsKey:true } (degrada, no rompe). Errores → 200 { error:true }.
import { hasKey, loadCatalogo, prefiltrar, lineaProyecto, fichaUrl, openaiChat } from "../../../lib/ia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `Sos un asesor de inversión en departamentos "en pozo" (preventa/pre-construcción) en CABA y GBA, Argentina, para un portal de ANÁLISIS INDEPENDIENTE (no sos vendedor de ninguna desarrolladora ni inmobiliaria). Tono: español rioplatense, claro, conciso, honesto.
Reglas:
- Usá SOLO los proyectos del CONTEXTO que te paso. NUNCA inventes proyectos, precios, ni desarrolladoras.
- Sé honesto sobre los riesgos del pozo: fideicomiso al costo, avance de obra, ajuste por CAC (índice de la construcción), plazos de entrega. No prometas rentabilidad.
- Cuando recomiendes proyectos, mencioná el nombre y el barrio y sugerí entrar a la ficha para ver precio y forma de pago actualizados.
- Ofrecé, sin presionar, que dejen nombre y WhatsApp para que un asesor humano les pase precio/cuota.
- Respuestas breves (máx ~120 palabras). No uses markdown de tablas.`;

export async function GET() {
  return Response.json({ ready: hasKey() });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { body = {}; }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const proyecto = (body?.proyecto || "").toString().slice(0, 120);

  if (!hasKey()) {
    return Response.json({
      needsKey: true,
      reply: "El asesor con IA todavía no está activo. Mientras tanto, escribinos y un asesor humano te contacta.",
      sugeridos: [],
    });
  }

  try {
    const lastUser = [...messages].reverse().find((m) => m?.role === "user");
    const q = ((lastUser?.content || "") + " " + proyecto).trim();
    const catalogo = await loadCatalogo();
    const top = prefiltrar(catalogo, q, 15);
    const contexto = top.map(lineaProyecto).join("\n") || "(sin proyectos que matcheen la consulta)";

    const chat = [
      { role: "system", content: SYSTEM },
      { role: "system", content: `CONTEXTO — proyectos del catálogo relevantes a la consulta:\n${contexto}` },
      ...messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
        .slice(-10)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1500) })),
    ];

    const reply = (await openaiChat(chat, { temperature: 0.4 })) ||
      "Disculpá, no pude generar una respuesta. ¿Querés dejarme tu WhatsApp y te contacta un asesor?";

    const rl = reply.toLowerCase();
    const sugeridos = top
      .filter((p) => p.nombre && rl.includes(p.nombre.toLowerCase().split("—")[0].trim().slice(0, 18)))
      .slice(0, 4)
      .map((p) => ({ slug: p.slug, nombre: p.nombre, url: fichaUrl(p.slug) }));

    return Response.json({ reply, sugeridos });
  } catch {
    return Response.json({
      error: true,
      reply: "Disculpá, tuve un problema para procesar tu consulta. Probá de nuevo en un momento o dejanos tu WhatsApp y te contactamos.",
      sugeridos: [],
    });
  }
}
