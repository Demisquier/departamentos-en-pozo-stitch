// app/api/chat/route.js — Chat del "Asesor IA" (GPT), env-gated y grounded en el catálogo real.
// GET  → health { ready }.
// POST { messages:[{role,content}], proyecto? } → { reply, sugeridos:[{slug,nombre,barrio,precioDesde,imagen,url}], verMas }.
// `sugeridos` = top del PREFILTRO determinístico (hasta 8) → hay cards aunque el LLM no
// nombre proyectos, y el LLM NO gasta tokens enumerándolos (las cards salen del catálogo).
// Sin OPENAI_API_KEY: 200 { needsKey:true } (degrada, no rompe). Errores → 200 { error:true }.
import { hasKey, loadCatalogo, prefiltrarHits, lineaProyecto, cardFrom, dedupeBySlug, openaiChat } from "../../../lib/ia";
import { SITE } from "../../../lib/wp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATALOGO_URL = SITE + "/desarrollos-inmobiliarios/";

const SYSTEM = `Sos Valentina, asesora de inversión en departamentos "en pozo" (preventa) en CABA y GBA, para un portal de ANÁLISIS INDEPENDIENTE (no vendés de ninguna desarrolladora ni inmobiliaria). Tono: español rioplatense, cálido, claro y breve.
Tu objetivo doble: (1) ayudar de verdad y (2) conseguir que la persona deje su contacto para que el desarrollador le pase datos concretos.
Reglas:
- Usá SOLO los proyectos del CONTEXTO. NUNCA inventes proyectos, precios ni desarrolladoras.
- No enumeres más de 1-2 proyectos en el texto: el usuario ve TARJETAS con más opciones abajo. Orientá con criterio (barrio, presupuesto, riesgos).
- Sé honesta con los riesgos del pozo: fideicomiso, avance de obra, ajuste por CAC (índice de la construcción), plazos de entrega. No prometas rentabilidad.
- CONVERSIÓN (value-first): cuando muestres proyectos o la persona pregunte precio, cuota, entrega, financiación o disponibilidad, ofrecé de forma concreta que el desarrollador le pase esos datos actualizados por WhatsApp y pedile NOMBRE y WHATSAPP. Ej: "Si querés, el desarrollador te pasa precio, cuota y disponibilidad de [proyecto] por WhatsApp — ¿me dejás tu nombre y número?". Una sola vez por turno, sin insistir de más.
- Respuestas breves (máx ~90 palabras). No uses tablas markdown.`;

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
      verMas: CATALOGO_URL,
    });
  }

  try {
    const lastUser = [...messages].reverse().find((m) => m?.role === "user");
    const q = ((lastUser?.content || "") + " " + proyecto).trim();
    const catalogo = await loadCatalogo();
    const { hit, hits } = prefiltrarHits(catalogo, q, 15);
    const top = dedupeBySlug(hits); // nunca el mismo proyecto 2 veces
    // Si NO hubo match real (cayó al fallback), no le damos proyectos al LLM ni pintamos
    // cards: mejor orientar sin nombrar fichas random.
    const contexto = hit ? top.map(lineaProyecto).join("\n") : "(sin proyectos que matcheen la consulta)";

    // Cards = top del prefiltro (hasta 8), armadas y sanitizadas desde el catálogo
    // (sin costo de tokens). Vacío cuando no hubo match real.
    const sugeridos = hit ? top.slice(0, 8).map(cardFrom) : [];
    const verMas = q
      ? SITE + "/buscar/#q=" + encodeURIComponent(q).slice(0, 300)
      : CATALOGO_URL;

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

    return Response.json({ reply, sugeridos, verMas });
  } catch {
    return Response.json({
      error: true,
      reply: "Disculpá, tuve un problema para procesar tu consulta. Probá de nuevo en un momento o dejanos tu WhatsApp y te contactamos.",
      sugeridos: [],
      verMas: CATALOGO_URL,
    });
  }
}
