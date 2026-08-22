import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDesarrollos, getDesarrolloBySlug, getDesarrolladoras, featuredImage, proxyImage, acf, stripHtml, SITE, fixImgs } from '../../../lib/wp';
import { toNumber, expandComercializa } from '../../../lib/format';
import Galeria from './Galeria';
import AccionesFicha, { Calculadora } from './AccionesFicha';
import GuardarBtn from '../../_auth/GuardarBtn';
import Descripcion from './Descripcion';
import EsquemaPago from './EsquemaPago';
import TipologiasTabla from './TipologiasTabla';
import Container from '../../_ui/Container';
import JsonLd from '../../_ui/JsonLd';
import Breadcrumb from '../../_ui/Breadcrumb';
import AlertaCTA from '../../_ui/AlertaCTA';
import { mapDesarrollos, similaresDesarrollos } from '../../../lib/catalogo';
import ProyectosSimilares from './ProyectosSimilares';
import CTAContextual from './CTAContextual';
import IntakeLauncher from '../../_ui/IntakeLauncher';

export const dynamicParams = !process.env.EXPORT;
// ISR: regenera la página como máximo cada 1h para tomar cambios de datos de WP sin redeploy manual.
export const revalidate = 3600;

export async function generateStaticParams() {
  const all = await getDesarrollos();
  return (all || []).map((x) => ({ slug: x.slug }));
}

// toNumber (normaliza precio a número) vive en lib/format.

// amenities puede venir como array (ACF repeater/checkbox), como string separada por comas, o null.
function parseAmenities(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((a) => (typeof a === 'string' ? a : a?.amenity || a?.nombre || a?.label || a?.value || ''))
      .filter(Boolean);
  }
  return String(raw)
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Prueba varias claves ACF y devuelve el primer valor no vacío (o null).
function acfAny(node, keys) {
  for (const k of keys) {
    const v = acf(node, k);
    if (v != null && String(v).trim() !== '') return v;
  }
  return null;
}

// ¿El valor contiene markup HTML? (decide dangerouslySetInnerHTML vs párrafo).
function looksLikeHtml(v) {
  return typeof v === 'string' && /<[a-z][\s\S]*>/i.test(v);
}

