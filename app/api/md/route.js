// app/api/md/route.js — Versión Markdown de cualquier página (para agentes de IA).
// Lo invoca middleware.js cuando el request trae `Accept: text/markdown`.
// Toma el HTML real de la página (mismo contenido que ve un humano) y lo convierte a Markdown
// limpio: títulos, párrafos, listas y links. Si la página no existe → 404 con cuerpo Markdown
// que explica el error y ofrece caminos (home, catálogo, sitemap, llms.txt).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://departamentosenpozo.com.ar";
const HEAD = { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept", "Cache-Control": "public, max-age=0, s-maxage=3600" };

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
const dec = (s) => s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (ENT[e.toLowerCase()]) return ENT[e.toLowerCase()];
  if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n ? String.fromCodePoint(n) : m; }
  return m;
});
const txt = (s) => dec(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function htmlAMarkdown(html, url) {
  const title = txt((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
  const desc = dec((html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1] || "");
  let b = (html.match(/<main[\s\S]*?<\/main>/i) || html.match(/<body[\s\S]*<\/body>/i) || [html])[0];
  b = b.replace(/<(script|style|noscript|svg|template|iframe|form|button|nav|footer|header)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<span[^>]*class="[^"]*material-symbols[^"]*"[^>]*>[\s\S]*?<\/span>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  b = b.replace(/<a\b[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, inner) => {
    const t = txt(inner); if (!t) return " ";
    const abs = href.startsWith("/") ? SITE + href : href;
    return /^https?:/.test(abs) ? "[" + t + "](" + abs + ")" : t;
  });
  b = b.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (m, n, inner) => "\n\n" + "#".repeat(+n) + " " + txt(inner) + "\n\n")
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (m, inner) => "\n- " + txt(inner))
    .replace(/<(p|div|section|article|tr|br)\b[^>]*>/gi, "\n")
    .replace(/<\/(p|div|section|article|ul|ol|table)>/gi, "\n");
  let md = dec(b.replace(/<[^>]+>/g, " ")).split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n").trim();
  const head = "# " + (title || "Departamentos en Pozo") + "\n\n" + (desc ? "> " + desc + "\n\n" : "") + "URL: " + url + "\n\n";
  // Si el contenido ya arranca con el H1 de la página, no lo duplicamos.
  if (/^# /.test(md)) return (desc ? "> " + desc + "\n\nURL: " + url + "\n\n" : "URL: " + url + "\n\n").replace(/^/, "") + md + "\n";
  return head + md + "\n";
}

const NOT_FOUND = (p) =>
  "# 404 — Página no encontrada\n\n" +
  "La ruta `" + p + "` no existe en Departamentos en Pozo (departamentosenpozo.com.ar), el sitio de proyectos de departamentos en pozo en CABA y GBA.\n\n" +
  "Podés seguir por acá:\n\n" +
  "- [Inicio](" + SITE + "/)\n" +
  "- [Catálogo de desarrollos en pozo](" + SITE + "/desarrollos-inmobiliarios/)\n" +
  "- [Desarrolladoras](" + SITE + "/desarrolladoras/)\n" +
  "- [Guías](" + SITE + "/novedades/)\n" +
  "- [Contacto](" + SITE + "/contacto/)\n" +
  "- [Sitemap](" + SITE + "/sitemap.xml)\n" +
  "- [llms.txt](" + SITE + "/llms.txt)\n";

export async function GET(req) {
  const u = new URL(req.url);
  let p = u.searchParams.get("p") || "/";
  if (!p.startsWith("/") || p.startsWith("//")) p = "/";
  if (!p.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(p)) p += "/";
  const target = u.origin + p;
  try {
    const r = await fetch(target, { headers: { Accept: "text/html" }, redirect: "follow", cache: "no-store" });
    if (r.status === 404) return new Response(NOT_FOUND(p), { status: 404, headers: HEAD });
    if (!r.ok) return new Response("# Error " + r.status + "\n\nNo pudimos generar esta página. Probá " + SITE + p + "\n", { status: r.status, headers: HEAD });
    const html = await r.text();
    return new Response(htmlAMarkdown(html, SITE + p), { status: 200, headers: HEAD });
  } catch {
    return new Response("# Error temporal\n\nProbá de nuevo en unos segundos: " + SITE + p + "\n", { status: 503, headers: HEAD });
  }
}
