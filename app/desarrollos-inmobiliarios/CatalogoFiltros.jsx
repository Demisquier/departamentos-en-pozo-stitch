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
          html: `<div style="background:#1b2a4a;color:#fff;border-radius:14px;padding:3px 9px;font:600 12px/1 Work Sans,sans-serif;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.35);border:1.5px solid #fff">${i.precio ? '$' + Math.round(i.precio / 1000) + 'k' : '•'}</div>`,
          iconSize: [48, 22], iconAnchor: [24, 22],
        });
        const m = L.marker([i.lat, i.lng], { icon }).addTo(layer);
        m.bindPopup(
          `<a href="/desarrollos-inmobiliarios/${i.slug}/" style="text-decoration:none;color:#1b2a4a;display:block;width:210px">
            ${i.imagen ? `<img src="${i.imagen}" style="width:210px;height:118px;object-fit:cover;border-radius:6px" loading="lazy"/>` : ''}
            <div style="padding:7px 2px 2px"><strong style="font:600 15px/1.2 Libre Caslon Text,serif">${i.nombre}</strong>
            <div style="color:#667;font-size:12px;margin:2px 0">${i.barrio || ''}${i.ambientes ? ' · ' + i.ambientes : ''}</div>
            <strong style="color:#A68966;font-size:14px">${label !== 'Consultar' && i.precio ? 'USD ' + i.precio.toLocaleString('es-AR') + ' /m²' : 'Consultar'}</strong></div></a>`,
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

// item: { slug, nombre, barrio, direccion, precio, precioLabel, ambientes, ambientesNums, entrega, desarrolladora, etapa, imagen, lat, lng }
export default function CatalogoFiltros({ items, barrioFijo = null }) {
  const [barrio, setBarrio] = useState('');
  const [amb, setAmb] = useState('');
  const [precio, setPrecio] = useState('todos');
  const [etapa, setEtapa] = useState('');
  const [entregaMax, setEntregaMax] = useState('');
  const [fin, setFin] = useState(false);
  const [orden, setOrden] = useState('destacados');
  const [vista, setVista] = useState('lista'); // 'lista' | 'mapa'
  const [barrioOpen, setBarrioOpen] = useState(false);

  // ── URL <-> filtros (vista compartible). Leemos los query params al montar y
  // reflejamos los filtros en la URL con replaceState (sin recargar ni navegar).
  // El canonical de la página apunta siempre a la URL base, así que las variantes
  // con ?barrio=...&amb=... no generan contenido duplicado indexable.
  const hydrated = useRef(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    // barrio NO es un query param: el filtro de barrio navega a la landing propia.
    if (sp.get('amb')) setAmb(sp.get('amb'));
    if (sp.get('precio')) setPrecio(sp.get('precio'));
    if (sp.get('etapa')) setEtapa(sp.get('etapa'));
    if (sp.get('entrega')) setEntregaMax(sp.get('entrega'));
    if (sp.get('fin') === '1') setFin(true);
    if (sp.get('orden')) setOrden(sp.get('orden'));
    hydrated.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hydrated.current) return;
    const sp = new URLSearchParams();
    if (amb) sp.set('amb', amb);
    if (precio !== 'todos') sp.set('precio', precio);
    if (etapa) sp.set('etapa', etapa);
    if (entregaMax) sp.set('entrega', entregaMax);
    if (fin) sp.set('fin', '1');
    if (orden !== 'destacados') sp.set('orden', orden);
    const qs = sp.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }, [barrio, amb, precio, etapa, entregaMax, fin, orden, barrioFijo]);

  const barrios = useMemo(
    () => Array.from(new Set(items.map((i) => i.barrio).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [items]
  );

  const filtered = useMemo(() => {
    let out = items.filter((i) => {
      if (barrio && i.barrio !== barrio) return false;
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
      if (etapa && (i.etapa || '').toLowerCase() !== etapa) return false;
      if (entregaMax && (i.entregaAnio == null || i.entregaAnio > Number(entregaMax))) return false;
      if (fin && !i.financiacion) return false;
      return true;
    });
    const entregaKey = (s) => {
      const m = String(s || '').match(/(\d{2})\/(\d{4})/);
      return m ? Number(m[2]) * 100 + Number(m[1]) : 999999;
    };
    if (orden === 'precio_asc') out = [...out].sort((a, b) => (a.precio ?? Infinity) - (b.precio ?? Infinity));
    else if (orden === 'precio_desc') out = [...out].sort((a, b) => (b.precio ?? -Infinity) - (a.precio ?? -Infinity));
    else if (orden === 'entrega') out = [...out].sort((a, b) => entregaKey(a.entrega) - entregaKey(b.entrega));
    else if (orden === 'nombre') out = [...out].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return out;
  }, [items, barrio, amb, precio, etapa, entregaMax, fin, orden]);

  const chip = (active) =>
    `px-3.5 py-2 border rounded-full text-[13px] font-body-md transition-all ${
      active ? 'bg-primary-container text-on-primary border-primary-container' : 'border-outline-variant text-primary hover:border-secondary'
    }`;

  const limpiar = () => { setBarrio(''); setAmb(''); setPrecio('todos'); setEtapa(''); setEntregaMax(''); setFin(false); };
  const hayFiltros = barrio || amb || precio !== 'todos' || etapa || entregaMax || fin;
  // Años de entrega disponibles (para el select), ascendente.
  const aniosEntrega = useMemo(
    () => Array.from(new Set(items.map((i) => i.entregaAnio).filter(Boolean))).sort((a, b) => a - b),
    [items]
  );
  const conCoord = filtered.filter((i) => i.lat != null).length;

  return (
    <>
      <div className="border-y border-outline-variant py-4 mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chip de barrio: se oculta en las landings por barrio (items ya pre-filtrados). */}
          {!barrioFijo && (
            <>
              <div className="relative">
                <button
                  onClick={() => setBarrioOpen((o) => !o)}
                  className={`flex items-center gap-2 px-3.5 py-2 border rounded-full text-[13px] transition-colors ${barrio ? 'bg-primary-container text-on-primary border-primary-container' : 'border-outline-variant text-primary hover:border-secondary'}`}
                >
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span>{barrio || 'Barrio'}</span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
                {barrioOpen && (
                  <div className="absolute z-40 mt-2 w-60 max-h-80 overflow-auto bg-surface border border-outline-variant shadow-xl rounded-lg py-2">
                    <button onClick={() => { setBarrio(''); setBarrioOpen(false); }} className="block w-full text-left px-4 py-2 text-[14px] hover:bg-surface-container">Todos los barrios</button>
                    {barrios.map((b) => {
                      // Si el barrio tiene landing propia, el filtro NAVEGA a esa página
                      // (listado ya filtrado, con su propio "ver todas" para quitarlo).
                      // Si no la tiene, cae al filtro en página.
                      const slug = landingSlugForBarrio(b);
                      const go = () => {
                        setBarrioOpen(false);
                        if (slug) window.location.assign(`/departamentos-en-pozo-en-${slug}/`);
                        else setBarrio(b);
                      };
                      return (
                        <button key={b} onClick={go} className={`block w-full text-left px-4 py-2 text-[14px] hover:bg-surface-container ${b === barrio ? 'text-secondary font-medium' : ''}`}>{b}</button>
                      );
                    })}
                  </div>
                )}
              </div>

              <span className="h-6 w-px bg-outline-variant mx-1 hidden sm:block" />
            </>
          )}
          {['1', '2', '3', '4+'].map((a) => (
            <button key={a} className={chip(amb === a)} onClick={() => setAmb(amb === a ? '' : a)}>{a} amb</button>
          ))}

          <span className="h-6 w-px bg-outline-variant mx-1 hidden sm:block" />
          <button className={chip(precio === 'hasta3000')} onClick={() => setPrecio(precio === 'hasta3000' ? 'todos' : 'hasta3000')}>Hasta USD 3.000/m²</button>
          <button className={chip(precio === '3000a4500')} onClick={() => setPrecio(precio === '3000a4500' ? 'todos' : '3000a4500')}>3.000–4.500/m²</button>
          <button className={chip(precio === 'mas4500')} onClick={() => setPrecio(precio === 'mas4500' ? 'todos' : 'mas4500')}>+4.500/m²</button>

          <span className="h-6 w-px bg-outline-variant mx-1 hidden sm:block" />
          <button className={chip(etapa === 'en pozo')} onClick={() => setEtapa(etapa === 'en pozo' ? '' : 'en pozo')}>En pozo</button>
          <button className={chip(etapa === 'en construcción')} onClick={() => setEtapa(etapa === 'en construcción' ? '' : 'en construcción')}>En construcción</button>
          <button className={chip(fin)} onClick={() => setFin((v) => !v)}>Con financiación</button>

          {hayFiltros && (
            <button onClick={limpiar} className="px-3 py-2 text-[13px] text-on-surface-variant hover:text-primary underline underline-offset-2">Limpiar</button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[13px] text-on-surface-variant">
            <span className="text-primary font-medium">{filtered.length}</span> {filtered.length === 1 ? 'proyecto' : 'proyectos'}
            {filtered.length !== items.length && <span> de {items.length}</span>}
          </p>
          <div className="flex items-center gap-4">
            {/* Toggle Lista / Mapa */}
            <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
              <button onClick={() => setVista('lista')} className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] ${vista === 'lista' ? 'bg-primary-container text-on-primary' : 'text-primary hover:bg-surface-container'}`}>
                <span className="material-symbols-outlined text-[16px]">grid_view</span>Lista
              </button>
              <button onClick={() => setVista('mapa')} className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] ${vista === 'mapa' ? 'bg-primary-container text-on-primary' : 'text-primary hover:bg-surface-container'}`}>
                <span className="material-symbols-outlined text-[16px]">map</span>Mapa
              </button>
            </div>
            {aniosEntrega.length > 0 && (
              <label className="flex items-center gap-2 text-[13px] text-on-surface-variant">
                Entrega hasta
                <select value={entregaMax} onChange={(e) => setEntregaMax(e.target.value)} className="border border-outline-variant rounded-lg px-2.5 py-1.5 text-[13px] text-primary bg-surface">
                  <option value="">Cualquiera</option>
                  {aniosEntrega.map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </label>
            )}
            {vista === 'lista' && (
              <label className="flex items-center gap-2 text-[13px] text-on-surface-variant">
                Ordenar por
                <select value={orden} onChange={(e) => setOrden(e.target.value)} className="border border-outline-variant rounded-lg px-2.5 py-1.5 text-[13px] text-primary bg-surface">
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
            />
          ))}
        </div>
      )}

      {vista === 'lista' && filtered.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-on-surface-variant font-body-md text-body-md">No hay proyectos que coincidan con los filtros.</p>
          <button onClick={limpiar} className="mt-3 text-secondary underline underline-offset-4 text-[14px]">Limpiar filtros</button>
        </div>
      )}
    </>
  );
}