// Extrae un porcentaje 0-100 de un valor de avance de obra.
function toPercent(v) {
  if (v == null) return null;
  const s = String(v).replace('%', '').replace(',', '.').trim();
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Formatea fecha_entrega "20281201" / "202812" -> "Dic 2028".
function fmtFecha(v) {
  const s = String(v || '');
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  let y, m;
  if (/^\d{8}$/.test(s)) { y = s.slice(0, 4); m = parseInt(s.slice(4, 6), 10); }
  else if (/^\d{6}$/.test(s)) { y = s.slice(0, 4); m = parseInt(s.slice(4, 6), 10); }
  else return v ? String(v) : '';
  return (m >= 1 && m <= 12) ? `${MESES[m - 1]} ${y}` : `${y}`;
}
// Formatea tipologias ["1_ambiente","2_ambientes","4_mas"] -> "1, 2, 4+ amb".
function fmtTipologias(v) {
  if (!v) return '';
  const arr = Array.isArray(v) ? v : String(v).split(',');
  const map = { '1_ambiente': '1', '2_ambientes': '2', '3_ambientes': '3', '4_ambientes': '4', '4_mas': '4+', '5_mas': '5+' };
  const nums = arr.map((x) => map[String(x).trim()] || String(x).replace(/_/g, ' ').trim()).filter(Boolean);
  return nums.length ? nums.join(', ') + ' amb' : '';
}

export async function generateMetadata({ params }) {
  const d = await getDesarrolloBySlug(params.slug);
  if (!d) return { title: 'Proyecto no encontrado' };
  const nombre = (d.title?.rendered || 'Proyecto').split('—')[0].trim();
  const barrio = (d.title?.rendered || '').split('—')[1]?.trim() || '';
  const dev = acfAny(d, ['desarrolladora', 'constructora']);
  const m2 = toNumber(acfAny(d, ['precio_m2']));
  const entregaMeta = fmtFecha(acfAny(d, ['fecha_entrega', 'entrega']));
  const partes = [];
  if (m2) partes.push(`valor de referencia USD ${m2.toLocaleString('es-AR')}/m²`);
  if (dev) partes.push(`desarrollado por ${dev}`);
  if (entregaMeta) partes.push(`entrega ${entregaMeta}`);
  const desc = `${nombre}${barrio ? ` en ${barrio}` : ''}: ${partes.length ? partes.join(', ') + '. ' : ''}Precio, desarrolladora, financiación, avance de obra y análisis independiente vs. la zona.`;
  return {
    title: `${nombre}${barrio ? ' — ' + barrio : ''}: precio, desarrolladora y entrega | Departamentos en Pozo`,
    description: desc.slice(0, 320),
    alternates: { canonical: `${SITE}/desarrollos-inmobiliarios/${params.slug}/` },
  };
}

export default async function FichaProyecto({ params }) {
  const d = await getDesarrolloBySlug(params.slug);
  if (!d) notFound();

  // El título viene "Nombre — Barrio"; separamos ambos.
  const tituloRaw = d.title?.rendered || 'Proyecto';
  const nombre = tituloRaw.split('—')[0].trim() || tituloRaw;
  const barrio = (tituloRaw.split('—')[1] || '').trim() || acf(d, 'barrio') || 'Buenos Aires';
  const direccion = acfAny(d, ['direccion', 'direccion_completa']) || `${barrio}, CABA`;

  const entrega = fmtFecha(acfAny(d, ['fecha_entrega', 'entrega']));
  const ambientes = fmtTipologias(acfAny(d, ['tipologias', 'ambientes']));
  const ajuste = acfAny(d, ['ajuste', 'ajuste_cuotas']);
  const constructora = expandComercializa(acfAny(d, ['desarrolladora', 'constructora']));
  const estado = acfAny(d, ['estado', 'pozo_estado', 'estado_obra']);
  const lat = acfAny(d, ['lat', 'latitud']);
  const lng = acfAny(d, ['lng', 'longitud']);
  const amenities = parseAmenities(acf(d, 'amenities'));

  // Precio: separamos el TOTAL ("desde") del VALOR/m² (referencia de mercado).
  // El total es el héroe; el /m² baja a referencia (dato del inversor, no el titular).
  // Nunca se estima un total a partir del m²: si no hay total, se muestra "Consultar precio".
  const precioDesdeNum = toNumber(acfAny(d, ['precio_desde']));
  const precioM2Num = toNumber(acfAny(d, ['precio_m2']));
  const precioHeroLabel = precioDesdeNum ? `Desde USD ${precioDesdeNum.toLocaleString('es-AR')}` : 'Consultar precio';
  const refM2Label = precioM2Num ? `USD ${precioM2Num.toLocaleString('es-AR')} /m²` : null;
  // Cuota mensual estimada: SOLO si viene cargada como dato real. No se deriva/inventa acá.
  const cuotaEstim = acfAny(d, ['cuota_estimada']);
  const anticipoRaw = acfAny(d, ['anticipo']);
  const anticipoNum = toNumber(anticipoRaw);
  const anticipoLabel = anticipoNum ? `USD ${anticipoNum.toLocaleString('es-AR')}` : (anticipoRaw ? String(anticipoRaw) : null);
  const cuotas = acfAny(d, ['esquema_cuotas']);
  const comparableNum = toNumber(acf(d, 'comparable_terminado'));
  // Plan de pago estructurado (timeline) y tabla de unidades — datos reales; si no hay, degradan solos.
  const esquemaPasos = acf(d, 'esquema_pago');   // array [{etapa, detalle}]
  const unidades = acf(d, 'unidades');           // array [{tipologia, sup_total, sup_cubierta, precio, disponibilidad}]
  // Texto libre del esquema SOLO si aporta info; los placeholders "A consultar…" no arman sección.
  const cuotasReal = cuotas && !/^\s*(a\s+)?consultar/i.test(String(cuotas)) ? cuotas : null;

  // Link a la landing de la desarrolladora, si tiene página propia (match por nombre normalizado).
  let devHref = null;
  if (constructora) {
    try {
      const devs = await getDesarrolladoras();
      const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
      const t = norm(constructora); // norm quita acentos y no-alfanumérico
      const hit = (devs || []).find((x) => { const n = norm(x.nombre); return n && (n === t || (n.length > 4 && t.length > 4 && (n.includes(t) || t.includes(n)))); });
      if (hit && hit.slug) devHref = `/desarrolladoras/${hit.slug}/`;
    } catch (e) { devHref = null; }
  }

  // Etapa de obra para el stepper visual (En pozo · Construcción · Terminado).
  const etapaTxt = String(estado || '').toLowerCase();
  const etapaIdx = /termin|entreg/.test(etapaTxt) ? 2 : /construc/.test(etapaTxt) ? 1 : 0;

  const imagen = featuredImage(d);
  const contenido = fixImgs(d.content?.rendered || '');

  // Catálogo mapeado (una sola vez): alimenta similares + panel de confianza dev + contexto de precio.
  let allMapped = [];
  try { allMapped = mapDesarrollos(await getDesarrollos()); } catch (e) { allMapped = []; }

  // Proyectos similares (carrusel al pie): mismo barrio / precio cercano / etapa.
  let similares = [];
  try {
    similares = similaresDesarrollos(d.slug, allMapped, {
      barrio,
      precioDesde: precioDesdeNum,
      precioM2: precioM2Num,
      etapa: /construc/.test(String(estado || '').toLowerCase()) ? 'En construcción' : 'En pozo',
    }, 10);
  } catch (e) { similares = []; }

  // --- Bloque 1: panel de confianza de la desarrolladora (dato propio, honesto) ---
  // Contamos proyectos de esta dev en NUESTRO catálogo, barrios y rango de entregas.
  const _norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  let devStats = null;
  if (constructora) {
    const dk = _norm(constructora);
    if (dk.length > 2) {
      const suyos = allMapped.filter((m) => {
        const n = _norm(m.desarrolladora);
        return n && (n === dk || (n.length > 4 && dk.length > 4 && (n.includes(dk) || dk.includes(n))));
      });
      if (suyos.length) {
        const barriosDev = [...new Set(suyos.map((s) => s.barrio).filter(Boolean))];
        const anios = suyos.map((s) => s.entregaAnio).filter(Boolean).sort((a, b) => a - b);
        devStats = {
          n: suyos.length,
          barrios: barriosDev,
          anioMin: anios[0] || null,
          anioMax: anios[anios.length - 1] || null,
          verificada: suyos.length >= 3,
        };
      }
    }
  }

  // --- Bloque 2: contexto de precio vs. el barrio (mediana del catálogo en la zona) ---
  const _topBarrio = (b) => (String(b || '').startsWith('Palermo') ? 'Palermo' : String(b || ''));
  let precioCtx = null;
  if (precioM2Num) {
    const curTop = _topBarrio(barrio);
    const pares = allMapped
      .filter((m) => m.slug !== d.slug && m.precioM2 && _topBarrio(m.barrio) === curTop && curTop)
      .map((m) => m.precioM2);
    if (pares.length >= 3) {
      const sorted = [...pares].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      precioCtx = {
        median,
        n: pares.length,
        diffPct: Math.round(((precioM2Num - median) / median) * 100),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        barrioLabel: curTop,
      };
    }
  }

  // Galería: featured + fotos del campo `galeria` (proxied) + imágenes del contenido.
  // `galeria` es un array de URLs (renders/fotos reales del proyecto) en el dato del
  // desarrollo (top-level o acf.galeria). Únicas, hasta 8 para una galería completa.
  const galeriaRaw = Array.isArray(d.galeria) ? d.galeria : (Array.isArray(acf(d, 'galeria')) ? acf(d, 'galeria') : []);
  const galeriaImgs = galeriaRaw.map((u) => proxyImage(u)).filter(Boolean);
  const contentImgs = [...contenido.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
  const gallery = [imagen, ...galeriaImgs, ...contentImgs].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);

  // Campos que se muestran solo si existen.
  const legal = acfAny(d, ['legal', 'confianza_legal', 'estructura_legal']);
  const obra = acfAny(d, ['obra', 'avance_obra', 'estado_obra', 'avance']);
  const obraPct = toPercent(obra);
  const rentabilidad = acfAny(d, ['rentabilidad', 'renta', 'proyeccion_renta', 'roi']);

  // --- Facts & features (estilo Zillow), solo filas con dato real ---
  const grupoDesarrollo = [
    ['Desarrolladora', constructora],
    ['Entrega estimada', entrega || null],
    ['Tipologías', ambientes || null],
    ['Avance de obra', obraPct != null ? `${obraPct}%` : (obra && !looksLikeHtml(obra) ? obra : null)],
    ['Estado', estado || null],
  ].filter(([, v]) => v);

  const grupoFinanciacion = [
    ['Precio desde (total)', precioDesdeNum ? `USD ${precioDesdeNum.toLocaleString('es-AR')}` : null],
    ['Valor de referencia', refM2Label],
    ['Cuota estimada', cuotaEstim ? String(cuotaEstim) : null],
    ['Anticipo', anticipoLabel],
    ['Ajuste de cuotas', ajuste || null],
    ['Comparable (usado terminado)', comparableNum ? `USD ${comparableNum.toLocaleString('es-AR')} /m²` : null],
  ].filter(([, v]) => v);

  const grupoUbicacion = [
    ['Dirección', direccion || null],
    ['Barrio', barrio || null],
  ].filter(([, v]) => v);

  // Resumen tipo Zillow (bd | ba | sqft) adaptado a pozo.
  const resumen = [
    ambientes ? { icon: 'apartment', label: ambientes } : null,
    entrega ? { icon: 'event_available', label: `Entrega ${entrega}` } : null,
    { icon: 'location_on', label: barrio },
  ].filter(Boolean);

  // --- Bloque 3: checklist de due diligence del proyecto ---
  // Cada punto: ✔ si tenemos el dato / — si falta (→ motivo concreto para pedirlo al asesor).
  // Los "—" son la mejor palanca de lead: convierten un dato faltante en una consulta.
  const dueItems = [
    { k: 'Desarrolladora identificada', ok: !!constructora, pedido: 'saber quién desarrolla y su trayectoria' },
    { k: 'Precio y forma de pago', ok: !!(precioDesdeNum || precioM2Num), pedido: 'el precio actualizado y la forma de pago' },
    { k: 'Esquema de cuotas y ajuste', ok: !!((Array.isArray(esquemaPasos) && esquemaPasos.length) || cuotasReal || ajuste), pedido: 'el plan de pago con el ajuste (CAC u otro)' },
    { k: 'Cronograma y avance de obra', ok: !!(obraPct != null || entrega), pedido: 'el cronograma de obra y la fecha de entrega' },
    { k: 'Tipologías y superficies', ok: !!((Array.isArray(unidades) && unidades.length) || ambientes), pedido: 'el detalle de tipologías y superficies' },
    { k: 'Estructura legal (fideicomiso / SA)', ok: !!legal, pedido: 'la estructura legal y el contrato de fideicomiso' },
  ];
  const dueOk = dueItems.filter((x) => x.ok).length;

  // --- Bloque 7 (P1): Veredicto del analista — síntesis honesta, semi-plantillada por reglas ---
  const _financiacionReal = !!((Array.isArray(esquemaPasos) && esquemaPasos.length) || cuotasReal || ajuste);
  const veredicto = (() => {
    const para = [], fuerte = [], verificar = [];
    if (precioCtx && precioCtx.diffPct <= -3) para.push('el que busca precio por debajo del promedio de la zona');
    if (devStats && devStats.verificada) para.push('quien prioriza una desarrolladora con trayectoria comprobable');
    if (_financiacionReal) para.push('quien necesita pagar en cuotas durante la obra');
    if (!para.length) para.push('inversores que hacen su propia due diligence antes de decidir');
    if (precioCtx && precioCtx.diffPct <= -3) fuerte.push(`entra ${Math.abs(precioCtx.diffPct)}% por debajo de la mediana de ${precioCtx.barrioLabel}`);
    else if (devStats && devStats.verificada) fuerte.push(`la desarrolladora tiene ${devStats.n} proyectos relevados en nuestro catálogo`);
    else if (precioM2Num) fuerte.push('publica precio de referencia, algo que muchos proyectos en pozo no muestran');
    const falt = dueItems.filter((x) => !x.ok).map((x) => x.k.toLowerCase());
    if (falt.length) verificar.push(`todavía faltan datos por confirmar: ${falt.slice(0, 3).join(', ')}`);
    else verificar.push('confirmá el fideicomiso, el índice de ajuste de las cuotas y el plazo de entrega antes de firmar');
    return { para, fuerte, verificar };
  })();

  // --- Bloque 8: Preguntas frecuentes por proyecto (long-tail + AEO). ---
  // Solo preguntas con dato real; respuestas neutrales (no hablan mal del proyecto).
  const _ctxFrase = precioCtx
    ? (precioCtx.diffPct <= -3
        ? ` Su valor por m² está ${Math.abs(precioCtx.diffPct)}% por debajo de la mediana de USD ${precioCtx.median.toLocaleString('es-AR')}/m² de ${precioCtx.barrioLabel}.`
        : precioCtx.diffPct >= 3
          ? ` Se ubica en el segmento premium de ${precioCtx.barrioLabel} (mediana USD ${precioCtx.median.toLocaleString('es-AR')}/m²).`
          : ` Está en línea con la mediana de USD ${precioCtx.median.toLocaleString('es-AR')}/m² de ${precioCtx.barrioLabel}.`)
    : '';
  const faqs = [];
  faqs.push({
    q: `¿Cuánto cuesta ${nombre}?`,
    a: precioDesdeNum
      ? `El precio publicado de ${nombre} arranca en USD ${precioDesdeNum.toLocaleString('es-AR')}.${refM2Label ? ` El valor de referencia es de ${refM2Label}.` : ''}${_ctxFrase} Los valores varían según piso, orientación y avance de obra; pedí el precio actualizado a la desarrolladora.`
      : precioM2Num
        ? `El valor de referencia de ${nombre} es de ${refM2Label}.${_ctxFrase} No hay un precio total de lista publicado; podés pedir el valor actualizado de la unidad a la desarrolladora.`
        : `${nombre} no publica un precio de lista. Podés pedir el valor actualizado y la forma de pago a la desarrolladora desde el sitio.`,
  });
  if (constructora) faqs.push({
    q: `¿Quién desarrolla ${nombre}?`,
    a: `${nombre} es desarrollado por ${constructora}.${devStats ? ` En nuestro catálogo relevamos ${devStats.n} proyecto${devStats.n === 1 ? '' : 's'} de esta desarrolladora${devStats.barrios && devStats.barrios.length ? ` en ${devStats.barrios.slice(0, 3).join(', ')}` : ''}.` : ''} Verificar la trayectoria de la desarrolladora (obras anteriores entregadas) es clave al comprar en pozo.`,
  });
  if (entrega) faqs.push({
    q: `¿Cuándo se entrega ${nombre}?`,
    a: `La entrega estimada de ${nombre} es ${entrega}.${estado ? ` Estado de obra: ${String(estado)}.` : ''} En pozo el plazo puede ajustarse; conviene confirmar el cronograma de obra antes de firmar.`,
  });
  faqs.push({
    q: `¿En qué barrio está ${nombre}?`,
    a: `${nombre} está ubicado en ${barrio}, CABA${direccion && direccion !== `${barrio}, CABA` ? ` (${direccion})` : ''}.`,
  });
  if (ambientes) faqs.push({
    q: `¿Qué tipologías tiene ${nombre}?`,
    a: `${nombre} ofrece unidades de ${ambientes}.${amenities.length ? ` Entre sus amenities: ${amenities.slice(0, 5).join(', ')}.` : ''}`,
  });
  if (anticipoLabel || cuotasReal || ajuste) faqs.push({
    q: `¿Cómo se paga ${nombre}? ¿Tiene financiación?`,
    a: `${nombre} se compra en pozo${anticipoLabel ? ` con un anticipo de ${anticipoLabel}` : ''} y cuotas durante la obra.${ajuste ? ` Las cuotas se ajustan por ${String(ajuste)}.` : ' Confirmá el índice de ajuste (CAC u otro) y el saldo a la posesión antes de firmar.'}`,
  });
  faqs.push({
    q: `¿Conviene invertir en ${nombre}?`,
    a: `${nombre} es un proyecto en pozo en ${barrio}.${precioCtx && precioCtx.diffPct <= -3 ? ' Su valor por m² está por debajo de la mediana de la zona.' : ''} Como en toda preventa, la conveniencia depende de tu perfil: conviene verificar la trayectoria de la desarrolladora, el índice de ajuste de las cuotas y el plazo de entrega. Podés pedirnos un análisis para tu caso.`,
  });

  const faqSchema = faqs.length ? {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  } : null;

  // --- JSON-LD (Product/Offer) ---
  const descLimpia = stripHtml(d.excerpt?.rendered) || stripHtml(contenido) || null;
  const schema = { '@context': 'https://schema.org', '@type': precioDesdeNum ? 'Product' : 'Apartment', name: nombre };
  if (descLimpia) schema.description = descLimpia.slice(0, 300);
  if (imagen) schema.image = imagen;
  {
    const address = {};
    if (direccion) address.streetAddress = direccion;
    if (barrio) address.addressLocality = barrio;
    address.addressRegion = 'Buenos Aires';
    address.addressCountry = 'AR';
    schema.address = { '@type': 'PostalAddress', ...address };
  }
  // Offer solo con precio TOTAL real (el /m² no es el precio de la oferta).
  if (precioDesdeNum) {
    schema.offers = {
      '@type': 'Offer',
      price: precioDesdeNum,
      priceCurrency: 'USD',
      availability: 'https://schema.org/PreOrder',
      url: `${SITE}/desarrollos-inmobiliarios/${d.slug}/`,
    };
  }

  // BreadcrumbList: todos los demás tipos de página lo tienen; las fichas no lo tenían.
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Proyectos en pozo', item: `${SITE}/desarrollos-inmobiliarios/` },
      { '@type': 'ListItem', position: 3, name: nombre, item: `${SITE}/desarrollos-inmobiliarios/${d.slug}/` },
    ],
  };

  const mapQuery = lat && lng ? `${lat},${lng}` : encodeURIComponent(`${direccion}`);
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;

  return (
    <>
      <JsonLd data={[schema, breadcrumbSchema, faqSchema].filter(Boolean)} />

      <Container as="main" className="py-6 md:py-8 pb-28">
        {/* Breadcrumb */}
        <Breadcrumb
          tone="light"
          sep="/"
          sepAriaHidden={false}
          className="mb-4"
          items={[
            { name: "Inicio", href: "/" },
            { name: "Proyectos en pozo", href: "/desarrollos-inmobiliarios/" },
            { name: nombre },
          ]}
        />

        {/* Galería mosaico + lightbox con zoom (client) */}
        <Galeria images={gallery} nombre={nombre} />

        {/* Layout 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            {/* Precio + resumen. Héroe = precio TOTAL "desde"; el /m² baja a referencia. */}
            <div className="border-b border-outline-variant pb-6 mb-6">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display-lg text-display-lg text-primary leading-none">{precioHeroLabel}</span>
                {cuotaEstim && <span className="text-body-lg text-secondary font-medium">≈ {String(cuotaEstim)}</span>}
              </div>
              {refM2Label && (
                <p className="text-body-md text-on-surface-variant mt-1.5">
                  Valor de referencia: <span className="text-primary font-medium">{refM2Label}</span>
                </p>
              )}
              <h1 className="font-headline-sm text-headline-sm text-primary mt-2">{nombre}</h1>
              <p className="text-body-md text-on-surface-variant flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[18px] text-link-gold">location_on</span>
                {direccion}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                {resumen.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-link-gold">{r.icon}</span>
                    <span className="text-body-md text-primary font-medium">{r.label}</span>
                    {i < resumen.length - 1 && <span className="text-outline-variant ml-3 hidden sm:inline">|</span>}
                  </div>
                ))}
              </div>

              {/* Stepper de etapa de obra (En pozo · Construcción · Terminado), estilo portal. */}
              <div className="flex items-center gap-0 mt-5 max-w-md">
                {['En pozo', 'En construcción', 'Terminado'].map((label, i) => (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[13px] ${i <= etapaIdx ? 'bg-link-gold text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {i < etapaIdx ? <span className="material-symbols-outlined text-[15px]">check</span> : i + 1}
                      </span>
                      <span className={`text-[11px] whitespace-nowrap ${i === etapaIdx ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>{label}</span>
                    </div>
                    {i < 2 && <span className={`h-px flex-1 mx-1 -mt-4 ${i < etapaIdx ? 'bg-link-gold' : 'bg-outline-variant'}`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* BRECHA POZO vs TERMINADO — el dato diferencial del sitio, como conclusión
                y no como herramienta. Se lee sin tocar nada. Solo se muestra si ambos
                valores existen; nunca se estima. */}
            {precioM2Num && comparableNum && comparableNum > precioM2Num ? (
              <div className="mb-8 rounded-xl border border-link-gold/40 bg-link-gold/[0.06] p-6">
                <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                  COMPRANDO EN POZO
                </p>
                <p className="font-headline-md text-headline-md text-primary leading-tight">
                  Pagás {Math.round(((comparableNum - precioM2Num) / comparableNum) * 100)}% menos
                  que un terminado comparable de la zona
                </p>
                <p className="text-body-md text-on-surface-variant mt-3">
                  USD {precioM2Num.toLocaleString('es-AR')}/m² en pozo contra USD {comparableNum.toLocaleString('es-AR')}/m² terminado
                  {' '}— una diferencia de <strong className="text-primary">USD {(comparableNum - precioM2Num).toLocaleString('es-AR')} por m²</strong>.
                </p>
                <p className="text-[12px] text-on-surface-variant mt-3">
                  La brecha es la contrapartida del riesgo de obra: se cobra al entregar, no al firmar.
                </p>
              </div>
            ) : null}

            {/* BLOQUE 2 — Contexto de precio vs. el barrio (dato propio, honesto).
                El portal da un número aislado; nosotros lo ubicamos en el rango de la zona (sin hablar mal del proyecto). */}
            {precioCtx ? (
              <div className="mb-8 rounded-xl border border-outline-variant p-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="font-headline-sm text-headline-sm text-primary">Este precio, en contexto</h2>
                  <span className={`text-[12px] font-label-caps uppercase tracking-wider px-2.5 py-1 rounded-md ${precioCtx.diffPct <= -3 ? 'bg-green-700/10 text-green-800' : precioCtx.diffPct >= 8 ? 'bg-link-gold/15 text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
                    {precioCtx.diffPct <= -3 ? `${Math.abs(precioCtx.diffPct)}% bajo promedio` : precioCtx.diffPct >= 3 ? 'Segmento premium de la zona' : 'En línea con la zona'}
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant">
                  A <strong className="text-primary">USD {precioM2Num.toLocaleString('es-AR')}/m²</strong>, este proyecto se ubica
                  {precioCtx.diffPct <= -3 ? ' por debajo de ' : precioCtx.diffPct >= 3 ? ' en el segmento premium de la zona, por sobre ' : ' en línea con '}
                  la mediana de <strong className="text-primary">USD {precioCtx.median.toLocaleString('es-AR')}/m²</strong> de {precioCtx.n} proyectos en pozo relevados en {precioCtx.barrioLabel}.
                </p>
                {/* Barra: rango del barrio + dónde cae este proyecto */}
                <div className="mt-4">
                  <div className="relative h-2 rounded-full bg-surface-container-high">
                    {(() => {
                      const lo = Math.min(precioCtx.min, precioM2Num), hi = Math.max(precioCtx.max, precioM2Num);
                      const pos = hi > lo ? ((precioM2Num - lo) / (hi - lo)) * 100 : 50;
                      const medPos = hi > lo ? ((precioCtx.median - lo) / (hi - lo)) * 100 : 50;
                      return (<>
                        <span className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-on-surface-variant/50" style={{ left: `${medPos}%` }} />
                        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-link-gold border-2 border-surface shadow" style={{ left: `${pos}%` }} />
                      </>);
                    })()}
                  </div>
                  <div className="flex justify-between text-[11px] text-on-surface-variant mt-1.5">
                    <span>USD {precioCtx.min.toLocaleString('es-AR')}/m²</span>
                    <span>mediana {precioCtx.barrioLabel}</span>
                    <span>USD {precioCtx.max.toLocaleString('es-AR')}/m²</span>
                  </div>
                </div>
                <p className="text-[12px] text-on-surface-variant mt-3">
                  Referencia sobre datos propios del catálogo; el valor final depende de piso, orientación, amenities y avance de obra.
                </p>
                <div className="mt-3">
                  <CTAContextual nombre={nombre} slug={d.slug} pedido={`un análisis de si el precio de ${nombre} es conveniente para ${precioCtx.barrioLabel}`} label="Pedir análisis de precio" icon="query_stats" />
                </div>
              </div>
            ) : null}

            {/* BLOQUE 1 — Panel de confianza de la desarrolladora (la pregunta #1 en pozo). */}
            {devStats ? (
              <div className="mb-8 rounded-xl border border-outline-variant p-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-link-gold">verified</span> ¿Quién construye?
                  </h2>
                  <span className={`text-[12px] font-label-caps uppercase tracking-wider px-2.5 py-1 rounded-md ${devStats.verificada ? 'bg-green-700/10 text-green-800' : 'bg-surface-container text-on-surface-variant'}`}>
                    {devStats.verificada ? 'Trayectoria verificada' : 'Datos limitados'}
                  </span>
                </div>
                <p className="text-body-md text-on-surface-variant">
                  <strong className="text-primary">{constructora}</strong> tiene <strong className="text-primary">{devStats.n} proyecto{devStats.n === 1 ? '' : 's'}</strong> en pozo relevado{devStats.n === 1 ? '' : 's'} en nuestro catálogo
                  {devStats.barrios.length ? `, en ${devStats.barrios.slice(0, 4).join(', ')}${devStats.barrios.length > 4 ? ' y más' : ''}` : ''}
                  {devStats.anioMin ? `. Entregas estimadas entre ${devStats.anioMin} y ${devStats.anioMax}.` : '.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {devHref && (
                    <Link href={devHref} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-secondary hover:text-primary underline underline-offset-2">
                      Ver los {devStats.n} proyectos de {constructora} →
                    </Link>
                  )}
                  <CTAContextual nombre={nombre} slug={d.slug} pedido={`el historial de obras entregadas de ${constructora}`} label="Pedir historial de entregas" icon="history" />
                </div>
                <p className="text-[12px] text-on-surface-variant mt-3">
                  Verificar la trayectoria del desarrollador (obras anteriores terminadas y entregadas) es la mitigación de riesgo central al comprar en pozo.
                </p>
              </div>
            ) : null}

            {/* Lo destacado (amenities) */}
            {amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Lo destacado</h2>
                <div className="flex flex-wrap gap-2.5">
                  {amenities.map((a, idx) => (
                    <span key={idx} className="px-3.5 py-2 bg-surface-container border border-outline-variant rounded-full text-[13px] flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px] text-link-gold">check_circle</span> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Datos y características (Facts & features estilo Zillow) */}
            <div className="mb-8">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Datos y características</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {grupoDesarrollo.length > 0 && (
                  <div className="border border-outline-variant rounded-xl p-5">
                    <h3 className="font-label-caps text-label-caps text-primary mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-link-gold">apartment</span> Desarrollo
                    </h3>
                    <dl className="space-y-2">
                      {grupoDesarrollo.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 text-[14px]">
                          <dt className="text-on-surface-variant">{k}</dt>
                          <dd className="text-primary font-medium text-right">
                            {k === 'Desarrolladora' && devHref
                              ? <Link href={devHref} className="text-secondary underline underline-offset-2 hover:text-primary">{v}</Link>
                              : v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {grupoFinanciacion.length > 0 && (
                  <div className="border border-outline-variant rounded-xl p-5">
                    <h3 className="font-label-caps text-label-caps text-primary mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-link-gold">payments</span> Financiación
                    </h3>
                    <dl className="space-y-2">
                      {grupoFinanciacion.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 text-[14px]">
                          <dt className="text-on-surface-variant">{k}</dt>
                          <dd className="text-primary font-medium text-right">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {grupoUbicacion.length > 0 && (
                  <div className="border border-outline-variant rounded-xl p-5">
                    <h3 className="font-label-caps text-label-caps text-primary mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-link-gold">location_on</span> Ubicación
                    </h3>
                    <dl className="space-y-2">
                      {grupoUbicacion.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 text-[14px]">
                          <dt className="text-on-surface-variant">{k}</dt>
                          <dd className="text-primary font-medium text-right">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                {obraPct != null && (
                  <div className="border border-outline-variant rounded-xl p-5">
                    <h3 className="font-label-caps text-label-caps text-primary mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-link-gold">construction</span> Avance de obra
                    </h3>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[14px] text-on-surface-variant">Progreso</span>
                      <span className="font-headline-sm text-headline-sm text-primary">{obraPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-link-gold" style={{ width: `${obraPct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BLOQUE 3 — Checklist de due diligence del proyecto. El bloque más anti-portal:
                mostramos qué verificar antes de comprar en pozo y qué dato tenemos de ESTE proyecto.
                Los "—" (faltantes) son motivos concretos para pedirle al asesor. */}
            <div className="mb-8 rounded-xl border border-link-gold/40 bg-link-gold/[0.04] p-6">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-link-gold">fact_check</span> Qué verificar antes de comprar
                </h2>
                <span className="text-[12px] text-on-surface-variant">{dueOk}/{dueItems.length} con dato</span>
              </div>
              <p className="text-[13px] text-on-surface-variant mb-4">
                Somos un sitio de análisis independiente: te mostramos lo que hay que chequear en pozo y qué dato tenemos de este proyecto. Lo que falta, lo pedís y te lo conseguimos.
              </p>
              <ul className="space-y-2.5">
                {dueItems.map((it) => (
                  <li key={it.k} className="flex items-start gap-3 text-[14px]">
                    <span className={`material-symbols-outlined text-[20px] mt-0.5 ${it.ok ? 'text-green-700' : 'text-on-surface-variant/50'}`}>
                      {it.ok ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="flex-1">
                      <span className={it.ok ? 'text-primary' : 'text-on-surface-variant'}>{it.k}</span>
                      {!it.ok && (
                        <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
                          <CTAContextual nombre={nombre} slug={d.slug} pedido={it.pedido} label="Pedir este dato" icon="forum" />
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-on-surface-variant mt-4">
                Ver también nuestras guías de <a href="/que-revisar-antes-de-comprar-en-pozo-checklist-due-diligence/" className="text-secondary hover:underline">due diligence</a> y <a href="/fideicomiso-al-costo-vs-sociedad-anonima/" className="text-secondary hover:underline">fideicomiso vs. SA</a>.
              </p>
            </div>

            {/* Plan de pago estructurado (diferenciador). Timeline si hay datos; si no, el texto libre. */}
            <EsquemaPago pasos={esquemaPasos} textoLibre={cuotasReal} />

            {/* Tabla de tipologías/unidades (solo si hay datos por unidad cargados). */}
            <TipologiasTabla unidades={unidades} />

            {/* Descripción (texto, después de los datos rápidos; colapsable para no saturar) */}
            <div className="mb-8">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Sobre este desarrollo</h2>
              {contenido ? (
                <Descripcion html={contenido} />
              ) : (
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {nombre} es un desarrollo en pozo en {barrio}. Cargá la descripción, el render y los datos comerciales para completar esta ficha.
                </p>
              )}
            </div>

            {/* Legal / Rentabilidad (prose, solo si hay dato) */}
            {legal && (
              <div className="mb-8">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-link-gold">verified_user</span> Estructura legal y seguridad
                </h2>
                {looksLikeHtml(legal) ? (
                  <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: legal }} />
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{legal}</p>
                )}
              </div>
            )}
            {rentabilidad && (
              <div className="mb-8">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-link-gold">trending_up</span> Proyección de rentabilidad
                </h2>
                {looksLikeHtml(rentabilidad) ? (
                  <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: rentabilidad }} />
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{rentabilidad}</p>
                )}
              </div>
            )}

            {/* Mapa */}
            <div className="mb-4">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Ubicación</h2>
              <div className="h-[380px] rounded-xl overflow-hidden border border-outline-variant">
                <iframe title={`Mapa de ${nombre}`} src={mapSrc} className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </div>

            {/* Calculadora: bajó del sidebar al cuerpo. Acá es "ajustá los supuestos",
                el titular ya lo dio el bloque de brecha más arriba. */}
            {precioM2Num && comparableNum ? (
              <div className="mb-4">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Simulá tu inversión</h2>
                <Calculadora precioNum={precioM2Num} comparableNum={comparableNum} />
              </div>
            ) : null}

            {/* BLOQUE 7 — Veredicto del analista (síntesis honesta, E-E-A-T). Cierra la narrativa
                de independencia: para quién es, su punto fuerte y su punto a verificar. */}
            <div className="mb-8 rounded-xl border-l-4 border-link-gold bg-surface-container-low p-6">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-link-gold">rate_review</span> Veredicto del analista
              </h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                <strong className="text-primary">Para quién:</strong> {veredicto.para[0]}{veredicto.para[1] ? ` y ${veredicto.para[1]}` : ''}.{' '}
                {veredicto.fuerte.length ? <><strong className="text-primary">A favor:</strong> {veredicto.fuerte[0]}. </> : null}
                <strong className="text-primary">A verificar:</strong> {veredicto.verificar[0]}.
              </p>
              <p className="text-[12px] text-on-surface-variant mt-3">
                Síntesis editorial independiente sobre datos propios; no es asesoramiento financiero. — Equipo Departamentos en Pozo
              </p>
              <div className="mt-3">
                <CTAContextual nombre={nombre} slug={d.slug} pedido={`una opinión honesta sobre si ${nombre} conviene para mi caso`} label="Consultar con un asesor" icon="forum" />
              </div>
            </div>

            {/* BLOQUE 8 — Preguntas frecuentes (contenido visible que matchea el schema FAQPage;
                captura long-tail "{proyecto} precio/quién desarrolla/cuándo entrega" + AEO). */}
            {faqs.length ? (
              <section className="mb-8">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-link-gold">quiz</span> Preguntas frecuentes sobre {nombre}
                </h2>
                <div className="border-y border-outline-variant divide-y divide-outline-variant">
                  {faqs.map((f, i) => (
                    <details key={i} className="group py-3">
                      <summary className="cursor-pointer list-none flex items-start justify-between gap-3 font-medium text-primary">
                        <span>{f.q}</span>
                        <span className="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180">expand_more</span>
                      </summary>
                      <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Disclaimer independencia (E-E-A-T / YMYL) */}
            <p className="text-[12px] text-on-surface-variant leading-relaxed border-t border-outline-variant pt-4 mt-6">
              Análisis independiente con fines informativos. Los datos son de fuentes públicas y de la comercializadora,
              pueden variar y no constituyen asesoramiento financiero ni oferta comercial. Verificá precios, plazos y
              condiciones legales antes de invertir. Las imágenes son de referencia, gentileza de la desarrolladora o de fuentes públicas; los derechos pertenecen a sus autores.
            </p>

            {/* Captura de leads: alerta para este perfil de proyecto */}
            <AlertaCTA titulo="¿Buscás un proyecto así?" texto={`Activá una alerta y te avisamos cuando aparezca un nuevo lanzamiento en ${barrio} o en el barrio que elijas, antes de que salga a los portales.`} cta="Crear alerta" />

            {/* Intake: si el que mira es la desarrolladora/comercializadora, que cargue o actualice hablando. */}
            <IntakeLauncher variant="banner" />
          </div>

          {/* Sidebar: contacto (modal) + calculadora de inversión + barra móvil (client) */}
          <aside className="lg:col-span-1">
            <AccionesFicha
              slug={d.slug}
              nombre={nombre}
              precioHeroLabel={precioHeroLabel}
              precioDesdeNum={precioDesdeNum}
              refM2Label={refM2Label}
              cuotaEstim={cuotaEstim ? String(cuotaEstim) : null}
              anticipoLabel={anticipoLabel}
              entrega={entrega}
              cuotas={cuotasReal}
              ajuste={ajuste}
              comparableNum={comparableNum}
            />
            <GuardarBtn
              variant="full"
              className="w-full mt-3"
              card={{ slug: d.slug, nombre, barrio, precioDesde: precioDesdeNum, img: imagen, etapa: estado, entrega, desarrolladora: constructora }}
            />
          </aside>
        </div>

        {/* Interlinking: carrusel de proyectos similares (mismo barrio / precio) */}
        <ProyectosSimilares items={similares} barrio={barrio} />
      </Container>
    </>
  );
}
