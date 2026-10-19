// middleware.js — Agent readiness (is-agentic.com):
//  1) Content negotiation: si un agente pide `Accept: text/markdown`, le servimos la página en
//     Markdown (vía /api/md). Los navegadores (text/html) siguen recibiendo HTML. `Vary: Accept`
//     para que CDN/caches no mezclen las dos versiones.
//  2) Trust pages en inglés: /about, /contact, /privacy sirven (rewrite, 200) las páginas reales
//     /sobre-nosotros/, /contacto/, /politica-de-privacidad/ (canonical sigue en la versión ES).
import { NextResponse } from "next/server";

const ALIAS = { "/about": "/sobre-nosotros/", "/contact": "/contacto/", "/privacy": "/politica-de-privacidad/" };

function quiereMarkdown(accept) {
  const a = String(accept || "").toLowerCase();
  if (!a.includes("text/markdown")) return false;
  // Si también acepta HTML con mayor prioridad (orden), gana HTML.
  const iMd = a.indexOf("text/markdown"), iHtml = a.indexOf("text/html");
  return iHtml < 0 || iMd < iHtml;
}

export function middleware(req) {
  const url = req.nextUrl;
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (quiereMarkdown(req.headers.get("accept"))) {
    const dest = url.clone();
    dest.pathname = "/api/md/";
    dest.search = "?p=" + encodeURIComponent(ALIAS[path] || url.pathname);
    const res = NextResponse.rewrite(dest);
    res.headers.set("Vary", "Accept");
    return res;
  }

  if (ALIAS[path]) {
    const dest = url.clone();
    dest.pathname = ALIAS[path];
    const res = NextResponse.rewrite(dest);
    res.headers.set("Vary", "Accept");
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("Vary", "Accept");
  return res;
}

export const config = {
  // Sólo páginas: excluye API, assets de Next y archivos con extensión.
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]{2,5}$).*)"],
};
