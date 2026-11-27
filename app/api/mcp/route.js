// app/api/mcp/route.js — Servidor MCP (Model Context Protocol) del catálogo de Departamentos en Pozo.
// Transporte: Streamable HTTP (JSON-RPC 2.0 por POST). Sin auth (catálogo público).
// v2 (nov-2026): adaptado a las guías del directorio de plugins de ChatGPT (OpenAI):
//  - nombres de tools en inglés tipo verbo + alias de compatibilidad para los nombres viejos;
//  - annotations explícitas (readOnly/destructive/openWorld) y outputSchema en cada tool;
//  - widget de tarjetas (MCP Apps: resource ui:// con mimeType text/html;profile=mcp-app);
//  - request_contact (lead) con datos mínimos, side effect explícito y dedupe.
import { getDesarrollos } from "../../../lib/wp";
import { mapDesarrollos } from "../../../lib/catalogo";

export const runtime = "nodejs";
export const revalidate = 3600;

const SITE = "https://departamentosenpozo.com.ar";
const PROTOCOL_DEFAULT = "2025-06-18";
const VERSION = "2.0.0";
const WIDGET_URI = "ui://widget/proyectos-v1.html";
const UTM = "utm_source=chatgpt&utm_medium=app&utm_campaign=mcp";

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
function fichaUrl(slug, utm) { return `${SITE}/desarrollos-inmobiliarios/${slug}/${utm ? "?" + UTM : ""}`; }
// Imágenes: todo pasa por un único proxy (images.weserv.nl) → CSP del widget acotada a 2 dominios.
function imgUrl(u) {
  if (!u) return null;
  let s = String(u);
  if (s.startsWith("/")) s = SITE + s;
  if (/images\.weserv\.nl/.test(s)) return s;
  return "https://images.weserv.nl/?url=" + encodeURIComponent(s.replace(/^https?:\/\//, "")) + "&w=640&output=webp&q=75";
}

function fichaTexto(m) {
  return [
    m.nombre,
    m.barrio ? `Barrio: ${m.barrio}` : "",
    m.direccion ? `Dirección: ${m.direccion}` : "",
    m.precioLabel ? `Precio: ${m.precioLabel}` : "",
    m.ambientes ? `Tipologías: ${m.ambientes}` : "",
    m.entrega ? `Entrega: ${m.entrega}` : "",
    m.etapa ? `Estado: ${m.etapa}` : "",
    m.desarrolladora ? `Desarrolladora/Comercializadora: ${m.desarrolladora}` : "",
    m.financiacion ? "Ofrece financiación en cuotas." : "",
  ].filter(Boolean).join(". ");
}

// Consulta en lenguaje natural → filtros estructurados.
function parseQuery(q, barriosSet) {
  const s = norm(q || "");
  const f = {};
  let mejor = "";
  for (const b of barriosSet) { const nb = norm(b); if (nb && s.includes(nb) && nb.length > mejor.length) mejor = b; }
  if (mejor) f.barrio = mejor;
  if (/mono ?ambiente|monoamb/.test(s)) f.ambientes = "1";
  const pal = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4 };
  const ma = s.match(/\b(\d)\s*(?:amb|ambientes?|dorm|dormitorios?)\b/) || s.match(/\b(un|una|dos|tres|cuatro)\s+ambientes?\b/);
  if (ma) f.ambientes = String(pal[ma[1]] || ma[1]);
  function toUsd(numStr, suf) {
    let n = Number(String(numStr).replace(/[.,]/g, ""));
    if (/k|mil/.test(suf || "")) n = Number(String(numStr).replace(/,/g, ".")) * 1000;
    return isFinite(n) ? n : null;
  }
  const mx = s.match(/(?:hasta|menos de|maximo|tope|<=?)\s*u?\$?s?\s*([\d.,]+)\s*(k|mil)?/);
  if (mx) { const v = toUsd(mx[1], mx[2]); if (v) f.precio_max = v; }
  const mn = s.match(/(?:desde|mas de|minimo|>=?)\s*u?\$?s?\s*([\d.,]+)\s*(k|mil)?/);
  if (mn) { const v = toUsd(mn[1], mn[2]); if (v) f.precio_min = v; }
  const me = s.match(/(?:entrega|entregar|listo|terminado|posesion|antes de)\s*(?:en\s*)?(20[23]\d)(?!\d)/);
  if (me) f.entrega_hasta_anio = Number(me[1]);
  if (/financ|cuotas?|plan de pago/.test(s)) f.financiacion = true;
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
  if (f.ambientes != null && f.ambientes !== "") {
    const want = String(f.ambientes).replace(/\D/g, "");
    const has = (m.ambientesNums || []).some((n) => String(n).replace(/\D/g, "") === want || (String(n).includes("+") && Number(want) >= Number(String(n).replace(/\D/g, ""))));
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
  return scored.slice(0, Math.min(Number(limit) || 15, 25)).map((x) => x.m);
}

function itemLite(m) {
  return {
    id: m.slug, title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`, url: fichaUrl(m.slug),
    precio_desde_usd: m.precioDesde || null, precio_m2_usd: m.precioM2 || null,
    ambientes: m.ambientes || null, barrio: m.barrio || null, entrega: m.entrega || null,
    desarrolladora: m.desarrolladora || null, etapa: m.etapa || null, financiacion: !!m.financiacion,
  };
}
function cardItem(m) {
  return {
    id: m.slug, nombre: m.nombre, barrio: m.barrio || null, precio_desde_usd: m.precioDesde || null,
    ambientes: m.ambientes || null, entrega: m.entrega || null, url: fichaUrl(m.slug, true), imagen: imgUrl(m.imagen),
  };
}

// --- Schemas ---
const RO = { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true };
const ITEM_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" }, title: { type: "string" }, url: { type: "string" },
    precio_desde_usd: { type: ["number", "null"] }, precio_m2_usd: { type: ["number", "null"] },
    ambientes: { type: ["string", "null"] }, barrio: { type: ["string", "null"] }, entrega: { type: ["string", "null"] },
    desarrolladora: { type: ["string", "null"] }, etapa: { type: ["string", "null"] }, financiacion: { type: "boolean" },
  },
};
const STATS_SCHEMA = { type: ["object", "null"], properties: { n: { type: "number" }, avg: { type: "number" }, min: { type: "number" }, max: { type: "number" }, median: { type: "number" } } };

const TOOLS = [
  {
    name: "search",
    title: "Search pre-construction projects",
    description:
      "Search pre-construction apartment projects ('departamentos en pozo') in Buenos Aires, Argentina (CABA and Greater Buenos Aires). " +
      "Accepts a natural-language query in Spanish or English and extracts neighborhood (barrio), price cap/floor in USD, number of rooms (ambientes), delivery year and installment financing. " +
      "Returns up to 15 matching projects with id, title, project page URL and key data. Use fetch for full details of one project.",
    inputSchema: { type: "object", properties: { query: { type: "string", description: "Natural-language query, e.g. '2 ambientes en Palermo hasta 200 mil dólares'." } }, required: ["query"] },
    outputSchema: { type: "object", properties: { results: { type: "array", items: { type: "object" } }, filtros_detectados: { type: "object" } }, required: ["results"] },
    annotations: RO,
  },
  {
    name: "fetch",
    title: "Get project details",
    description: "Get the full details of one pre-construction project by its id (slug, as returned by search or filter_projects): neighborhood, address, list price from (USD), USD per m², room types, delivery date, construction stage, developer/sales agent and financing.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "Project id (slug)." } }, required: ["id"] },
    outputSchema: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, url: { type: "string" }, text: { type: "string" }, metadata: { type: "object" } }, required: ["id", "title", "url"] },
    annotations: RO,
  },
  {
    name: "filter_projects",
    title: "Filter projects",
    description: "Structured search of pre-construction projects in Buenos Aires using explicit filters combined with AND. All filters are optional: barrio (neighborhood), precio_min / precio_max (list price from, in USD), ambientes (number of rooms, '1' = studio), entrega_hasta_anio (delivery year at the latest), financiacion (true = offers installments), desarrolladora (developer name), query (free text) and limit (max 25).",
    inputSchema: {
      type: "object",
      properties: {
        barrio: { type: "string" }, precio_min: { type: "number" }, precio_max: { type: "number" },
        ambientes: { type: "string" }, entrega_hasta_anio: { type: "number" }, financiacion: { type: "boolean" },
        desarrolladora: { type: "string" }, query: { type: "string" }, limit: { type: "number" },
      },
    },
    outputSchema: { type: "object", properties: { count: { type: "number" }, results: { type: "array", items: ITEM_SCHEMA } }, required: ["count", "results"] },
    annotations: RO,
  },
  {
    name: "compare_projects",
    title: "Compare projects",
    description: "Compare 2 to 4 pre-construction projects side by side (USD per m², list price from, room types, delivery, neighborhood, developer, financing) to help the user decide. Takes the list of project ids (slugs).",
    inputSchema: { type: "object", properties: { ids: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4, description: "Project ids (slugs)." } }, required: ["ids"] },
    outputSchema: { type: "object", properties: { count: { type: "number" }, comparacion: { type: "array", items: ITEM_SCHEMA } }, required: ["count", "comparacion"] },
    annotations: RO,
  },
  {
    name: "get_market_stats",
    title: "Get pre-construction price stats",
    description: "Price statistics of the pre-construction catalog: number of projects and USD per m² and list price from (average, min, max, median). Optionally scoped to one neighborhood (barrio); without barrio it also returns the neighborhoods with most projects. Figures are list prices published by developers, for reference only (not financial advice).",
    inputSchema: { type: "object", properties: { barrio: { type: "string", description: "Neighborhood to scope the stats (optional)." } } },
    outputSchema: { type: "object", properties: { barrio: { type: "string" }, proyectos: { type: "number" }, precio_m2_usd: STATS_SCHEMA, precio_desde_usd: STATS_SCHEMA, top_barrios: { type: "array", items: { type: "object" } } }, required: ["barrio", "proyectos"] },
    annotations: RO,
  },
  {
    name: "show_projects",
    title: "Show projects as cards",
    description: "Display 1 to 8 projects as visual cards (photo, name, neighborhood, price from, rooms, delivery and a link to the project page). Call search or filter_projects first and pass the ids of the projects to show.",
    inputSchema: { type: "object", properties: { ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8, description: "Project ids (slugs) to display." } }, required: ["ids"] },
    outputSchema: { type: "object", properties: { projects: { type: "array", items: { type: "object" } } }, required: ["projects"] },
    annotations: RO,
    _meta: {
      ui: { resourceUri: WIDGET_URI },
      "openai/outputTemplate": WIDGET_URI,
      "openai/toolInvocation/invoking": "Buscando proyectos…",
      "openai/toolInvocation/invoked": "Proyectos listos",
    },
  },
  {
    name: "request_contact",
    title: "Ask the developer to contact me",
    description:
      "Side effect: sends the user's name and email and/or WhatsApp number to the developer or sales agent of ONE project so they contact the user about it (a copy goes to Departamentos en Pozo). " +
      "Only call this when the user explicitly asks to be contacted about a specific project and has provided the contact details themselves in the conversation; confirm the project and the details with the user before calling. " +
      "Not idempotent: calling it again sends another request (duplicates within 24 h for the same contact and project are ignored).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project id (slug) the user wants to be contacted about." },
        name: { type: "string", description: "User's first name." },
        email: { type: "string", description: "User's email (email or whatsapp required)." },
        whatsapp: { type: "string", description: "User's WhatsApp number (email or whatsapp required)." },
      },
      required: ["project_id"],
    },
    outputSchema: { type: "object", properties: { ok: { type: "boolean" }, mensaje: { type: "string" } }, required: ["ok"] },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true, idempotentHint: false },
  },
];
// Compatibilidad con clientes que ya usaban los nombres anteriores.
const ALIAS = { filtrar: "filter_projects", comparar: "compare_projects", mercado: "get_market_stats", capturar_lead: "request_contact" };

// --- Widget (MCP Apps / ChatGPT): tarjetas de proyectos. Sin dependencias, fuente del sistema. ---
const WIDGET_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light dark;--fg:#0b1a34;--mut:#5b6474;--bd:#e3e6ec;--bg:#fff;--acc:#8a6a1f}
@media (prefers-color-scheme:dark){:root{--fg:#eef1f6;--mut:#a9b1bf;--bd:#2c3340;--bg:#161a21;--acc:#d8b25a}}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--fg);background:transparent}
.row{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x mandatory}
.card{flex:0 0 240px;scroll-snap-align:start;border:1px solid var(--bd);border-radius:14px;overflow:hidden;background:var(--bg);display:flex;flex-direction:column}
.img{width:100%;height:150px;object-fit:cover;background:#ccd2dc;display:block}
.b{padding:10px 12px 12px;display:flex;flex-direction:column;gap:3px;flex:1}
.n{font-weight:600;font-size:15px;line-height:1.25;margin:0}
.m{font-size:13px;color:var(--mut);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p{font-size:15px;font-weight:600;margin:4px 0 0}
.cta{margin-top:auto;padding-top:8px}
button{width:100%;border:1px solid var(--fg);background:transparent;color:var(--fg);border-radius:999px;padding:8px 10px;font:600 13px system-ui,sans-serif;cursor:pointer}
button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.empty{font-size:14px;color:var(--mut);padding:8px}
</style></head><body><div id="root" class="row" role="list" aria-label="Proyectos en pozo"></div>
<script>
(function(){
  var root=document.getElementById('root');
  function money(n){return n?('Desde USD '+Number(n).toLocaleString('es-AR')):'Consultar precio';}
  function open(url){try{if(window.openai&&window.openai.openExternal){window.openai.openExternal({href:url});return;}}catch(e){} window.open(url,'_blank','noopener');}
  function render(data){
    var ps=(data&&data.projects)||[]; root.innerHTML='';
    if(!ps.length){root.innerHTML='<div class="empty">No hay proyectos para mostrar.</div>';return;}
    ps.slice(0,8).forEach(function(p){
      var c=document.createElement('div');c.className='card';c.setAttribute('role','listitem');
      var meta=[p.barrio,p.ambientes,p.entrega?('Entrega '+p.entrega):null].filter(Boolean).join(' · ');
      c.innerHTML=(p.imagen?'<img class="img" alt="" loading="lazy">':'<div class="img"></div>')+'<div class="b"><p class="n"></p><p class="m"></p><p class="p"></p><div class="cta"><button type="button">Ver proyecto</button></div></div>';
      if(p.imagen){var im=c.querySelector('img');im.src=p.imagen;im.alt='Render de '+p.nombre;}
      c.querySelector('.n').textContent=p.nombre||'';c.querySelector('.m').textContent=meta;c.querySelector('.p').textContent=money(p.precio_desde_usd);
      c.querySelector('button').addEventListener('click',function(){open(p.url);});
      root.appendChild(c);
    });
  }
  function fromOpenai(){try{return window.openai&&window.openai.toolOutput;}catch(e){return null;}}
  var d=fromOpenai(); if(d) render(d);
  window.addEventListener('openai:set_globals',function(){var x=fromOpenai(); if(x) render(x);},{passive:true});
  // MCP Apps (estándar): el host envía el resultado de la tool por postMessage.
  window.addEventListener('message',function(ev){var m=ev&&ev.data; if(!m||typeof m!=='object')return;
    if(m.method==='ui/notifications/tool-result'&&m.params){render(m.params.structuredContent||m.params);} });
  try{window.parent.postMessage({jsonrpc:'2.0',method:'ui/notifications/initialized',params:{}},'*');}catch(e){}
})();
</script></body></html>`;

const RESOURCES = [{ uri: WIDGET_URI, name: "proyectos-cards", title: "Tarjetas de proyectos", mimeType: "text/html;profile=mcp-app", description: "Tarjetas visuales de proyectos en pozo." }];
function widgetResource() {
  return {
    uri: WIDGET_URI,
    mimeType: "text/html;profile=mcp-app",
    text: WIDGET_HTML,
    _meta: {
      ui: {
        prefersBorder: false,
        csp: { connectDomains: [], resourceDomains: ["https://images.weserv.nl", SITE] },
      },
      "openai/widgetCSP": { connect_domains: [], resource_domains: ["https://images.weserv.nl", SITE], redirect_domains: [SITE, "https://www.departamentosenpozo.com.ar"] },
      "openai/widgetDescription": "Tarjetas de proyectos en pozo con foto, barrio, precio desde y link a la ficha.",
      "openai/widgetPrefersBorder": false,
    },
  };
}

function stats(nums) {
  const a = nums.filter((n) => n && isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const avg = Math.round(a.reduce((s, n) => s + n, 0) / a.length);
  const median = a.length % 2 ? a[(a.length - 1) / 2] : Math.round((a[a.length / 2 - 1] + a[a.length / 2]) / 2);
  return { n: a.length, avg, min: a[0], max: a[a.length - 1], median };
}
const ok = (out, text) => ({ structuredContent: out, content: [{ type: "text", text: text || JSON.stringify(out) }] });
const fail = (out) => ({ structuredContent: out, content: [{ type: "text", text: JSON.stringify(out) }], isError: true });

// Dedupe de contactos (por instancia): mismo contacto + proyecto en 24 h → no se reenvía.
const _sent = new Map();

async function callTool(rawName, args, req) {
  const name = ALIAS[rawName] || rawName;
  const mapped = await catalogo();
  if (name === "search") {
    const barriosSet = new Set(mapped.map((m) => m.barrio).filter(Boolean));
    const f = parseQuery(args && args.query, barriosSet);
    const res = buscar(mapped, args && args.query, f, 15).map((m) => ({
      id: m.slug, title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`, url: fichaUrl(m.slug),
      text: fichaTexto(m), precio_desde_usd: m.precioDesde || null, ambientes: m.ambientes || null, barrio: m.barrio || null, entrega: m.entrega || null,
    }));
    return ok({ results: res, filtros_detectados: f });
  }
  if (name === "fetch") {
    const id = args && (args.id || args.slug);
    const m = mapped.find((x) => x.slug === id);
    if (!m) return fail({ error: "not_found", id: id || null });
    return ok({
      id: m.slug, title: `${m.nombre}${m.barrio ? " — " + m.barrio : ""}`, url: fichaUrl(m.slug), text: fichaTexto(m),
      metadata: {
        barrio: m.barrio || null, direccion: m.direccion || null, precio_desde_usd: m.precioDesde || null, precio_m2_usd: m.precioM2 || null,
        ambientes: m.ambientes || null, entrega: m.entrega || null, entrega_anio: m.entregaAnio || null, etapa: m.etapa || null,
        desarrolladora: m.desarrolladora || null, financiacion: !!m.financiacion, imagen: imgUrl(m.imagen),
      },
    });
  }
  if (name === "filter_projects") {
    const f = args || {};
    const res = buscar(mapped, f.query || "", f, f.limit || 15).map(itemLite);
    return ok({ count: res.length, results: res });
  }
  if (name === "compare_projects") {
    const ids = Array.isArray(args && args.ids) ? args.ids : [];
    const items = ids.map((id) => mapped.find((x) => x.slug === id)).filter(Boolean).slice(0, 4).map(itemLite);
    return ok({ count: items.length, comparacion: items });
  }
  if (name === "get_market_stats") {
    const b = args && args.barrio ? norm(args.barrio) : "";
    const sel = b ? mapped.filter((m) => norm(m.barrio).includes(b)) : mapped;
    const out = { barrio: (args && args.barrio) || "(todos)", proyectos: sel.length, precio_m2_usd: stats(sel.map((m) => m.precioM2)), precio_desde_usd: stats(sel.map((m) => m.precioDesde)) };
    if (!b) {
      const porBarrio = {};
      for (const m of mapped) if (m.barrio) porBarrio[m.barrio] = (porBarrio[m.barrio] || 0) + 1;
      out.top_barrios = Object.entries(porBarrio).sort((a, c) => c[1] - a[1]).slice(0, 12).map(([barrio, n]) => ({ barrio, proyectos: n }));
    }
    return ok(out);
  }
  if (name === "show_projects") {
    const ids = Array.isArray(args && args.ids) ? args.ids.slice(0, 8) : [];
    const projects = ids.map((id) => mapped.find((x) => x.slug === id)).filter(Boolean).map(cardItem);
    const out = { projects };
    return { structuredContent: out, content: [{ type: "text", text: projects.length ? `Mostrando ${projects.length} proyecto(s): ${projects.map((p) => p.nombre).join(", ")}.` : "No se encontraron esos proyectos." }] };
  }
  if (name === "request_contact") {
    const a = args || {};
    const slug = String(a.project_id || a.proyecto_slug || "").trim();
    const email = String(a.email || "").trim().slice(0, 120);
    const whatsapp = String(a.whatsapp || "").replace(/[^\d+ ]/g, "").trim().slice(0, 25);
    const nombre = String(a.name || a.nombre || "").trim().slice(0, 60);
    if (!email && !whatsapp) return fail({ ok: false, mensaje: "Falta un email o WhatsApp para que te contacten." });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail({ ok: false, mensaje: "El email no parece válido." });
    const m = mapped.find((x) => x.slug === slug);
    if (!m) return fail({ ok: false, mensaje: "No encontré ese proyecto en el catálogo." });
    const key = `${(email || whatsapp).toLowerCase()}|${slug}`;
    const prev = _sent.get(key);
    if (prev && Date.now() - prev < 24 * 3600 * 1000) return ok({ ok: true, mensaje: `La consulta por ${m.nombre} ya había sido enviada; el responsable del proyecto te va a contactar.` });
    const sheet = {
      origen: "ChatGPT (MCP)", tipo: "lead_mcp", nombre: nombre || "(sin nombre)", email, whatsapp,
      proyecto: m.nombre, proyectoSlug: slug, mensaje: "", objetivo: "", presupuesto: "", zonas: "", ambientes: "",
    };
    try {
      const r = await fetch(new URL("/api/lead", req.url).toString(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheet }) });
      const j = await r.json().catch(() => ({}));
      if (j && j.ok) { _sent.set(key, Date.now()); return ok({ ok: true, mensaje: `Listo: le pasamos tu contacto al responsable de ${m.nombre}, que te va a escribir.` }); }
      return fail({ ok: false, mensaje: "No se pudo enviar la consulta. Probá desde la ficha del proyecto." });
    } catch { return fail({ ok: false, mensaje: "No se pudo enviar la consulta (error de red)." }); }
  }
  return fail({ error: "unknown_tool", name: rawName || null });
}

function rpcResult(id, result) { return { jsonrpc: "2.0", id, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id, error: { code, message } }; }

async function handleRpc(msg, req) {
  const { id, method, params } = msg || {};
  if (method === "initialize") {
    const pv = (params && params.protocolVersion) || PROTOCOL_DEFAULT;
    return rpcResult(id, {
      protocolVersion: pv,
      capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
      serverInfo: { name: "departamentos-en-pozo", title: "Departamentos en Pozo", version: VERSION },
      instructions:
        "Catalog of pre-construction apartment projects ('departamentos en pozo') in Buenos Aires, Argentina. " +
        "Use search (natural language) or filter_projects to find projects, fetch for details, compare_projects to compare, get_market_stats for USD/m² by neighborhood, and show_projects to display results as cards. " +
        "Prices are developers' published list prices in USD and may change; always share the project page URL. This is information, not financial advice. " +
        "Only use request_contact when the user explicitly asks to be contacted about a specific project and has given their contact details.",
    });
  }
  if (method === "tools/list") return rpcResult(id, { tools: TOOLS });
  if (method === "tools/call") return rpcResult(id, await callTool(params && params.name, (params && params.arguments) || {}, req));
  if (method === "resources/list") return rpcResult(id, { resources: RESOURCES });
  if (method === "resources/templates/list") return rpcResult(id, { resourceTemplates: [] });
  if (method === "resources/read") {
    if (params && params.uri === WIDGET_URI) return rpcResult(id, { contents: [widgetResource()] });
    return rpcError(id, -32002, "Resource not found");
  }
  if (method === "prompts/list") return rpcResult(id, { prompts: [] });
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
  return new Response(JSON.stringify({ name: "departamentos-en-pozo MCP", version: VERSION, transport: "streamable-http", tools: TOOLS.map((t) => t.name) }), {
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
