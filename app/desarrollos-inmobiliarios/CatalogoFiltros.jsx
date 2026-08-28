'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import ProjectCard from '../_ui/ProjectCard';
import { BARRIO_CATALOGO, matchBarrioCatalogo } from '../../lib/barrios';

// Barrio (granular, ej. "Palermo Hollywood") -> slug de landing propia, si existe.
// Palermo Soho/Hollywood/Botánico -> "palermo". Barrios sin landing (Saavedra, Coghlan) -> null.
function landingSlugForBarrio(label) {
  for (const slug of Object.keys(BARRIO_CATALOGO)) if (matchBarrioCatalogo(label, slug)) return slug;
  return null;
}

// Normaliza un nombre de barrio (saca acentos, minúsculas) para dedupe/match acento-insensible.
const NORM = (s) => String(s || '').normalize('NFD').split('').filter((c) => { const k = c.charCodeAt(0); return k < 768 || k > 879; }).join('').toLowerCase().trim();

// Barrios con landing propia (para el dropdown de barrio en las páginas por barrio).
const LANDING_BARRIOS = Object.keys(BARRIO_CATALOGO).map((slug) => ({ slug, label: BARRIO_CATALOGO[slug].label }));

// Rangos de precio total (USD) — sobre precioDesde. Datos parciales: el filtro excluye
// proyectos sin precio total cargado (mismo criterio que el de precio/m²).
const PRECIO_TOTAL = {
  hasta150: { label: 'Hasta USD 150.000', chip: 'Hasta USD 150k', test: (p) => p <= 150000 },
  '150a250': { label: 'USD 150.000–250.000', chip: 'USD 150k–250k', test: (p) => p > 150000 && p <= 250000 },
  '250a400': { label: 'USD 250.000–400.000', chip: 'USD 250k–400k', test: (p) => p > 250000 && p <= 400000 },
  mas400: { label: '+USD 400.000', chip: '+USD 400k', test: (p) => p > 400000 },
};
const PRECIO_M2_LBL = { hasta3000: 'Hasta USD 3.000/m²', '3000a4500': 'USD 3.000–4.500/m²', mas4500: '+USD 4.500/m²' };

// Proyectos DESTACADOS (monetizable / editorial): van primero en el orden por defecto
// y llevan el badge "Destacado". Editar esta lista para vender/rotar slots.
const DESTACADOS = ['arcadia-art-residence-coghlan', 'newbery-place-colegiales', 'vibe-deheza-saavedra'];

