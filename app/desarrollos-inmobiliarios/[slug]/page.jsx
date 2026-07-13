import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDesarrollos, getDesarrolloBySlug, featuredImage, acf, stripHtml, SITE } from '../../../lib/wp';

export const dynamicParams = !process.env.EXPORT;

export async function generateStaticParams() {
  const all = await getDesarrollos();
  return (all || []).map((x) => ({ slug: x.slug }));
}

// Normaliza precio a número para poder formatear/derivar el anticipo.
function toNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

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

// Extrae un porcentaje 0-100 de un valor de avance de obra (número, "45", "45%", "45,5%").
function toPercent(v) {
  if (v == null) return null;
  const s = String(v).replace('%', '').replace(',', '.').trim();
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function generateMetadata({ params }) {
  const d = await getDesarrolloBySlug(params.slug);
  if (!d) return { title: 'Proyecto no encontrado' };
  const nombre = d.title?.rendered || 'Proyecto';
  return {
    title: `${nombre} - Departamentos en Pozo`,
    description: `Ficha del desarrollo ${nombre}. Precios, financiación, amenities y ubicación.`,
  };
}

export default async function FichaProyecto({ params }) {
  const d = await getDesarrolloBySlug(params.slug);
  if (!d) notFound();

  const nombre = d.title?.rendered || 'Proyecto';
  const barrio = acf(d, 'barrio') || 'Buenos Aires';
  const direccion = acf(d, 'direccion') || `${barrio}, CABA`;
  const entrega = acf(d, 'entrega') || 'Consultar';
  const ambientes = acf(d, 'ambientes') || 'Consultar';
  const ajuste = acf(d, 'ajuste') || 'Índice CAC';
  const constructora = acf(d, 'constructora') || null; // fallback: no se muestra si falta
  const lat = acf(d, 'lat') || acf(d, 'latitud') || null;
  const lng = acf(d, 'lng') || acf(d, 'longitud') || null;
  const amenities = parseAmenities(acf(d, 'amenities'));

  const precioNum = toNumber(acf(d, 'precio_desde'));
  const precioLabel = precioNum ? `USD ${precioNum.toLocaleString('es-AR')}` : 'Consultar';
  // Anticipo estimado 40% (mismo criterio del diseño) si hay precio numérico.
  const anticipo = precioNum ? Math.round(precioNum * 0.4) : null;
  const anticipoLabel = anticipo ? anticipo.toLocaleString('es-AR') : 'Consultar';

  const imagen = featuredImage(d);
  const contenido = d.content?.rendered || '';

  // --- Campos nuevos (se muestran solo si existen) ---
  const legal = acfAny(d, ['legal', 'confianza_legal', 'estructura_legal']);
  const obra = acfAny(d, ['obra', 'avance_obra', 'estado_obra', 'avance']);
  const obraPct = toPercent(obra);
  const rentabilidad = acfAny(d, ['rentabilidad', 'renta', 'proyeccion_renta', 'roi']);

  // --- JSON-LD (Product/Offer) para la ficha ---
  const descLimpia = stripHtml(d.excerpt?.rendered) || stripHtml(contenido) || null;
  const schema = { '@context': 'https://schema.org', '@type': 'Product', name: nombre };
  if (descLimpia) schema.description = descLimpia.slice(0, 300);
  if (imagen) schema.image = imagen;
  {
    const address = {};
    if (direccion) address.streetAddress = direccion;
    if (barrio) address.addressLocality = barrio;
    address.addressRegion = 'Buenos Aires';
    address.addressCountry = 'AR';
    if (Object.keys(address).length) schema.address = { '@type': 'PostalAddress', ...address };
  }
  if (precioNum) {
    schema.offers = {
      '@type': 'Offer',
      price: precioNum,
      priceCurrency: 'USD',
      availability: 'https://schema.org/PreOrder',
      url: `${SITE}/desarrollos-inmobiliarios/${d.slug}/`,
    };
  }

  // Mapa: usamos Google Maps embed con lat/lng si están, si no con la dirección.
  const mapQuery = lat && lng ? `${lat},${lng}` : encodeURIComponent(`${direccion}`);
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-baseline justify-between mb-10 gap-4">
          <div>
            <span className="font-label-caps text-label-caps text-secondary mb-2 block">
              {barrio.toUpperCase()}, BUENOS AIRES
            </span>
            <h1 className="font-display-lg text-display-lg text-primary">{nombre}</h1>
          </div>
          <div className="flex flex-col md:items-end">
            <span className="font-label-caps text-label-caps text-on-surface-variant">DESDE</span>
            <span className="font-headline-md text-headline-md text-primary">{precioLabel}</span>
          </div>
        </header>

        {/* Gallery Grid 4:3 — usamos la imagen destacada de WP como fachada principal */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-12">
          <div className="md:col-span-8 aspect-[4/3] relative overflow-hidden group">
            {imagen ? (
              <img
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                src={imagen}
                alt={nombre}
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high" />
            )}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1">
              <span className="font-label-caps text-[10px] tracking-widest text-primary">FACHADA PRINCIPAL</span>
            </div>
          </div>
          <div className="md:col-span-4 flex flex-col gap-gutter">
            <div className="aspect-[4/3] relative overflow-hidden group">
              {imagen ? (
                <img
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  src={imagen}
                  alt={nombre}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-high" />
              )}
            </div>
            <div className="aspect-[4/3] relative overflow-hidden group">
              {imagen ? (
                <img
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  src={imagen}
                  alt={nombre}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-high" />
              )}
            </div>
          </div>
        </section>

        {/* Quick Info Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 border-y border-outline-variant py-8 mb-12 gap-8">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-link-gold text-3xl">calendar_today</span>
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant">ENTREGA</p>
              <p className="font-body-lg text-body-lg text-primary font-medium">{entrega}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-x-0 sm:border-x border-outline-variant sm:px-8">
            <span className="material-symbols-outlined text-link-gold text-3xl">payments</span>
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant">FINANCIACIÓN</p>
              <p className="font-body-lg text-body-lg text-primary font-medium">40% Anticipo + Cuotas</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:pl-8">
            <span className="material-symbols-outlined text-link-gold text-3xl">apartment</span>
            <div>
              <p className="font-label-caps text-label-caps text-on-surface-variant">AMBIENTES</p>
              <p className="font-body-lg text-body-lg text-primary font-medium">{ambientes}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          {/* Details Column */}
          <div className="md:col-span-7">
            <h2 className="font-headline-sm text-headline-sm text-primary mb-6">
              Un desarrollo de diseño atemporal
            </h2>
            {contenido ? (
              <div
                className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: contenido }}
              />
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed">
                {nombre} redefine el estándar de vida en {barrio}. Un desarrollo pensado para inversores exigentes y
                para quienes buscan un hogar en una de las zonas más prestigiosas de la ciudad.
              </p>
            )}

            {amenities.length > 0 && (
              <>
                <h3 className="font-label-caps text-label-caps text-primary mb-6 border-b border-outline-variant pb-2 inline-block">
                  AMENITIES EXCLUSIVOS
                </h3>
                <div className="flex flex-wrap gap-3">
                  {amenities.map((a, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-surface-container border border-outline-variant text-label-caps text-[11px] flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span> {a.toUpperCase()}
                    </span>
                  ))}
                </div>
              </>
            )}

            {constructora && (
              <p className="mt-8 font-body-md text-body-md text-on-surface-variant">
                <span className="font-label-caps text-label-caps text-primary">DESARROLLADORA:</span> {constructora}
              </p>
            )}
          </div>

          {/* Payment Plan Card (sticky) */}
          <aside className="md:col-span-5">
            <div className="md:sticky md:top-24 bg-primary-container p-8 text-on-primary border border-primary-container shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-link-gold/10 rounded-full -mr-16 -mt-16"></div>
              <h3 className="font-headline-sm text-headline-sm text-on-primary mb-6">Plan de Inversión</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-on-primary-container/30 pb-4">
                  <div>
                    <p className="font-label-caps text-label-caps text-on-primary-container">ANTICIPO</p>
                    <p className="font-headline-sm text-headline-sm text-on-primary">40%</p>
                  </div>
                  <div className="text-right">
                    <p className="font-label-caps text-label-caps text-on-primary-container">USD</p>
                    <p className="font-body-lg text-body-lg">{anticipoLabel}</p>
                  </div>
                </div>
                <div className="flex justify-between items-end border-b border-on-primary-container/30 pb-4">
                  <div>
                    <p className="font-label-caps text-label-caps text-on-primary-container">ENTREGA</p>
                    <p className="font-headline-sm text-headline-sm text-on-primary">{entrega}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-label-caps text-label-caps text-on-primary-container">AJUSTE</p>
                    <p className="font-body-lg text-body-lg text-secondary-fixed">{ajuste}</p>
                  </div>
                </div>
                <div className="bg-on-primary-fixed-variant/20 p-4 rounded-sm">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary-fixed">info</span>
                    <p className="text-[13px] font-body-md text-on-primary-container leading-relaxed">
                      Las cuotas en pesos se ajustan mensualmente según el índice informado por la desarrolladora.
                      Consulte por descuentos por pago contado.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/contacto/?proyecto=${d.slug}`}
                  className="w-full py-4 bg-link-gold text-white font-label-caps text-label-caps tracking-[0.2em] hover:brightness-110 transition-all flex justify-center items-center gap-2"
                >
                  SOLICITAR COTIZACIÓN <span className="material-symbols-outlined">trending_flat</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Confianza / Obra / Rentabilidad — se renderiza solo lo que tenga dato */}
        {(legal || obra || rentabilidad) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
            {/* Estructura legal y seguridad */}
            {legal && (
              <section className="md:col-span-4">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-link-gold">verified_user</span>
                  Estructura legal y seguridad
                </h2>
                {looksLikeHtml(legal) ? (
                  <div
                    className="font-body-md text-body-md text-on-surface-variant leading-relaxed prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: legal }}
                  />
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{legal}</p>
                )}
              </section>
            )}

            {/* Avance de obra */}
            {obra && (
              <section className="md:col-span-4">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-link-gold">construction</span>
                  Avance de obra
                </h2>
                {obraPct != null ? (
                  <div className="bg-surface-container border border-outline-variant p-6">
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="font-label-caps text-label-caps text-on-surface-variant">PROGRESO</span>
                      <span className="font-headline-sm text-headline-sm text-primary">{obraPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high overflow-hidden">
                      <div className="h-full bg-link-gold" style={{ width: `${obraPct}%` }} />
                    </div>
                  </div>
                ) : looksLikeHtml(obra) ? (
                  <div
                    className="font-body-md text-body-md text-on-surface-variant leading-relaxed prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: obra }}
                  />
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{obra}</p>
                )}
              </section>
            )}

            {/* Proyección de rentabilidad */}
            {rentabilidad && (
              <section className="md:col-span-4">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-link-gold">trending_up</span>
                  Proyección de rentabilidad
                </h2>
                {looksLikeHtml(rentabilidad) ? (
                  <div
                    className="font-body-md text-body-md text-on-surface-variant leading-relaxed prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: rentabilidad }}
                  />
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{rentabilidad}</p>
                )}
              </section>
            )}
          </div>
        )}

        {/* Location Section */}
        <section className="mb-24">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-headline-sm text-headline-sm text-primary">Ubicación Estratégica</h2>
            <p className="font-body-md text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-link-gold">location_on</span> {direccion}
            </p>
          </div>
          <div className="h-[450px] bg-surface-container-high relative border border-outline-variant">
            {/* Mapa embebido (lat/lng si existen, si no por dirección) */}
            <iframe
              title={`Mapa de ${nombre}`}
              src={mapSrc}
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </section>
      </main>

      {/* Bottom Action Bar (CTA fija) */}
      <div className="fixed bottom-0 left-0 w-full z-[60] p-4 md:px-margin-desktop md:py-6 bg-surface/80 backdrop-blur-md md:bg-transparent md:pointer-events-none">
        <div className="max-w-container-max mx-auto flex justify-center md:justify-end">
          <Link
            href={`/contacto/?proyecto=${d.slug}`}
            className="w-full md:w-auto px-8 py-4 bg-link-gold text-white font-label-caps text-label-caps tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center justify-center gap-4"
          >
            QUIERO MÁS INFORMACIÓN
            <span className="material-symbols-outlined fill-icon">send</span>
          </Link>
        </div>
      </div>
    </>
  );
}
