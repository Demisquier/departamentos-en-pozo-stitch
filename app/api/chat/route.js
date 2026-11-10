// app/api/chat/route.js — Chat del "Asesor IA" (GPT), env-gated y grounded en el catálogo real.
// GET  → health { ready }.
// POST { messages:[{role,content}], proyecto? } → { reply, sugeridos:[{slug,nombre,barrio,precioDesde,imagen,url}], verMas }.
// `sugeridos` = top del PREFILTRO determinístico (hasta 8) → hay cards aunque el LLM no
// nombre proyectos, y el LLM NO gasta tokens enumerándolos (las cards salen del catálogo).
// Cuando la consulta menciona un barrio, inyecta DATOS DE MERCADO (precio/m² y desde
// mediana) para que Valentina responda con datos reales = más confianza y conversión.
// Sin OPENAI_API_KEY: 200 { needsKey:true } (degrada, no rompe). Errores → 200 { error:true }.
import { hasKey, loadCatalogo, prefiltrarHits, lineaProyecto, cardFrom, dedupeBySlug, openaiChat, detectBarrio, statsBarrio, parseBudget } from "../../../lib/ia";
import { guardarAlertaServer } from "../../../lib/alertaServer";
import { landingDeBarrio, BARRIO_CATALOGO } from "../../../lib/barrios";
import { SITE } from "../../../lib/wp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATALOGO_URL = SITE + "/desarrollos-inmobiliarios/";