// --- Mapa (Leaflet cargado por CDN, sin dependencias de build). Muestra pines con precio. ---
function MapaListado({ items }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    const loadCSS = (id, href) => {
      if (document.getElementById(id)) return;
      const l = document.createElement('link');
      l.id = id; l.rel = 'stylesheet'; l.href = href;
      document.head.appendChild(l);
    };
    const loadJS = (src) => new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s);
    });
    async function ensureL() {
      if (!window.L) {
        loadCSS('leaflet-css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        await loadJS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      }
      // Plugin de clustering para pines superpuestos (mismo barrio/dirección cercana).
      if (window.L && !window.L.markerClusterGroup) {
        loadCSS('mcluster-css', 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css');
        loadCSS('mcluster-css-def', 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css');
        try { await loadJS('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'); } catch {}
      }
      return window.L;
    }
    ensureL().then((L) => {
      if (cancel || !ref.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(ref.current, { scrollWheelZoom: false }).setView([-34.6, -58.44], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19,
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;
      if (map._layer) map.removeLayer(map._layer);
      // Si el plugin cargó, agrupamos; si no, caemos a layerGroup normal.
      const layer = L.markerClusterGroup
        ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 46, spiderfyOnMaxZoom: true })
        : L.layerGroup();
      layer.addTo(map); map._layer = layer;
      const pts = [];
      items.forEach((i) => {
        if (i.lat == null || i.lng == null) return;
        const label = i.precio ? 'USD ' + Math.round(i.precio / 100) / 10 + 'k' : 'Consultar';
        const icon = L.divIcon({
          className: '',
          html: `<div class="map-pin">${i.precio ? '$' + Math.round(i.precio / 1000) + 'k' : '•'}</div>`,
          iconSize: [48, 22], iconAnchor: [24, 22],
        });
        const m = L.marker([i.lat, i.lng], { icon }).addTo(layer);
        m.bindPopup(
          `<a href="/desarrollos-inmobiliarios/${i.slug}/" class="map-pop">
            ${i.imagen ? `<img src="${i.imagen}" class="map-pop__img" loading="lazy"/>` : ''}
            <div class="map-pop__body"><strong class="map-pop__name">${i.nombre}</strong>
            <div class="map-pop__meta">${i.barrio || ''}${i.ambientes ? ' · ' + i.ambientes : ''}</div>
            <strong class="map-pop__price">${label !== 'Consultar' && i.precio ? 'USD ' + i.precio.toLocaleString('es-AR') + ' /m²' : 'Consultar'}</strong></div></a>`,
          { minWidth: 210 }
        );
        pts.push([i.lat, i.lng]);
      });
      if (pts.length) map.fitBounds(pts, { padding: [45, 45], maxZoom: 14 });
      setTimeout(() => map.invalidateSize(), 100);
    }).catch(() => {});
    return () => { cancel = true; };
  }, [items]);

  return <div ref={ref} className="w-full h-[560px] md:h-[640px] rounded-xl overflow-hidden border border-outline-variant bg-surface-container-high" />;
}

// item: { slug, nombre, barrio, direccion, precio, precioM2, precioDesde, precioLabel,
//         ambientes, ambientesNums, entrega, entregaAnio, financiacion, desarrolladora, etapa, imagen, lat, lng }
export default function CatalogoFiltros({ items, barrioFijo = null }) {
  // Principales
  const [barrio, setBarrio] = useState('');
  const [amb, setAmb] = useState('');
  const [precio, setPrecio] = useState('todos');     // precio/m²
  const [etapa, setEtapa] = useState('');
  // Secundarios ("Más filtros")
  const [entregaMax, setEntregaMax] = useState('');
  const [fin, setFin] = useState(false);              // forma de pago: con financiación (cuotas)
  const [desarrolladora, setDesarrolladora] = useState('');
  const [precioTotal, setPrecioTotal] = useState('todos');
  // UI
  const [orden, setOrden] = useState('destacados');
  const [vista, setVista] = useState('lista');        // 'lista' | 'mapa'
  const [barrioOpen, setBarrioOpen] = useState(false);
  const [masOpen, setMasOpen] = useState(false);      // panel secundarios (desktop)
  const [sheetOpen, setSheetOpen] = useState(false);  // bottom-sheet (mobile)

  // ── URL <-> filtros (vista compartible). Leemos los query params al montar y
  // reflejamos los filtros en la URL con replaceState (sin recargar ni navegar).
  // El canonical apunta siempre a la URL base, así que las variantes con ?... no
  // generan contenido duplicado indexable.
  const hydrated = useRef(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (!barrioFijo && sp.get('barrio')) setBarrio(sp.get('barrio'));
    if (sp.get('amb')) setAmb(sp.get('amb'));
    if (sp.get('precio')) setPrecio(sp.get('precio'));
    if (sp.get('etapa')) setEtapa(sp.get('etapa'));
    if (sp.get('entrega')) setEntregaMax(sp.get('entrega'));
    if (sp.get('fin') === '1') setFin(true);
    if (sp.get('dev')) setDesarrolladora(sp.get('dev'));
    if (sp.get('ptot')) setPrecioTotal(sp.get('ptot'));
    if (sp.get('orden')) setOrden(sp.get('orden'));
    hydrated.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hydrated.current) return;
    const sp = new URLSearchParams();
    if (barrio) sp.set('barrio', barrio);
    if (amb) sp.set('amb', amb);
    if (precio !== 'todos') sp.set('precio', precio);
    if (etapa) sp.set('etapa', etapa);
    if (entregaMax) sp.set('entrega', entregaMax);
    if (fin) sp.set('fin', '1');
    if (desarrolladora) sp.set('dev', desarrolladora);
    if (precioTotal !== 'todos') sp.set('ptot', precioTotal);
    if (orden !== 'destacados') sp.set('orden', orden);
    const qs = sp.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }, [barrio, amb, precio, etapa, entregaMax, fin, desarrolladora, precioTotal, orden, barrioFijo]);

  // Bloqueo de scroll del body mientras el bottom-sheet mobile está abierto.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  // Focus-trap + Escape en el bottom-sheet (accesibilidad).
  const sheetRef = useRef(null);
  useEffect(() => {
    if (!sheetOpen) return;
    const el = sheetRef.current;
    const focusables = () => Array.from(el?.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])') || []);
    focusables()[0]?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { setSheetOpen(false); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const barrios = useMemo(() => {
    // Dropdown limpio: dedupe acento-insensible + saca 'barrios' que son direcciones (con número).
    const seen = new Map();
    for (const i of items) {
      const b = i.barrio;
      if (!b || [...b].some((c) => c >= '0' && c <= '9')) continue;
      const k = NORM(b);
      if (!seen.has(k)) seen.set(k, b);
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'es'));
  }, [items]);
  const desarrolladoras = useMemo(
    () => Array.from(new Set(items.map((i) => i.desarrolladora).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [items]
  );
  const aniosEntrega = useMemo(
    () => Array.from(new Set(items.map((i) => i.entregaAnio).filter(Boolean))).sort((a, b) => a - b),
    [items]
  );

  const filtered = useMemo(() => {
    let out = items.filter((i) => {
      if (barrio && NORM(i.barrio) !== NORM(barrio)) return false;
      if (amb) {
        const nums = i.ambientesNums || [];
        const match = amb === '4+' ? nums.some((n) => n === '4+' || n === '4' || n === '5+') : nums.includes(amb);
        if (!match) return false;
      }
      if (precio !== 'todos') {
        const p = i.precio;
        if (p == null) return false;
        if (precio === 'hasta3000' && !(p <= 3000)) return false;
        if (precio === '3000a4500' && !(p > 3000 && p <= 4500)) return false;
        if (precio === 'mas4500' && !(p > 4500)) return false;
      }
      if (precioTotal !== 'todos') {
        const p = i.precioDesde;
        if (p == null || !PRECIO_TOTAL[precioTotal].test(p)) return false;
      }
      if (etapa && (i.etapa || '').toLowerCase() !== etapa) return false;
      if (entregaMax && (i.entregaAnio == null || i.entregaAnio > Number(entregaMax))) return false;
      if (fin && !i.financiacion) return false;
      if (desarrolladora && i.desarrolladora !== desarrolladora) return false;
      return true;
    });
    const entregaKey = (s) => {
      const m = String(s || '').match(/(\d{2})\/(\d{4})/);
      return m ? Number(m[2]) * 100 + Number(m[1]) : 999999;
    };
    if (orden === 'destacados') {
      // Orden PRO-CONVERSIÓN: destacados (monetizables) primero, luego las fichas más
      // completas (más señales = más chance de convertir un lead): foto, precio, financiación…
      const score = (i) => {
        let s = 0;
        if (DESTACADOS.includes(i.slug)) s += 1000;               // slots destacados
        if (i.imagen) s += 40;                                    // con foto convierte más
        if (i.precioDesde != null || i.precio != null) s += 30;   // con precio
        if (i.financiacion) s += 20;                              // financiación = señal de compra
        if (i.desarrolladora) s += 10;                            // confianza
        if (i.ambientesNums && i.ambientesNums.length) s += 5;    // tipologías cargadas
        if (i.entregaAnio) s += 3;
        return s;
      };
      out = [...out].sort((a, b) => score(b) - score(a));
    }
    else if (orden === 'precio_asc') out = [...out].sort((a, b) => (a.precio ?? Infinity) - (b.precio ?? Infinity));
    else if (orden === 'precio_desc') out = [...out].sort((a, b) => (b.precio ?? -Infinity) - (a.precio ?? -Infinity));
    else if (orden === 'entrega') out = [...out].sort((a, b) => entregaKey(a.entrega) - entregaKey(b.entrega));
    else if (orden === 'nombre') out = [...out].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return out;
  }, [items, barrio, amb, precio, precioTotal, etapa, entregaMax, fin, desarrolladora, orden]);

  // Chips toggle (con aria-pressed, focus visible y tap target 44px).
  const chip = (active) =>
    `inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 border rounded-full text-[13px] font-body-md transition-all ${
      active ? 'bg-primary-container text-on-primary border-primary-container' : 'border-outline-variant text-primary hover:border-secondary'
    }`;

  const limpiar = () => {
    setBarrio(''); setAmb(''); setPrecio('todos'); setEtapa('');
    setEntregaMax(''); setFin(false); setDesarrolladora(''); setPrecioTotal('todos');
  };
  // Precio TOTAL es ahora el filtro PRINCIPAL (85% de cobertura); precio/m² pasó a secundario (20%).
  const secundariosCount = [entregaMax, fin, desarrolladora, precio !== 'todos'].filter(Boolean).length;
  const activeCount = [barrio, amb, precioTotal !== 'todos', etapa].filter(Boolean).length + secundariosCount;
  const hayFiltros = activeCount > 0;
  const conCoord = filtered.filter((i) => i.lat != null).length;

  // Chips de filtros activos (patrón principal para quitar un filtro). [label, clearFn]
  const activeChips = () => {
    const a = [];
    if (barrio) a.push([barrio, () => setBarrio('')]);
    if (amb) a.push([`${amb} amb`, () => setAmb('')]);
    if (precio !== 'todos') a.push([PRECIO_M2_LBL[precio] || 'Precio/m²', () => setPrecio('todos')]);
    if (precioTotal !== 'todos') a.push([PRECIO_TOTAL[precioTotal].label, () => setPrecioTotal('todos')]);
    if (etapa) a.push([etapa === 'en pozo' ? 'En pozo' : 'En construcción', () => setEtapa('')]);
    if (entregaMax) a.push([`Entrega hasta ${entregaMax}`, () => setEntregaMax('')]);
    if (fin) a.push(['Con financiación', () => setFin(false)]);
    if (desarrolladora) a.push([desarrolladora, () => setDesarrolladora('')]);
    return a;
  };

  // ── Bloques reutilizables ────────────────────────────────────────────────

  const barrioDropdown = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setBarrioOpen((o) => !o)}
        aria-expanded={barrioOpen}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 border rounded-full text-[14px] md:text-[13px] transition-colors ${(barrio || barrioFijo) ? 'bg-primary-container text-on-primary border-primary-container' : 'border-outline-variant text-primary hover:border-secondary'}`}
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">location_on</span>
        <span>{barrio || barrioFijo || 'Barrio'}</span>
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">expand_more</span>
      </button>
      {barrioOpen && (
        <div role="listbox" aria-label="Elegir barrio" className="absolute z-40 mt-2 w-60 max-h-80 overflow-auto bg-surface border border-outline-variant shadow-xl rounded-lg py-2">
          {barrioFijo ? (
            <>
              <button type="button" onClick={() => window.location.assign('/desarrollos-inmobiliarios/')} className="block w-full text-left px-4 py-2.5 text-[14px] hover:bg-surface-container">Todos los barrios</button>
              {LANDING_BARRIOS.map((b) => (
                <button type="button" key={b.slug} onClick={() => window.location.assign(`/desarrollos-inmobiliarios-en-${b.slug}/`)} className={`block w-full text-left px-4 py-2.5 text-[14px] hover:bg-surface-container ${b.label === barrioFijo ? 'text-secondary font-medium' : ''}`}>{b.label}</button>
              ))}
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setBarrio(''); setBarrioOpen(false); }} className="block w-full text-left px-4 py-2.5 text-[14px] hover:bg-surface-container">Todos los barrios</button>
              {barrios.map((b) => {
                const slug = landingSlugForBarrio(b);
                const go = () => {
                  setBarrioOpen(false);
                  if (slug) window.location.assign(`/desarrollos-inmobiliarios-en-${slug}/`);
                  else setBarrio(b);
                };
                return (
                  <button type="button" key={b} onClick={go} className={`block w-full text-left px-4 py-2.5 text-[14px] hover:bg-surface-container ${b === barrio ? 'text-secondary font-medium' : ''}`}>{b}</button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );

  const ambChips = () => (
    <>
      {['1', '2', '3', '4+'].map((a) => (
        <button type="button" key={a} aria-pressed={amb === a} className={chip(amb === a)} onClick={() => setAmb(amb === a ? '' : a)}>{a} amb</button>
      ))}
    </>
  );

  // Precio TOTAL (principal): mejor cobertura de dato (85%).
  const precioTotalChips = () => (
    <>
      {Object.entries(PRECIO_TOTAL).map(([k, v]) => (
        <button type="button" key={k} aria-pressed={precioTotal === k} className={chip(precioTotal === k)} onClick={() => setPrecioTotal(precioTotal === k ? 'todos' : k)}>{v.chip}</button>
      ))}
    </>
  );

  const etapaChips = () => (
    <>
      <button type="button" aria-pressed={etapa === 'en pozo'} className={chip(etapa === 'en pozo')} onClick={() => setEtapa(etapa === 'en pozo' ? '' : 'en pozo')}>En pozo</button>
      <button type="button" aria-pressed={etapa === 'en construcción'} className={chip(etapa === 'en construcción')} onClick={() => setEtapa(etapa === 'en construcción' ? '' : 'en construcción')}>En construcción</button>
    </>
  );

  // Campos secundarios ("Más filtros"). stack=true los apila (mobile sheet).
  const masFields = (stack = false) => (
    <div className={stack ? 'flex flex-col gap-5' : 'flex flex-wrap items-end gap-x-6 gap-y-4'}>
      {/* Forma de pago — diferencial pozo (Fase 4) */}
      <fieldset>
        <legend className="text-[12px] uppercase tracking-wide text-on-surface-variant mb-2">Forma de pago</legend>
        <button type="button" aria-pressed={fin} className={chip(fin)} onClick={() => setFin((v) => !v)}>Con financiación (cuotas)</button>
      </fieldset>

      {/* Entrega hasta */}
      {aniosEntrega.length > 0 && (
        <div>
          <label htmlFor="f-entrega" className="block text-[12px] uppercase tracking-wide text-on-surface-variant mb-2">Entrega hasta</label>
          <select id="f-entrega" value={entregaMax} onChange={(e) => setEntregaMax(e.target.value)} className="min-h-[44px] w-full sm:w-auto border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-primary bg-surface">
            <option value="">Cualquier año</option>
            {aniosEntrega.map((a) => (<option key={a} value={a}>{a}</option>))}
          </select>
        </div>
      )}

      {/* Precio por m² — secundario (dato parcial ~20%). El principal es precio total. */}
      <div>
        <label htmlFor="f-pm2" className="block text-[12px] uppercase tracking-wide text-on-surface-variant mb-2">Precio por m²</label>
        <select id="f-pm2" value={precio} onChange={(e) => setPrecio(e.target.value)} className="min-h-[44px] w-full sm:w-auto border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-primary bg-surface">
          <option value="todos">Cualquiera</option>
          <option value="hasta3000">Hasta USD 3.000/m²</option>
          <option value="3000a4500">USD 3.000–4.500/m²</option>
          <option value="mas4500">+USD 4.500/m²</option>
        </select>
      </div>

      {/* Desarrolladora (Fase 2) */}
      {desarrolladoras.length > 0 && (
        <div>
          <label htmlFor="f-dev" className="block text-[12px] uppercase tracking-wide text-on-surface-variant mb-2">Desarrolladora</label>
          <select id="f-dev" value={desarrolladora} onChange={(e) => setDesarrolladora(e.target.value)} className="min-h-[44px] w-full sm:w-[15rem] border border-outline-variant rounded-lg px-3 py-2 text-[14px] text-primary bg-surface">
            <option value="">Todas</option>
            {desarrolladoras.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="border-y border-outline-variant py-4 mb-6 flex flex-col gap-3">
        {/* ── Barra compacta MOBILE: botón Filtrar (con contador) + resultados ── */}
        <div className="md:hidden flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 border border-outline-variant rounded-full text-[14px] text-primary active:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">tune</span>
            Filtrar
            {activeCount > 0 && (
              <span className="ml-0.5 min-w-[20px] h-5 px-1 rounded-full bg-secondary text-white text-[11px] font-medium flex items-center justify-center">{activeCount}</span>
            )}
          </button>
          <p className="text-[13px] text-on-surface-variant">
            <span className="text-primary font-medium">{filtered.length}</span> {filtered.length === 1 ? 'proyecto' : 'proyectos'}
          </p>
        </div>

        {/* ── Barra principal DESKTOP: 4 filtros principales + "Más filtros" ── */}
        <div className="hidden md:flex flex-wrap items-center gap-2.5">
          {barrioDropdown()}
          <span className="h-6 w-px bg-outline-variant mx-1" />
          {ambChips()}
          <span className="h-6 w-px bg-outline-variant mx-1" />
          {precioTotalChips()}
          <span className="h-6 w-px bg-outline-variant mx-1" />
          {etapaChips()}

          <button
            type="button"
            onClick={() => setMasOpen((o) => !o)}
            aria-expanded={masOpen}
            className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 border rounded-full text-[13px] transition-colors ${masOpen || secundariosCount > 0 ? 'border-secondary text-secondary' : 'border-outline-variant text-primary hover:border-secondary'}`}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">tune</span>
            Más filtros
            {secundariosCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-white text-[11px] font-medium flex items-center justify-center">{secundariosCount}</span>
            )}
          </button>

          {hayFiltros && (
            <button type="button" onClick={limpiar} className="min-h-[44px] px-3 py-2 text-[13px] text-on-surface-variant hover:text-primary underline underline-offset-2">Limpiar todo</button>
          )}
        </div>

        {/* Panel "Más filtros" (desktop, colapsable) */}
        {masOpen && (
          <div className="hidden md:block border border-outline-variant rounded-xl p-4 bg-surface-container-low">
            {masFields()}
          </div>
        )}

        {/* ── Chips de filtros activos (patrón principal para quitar filtros) ── */}
        {activeChips().length > 0 && (
          <div className="hidden md:flex flex-wrap items-center gap-2">
            {activeChips().map(([label, fn], idx) => (
              <button
                key={idx}
                type="button"
                onClick={fn}
                aria-label={`Quitar filtro ${label}`}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-primary-container text-on-primary text-[12px]"
              >
                {label}
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">close</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Controles de vista: resultados (desktop) + Lista/Mapa + Orden ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="hidden md:block text-[13px] text-on-surface-variant">
            <span className="text-primary font-medium">{filtered.length}</span> {filtered.length === 1 ? 'proyecto' : 'proyectos'}
            {filtered.length !== items.length && <span> de {items.length}</span>}
          </p>
          <div className="flex items-center gap-3 flex-wrap ml-auto">
            <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden" role="group" aria-label="Vista">
              <button type="button" onClick={() => setVista('lista')} aria-pressed={vista === 'lista'} className={`flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-[13px] ${vista === 'lista' ? 'bg-primary-container text-on-primary' : 'text-primary hover:bg-surface-container'}`}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">grid_view</span>Lista
              </button>
              <button type="button" onClick={() => setVista('mapa')} aria-pressed={vista === 'mapa'} className={`flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-[13px] ${vista === 'mapa' ? 'bg-primary-container text-on-primary' : 'text-primary hover:bg-surface-container'}`}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">map</span>Mapa
              </button>
            </div>
            {vista === 'lista' && (
              <label className="flex items-center gap-2 text-[13px] text-on-surface-variant">
                <span className="hidden sm:inline">Ordenar por</span>
                <select value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar por" className="min-h-[44px] border border-outline-variant rounded-lg px-2.5 py-2 text-[13px] text-primary bg-surface">
                  <option value="destacados">Destacados</option>
                  <option value="precio_asc">Precio/m² ↑</option>
                  <option value="precio_desc">Precio/m² ↓</option>
                  <option value="entrega">Entrega más próxima</option>
                  <option value="nombre">Nombre (A–Z)</option>
                </select>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom-sheet MOBILE (Fase 3): todos los filtros + Aplicar/Limpiar ── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Filtrar proyectos">
          <div className="absolute inset-0 scrim-soft" onClick={() => setSheetOpen(false)} />
          <div ref={sheetRef} className="absolute inset-x-0 bottom-0 bg-surface rounded-t-2xl max-h-[90dvh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
              <h2 className="text-[15px] font-medium text-primary">Filtrar proyectos</h2>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Cerrar filtros" className="p-2 text-on-surface-variant">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-6">
              <div>
                <p className="text-[12px] uppercase tracking-wide text-on-surface-variant mb-2">Barrio</p>
                {barrioDropdown()}
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-wide text-on-surface-variant mb-2">Ambientes</p>
                <div className="flex flex-wrap gap-2">{ambChips()}</div>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-wide text-on-surface-variant mb-2">Precio total</p>
                <div className="flex flex-wrap gap-2">{precioTotalChips()}</div>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-wide text-on-surface-variant mb-2">Etapa de obra</p>
                <div className="flex flex-wrap gap-2">{etapaChips()}</div>
              </div>
              <div className="border-t border-outline-variant pt-5">
                {masFields(true)}
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-t border-outline-variant bg-surface">
              <button type="button" onClick={limpiar} className="min-h-[44px] px-4 text-[14px] text-on-surface-variant underline underline-offset-2">Limpiar</button>
              <button type="button" onClick={() => setSheetOpen(false)} className="flex-1 min-h-[48px] rounded-full bg-primary-container text-on-primary text-[15px] font-medium">
                Ver {filtered.length} {filtered.length === 1 ? 'proyecto' : 'proyectos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {vista === 'mapa' ? (
        <div>
          <MapaListado items={filtered} />
          <p className="mt-3 text-[12px] text-on-surface-variant">
            Mostrando {conCoord} de {filtered.length} en el mapa. Ubicaciones aproximadas según la dirección del proyecto — verificá la ubicación exacta en cada ficha.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filtered.map((i) => (
            <ProjectCard
              key={i.slug}
              slug={i.slug}
              nombre={i.nombre}
              barrio={i.barrio}
              direccion={i.direccion}
              precioDesde={i.precioDesde}
              precioM2={i.precioM2}
              img={i.imagen}
              etapa={i.etapa}
              ambientes={i.ambientes}
              entrega={i.entrega}
              desarrolladora={i.desarrolladora}
              destacado={DESTACADOS.includes(i.slug)}
            />
          ))}
        </div>
      )}

      {vista === 'lista' && filtered.length === 0 && (() => {
        const activos = activeChips();
        return (
          <div className="mt-10 text-center max-w-lg mx-auto">
            <span className="material-symbols-outlined text-5xl text-outline-variant" aria-hidden="true">search_off</span>
            <p className="mt-2 text-primary font-medium text-body-lg">Ningún proyecto coincide con estos filtros.</p>
            {activos.length > 0 && (
              <>
                <p className="text-on-surface-variant text-[14px] mt-1">Probá quitar alguno para ver más resultados:</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {activos.map(([label, fn], i) => (
                    <button key={i} type="button" onClick={fn} className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-full border border-outline-variant text-[13px] text-primary hover:border-secondary hover:text-secondary transition-colors">
                      Quitar «{label}» <span className="material-symbols-outlined text-[15px]" aria-hidden="true">close</span>
                    </button>
                  ))}
                  <button type="button" onClick={limpiar} className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary text-[13px] hover:opacity-90 transition-opacity">Ver todos</button>
                </div>
              </>
            )}
          </div>
        );
      })()}
    </>
  );
}
