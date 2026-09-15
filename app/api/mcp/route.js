// app/api/mcp/route.js — Servidor MCP (Model Context Protocol) del catálogo de Departamentos en Pozo.
// Transporte: Streamable HTTP (JSON-RPC 2.0 por POST). Sin auth (catálogo público).
// Sirve para: ChatGPT (Developer Mode / Responses API), Claude, y cualquier cliente MCP.
// Tools: search, fetch (contrato de conectores de ChatGPT) + filtrar (búsqueda estructurada)
//        + capturar_lead (postea al proxy /api/lead → rutea al dev + contacto@).
import { getDesarrollos, acf } from "../../../lib/wp";
import { toNumber } from "../../../lib/format";
import { mapDesarrollos } from "../../../lib/catalogo";

export const runtime = "nodejs";
export const revalidate = 3600;

const SITE = "https://www.departamentosenpozo.com.ar";
const PROTOCOL_DEFAULT = "2025-06-18";

// ---- Catálogo (cacheado por revalidate) ----
let _cache = null, _cacheAt = 0;
async function catalogo() {
  const now = Date.now();
  if (_cache && now - _cacheAt < 3600000) return _cache;
  const raw = await getDesarrollos();
  const mapped = mapDesarrollos(raw || []);
  _cache = mapped; _cacheAt = now;
  return mapped;
}

function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function fichaUrl(slug) { return `${SITE}/desarrollos-inmobiliarios/${slug}/`; }

// Texto compacto de una ficha (para el snippet de search y el body de fetch).
function fichaTexto(m) {
  const partes = [
    m.nombre,
    m.barrio ? `Barrio: ${m.barrio}` : "",
    m.direccion ? `Dirección: ${m.direccion}` : "",
    m.precioLabel ? `Precio: ${m.precioLabel}` : "",
    m.ambientes ? `Tipologías: ${m.ambientes}` : "",
    m.entrega ? `Entrega: ${m.entrega}` : "",
    m.etapa ? `Estado: ${m.etapa}` : "",
    m.desarrolladora ? `Desarrolladora/Comercializadora: ${m.desarrolladora}` : "",
    m.financiacion ? "Ofrece financiación / cuotas." : "",
  ].filter(Boolean);
  return partes.join(". ");
}

// Aplica filtros estructurados opcionales a un item mapeado.
function pasaFiltros(m, f) {
  if (!f) return true;
  if (f.barrio && !norm(m.barrio).includes(norm(f.barrio))) return false;
  if (f.desarrolladora && !norm(m.desarrolladora).includes(norm(f.desarrolladora))) return false;
  if (f.precio_min != null && !(m.precioDesde && m.precioDesde >= Number(f.precio_min))) return false;
  if (f.precio_max != null && !(m.precioDesde && m.precioDesde <= Number(f.precio_max))) return false;
  if (f.entrega_hasta_anio != null && !(m.entregaAnio && m.entregaAnio <= Number(f.entrega_hasta_anio))) return false;
  if (f.financiacion === true && !m.financiacion) return false;
  if (f.ambientes != null) {
    const want = String(f.ambientes).replace(/\D/g, "");
    const has = (m.ambientesNums || []).some((n) => String(n).replace(/\D/g, "") === want || (String(n).includes("+") && want >= String(n).replace(/\D/g, "")));
    if (want && !has) return false;
  }
  return true;
}

// Ranking simple por relevancia textual + completitud de ficha.
function buscar(mapped, query, filtros, limit) {
  const q = norm(query || "");
  const toks = q.split(/\s+/).filter(Boolean);
  const scored = mapped
    .filter((m) => m.slug && pasaFiltros(m, filtros))
    .map((m) => {
      const hay = norm([m.nombre, m.barrio, m.direccion, m.desarrolladora, m.ambientes].join(" "));
      let s = 0;
      if (!toks.length) s = 1;
      for (const t of toks) if (hay.includes(t)) s += (norm(m.nombre).includes(t) ? 3 : 1);
      if (m.imagen) s += 0.5;
      if (m.precioDesde || m.precioM2) s += 0.3;
      return { m, s };
    })
    .filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit || 15).map((x) => x.m);
}

