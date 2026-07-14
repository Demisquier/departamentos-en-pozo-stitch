import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDesarrollos, getDesarrolloBySlug, featuredImage, acf, stripHtml, SITE, fixImgs } from '../../../lib/wp';

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

// Extrae un porcentaje 0-100 de un valor de avance de obra.
function toPercent(v) {
  if (v == null) return null;
  const s = String(v).replace('%', '').replace(',', '.').trim();
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Formatea fecha_entrega "20270901" -> "09/2027".
function fmtFecha(v) {
  const s = String(v || '');
  if (/^\d{8}$/.test(s)) return `${s.slice(4, 6)}/${s.slice(0, 4)}`;
  return v ? String(v) : '';
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
  return {
    title: `${nombre}${barrio ? ' — ' + barrio : ''} | Departamentos en Pozo`,
    description: `Ficha del desarrollo ${nombre}${barrio ? ' en ' + barrio : ''}: desarrolladora, precio por m², financiación, avance de obra, amenities y ubicación. Análisis independiente.`,
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
  const constructora = acfAny(d, ['desarrolladora', 'constructora']);
  const estado = acfAny(d, ['estado', 'pozo_estado', 'estado_obra']);
  const lat = acfAny(d, ['lat', 'latitud']);
  const lng = acfAny(d, ['lng', 'longitud']);
  const amenities = parseAmenities(acf(d, 'amenities'));

  const precioNum = toNumber(acfAny(d, ['precio_m2', 'precio_desde']));
  const precioLabel = precioNum ? `USD ${precioNum.toLocaleString('es-AR')}` : 'Consultar';
  const anticipoRaw = acfAny(d, ['anticipo']);
  const anticipoNum = toNumber(anticipoRaw);
  const anticipoLabel = anticipoNum ? `USD ${anticipoNum.toLocaleString('es-AR')}` : (anticipoRaw ? String(anticipoRaw) : null);
  const cuotas = acfAny(d, ['esquema_cuotas']);
  const comparableNum = toNumber(acf(d, 'comparable_terminado'));

  const imagen = featuredImage(d);
  const contenido = fixImgs(d.content?.rendered || '');

  // Galería: featured + imágenes del contenido (ya con URLs relativas), únicas, hasta 5.
  const contentImgs = [...contenido.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
  const gallery = [imagen, ...contentImgs].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

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
    ['Precio desde', precioNum ? `${precioLabel} /m²` : null],
    ['Anticipo', anticipoLabel],
    ['Esquema de cuotas', cuotas || null],
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

  // --- JSON-LD (Product/Offer) ---
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
    schema.address = { '@type': 'PostalAddress', ...address };
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

  const mapQuery = lat && lng ? `${lat},${lng}` : encodeURIComponent(`${direccion}`);
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;

  const Tile = ({ src, alt, className }) =>
    src ? (
      <img src={src} alt={alt} className={`w-full h-full object-cover ${className || ''}`} />
    ) : (
      <div className={`w-full h-full bg-surface-container-high flex items-center justify-center ${className || ''}`}>
        <span className="material-symbols-outlined text-outline-variant text-4xl">image</span>
      </div>
    );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-8 pb-28">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-on-surface-variant mb-4 flex flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-link-gold">Inicio</Link>
          <span>/</span>
          <Link href="/desarrollos-inmobiliarios/" className="hover:text-link-gold">Proyectos en pozo</Link>
          <span>/</span>
          <span className="text-primary">{nombre}</span>
        </nav>

        {/* Galería mosaico (estilo Zillow) */}
        <section className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 mb-6 rounded-xl overflow-hidden relative" style={{ minHeight: '340px' }}>
          <div className="md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto relative">
            <Tile src={gallery[0]} alt={nombre} />
          </div>
          <div className="hidden md:block relative"><Tile src={gallery[1]} alt={`${nombre} 2`} /></div>
          <div className="hidden md:block relative"><Tile src={gallery[2]} alt={`${nombre} 3`} /></div>
          <div className="hidden md:block relative"><Tile src={gallery[3]} alt={`${nombre} 4`} /></div>
          <div className="hidden md:block relative"><Tile src={gallery[4]} alt={`${nombre} 5`} /></div>
          {gallery.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">photo_library</span>
              <span className="text-[13px] font-medium text-primary">{gallery.length} foto{gallery.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </section>

        {/* Layout 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            {/* Precio + resumen */}
            <div className="border-b border-outline-variant pb-6 mb-6">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-display-lg text-display-lg text-primary leading-none">{precioLabel}</span>
                {precioNum && <span className="text-body-lg text-on-surface-variant">/m²</span>}
              </div>
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
            </div>

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

            {/* Descripción */}
            <div className="mb-8">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Sobre este desarrollo</h2>
              {contenido ? (
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: contenido }} />
              ) : (
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {nombre} es un desarrollo en pozo en {barrio}. Cargá la descripción, el render y los datos comerciales para completar esta ficha.
                </p>
              )}
            </div>

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
                          <dd className="text-primary font-medium text-right">{v}</dd>
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

            {/* Disclaimer independencia (E-E-A-T / YMYL) */}
            <p className="text-[12px] text-on-surface-variant leading-relaxed border-t border-outline-variant pt-4 mt-6">
              Análisis independiente con fines informativos. Los datos son de fuentes públicas y de la comercializadora,
              pueden variar y no constituyen asesoramiento financiero ni oferta comercial. Verificá precios, plazos y
              condiciones legales antes de invertir.
            </p>
          </div>

          {/* Sidebar sticky: contacto + inversión (estilo Zillow) */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 border border-outline-variant rounded-xl p-6 bg-surface shadow-sm">
              <p className="font-label-caps text-label-caps text-on-surface-variant">DESDE</p>
              <p className="font-headline-md text-headline-md text-primary mb-1">
                {precioLabel}{precioNum && <span className="text-body-md text-on-surface-variant"> /m²</span>}
              </p>

              <dl className="space-y-2 py-4 my-4 border-y border-outline-variant text-[14px]">
                {anticipoLabel && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-on-surface-variant">Anticipo</dt>
                    <dd className="text-primary font-medium">{anticipoLabel}</dd>
                  </div>
                )}
                {entrega && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-on-surface-variant">Entrega</dt>
                    <dd className="text-primary font-medium">{entrega}</dd>
                  </div>
                )}
                {(cuotas || ajuste) && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-on-surface-variant">Cuotas</dt>
                    <dd className="text-primary font-medium text-right">{cuotas || `Ajuste ${ajuste}`}</dd>
                  </div>
                )}
              </dl>

              <Link
                href={`/contacto/?proyecto=${d.slug}`}
                className="w-full py-3.5 bg-link-gold text-white rounded-lg font-label-caps text-label-caps tracking-widest hover:brightness-110 transition-all flex justify-center items-center gap-2 mb-3"
              >
                SOLICITAR COTIZACIÓN
              </Link>
              <Link
                href={`/contacto/?proyecto=${d.slug}`}
                className="w-full py-3.5 border border-primary text-primary rounded-lg font-label-caps text-label-caps tracking-widest hover:bg-surface-container transition-all flex justify-center items-center gap-2"
              >
                AGENDAR VISITA
              </Link>

              <p className="text-[12px] text-on-surface-variant leading-relaxed mt-4 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-link-gold">info</span>
                Cuotas en pesos ajustables. Consultá descuentos por pago contado y disponibilidad de unidades.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Bottom Action Bar (CTA fija móvil) */}
      <div className="fixed bottom-0 left-0 w-full z-[60] p-3 bg-surface/90 backdrop-blur-md border-t border-outline-variant lg:hidden">
        <Link
          href={`/contacto/?proyecto=${d.slug}`}
          className="w-full px-8 py-3.5 bg-link-gold text-white rounded-lg font-label-caps text-label-caps tracking-widest shadow-lg flex items-center justify-center gap-3"
        >
          QUIERO MÁS INFORMACIÓN
          <span className="material-symbols-outlined fill-icon">send</span>
        </Link>
      </div>
    </>
  );
}
