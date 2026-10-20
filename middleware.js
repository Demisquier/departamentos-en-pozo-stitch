// middleware.js — Agent readiness (is-agentic.com):
//  1) Content negotiation: si un agente pide `Accept: text/markdown`, le servimos la página en
//     Markdown (vía /api/md). Los navegadores (text/html) siguen recibiendo HTML. `Vary: Accept`
//     para que CDN/caches no mezclen las dos versiones.
//  2) Trust pages en inglés: /about, /contact, /privacy sirven (rewrite, 200) las páginas reales
//     /sobre-nosotros/, /contacto/, /politica-de-privacidad/ (canonical sigue en la versión ES).
import { NextResponse } from "next/server";

const ALIAS = { "/about": "/sobre-nosotros/", "/contact": "/contacto/", "/privacy": "/politica-de-privacidad/" };

// 301 de URLs viejas (WordPress) que Search Console reporta como 404 → su equivalente actual.
const R301 = {
  "/fideicomiso-al-costo-vs-sociedad-anonima": "/fideicomiso-al-costo-vs-llave-en-mano-departamentos-en-pozo/",
  "/anticipo-y-sena-en-un-departamento-en-pozo-cuanto-se-paga-y-como-se-protege": "/anticipo-sena-y-reserva-en-pozo-cuanto-se-paga-al-inicio/",
  "/que-revisar-antes-de-comprar-un-departamento-en-pozo": "/que-revisar-antes-de-comprar-en-pozo-checklist-due-diligence/",
  "/invertir-en-pozo-rentabilidad": "/invertir-en-pozo-cuanto-se-gana-y-como-calcular-la-rentabilidad-paso-a-paso/",
  "/invertir-en-pozo-en-argentina": "/guia-invertir-departamentos-en-pozo-argentina/",
  "/desarrollos-en-pozo-por-barrio-caba": "/desarrollos-en-pozo-por-barrio/",
  "/herramientas/calculadora-pozo": "/simulador-cuota-cac-pozo/",
  "/category/guias": "/novedades/",
};
const DEV_VIEJAS = /^\/desarrolladoras\/(aterno|sycsa|gha-argentina|pur-desarrollos|soa-desarrollos|mosaico-real-estate)$/;
const BARRIO_VIEJO = /^\/desarrollo-en-pozo-(villa-urquiza|caballito|palermo|belgrano)-/;

function redirect301(path) {
  if (R301[path]) return R301[path];
  if (DEV_VIEJAS.test(path)) return "/desarrolladoras-inmobiliarias-en-capital-federal/";
  const b = path.match(BARRIO_VIEJO);
  if (b) return "/desarrollos-inmobiliarios-en-" + b[1] + "/";
  // Paginación / feeds / archivos de fecha y autor del WP viejo.
  let m;
  if ((m = path.match(/^\/category\/([^/]+)\/(feed|page\/\d+)$/))) return "/category/" + m[1] + "/";
  if (/^\/(novedades\/)?page\/\d+$/.test(path)) return "/novedades/";
  if (/^\/20\d\d(\/\d\d)?(\/page\/\d+)?$/.test(path)) return "/novedades/";
  if (/^\/author\/[^/]+\/(feed|page\/\d+)$/.test(path)) return "/";
  return null;
}

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

  const to = redirect301(path);
  if (to) {
    const dest = url.clone();
    dest.pathname = to;
    dest.search = "";
    return NextResponse.redirect(dest, 301);
  }

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