// ---- Definición de tools ----
const TOOLS = [
  {
    name: "search",
    description:
      "Busca proyectos de departamentos en pozo (pre-construcción) en Buenos Aires (CABA y GBA). " +
      "Usá una consulta en lenguaje natural con barrio, precio, ambientes, desarrolladora o nombre del proyecto. " +
      "Devuelve una lista de resultados con id, título y URL de la ficha.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Consulta en lenguaje natural, ej: '2 ambientes en Palermo hasta 200000 usd'." } },
      required: ["query"],
    },
  },
  {
    name: "fetch",
    description: "Devuelve el detalle completo de un proyecto en pozo a partir de su id (slug) obtenido con search o filtrar.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "El id (slug) del proyecto." } },
      required: ["id"],
    },
  },
  {
    name: "filtrar",
    description:
      "Búsqueda estructurada de proyectos en pozo por filtros. Todos los filtros son opcionales y se combinan (AND). " +
      "Ideal para pedidos precisos: rango de precio (USD desde), barrio, ambientes, año de entrega, financiación.",
    inputSchema: {
      type: "object",
      properties: {
        barrio: { type: "string", description: "Barrio o zona (ej: Palermo, Caballito, Nuñez)." },
        precio_min: { type: "number", description: "Precio 'desde' mínimo en USD." },
        precio_max: { type: "number", description: "Precio 'desde' máximo en USD." },
        ambientes: { type: "string", description: "Cantidad de ambientes: '1','2','3','4'." },
        entrega_hasta_anio: { type: "number", description: "Año máximo de entrega (ej: 2027)." },
        financiacion: { type: "boolean", description: "true = solo proyectos que ofrecen financiación/cuotas." },
        desarrolladora: { type: "string", description: "Nombre de la desarrolladora o comercializadora." },
        query: { type: "string", description: "Texto libre adicional (opcional)." },
        limit: { type: "number", description: "Máximo de resultados (default 15)." },
      },
    },
  },
  {
    name: "capturar_lead",
    description:
      "Registra un interesado (lead) para que la desarrolladora/comercializadora lo contacte. " +
      "Usar SOLO si la persona quiere ser contactada y dejó al menos email o WhatsApp. " +
      "El lead se rutea automáticamente al responsable del proyecto (con copia a contacto@departamentosenpozo.com.ar).",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        email: { type: "string" },
        whatsapp: { type: "string" },
        proyecto_slug: { type: "string", description: "id (slug) del proyecto de interés, si lo hay." },
        mensaje: { type: "string", description: "Qué está buscando / consulta." },
      },
      required: [],
    },
  },
];

