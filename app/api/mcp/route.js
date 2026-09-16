// app/api/mcp/route.js — Servidor MCP (Model Context Protocol) del catálogo de Departamentos en Pozo.
// Transporte: Streamable HTTP (JSON-RPC 2.0 por POST). Sin auth (catálogo público).
// Sirve para: ChatGPT (Developer Mode / Responses API), Claude, y cualquier cliente MCP.
// Tools: search (con parsing de la consulta), fetch, filtrar, comparar, mercado, capturar_lead.
import { getDesarrollos, acf } from "../../../lib/wp";
import { toNumber } from "../../../lib/format";
import { mapDesarrollos } from "../../../lib/catalogo";

export const runtime = "nodejs";
export const revalidate = 3600;

const SITE = "https://www.departamentosenpozo.com.ar";
const PROTOCOL_DEFAULT = "2025-06-18";

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

// Parseo de la consulta en lenguaje natural → filtros estructurados (razonamiento de inversión pozo).
// barriosSet = set de barrios reales del catálogo (para detectar zona sin listas hardcodeadas).
function parseQuery(q, barriosSet) {
  const s = norm(q || "");
  const f = {};
  // Barrio: el nombre de barrio real más largo que aparezca en la consulta.
  let mejor = "";
  for (const b of barriosSet) { const nb = norm(b); if (nb && s.includes(nb) && nb.length > mejor.length) mejor = b; }
  if (mejor) f.barrio = mejor;
  // Ambientes: monoambiente / N ambientes / N amb.
  if (/mono ?ambiente|monoamb/.test(s)) f.ambientes = "1";
  const pal = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4 };
  let ma = s.match(/\b(\d)\s*(?:amb|ambientes?|dorm|dormitorios?)\b/) || s.match(/\b(un|una|dos|tres|cuatro)\s+ambientes?\b/);
  if (ma) f.ambientes = String(pal[ma[1]] || ma[1]);
  // Precio: "hasta 200000", "menos de 200k", "200.000 usd", "desde 150000".
  function toUsd(numStr, suf) {
    let n = Number(String(numStr).replace(/[.,]/g, ""));
    if (/k|mil/.test(suf || "")) n = Number(String(numStr).replace(/,/g, ".")) * 1000;
    return isFinite(n) ? n : null;
  }
  let mx = s.match(/(?:hasta|menos de|maximo|máximo|tope|<=?)\s*u?\$?s?\s*([\d.,]+)\s*(k|mil)?/);
  if (mx) { const v = toUsd(mx[1], mx[2]); if (v) f.precio_max = v; }
  let mn = s.match(/(?:desde|mas de|más de|minimo|mínimo|>=?)\s*u?\$?s?\s*([\d.,]+)\s*(k|mil)?/);
  if (mn) { const v = toUsd(mn[1], mn[2]); if (v) f.precio_min = v; }
  // Entrega: "entrega 2027", "antes de 2027", "listo en 2027".
  let me = s.match(/(?:entrega|entregar|listo|terminado|posesion|antes de)\s*(?:en\s*)?(20[23]\d)(?!\d)/);
  if (me) f.entrega_hasta_anio = Number(me[1]);
  // Financiación / cuotas.
  if (/financ|cuotas?|en pozo con cuota|plan de pago/.test(s)) f.financiacion = true;
  return f;
}

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

