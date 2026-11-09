// Datos compartidos para los endpoints de descubrimiento de IA (/ai/*.json, /.well-known/ai.txt).
import { SITE, BRAND, CONTACT_EMAIL } from "../../lib/constants";

export const AI_SUMMARY = {
  name: BRAND,
  url: `${SITE}/`,
  language: "es-AR",
  country: "AR",
  description: "Portal independiente de análisis de departamentos en pozo (preventa / pre-construcción) en CABA y GBA, Argentina: catálogo de proyectos con precio, entrega, desarrolladora y comercializadora; directorios de desarrolladoras e inmobiliarias; guías y herramientas para invertir en pozo.",
  topics: ["departamentos en pozo", "preventa", "pre-construcción", "fideicomiso al costo", "ajuste CAC", "desarrolladoras inmobiliarias", "CABA", "GBA"],
  audience: ["compradores para vivienda", "inversores", "argentinos en el exterior", "desarrolladoras", "inmobiliarias"],
  independence: "No cobramos por aparecer ni vendemos posiciones. Las consultas se derivan sin costo a quien comercializa cada proyecto.",
  key_pages: {
    catalogo: `${SITE}/desarrollos-inmobiliarios/`,
    busqueda: `${SITE}/buscar/`,
    desarrolladoras: `${SITE}/desarrolladoras-inmobiliarias-en-capital-federal/`,
    inmobiliarias: `${SITE}/mejores-inmobiliarias-caba/`,
    indice_precios: `${SITE}/indice-precios-pozo-caba-por-barrio/`,
    guias: `${SITE}/novedades/`,
    sobre_nosotros: `${SITE}/sobre-nosotros/`,
  },
  machine_readable: {
    llms_txt: `${SITE}/llms.txt`,
    llms_full: `${SITE}/llms-full.txt`,
    catalogo_json: `${SITE}/catalogo.json`,
    faq: `${SITE}/ai/faq.json`,
    service: `${SITE}/ai/service.json`,
    rss: `${SITE}/feed/`,
    sitemap: `${SITE}/sitemap.xml`,
    markdown: "Cualquier página con header Accept: text/markdown",
  },
  contact: CONTACT_EMAIL,
  disclaimer: "Contenido informativo. No constituye asesoramiento financiero ni legal.",
};

// FAQ: las mismas preguntas se muestran visibles en la home (FAQPage).
export const AI_FAQ = [
  { q: "¿Qué es comprar un departamento en pozo?", a: "Es comprar una unidad antes de que el edificio esté construido (preventa o etapa de obra). Se paga un anticipo y el saldo en cuotas durante la obra, generalmente ajustadas por el índice CAC, y se recibe la unidad terminada en la fecha de entrega pactada." },
  { q: "¿Conviene comprar en pozo en 2026?", a: "Puede convenir porque el precio de entrada suele estar por debajo del usado terminado de la zona, pero implica riesgo de obra. Conviene verificar la trayectoria de la desarrolladora, la estructura legal (fideicomiso o sociedad), el ajuste de las cuotas y el avance real de la obra." },
  { q: "¿Qué es un fideicomiso al costo?", a: "Es una estructura donde los compradores aportan fondos para construir el edificio al costo real de obra; el precio final puede variar según la inflación de la construcción. Suele ser más barato que el precio cerrado pero con más incertidumbre en el total a pagar." },
  { q: "¿Cómo se ajustan las cuotas de un departamento en pozo?", a: "En Argentina la mayoría de los proyectos ajusta las cuotas en pesos o dólares por el índice CAC (Cámara Argentina de la Construcción). Algunos ofrecen cuotas fijas en dólares. Usá el simulador de cuota CAC del sitio para estimar el impacto." },
  { q: "¿Cuánto cuesta un departamento en pozo en CABA?", a: "Depende del barrio: los precios por m² en pozo van aproximadamente de USD 2.000 a más de USD 5.000. Consultá el índice de precios en pozo por barrio del sitio para valores actualizados." },
  { q: "¿Departamentos en Pozo cobra comisión o es una inmobiliaria?", a: "No. Es un portal independiente de análisis: no es inmobiliaria ni cobra comisión al comprador. Las consultas se derivan sin costo a la inmobiliaria o desarrolladora que comercializa cada proyecto." },
];
