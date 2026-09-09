// app/api/chat/route.js — Chat del "Asesor IA" (GPT), env-gated y grounded en el catálogo real.
// GET  → health { ready }.
// POST { messages:[{role,content}], proyecto? } → { reply, sugeridos:[{slug,nombre,barrio,precioDesde,imagen,url}], verMas }.
// `sugeridos` = top del PREFILTRO determinístico (hasta 8) → hay cards aunque el LLM no
// nombre proyectos, y el LLM NO gasta tokens enumerándolos (las cards salen del catálogo).
// Sin OPENAI_API_KEY: 200 { needsKey:true } (degrada, no rompe). Errores → 200 { error:true }.
import { hasKey, loadCatalogo, prefiltrar, lineaProyecto, fichaUrl, openaiChat } from "../../../lib/ia";
import { SITE } from "../../../lib/wp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATALOGO_URL = SITE + "/desarrollos-inmobiliarios/";

const SYSTEM = `Sos un asesor de inversión en departamentos "en pozo" (preventa/pre-construcción) en CABA y GBA, Argentina, para un portal de ANÁLISIS INDEPENDIENTE (no sos vendedor de ninguna desarrolladora ni inmobiliaria). Tono: español rioplatense, claro, conciso, honesto.
Reglas:
- Usá SOLO los proyectos del CONTEXTO que te paso. NUNCA inventes proyectos, precios, ni desarrolladoras.
- No enumeres más de 1-2 proyectos en el texto: el usuario ve TARJETAS con más opciones abajo. Orientá con criterio (barrio, presupuesto, riesgos) en vez de listar fichas.
- Sé honesto sobre los riesgos del pozo: fideicomiso al costo, avance de obra, ajuste por CAC (índice de la construcción), plazos de entrega. No prometas rentabilidad.
- Cuando menciones un proyecto, decí nombre y barrio y sugerí entrar a la ficha para ver precio y forma de pago actualizados.
- Ofrecé, sin presionar, que dejen nombre y WhatsApp para que un asesor humano les pase precio/cuota.
- Respuestas breves (máx ~90 palabras). No uses markdown de tablas.`;

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
    const top = prefiltrar(catalogo, q, 15);
    const contexto = top.map(lineaProyecto).join("\n") || "(sin proyectos que matcheen la consulta)";

    // Cards = top del prefiltro (hasta 8), armadas desde el catálogo (sin costo de tokens).
    const sugeridos = top.slice(0, 8).map((p) => ({
      slug: p.slug,
      nombre: p.nombre,
      barrio: p.barrio || "",
      precioDesde: p.precioDesde || null,
      ambientes: p.ambientes || "",
      entrega: p.entrega || "",
      imagen: p.imagen || "",
      url: fichaUrl(p.slug),
    }));
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