function buscar(mapped, query, filtros, limit) {
  const q = norm(query || "");
  const toks = q.split(/\s+/).filter((t) => t.length > 2);
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

function itemLite(m) {
  return {
    id: m.slug, title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`, url: fichaUrl(m.slug),
    precio_desde_usd: m.precioDesde || null, precio_m2_usd: m.precioM2 || null,
    ambientes: m.ambientes, barrio: m.barrio, entrega: m.entrega,
    desarrolladora: m.desarrolladora, etapa: m.etapa, financiacion: !!m.financiacion,
  };
}

const TOOLS = [
  {
    name: "search",
    description:
      "Busca proyectos de departamentos en pozo (pre-construcción) en Buenos Aires (CABA y GBA). " +
      "Entiende consultas de inversión en lenguaje natural: extrae barrio, precio (ej 'hasta 200000 usd', '200k'), " +
      "ambientes ('monoambiente','2 ambientes'), año de entrega ('antes de 2027') y financiación/cuotas, y los aplica como filtros. " +
      "Devuelve resultados con id, título, URL de ficha, precio, ambientes, barrio y entrega.",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "Consulta en lenguaje natural." } }, required: ["query"] },
  },
  {
    name: "fetch",
    description: "Devuelve el detalle completo de un proyecto en pozo a partir de su id (slug).",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "id (slug) del proyecto." } }, required: ["id"] },
  },
  {
    name: "filtrar",
    description: "Búsqueda estructurada por filtros (AND). Todos opcionales: barrio, precio_min, precio_max (USD desde), ambientes, entrega_hasta_anio, financiacion, desarrolladora, query (texto libre), limit.",
    inputSchema: {
      type: "object",
      properties: {
        barrio: { type: "string" }, precio_min: { type: "number" }, precio_max: { type: "number" },
        ambientes: { type: "string" }, entrega_hasta_anio: { type: "number" }, financiacion: { type: "boolean" },
        desarrolladora: { type: "string" }, query: { type: "string" }, limit: { type: "number" },
      },
    },
  },
  {
    name: "comparar",
    description: "Compara 2 a 4 proyectos lado a lado (precio/m², precio desde, ambientes, entrega, barrio, desarrolladora, financiación) para ayudar a decidir. Recibe la lista de ids (slugs).",
    inputSchema: { type: "object", properties: { ids: { type: "array", items: { type: "string" }, description: "ids (slugs) de los proyectos a comparar." } }, required: ["ids"] },
  },
  {
    name: "mercado",
    description: "Estadísticas de mercado del catálogo en pozo: cantidad de proyectos y precio/m² (promedio, mínimo, máximo, mediana) y precio 'desde'. Opcional: filtrar por barrio. Sin barrio, devuelve el top de barrios por cantidad.",
    inputSchema: { type: "object", properties: { barrio: { type: "string", description: "Barrio para acotar (opcional)." } } },
  },
  {
    name: "capturar_lead",
    description:
      "Registra un interesado (lead) para que la desarrolladora/comercializadora lo contacte. Usar SOLO si la persona quiere ser contactada y dejó al menos email o WhatsApp. " +
      "El lead se rutea al responsable del proyecto (con copia a contacto@departamentosenpozo.com.ar).",
    inputSchema: {
      type: "object",
      properties: {
        nombre: { type: "string" }, email: { type: "string" }, whatsapp: { type: "string" },
        proyecto_slug: { type: "string", description: "id (slug) del proyecto de interés, si lo hay." },
        mensaje: { type: "string" },
        objetivo: { type: "string", description: "'vivir' o 'invertir', si se sabe." },
        presupuesto: { type: "string", description: "Presupuesto en USD, si se sabe." },
      },
      required: [],
    },
  },
];

function stats(nums) {
  const a = nums.filter((n) => n && isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const avg = Math.round(a.reduce((s, n) => s + n, 0) / a.length);
  const median = a.length % 2 ? a[(a.length - 1) / 2] : Math.round((a[a.length / 2 - 1] + a[a.length / 2]) / 2);
  return { n: a.length, avg, min: a[0], max: a[a.length - 1], median };
}

async function callTool(name, args, req) {
  const mapped = await catalogo();
  if (name === "search") {
    const barriosSet = new Set(mapped.map((m) => m.barrio).filter(Boolean));
    const f = parseQuery(args && args.query, barriosSet);
    const res = buscar(mapped, args && args.query, f, 15).map((m) => ({
      id: m.slug, title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`, url: fichaUrl(m.slug),
      text: fichaTexto(m), precio_desde_usd: m.precioDesde || null, ambientes: m.ambientes, barrio: m.barrio, entrega: m.entrega,
    }));
    const out = { results: res, filtros_detectados: f };
    return { structuredContent: out, content: [{ type: "text", text: JSON.stringify(out) }] };
  }
  if (name === "fetch") {
    const id = args && (args.id || args.slug);
    const m = mapped.find((x) => x.slug === id);
    if (!m) return { content: [{ type: "text", text: JSON.stringify({ error: "not_found", id }) }], isError: true };
    const doc = {
      id: m.slug, title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`, url: fichaUrl(m.slug), text: fichaTexto(m),
      metadata: {
        barrio: m.barrio, direccion: m.direccion, precio_desde_usd: m.precioDesde || null, precio_m2_usd: m.precioM2 || null,
        ambientes: m.ambientes, entrega: m.entrega, entrega_anio: m.entregaAnio, etapa: m.etapa,
        desarrolladora: m.desarrolladora, financiacion: !!m.financiacion, imagen: m.imagen || null,
      },
    };
    return { structuredContent: doc, content: [{ type: "text", text: JSON.stringify(doc) }] };
  }
  if (name === "filtrar") {
    const f = args || {};
    const res = buscar(mapped, f.query || "", f, f.limit || 15).map(itemLite);
    const out = { count: res.length, results: res };
    return { structuredContent: out, content: [{ type: "text", text: JSON.stringify(out) }] };
  }
  if (name === "comparar") {
    const ids = (args && args.ids) || [];
    const items = ids.map((id) => mapped.find((x) => x.slug === id)).filter(Boolean).slice(0, 4).map(itemLite);
    const out = { count: items.length, comparacion: items };
    return { structuredContent: out, content: [{ type: "text", text: JSON.stringify(out) }] };
  }
  if (name === "mercado") {
    const b = args && args.barrio ? norm(args.barrio) : "";
    const sel = b ? mapped.filter((m) => norm(m.barrio).includes(b)) : mapped;
    const out = {
      barrio: (args && args.barrio) || "(todos)",
      proyectos: sel.length,
      precio_m2_usd: stats(sel.map((m) => m.precioM2)),
      precio_desde_usd: stats(sel.map((m) => m.precioDesde)),
    };
    if (!b) {
      const porBarrio = {};
      for (const m of mapped) if (m.barrio) porBarrio[m.barrio] = (porBarrio[m.barrio] || 0) + 1;
      out.top_barrios = Object.entries(porBarrio).sort((a, c) => c[1] - a[1]).slice(0, 12).map(([barrio, n]) => ({ barrio, proyectos: n }));
    }
    return { structuredContent: out, content: [{ type: "text", text: JSON.stringify(out) }] };
  }
  if (name === "capturar_lead") {
    const a = args || {};
    const email = (a.email || "").toString().trim();
    const whatsapp = (a.whatsapp || "").toString().trim();
    if (!email && !whatsapp) return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "Falta email o WhatsApp del interesado." }) }], isError: true };
    let proyNombre = "";
    if (a.proyecto_slug) { const m = mapped.find((x) => x.slug === a.proyecto_slug); if (m) proyNombre = m.nombre; }
    const sheet = {
      origen: "ChatGPT (MCP)", tipo: "lead_mcp", nombre: a.nombre || "(sin nombre)", email, whatsapp,
      proyecto: proyNombre, proyectoSlug: a.proyecto_slug || "", mensaje: a.mensaje || "",
      objetivo: a.objetivo || "", presupuesto: a.presupuesto || "", zonas: "", ambientes: "",
    };
    try {
      const r = await fetch(new URL("/api/lead", req.url).toString(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheet }) });
      const j = await r.json().catch(() => ({}));
      return { content: [{ type: "text", text: JSON.stringify({ ok: !!(j && j.ok), mensaje: j && j.ok ? "Lead registrado; el responsable del proyecto lo contactará." : "No se pudo registrar el lead." }) }] };
    } catch { return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: "network" }) }], isError: true }; }
  }
  return { content: [{ type: "text", text: JSON.stringify({ error: "unknown_tool", name }) }], isError: true };
}

function rpcResult(id, result) { return { jsonrpc: "2.0", id, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id, error: { code, message } }; }

async function handleRpc(msg, req) {
  const { id, method, params } = msg || {};
  if (method === "initialize") {
    const pv = (params && params.protocolVersion) || PROTOCOL_DEFAULT;
    return rpcResult(id, {
      protocolVersion: pv,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "departamentos-en-pozo", version: "1.1.0" },
      instructions: "Catálogo de departamentos en pozo (pre-construcción) en Buenos Aires. Usá 'search' (entiende barrio, precio, ambientes, entrega, financiación) o 'filtrar'; 'fetch' para el detalle; 'comparar' para enfrentar proyectos; 'mercado' para estadísticas de precio/m² por barrio. Cada resultado trae la URL de la ficha.",
    });
  }
  if (method === "tools/list") return rpcResult(id, { tools: TOOLS });
  if (method === "tools/call") return rpcResult(id, await callTool(params && params.name, (params && params.arguments) || {}, req));
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
  return new Response(JSON.stringify({ name: "departamentos-en-pozo MCP", version: "1.1.0", transport: "streamable-http", tools: TOOLS.map((t) => t.name) }), {
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