// ---- Ejecución de tools ----
async function callTool(name, args, req) {
  const mapped = await catalogo();
  if (name === "search") {
    const res = buscar(mapped, args && args.query, null, 15).map((m) => ({
      id: m.slug,
      title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`,
      url: fichaUrl(m.slug),
      text: fichaTexto(m),
    }));
    return { structuredContent: { results: res }, content: [{ type: "text", text: JSON.stringify({ results: res }) }] };
  }
  if (name === "fetch") {
    const id = args && (args.id || args.slug);
    const m = mapped.find((x) => x.slug === id);
    if (!m) return { content: [{ type: "text", text: JSON.stringify({ error: "not_found", id }) }], isError: true };
    const doc = {
      id: m.slug,
      title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`,
      url: fichaUrl(m.slug),
      text: fichaTexto(m),
      metadata: {
        barrio: m.barrio, direccion: m.direccion, precio_desde_usd: m.precioDesde || null,
        precio_m2_usd: m.precioM2 || null, ambientes: m.ambientes, entrega: m.entrega,
        entrega_anio: m.entregaAnio, etapa: m.etapa, desarrolladora: m.desarrolladora,
        financiacion: !!m.financiacion, imagen: m.imagen || null,
      },
    };
    return { structuredContent: doc, content: [{ type: "text", text: JSON.stringify(doc) }] };
  }
  if (name === "filtrar") {
    const f = args || {};
    const res = buscar(mapped, f.query || "", f, f.limit || 15).map((m) => ({
      id: m.slug, title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`, url: fichaUrl(m.slug),
      precio_desde_usd: m.precioDesde || null, ambientes: m.ambientes, barrio: m.barrio,
      entrega: m.entrega, desarrolladora: m.desarrolladora, financiacion: !!m.financiacion,
    }));
    return { structuredContent: { count: res.length, results: res }, content: [{ type: "text", text: JSON.stringify({ count: res.length, results: res }) }] };
  }
  if (name === "capturar_lead") {
    const a = args || {};
    const email = (a.email || "").toString().trim();
    const whatsapp = (a.whatsapp || "").toString().trim();
    if (!email && !whatsapp) {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Falta email o WhatsApp del interesado." }) }], isError: true };
    }
    let proyNombre = "";
    if (a.proyecto_slug) { const m = mapped.find((x) => x.slug === a.proyecto_slug); if (m) proyNombre = m.nombre; }
    const sheet = {
      origen: "ChatGPT (MCP)", tipo: "lead_mcp",
      nombre: a.nombre || "(sin nombre)", email, whatsapp,
      proyecto: proyNombre, proyectoSlug: a.proyecto_slug || "",
      mensaje: a.mensaje || "", zonas: "", ambientes: "",
    };
    try {
      const r = await fetch(new URL("/api/lead", req.url).toString(), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheet }),
      });
      const j = await r.json().catch(() => ({}));
      return { content: [{ type: "text", text: JSON.stringify({ ok: !!(j && j.ok), mensaje: j && j.ok ? "Lead registrado; el responsable del proyecto lo contactará." : "No se pudo registrar el lead." }) }] };
    } catch {
      return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "network" }) }], isError: true };
    }
  }
  return { content: [{ type: "text", text: JSON.stringify({ error: "unknown_tool", name }) }], isError: true };
}

// ---- JSON-RPC (MCP Streamable HTTP) ----
function rpcResult(id, result) { return { jsonrpc: "2.0", id, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id, error: { code, message } }; }

async function handleRpc(msg, req) {
  const { id, method, params } = msg || {};
  if (method === "initialize") {
    const pv = (params && params.protocolVersion) || PROTOCOL_DEFAULT;
    return rpcResult(id, {
      protocolVersion: pv,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "departamentos-en-pozo", version: "1.0.0" },
      instructions: "Catálogo de departamentos en pozo (pre-construcción) en Buenos Aires. Usá 'search' o 'filtrar' para encontrar proyectos y 'fetch' para el detalle. Cada resultado incluye la URL de la ficha.",
    });
  }
  if (method === "tools/list") return rpcResult(id, { tools: TOOLS });
  if (method === "tools/call") {
    const out = await callTool(params && params.name, (params && params.arguments) || {}, req);
    return rpcResult(id, out);
  }
  if (method === "ping") return rpcResult(id, {});
  if (id === undefined || id === null) return null;
  return rpcError(id, -32601, "Method not found: " + method);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version",
};

export async function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

export async function GET() {
  return new Response(JSON.stringify({ name: "departamentos-en-pozo MCP", transport: "streamable-http", tools: TOOLS.map((t) => t.name) }), {
    status: 200, headers: { "Content-Type": "application/json", ...CORS },
  });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return new Response(JSON.stringify(rpcError(null, -32700, "Parse error")), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }
  try {
    if (Array.isArray(body)) {
      const out = [];
      for (const m of body) { const r = await handleRpc(m, req); if (r) out.push(r); }
      return new Response(JSON.stringify(out), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
    }
    const r = await handleRpc(body, req);
    if (r === null) return new Response(null, { status: 202, headers: CORS });
    return new Response(JSON.stringify(r), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
  } catch (e) {
    return new Response(JSON.stringify(rpcError(body && body.id, -32603, "Internal error")), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });
  }
}