const SYSTEM = `Sos Valentina, asesora de inversión en departamentos "en pozo" (preventa) en CABA y GBA, para un portal de ANÁLISIS INDEPENDIENTE (no vendés de ninguna desarrolladora ni inmobiliaria). Tono: español rioplatense, cálido, claro y breve.
Tu objetivo doble: (1) ayudar de verdad y (2) conseguir que la persona deje su contacto para que el desarrollador le pase datos concretos.
Reglas:
- Usá SOLO los proyectos del CONTEXTO. NUNCA inventes proyectos, precios ni desarrolladoras.
- No enumeres más de 1-2 proyectos en el texto: el usuario ve TARJETAS con más opciones abajo. Orientá con criterio (barrio, presupuesto, riesgos).
- Si en el CONTEXTO hay "DATOS DE MERCADO" del barrio, usalos para dar una lectura corta y con números (cantidad de proyectos, precio/m² o precio desde mediana). Da confianza y te posiciona como analista, no como vendedor.
- Sé honesta con los riesgos del pozo: fideicomiso, avance de obra, ajuste por CAC (índice de la construcción), plazos de entrega. No prometas rentabilidad.
- CONVERSIÓN (value-first): cuando muestres proyectos o la persona pregunte precio, cuota, entrega, financiación o disponibilidad, ofrecé de forma concreta que el desarrollador le pase esos datos actualizados por WhatsApp y pedile NOMBRE y WHATSAPP. Ej: "Si querés, el desarrollador te pasa precio, cuota y disponibilidad de [proyecto] por WhatsApp — ¿me dejás tu nombre y número?". Una sola vez por turno, sin insistir de más.
- Respuestas breves (máx ~90 palabras). No uses tablas markdown.
- Escribí SIEMPRE como en un chat de WhatsApp: 1 a 3 frases seguidas, tono charlado. NADA de encabezados, viñetas, listas numeradas, negritas ni "fichas" de texto. Si necesitás un dato de la persona (nombre, WhatsApp, zona, presupuesto), pedilo conversando, uno por vez, dentro de la charla.
- ALERTAS: cuando la persona no encuentra lo que busca (no hay proyectos que matcheen, el presupuesto no alcanza, "nada me convence") o cuando la charla se está cerrando ("gracias", "lo pienso", "después veo"), ofrecé crear una ALERTA por email con su barrio y presupuesto. Ej: "Si querés, te armo una alerta y te aviso por mail apenas salga algo en [barrio] hasta USD [presupuesto]. ¿A qué email te escribo?". Usá la palabra "alerta" y pedí el EMAIL. Una sola vez por conversación; si ya dio el email, no lo vuelvas a pedir.
- Si en el CONTEXTO aparece "ALERTA CREADA", confirmá en una frase que la alerta quedó activa (barrio y tope si los hay) y que puede darse de baja con un clic desde cualquier mail.`;

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

    // Analista de barrio: si la consulta nombra un barrio, sumamos datos de mercado reales.
    const barrioDet = detectBarrio(catalogo, q);
    const mkt = statsBarrio(catalogo, barrioDet);
    const contextoMkt = mkt
      ? `\n\nDATOS DE MERCADO (${mkt.barrio}): ${mkt.n} proyectos en pozo${mkt.desdeMed ? `, precio desde mediana USD ${mkt.desdeMed.toLocaleString("es-AR")}` : ""}${mkt.m2Med ? `, precio/m² mediana USD ${mkt.m2Med.toLocaleString("es-AR")}` : ""}.`
      : "";

    // Cards = top del prefiltro (hasta 8), armadas y sanitizadas desde el catálogo
    // (sin costo de tokens). Vacío cuando no hubo match real.
    const sugeridos = hit ? top.slice(0, 8).map(cardFrom) : [];
    const verMas = q
      ? SITE + "/buscar/#q=" + encodeURIComponent(q).slice(0, 300)
      : CATALOGO_URL;

    // Alerta desde el chat (sin tools): si Valentina ofreció una alerta en su último mensaje y
    // el usuario respondió con un email → alta como lead origen "Alerta" (zonas = barrio detectado
    // en la charla, presupuesto = el que mencionó). Se le avisa al LLM para que lo confirme.
    let alerta = null;
    const idxUser = messages.lastIndexOf(lastUser);
    const prevAsis = [...messages.slice(0, idxUser)].reverse().find((m) => m?.role === "assistant");
    const emailUser = String(lastUser?.content || "").match(/[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/i);
    if (emailUser && prevAsis && /alerta|te aviso|avisarte|avisamos/i.test(String(prevAsis.content || ""))) {
      const textoUser = messages.filter((m) => m?.role === "user").map((m) => String(m.content || "")).join(" ").replace(/[^\s@]+@[^\s@]+/g, " ");
      const bDet = detectBarrio(catalogo, textoUser + " " + proyecto);
      const sl = bDet ? landingDeBarrio(bDet) : null;
      const zonas = sl ? BARRIO_CATALOGO[sl].label : (bDet || "");
      const presupuesto = parseBudget(textoUser) || "";
      const ambM = textoUser.match(/(\d)\s*(?:amb|ambientes|dorm)/i) || (/monoambiente/i.test(textoUser) ? [null, "1"] : null);
      const r = await guardarAlertaServer({
        email: emailUser[0], zonas, presupuesto, ambientes: ambM ? ambM[1] : "", fuente: "chat",
        mensaje: "Alerta creada desde el chat de Valentina" + (proyecto ? " · contexto: " + proyecto : ""),
      }).catch(() => ({ ok: false }));
      alerta = { ok: !!r.ok, email: emailUser[0], zonas: zonas || "abierto", presupuesto: presupuesto || null };
    }

    const chat = [
      { role: "system", content: SYSTEM },
      { role: "system", content: `CONTEXTO — proyectos del catálogo relevantes a la consulta:\n${contexto}${contextoMkt}${alerta && alerta.ok ? `\n\nALERTA CREADA para ${alerta.email}: zonas ${alerta.zonas === "abierto" ? "todo CABA" : alerta.zonas}${alerta.presupuesto ? `, hasta USD ${Number(alerta.presupuesto).toLocaleString("es-AR")}` : ""}.` : ""}` },
      ...messages
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
        .slice(-10)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1500) })),
    ];

    const reply = (await openaiChat(chat, { temperature: 0.4 })) ||
      "Disculpá, no pude generar una respuesta. ¿Querés dejarme tu WhatsApp y te contacta un asesor?";

    return Response.json({ reply, sugeridos, verMas, alerta });
  } catch {
    return Response.json({
      error: true,
      reply: "Disculpá, tuve un problema para procesar tu consulta. Probá de nuevo en un momento o dejanos tu WhatsApp y te contactamos.",
      sugeridos: [],
      verMas: CATALOGO_URL,
    });
  }
}
