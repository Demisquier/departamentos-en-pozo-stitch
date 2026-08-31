"use client";
// app/mi-seleccion/MiSeleccion.jsx — "Mi Plan": tu espacio de decisión.
// Orden nuevo (redesign): (1) tu perfil EDITABLE arriba de todo (búsqueda + contacto +
// un "dato clave" libre); (2) tus proyectos guardados divididos en "sin contactar" y "ya
// contactados", con CTA para contactar a uno o a todos; (3) "Nuevas oportunidades para vos",
// cuyas fichas se abren como MODAL (estilo Zillow) para no salir de Mi Plan.
// Sin login funciona en localStorage; con login, cross-device vía el provider.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";
import ComparadorPlan from "../_components/ComparadorPlan";
import GuardarBtn from "../_auth/GuardarBtn";
import AsesorModal from "../asesor/AsesorModal";
import AgregarExterno from "../_components/AgregarExterno";
import { track } from "../../lib/track";
import { supabase, authEnabled } from "../../lib/supabase";

// Scoring de "similares" INLINE (client-safe): réplica de lib/catalogo.similaresDesarrollos
// pero sin importar lib/catalogo → lib/wp (server-only) para no romper el bundle.
function topBarrioL(b) { return String(b || "").startsWith("Palermo") ? "Palermo" : String(b || ""); }
function similaresLocal(currentSlug, mapped, opts = {}, limit = 10) {
  const { barrio, precioDesde, precioM2, etapa } = opts;
  const curTop = topBarrioL(barrio);
  const scored = (mapped || []).filter((m) => m.slug && m.slug !== currentSlug).map((m) => {
    let s = 0;
    if (m.barrio && barrio && m.barrio === barrio) s += 60;
    else if (topBarrioL(m.barrio) && curTop && topBarrioL(m.barrio) === curTop) s += 45;
    if (m.etapa && etapa && m.etapa === etapa) s += 15;
    if (precioDesde && m.precioDesde) { const d = Math.abs(precioDesde - m.precioDesde) / precioDesde; if (d <= 0.5) s += Math.round(25 * (1 - d / 0.5)); }
    else if (precioM2 && m.precioM2) { const d = Math.abs(precioM2 - m.precioM2) / precioM2; if (d <= 0.5) s += Math.round(20 * (1 - d / 0.5)); }
    if (m.imagen) s += 8;
    if (m.precioDesde || m.precioM2) s += 4;
    return { m, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.m);
}

// Techo de presupuesto (USD) a partir del texto del perfil ("USD 180k–250k", "≤ USD 120k", "250k+").
function parsePresupuestoMax(s) {
  if (!s) return null;
  const t = String(s).toLowerCase();
  const nums = [...t.matchAll(/(\d+)\s*(k|mil)?/g)].map((m) => parseInt(m[1], 10) * (m[2] ? 1000 : 1)).filter((n) => n >= 1000);
  if (!nums.length) return null;
  return Math.max(...nums);
}

// Recomendados a partir del PERFIL (objetivo/zona/presupuesto/tipología), no de lo guardado.
function recomendadosLocal(perfil, catalogo, excluir, limit = 12) {
  if (!perfil || !catalogo.length) return [];
  const zona = perfil.zonas ? String(perfil.zonas) : "";
  const zonaTop = topBarrioL(zona);
  const presMax = parsePresupuestoMax(perfil.presupuesto);
  const amb = perfil.ambientes ? String(perfil.ambientes).toLowerCase().replace(/amb\w*/g, "").trim() : "";
  const scored = catalogo.filter((m) => m.slug && !excluir.has(m.slug)).map((m) => {
    let s = 0;
    if (zona && m.barrio) { if (m.barrio === zona) s += 55; else if (zonaTop && topBarrioL(m.barrio) === zonaTop) s += 40; }
    if (presMax && m.precioDesde) { if (m.precioDesde <= presMax * 1.1) s += 30; else if (m.precioDesde <= presMax * 1.35) s += 12; }
    if (amb && m.ambientes && String(m.ambientes).toLowerCase().includes(amb)) s += 12;
    if (m.imagen) s += 8;
    if (m.precioDesde || m.precioM2) s += 4;
    return { m, s };
  }).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.m);
}

const ETIQUETAS = { objetivo: "Objetivo", presupuesto: "Presupuesto", zonas: "Zonas", ambientes: "Tipología", entrega: "Entrega", plazo: "Plazo", financiacion: "Financiación" };
const DESCARTES_KEY = "dpp_descartes_v1";
const CONTACTADOS_KEY = "dpp_contactados_v1";

// Persiste la memoria del plan (contactados + descartes) DENTRO de perfiles.data, misma fila
// que el perfil, para que viaje entre dispositivos sin crear una tabla nueva. Best-effort.
async function savePlanState(contactados, descartes) {
  let base = {};
  try { base = JSON.parse(localStorage.getItem("dpp_perfil_v1")) || {}; } catch {}
  const next = { ...base, contactados, descartes };
  try { localStorage.setItem("dpp_perfil_v1", JSON.stringify(next)); } catch {}
  try { if (authEnabled) { const { data: u } = await supabase.auth.getUser(); const uid = u && u.user && u.user.id; if (uid) await supabase.from("perfiles").upsert({ user_id: uid, data: next }); } } catch {}
}

// Precio legible para cards y modal.
function precioLabelDe(m) {
  if (m.precioDesde) return "Desde USD " + Number(m.precioDesde).toLocaleString("es-AR");
  const m2 = m.precioM2 ?? m.precio;
  if (m2) return "USD " + Number(m2).toLocaleString("es-AR") + " /m²";
  return "Consultar";
}
// Dato denormalizado que consume GuardarBtn / comparador (sin releer catálogo).
function cardDe(m) {
  return { slug: m.slug, nombre: m.nombre, barrio: m.barrio, direccion: m.direccion, precio: m.precio, precioDesde: m.precioDesde, precioM2: m.precioM2, img: m.imagen || m.img, etapa: m.etapa, ambientes: m.ambientes, entrega: m.entrega, desarrolladora: m.desarrolladora };
}

export default function MiSeleccion({ catalogo = [] }) {
  const { items, ready, enabled, authReady, user, login, logout } = useAuth();
  const [perfil, setPerfil] = useState(undefined); // undefined = cargando
  const [descartes, setDescartes] = useState({}); // { slug: motivo }
  const [contactados, setContactados] = useState({}); // { slug: true }
  const [consulta, setConsulta] = useState(null); // { nombre, slug }
  const [detalle, setDetalle] = useState(null);   // proyecto para el modal Zillow-style

  useEffect(() => {
    const loadPerfil = () => { try { const raw = localStorage.getItem("dpp_perfil_v1"); const p = raw ? JSON.parse(raw) : null; setPerfil(p); if (p && p.contactados) setContactados((c) => ({ ...c, ...p.contactados })); if (p && p.descartes) setDescartes((d) => ({ ...d, ...p.descartes })); } catch { setPerfil(null); } };
    loadPerfil();
    try { const d = localStorage.getItem(DESCARTES_KEY); if (d) setDescartes(JSON.parse(d)); } catch {}
    try { const c = localStorage.getItem(CONTACTADOS_KEY); if (c) setContactados(JSON.parse(c)); } catch {}
    // El perfil puede llegar de la nube (Supabase) DESPUÉS del montaje.
    const onStorage = (e) => { if (!e || e.key === "dpp_perfil_v1") loadPerfil(); };
    window.addEventListener("dpp-perfil-updated", loadPerfil);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("dpp-perfil-updated", loadPerfil); window.removeEventListener("storage", onStorage); };
  }, []);

  // Evento norte: "usuario activo de Mi Plan" (se cuenta cada visita a la sección).
  useEffect(() => {
    if (perfil === undefined) return;
    try { track("mi_plan_view", { guardados: items.length, tiene_perfil: !!perfil }); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil === undefined]);

  function descartar(slug, motivo) {
    setDescartes((prev) => {
      const next = { ...prev, [slug]: motivo };
      try { localStorage.setItem(DESCARTES_KEY, JSON.stringify(next)); } catch {}
      try { savePlanState(contactados, next); } catch {}
      return next;
    });
    try { track("mi_plan_descarte", { slug, motivo }); } catch {}
  }

  function marcarContactado(slugs, on = true) {
    const arr = Array.isArray(slugs) ? slugs : [slugs];
    setContactados((prev) => {
      const next = { ...prev };
      arr.forEach((sl) => { if (on) next[sl] = true; else delete next[sl]; });
      try { localStorage.setItem(CONTACTADOS_KEY, JSON.stringify(next)); } catch {}
      try { savePlanState(next, descartes); } catch {}
      return next;
    });
  }

  // Abrir consulta = marcar contactado (proxy: el usuario ya inició el contacto por ese proyecto).
  function consultar(m, marcar = true) {
    setConsulta({ nombre: m.nombre, slug: m.slug });
    if (marcar && m.slug) marcarContactado(m.slug, true);
    try { track("mi_plan_consulta", { slug: m.slug || "" }); } catch {}
  }
  function consultarTodos() {
    const list = items.filter((it) => !contactados[it.slug]);
    const objetivo = list.length ? list : items;
    if (!objetivo.length) return;
    const nombres = objetivo.map((it) => it.nombre).filter(Boolean).slice(0, 6).join(", ");
    setConsulta({ nombre: nombres || "tus proyectos guardados", slug: "" });
    marcarContactado(objetivo.map((it) => it.slug), true);
    try { track("mi_plan_consulta_todos", { n: objetivo.length }); } catch {}
  }

  const excluir = useMemo(() => {
    const set = new Set(Object.keys(descartes));
    for (const it of items) set.add(it.slug);
    return set;
  }, [descartes, items]);

  const recomendados = useMemo(() => {
    if (!ready || !perfil || !catalogo.length) return [];
    return recomendadosLocal(perfil, catalogo, excluir, 12);
  }, [ready, perfil, catalogo, excluir]);

  const similares = useMemo(() => {
    if (!ready || !items.length || !catalogo.length) return [];
    const vistos = new Set(); const out = [];
    for (const it of items) {
      const cands = similaresLocal(it.slug, catalogo, { barrio: it.barrio, precioDesde: it.precioDesde, precioM2: it.precioM2 ?? it.precio, etapa: it.etapa }, 6);
      for (const c of cands) { if (excluir.has(c.slug) || vistos.has(c.slug)) continue; vistos.add(c.slug); out.push(c); }
    }
    return out.slice(0, 12);
  }, [ready, items, catalogo, excluir]);

  const guardadosSinContactar = useMemo(() => items.filter((it) => !contactados[it.slug]), [items, contactados]);
  const guardadosContactados = useMemo(() => items.filter((it) => contactados[it.slug]), [items, contactados]);

  // Con auth activo, "Mi Plan" es privado: sin sesión no se ve.
  if (enabled && !authReady) {
    return <p className="text-on-surface-variant py-10 text-center">Cargando…</p>;
  }
  if (enabled && !user) {
    return <LoginGate login={login} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <PlanNav mostrarGuardados={items.length > 0} />

      {/* 1) TU PERFIL — lo primero: editable, con búsqueda + contacto + un dato clave libre. */}
      <div id="mp-perfil" className="scroll-mt-28">
        <PerfilEditable perfil={perfil} onSaved={setPerfil} />
      </div>

      <CuentaBloque enabled={enabled} user={user} login={login} logout={logout} />

      {/* 2) TUS PROYECTOS — divididos por estado de contacto. */}
      <section id="mp-guardados" className="scroll-mt-28 flex flex-col gap-5">
        <SectionHeader icon="bookmark" titulo="Tus proyectos guardados" sub="Lo que marcaste con el corazón. Contactá a la desarrolladora por uno o por todos y seguimos nosotros." />
        {!ready ? (
          <p className="text-on-surface-variant">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-on-surface-variant mb-4">Todavía no guardaste proyectos. Tocá el corazón en cualquiera para sumarlo a tu plan.</p>
            <Link href="/desarrollos-inmobiliarios/" className="inline-block rounded bg-primary-container px-6 py-3 text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">Explorar proyectos en pozo</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <ComparadorPlan items={items} />
              {guardadosSinContactar.length > 0 && (
                <button type="button" onClick={consultarTodos} className="inline-flex items-center gap-2 rounded-full bg-secondary text-white px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined text-[18px]">forum</span> Contactar por {guardadosSinContactar.length === 1 ? "el pendiente" : `los ${guardadosSinContactar.length}`}
                </button>
              )}
            </div>

            {guardadosSinContactar.length > 0 && (
              <SavedCarousel
                titulo="Pendientes de contactar"
                sub="Pedí precio, disponibilidad y forma de pago. Se lo llevamos a la desarrolladora por vos."
                items={guardadosSinContactar}
                estado="pendiente"
                onContactar={(m) => consultar(m)}
                onMarcar={(slug) => marcarContactado(slug, true)}
                onVer={setDetalle}
              />
            )}
            {guardadosContactados.length > 0 && (
              <SavedCarousel
                titulo="Ya contactaste"
                sub="Estás esperando respuesta de la desarrolladora. Cuando tengas novedades, las sumamos acá."
                items={guardadosContactados}
                estado="contactado"
                onContactar={(m) => consultar(m, false)}
                onMarcar={(slug) => marcarContactado(slug, false)}
                onVer={setDetalle}
              />
            )}
          </>
        )}
      </section>

      {/* Otros proyectos que el usuario suma a mano (no están en el catálogo). */}
      <AgregarExterno />

      {/* 3) NUEVAS OPORTUNIDADES — las fichas abren un modal (no salís de Mi Plan). */}
      <section id="mp-oportunidades" className="scroll-mt-28 flex flex-col gap-6">
        <SectionHeader icon="auto_awesome" titulo="Nuevas oportunidades para vos" sub="Proyectos que encajan con tu búsqueda y todavía no viste. Abrilos acá sin perder tu plan; descartá lo que no va y afinamos." />
        {recomendados.length === 0 && similares.length === 0 ? (
          <div className="border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-on-surface-variant mb-4">{perfil ? "Por ahora no hay nuevas coincidencias. Guardá algún proyecto o ampliá tu búsqueda y te traemos más." : "Armá tu perfil en 2 minutos y acá te vamos a mostrar proyectos a tu medida, antes que en los portales."}</p>
            <Link href={perfil ? "/desarrollos-inmobiliarios/" : "/asesor/"} className="inline-block rounded bg-primary-container px-6 py-3 text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">{perfil ? "Explorar proyectos" : "Armar mi perfil"}</Link>
          </div>
        ) : (
          <>
            {recomendados.length > 0 && (
              <FeedCarousel titulo="A tu medida" subtitulo="Por tu objetivo, zona y presupuesto." items={recomendados} onVer={setDetalle} onDescartar={descartar} />
            )}
            {similares.length > 0 && (
              <FeedCarousel titulo="Parecidos a lo que guardaste" subtitulo="Misma zona, etapa de obra y rango de precio." items={similares} onVer={setDetalle} onDescartar={descartar} />
            )}
          </>
        )}
      </section>

      {detalle && (
        <DetalleModal
          m={detalle}
          onClose={() => setDetalle(null)}
          onConsultar={(m) => { setDetalle(null); consultar(m); }}
          onDescartar={(slug, motivo) => { descartar(slug, motivo); setDetalle(null); }}
        />
      )}
      {consulta && (<AsesorModal nombre={consulta.nombre} slug={consulta.slug} onClose={() => setConsulta(null)} />)}
    </div>
  );
}

// Navbar de secciones de Mi Plan: sticky bajo el header del sitio, pills scrolleables en
// mobile, resalta la sección visible (IntersectionObserver) y hace scroll suave al tocar.
const SECCIONES = [
  { id: "mp-perfil", label: "Tu perfil", icon: "badge" },
  { id: "mp-guardados", label: "Guardados", icon: "bookmark" },
  { id: "mp-oportunidades", label: "Para vos", icon: "auto_awesome" },
];
function PlanNav({ mostrarGuardados = true }) {
  const [activo, setActivo] = useState("mp-perfil");
  const secciones = mostrarGuardados ? SECCIONES : SECCIONES.filter((s) => s.id !== "mp-guardados");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActivo(e.target.id); }); },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    secciones.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarGuardados]);
  const ir = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <nav aria-label="Secciones de Mi Plan" className="sticky top-14 z-30 -mt-2 mb-1 bg-surface/95 supports-[backdrop-filter]:bg-surface/80 backdrop-blur border-b border-outline-variant">
      <div className="flex gap-1.5 overflow-x-auto py-2.5 [scrollbar-width:none] [-ms-overflow-style:none]" style={{ scrollbarWidth: "none" }}>
        {secciones.map((s) => {
          const on = activo === s.id;
          return (
            <button key={s.id} type="button" onClick={() => ir(s.id)} aria-current={on ? "true" : undefined}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${on ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
              <span className={`material-symbols-outlined text-[17px] ${on ? "icon-fill" : ""}`}>{s.icon}</span>{s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Cabecera de pilar: ícono + título + subtítulo con divisoria.
function SectionHeader({ icon, titulo, sub }) {
  return (
    <div className="border-t border-outline-variant pt-6">
      <h2 className="font-headline-md text-headline-md serif text-primary flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[24px] text-secondary icon-fill">{icon}</span>{titulo}
      </h2>
      {sub && <p className="text-on-surface-variant text-[14.5px] mt-1">{sub}</p>}
    </div>
  );
}

/* ============================ PERFIL EDITABLE ============================ */

const CAMPOS_BUSQUEDA = [
  { key: "objetivo", label: "Objetivo", ph: "Vivienda / Inversión", sug: ["Vivienda", "Inversión / renta", "Vivienda + inversión"] },
  { key: "presupuesto", label: "Presupuesto (USD)", ph: "USD 120k–180k", sug: ["≤ USD 120k", "USD 120k–180k", "USD 180k–250k", "USD 250k+"] },
  { key: "zonas", label: "Zonas", ph: "Caballito, Palermo…", sug: ["Caballito", "Villa Urquiza", "Palermo", "Belgrano / Núñez", "Abierto a sugerencias"] },
  { key: "ambientes", label: "Tipología", ph: "2 ambientes", sug: ["Monoambiente", "2 ambientes", "3 ambientes", "3+ ambientes"] },
  { key: "entrega", label: "Entrega", ph: "2026 / 2027", sug: ["En pozo", "2026", "2027", "2028+"] },
  { key: "plazo", label: "Plazo para comprar", ph: "3–6 meses", sug: ["Ya", "3–6 meses", "6–12 meses", "Explorando"] },
  { key: "financiacion", label: "Financiación", ph: "Cuotas / Contado", sug: ["Contado", "Cuotas", "Mixto"] },
];
const CAMPOS_CONTACTO = [
  { key: "nombre", label: "Nombre", ph: "Tu nombre", type: "text", ac: "name" },
  { key: "email", label: "Email", ph: "vos@mail.com", type: "email", ac: "email" },
  { key: "whatsapp", label: "WhatsApp", ph: "+54 9 11 …", type: "tel", ac: "tel" },
];

async function guardarPerfil(next) {
  const clean = {};
  Object.keys(next).forEach((k) => { if (k === "contactados" || k === "descartes") return; const v = String(next[k] == null ? "" : next[k]).trim(); if (v) clean[k] = v; });
  try { const prevP = JSON.parse(localStorage.getItem("dpp_perfil_v1")) || {}; if (prevP.contactados) clean.contactados = prevP.contactados; if (prevP.descartes) clean.descartes = prevP.descartes; } catch {}
  try { localStorage.setItem("dpp_perfil_v1", JSON.stringify(clean)); } catch {}
  try {
    if (authEnabled) { const { data: u } = await supabase.auth.getUser(); const uid = u && u.user && u.user.id; if (uid) await supabase.from("perfiles").upsert({ user_id: uid, data: clean }); }
  } catch {}
  try { window.dispatchEvent(new Event("dpp-perfil-updated")); } catch {}
  try { track("mi_plan_perfil_edit", {}); } catch {}
  return clean;
}

function PerfilEditable({ perfil, onSaved }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(true);
  useEffect(() => { try { if (!window.matchMedia("(min-width: 768px)").matches) setAbierto(false); } catch {} }, []);

  if (perfil === undefined) return null; // cargando

  function abrirEdicion() {
    setForm({ ...(perfil || {}) });
    setEditando(true);
  }
  async function onSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    const clean = await guardarPerfil(form);
    setGuardando(false);
    setEditando(false);
    onSaved && onSaved(clean);
  }

  // Sin perfil aún: onboarding, pero con opción de cargarlo a mano acá mismo.
  if (!perfil && !editando) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:p-7">
        <div className="md:flex md:items-center md:justify-between gap-6">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-secondary">badge</span>Tu perfil de búsqueda</h2>
            <p className="text-on-surface-variant text-[14px] max-w-xl">Contanos qué buscás y cómo contactarte. Lo guardamos acá para recomendarte a tu medida y acompañarte, sin presiones.</p>
          </div>
          <div className="mt-4 md:mt-0 shrink-0 flex flex-wrap gap-2">
            <Link href="/asesor/" className="inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-5 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">support_agent</span> Armar con el asesor
            </Link>
            <button type="button" onClick={abrirEdicion} className="inline-flex items-center gap-2 rounded border border-outline-variant text-primary px-5 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:border-secondary transition-all">
              <span className="material-symbols-outlined text-[18px]">edit</span> Cargar a mano
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (editando) {
    return (
      <form onSubmit={onSubmit} className="rounded-2xl border border-secondary/40 bg-surface p-6 md:p-7 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-secondary">edit</span>Editá tu perfil</h2>
        </div>

        <fieldset>
          <legend className="font-label-caps text-[11px] uppercase tracking-widest text-secondary mb-3">Tu búsqueda</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAMPOS_BUSQUEDA.map((c) => (
              <label key={c.key} className="flex flex-col gap-1">
                <span className="text-[12.5px] text-on-surface-variant">{c.label}</span>
                <input
                  list={`sug-${c.key}`}
                  value={form[c.key] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                  placeholder={c.ph}
                  className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-[14.5px] text-primary focus:border-secondary focus:outline-none"
                />
                {c.sug && (
                  <datalist id={`sug-${c.key}`}>
                    {c.sug.map((s) => (<option key={s} value={s} />))}
                  </datalist>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-label-caps text-[11px] uppercase tracking-widest text-secondary mb-3">Tus datos de contacto</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CAMPOS_CONTACTO.map((c) => (
              <label key={c.key} className="flex flex-col gap-1">
                <span className="text-[12.5px] text-on-surface-variant">{c.label}</span>
                <input
                  type={c.type || "text"}
                  autoComplete={c.ac}
                  value={form[c.key] || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                  placeholder={c.ph}
                  className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-[14.5px] text-primary focus:border-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-label-caps text-[11px] uppercase tracking-widest text-secondary mb-3">Un dato clave que no te preguntamos</legend>
          <textarea
            value={form.nota || ""}
            onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))}
            placeholder="Ej: necesito cochera, escritura antes de 2027, prioridad amenities, cuota que no supere X…"
            rows={2}
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-[14.5px] text-primary focus:border-secondary focus:outline-none resize-y"
          />
        </fieldset>

        <div className="flex items-center gap-3 flex-wrap">
          <button type="submit" disabled={guardando} className="inline-flex items-center gap-2 rounded-full bg-primary-container text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-60">
            <span className="material-symbols-outlined text-[18px]">check</span> {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
          <button type="button" onClick={() => setEditando(false)} className="text-[13px] text-on-surface-variant hover:text-primary transition-colors">Cancelar</button>
        </div>
      </form>
    );
  }

  // Vista de lectura del perfil cargado.
  const chips = CAMPOS_BUSQUEDA.filter((c) => perfil[c.key]).map((c) => [c.label, perfil[c.key]]);
  const contacto = CAMPOS_CONTACTO.filter((c) => perfil[c.key]).map((c) => [c.label, perfil[c.key]]);
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-6 md:p-7">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-secondary">badge</span>Tu perfil</h2>
          <p className="text-on-surface-variant text-[13px] mt-0.5">Esto es lo que sabemos de tu búsqueda. Editalo cuando quieras.</p>
        </div>
        <button type="button" onClick={abrirEdicion} className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-outline-variant text-primary px-4 py-2 text-[13px] hover:border-secondary transition-colors">
          <span className="material-symbols-outlined text-[16px]">edit</span> Editar
        </button>
      </div>

      <button type="button" onClick={() => setAbierto((v) => !v)} className="md:hidden mb-3 inline-flex items-center gap-1 text-[13px] text-secondary underline underline-offset-2">{abierto ? "Ocultar mis datos" : "Ver mis datos"}</button>
      {abierto && (
        <>
      <p className="font-label-caps text-[11px] uppercase tracking-widest text-secondary mb-2">Tu búsqueda</p>
      {chips.length ? (
        <div className="flex flex-wrap gap-2 mb-5">
          {chips.map(([label, val]) => (
            <span key={label} className="inline-flex items-baseline gap-1.5 text-[13px] px-3 py-1.5 rounded-full bg-secondary-container text-primary">
              <span className="text-[11px] uppercase tracking-wide text-secondary">{label}</span>{val}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant text-[13.5px] mb-5">Todavía no cargaste tus filtros. <button type="button" onClick={abrirEdicion} className="text-secondary underline hover:no-underline">Agregalos</button>.</p>
      )}

      <p className="font-label-caps text-[11px] uppercase tracking-widest text-secondary mb-2">Tus datos de contacto</p>
      {contacto.length ? (
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 mb-1 text-[14px] text-primary">
          {contacto.map(([label, val]) => (
            <span key={label} className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-link-gold">{label === "Email" ? "mail" : label === "WhatsApp" ? "call" : "person"}</span>{val}</span>
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant text-[13.5px]">Sin datos de contacto. <button type="button" onClick={abrirEdicion} className="text-secondary underline hover:no-underline">Agregalos</button> así te llegan precio y novedades.</p>
      )}

      {perfil.nota && (
        <div className="mt-5 rounded-lg bg-surface-container-low border border-outline-variant p-3.5">
          <p className="font-label-caps text-[10px] uppercase tracking-widest text-secondary mb-1">Tu dato clave</p>
          <p className="text-[14px] text-primary">{perfil.nota}</p>
        </div>
      )}
        </>
      )}
    </div>
  );
}

/* ============================ GUARDADOS (carrusel por estado) ============================ */

function SavedCarousel({ titulo, sub, items, estado, onContactar, onMarcar, onVer }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`material-symbols-outlined text-[18px] ${estado === "contactado" ? "text-green-600" : "text-secondary"}`}>{estado === "contactado" ? "mark_email_read" : "schedule"}</span>
        <h3 className="font-headline-sm text-headline-sm text-primary">{titulo} ({items.length})</h3>
      </div>
      {sub && <p className="text-on-surface-variant text-[13.5px] mb-4 ml-6">{sub}</p>}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:thin]">
        {items.map((it) => (
          <SavedCard key={it.slug} it={it} estado={estado} onContactar={() => onContactar(it)} onMarcar={() => onMarcar(it.slug)} onVer={() => onVer && onVer(it)} />
        ))}
      </div>
    </div>
  );
}

function SavedCard({ it, estado, onContactar, onMarcar, onVer }) {
  const card = cardDe(it);
  const contactado = estado === "contactado";
  return (
    <div className="snap-start shrink-0 w-[270px] flex flex-col bg-surface rounded-xl overflow-hidden border border-outline-variant">
      <button type="button" onClick={onVer} className="relative aspect-[4/3] overflow-hidden bg-surface-container-high text-left block w-full">
        {card.img ? (
          <img src={card.img} alt={`${it.nombre} — ${it.barrio || ""}`} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary-container to-primary text-on-primary">
            <span className="material-symbols-outlined text-3xl opacity-80">apartment</span>
            <span className="font-label-caps text-[10px] tracking-widest opacity-80">{it.barrio || "En pozo"}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">{(it.etapa || "EN POZO").toUpperCase()}</span>
        {contactado && <span className="absolute top-3 right-12 bg-green-600 text-white px-2 py-1 rounded font-label-caps text-[10px] tracking-widest inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">check</span>CONTACTADO</span>}
        <GuardarBtn card={card} />
      </button>
      <div className="p-4 flex flex-col flex-1">
        <button type="button" onClick={onVer} className="text-left">
          <h3 className="serif text-[17px] text-primary leading-tight hover:text-secondary transition-colors">{it.nombre}</h3>
        </button>
        <p className="text-on-surface-variant text-[12.5px] flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>{it.barrio || it.direccion}
        </p>
        <p className="text-primary font-headline-sm text-[15px] mt-2">{precioLabelDe(it)}</p>

        {/* NOTA (recordatorio de lo que la ficha debería mostrar más adelante, cuando tengamos el dato). */}
        <p className="mt-2 text-[11.5px] text-on-surface-variant flex items-start gap-1 leading-snug">
          <span className="material-symbols-outlined text-[13px] mt-[1px] text-link-gold">bolt</span>
          Pronto acá: precio actualizado, cuota estimada y avance de obra.
        </p>

        {contactado ? (
          <div className="mt-3 flex flex-col gap-2">
            <span className="inline-flex items-center justify-center gap-2 rounded bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 text-[12px] font-label-caps uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px]">mark_email_read</span> Contactado
            </span>
            <button type="button" onClick={onContactar} className="text-[12px] text-secondary hover:underline inline-flex items-center gap-1 self-start">
              <span className="material-symbols-outlined text-[14px]">forum</span> Volver a consultar
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" onClick={onContactar} className="inline-flex items-center justify-center gap-2 rounded bg-secondary text-white px-4 py-2.5 text-[12px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[16px]">forum</span> Contactar
            </button>
            <button type="button" onClick={onMarcar} className="text-[12px] text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 self-start">
              <span className="material-symbols-outlined text-[14px]">check</span> Ya lo contacté
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ OPORTUNIDADES (feed → modal) ============================ */

function FeedCarousel({ titulo, subtitulo, items, onVer, onDescartar }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <h3 className="font-headline-sm text-headline-sm text-primary">{titulo}</h3>
      </div>
      {subtitulo && <p className="text-on-surface-variant text-[14px] mb-4">{subtitulo}</p>}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:thin]">
        {items.map((m) => (
          <FeedCard key={m.slug} m={m} onVer={() => onVer(m)} onDescartar={onDescartar} />
        ))}
      </div>
    </div>
  );
}

const MOTIVOS = ["Zona", "Precio", "Etapa/entrega", "Ya la vi", "Otro"];

function FeedCard({ m, onVer, onDescartar }) {
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const card = cardDe(m);
  return (
    <div className="snap-start shrink-0 w-64 flex flex-col bg-surface rounded-xl overflow-hidden border border-outline-variant">
      <button type="button" onClick={onVer} className="relative aspect-[4/3] overflow-hidden bg-surface-container-high text-left block w-full">
        {m.imagen ? (
          <img src={m.imagen} alt={`${m.nombre} — ${m.barrio || ""}`} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary-container to-primary text-on-primary">
            <span className="material-symbols-outlined text-3xl opacity-80">apartment</span>
            <span className="font-label-caps text-[10px] tracking-widest opacity-80">{m.barrio || "En pozo"}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">{(m.etapa || "EN POZO").toUpperCase()}</span>
        <GuardarBtn card={card} />
      </button>
      <div className="p-4 flex flex-col flex-1">
        <button type="button" onClick={onVer} className="text-left">
          <h3 className="serif text-[17px] text-primary leading-tight hover:text-secondary transition-colors">{m.nombre}</h3>
        </button>
        <p className="text-on-surface-variant text-[12.5px] flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>{m.barrio || m.direccion}
        </p>
        <p className="text-primary font-headline-sm text-[15px] mt-2">{precioLabelDe(m)}</p>

        {pidiendoMotivo ? (
          <div className="mt-3">
            <p className="text-[11px] uppercase tracking-wide text-on-surface-variant mb-1.5">¿Por qué no va?</p>
            <div className="flex flex-wrap gap-1.5">
              {MOTIVOS.map((mo) => (
                <button key={mo} type="button" onClick={() => onDescartar(m.slug, mo)} className="text-[12px] px-2.5 py-1 rounded-full border border-outline-variant text-primary hover:border-secondary hover:bg-secondary-container transition-colors">{mo}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <button type="button" onClick={onVer} className="mt-3 inline-flex items-center justify-center gap-2 rounded bg-primary-container text-on-primary px-4 py-2.5 text-[12px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[16px]">visibility</span> Ver detalle
            </button>
            <button type="button" onClick={() => setPidiendoMotivo(true)} className="mt-2 text-[12px] text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-1 self-start">
              <span className="material-symbols-outlined text-[14px]">close</span> No me interesa
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Modal estilo Zillow: mini-FICHA COMPLETA (galería + datos + avance + amenities + descripción)
// SIN salir de Mi Plan. Trae el dato completo de /api/proyecto/{slug} al abrir. Al cerrar, volvés.
function DetalleModal({ m, onClose, onConsultar, onDescartar }) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [idx, setIdx] = useState(0);
  const [descOpen, setDescOpen] = useState(false);
  const closeRef = useRef(null);
  const lenRef = useRef(1);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
      else if (e.key === "ArrowRight") setIdx((i) => (i + 1) % lenRef.current);
      else if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + lenRef.current) % lenRef.current);
    };
    window.addEventListener("keydown", onKey);
    try { track("mi_plan_ver_detalle", { slug: m.slug || "" }); } catch (e) {}
    const ft = setTimeout(() => { try { closeRef.current && closeRef.current.focus(); } catch (e) {} }, 30);
    let vivo = true;
    (async () => {
      try { const r = await fetch(`/api/proyecto/${m.slug}`); if (r.ok) { const j = await r.json(); if (vivo && !j.error) setData(j); } } catch (e) {}
      if (vivo) setCargando(false);
    })();
    return () => { vivo = false; clearTimeout(ft); document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose, m.slug]);

  const base = data || m;
  const card = cardDe(base);
  const galeria = (data && data.galeria && data.galeria.length ? data.galeria : [card.img].filter(Boolean));
  lenRef.current = galeria.length || 1;
  const cur = galeria[idx] || null;
  const goNext = () => setIdx((i) => (i + 1) % galeria.length);
  const goPrev = () => setIdx((i) => (i - 1 + galeria.length) % galeria.length);

  const datos = [
    ["Entrega", base.entrega],
    ["Etapa de obra", base.etapa],
    ["Tipologías", base.tipologias || base.ambientes],
    ["Precio / m²", base.precioM2 ? "USD " + Number(base.precioM2).toLocaleString("es-AR") + "/m²" : null],
    ["Anticipo", data && data.anticipo],
    ["Cuotas", data && data.cuotas],
    ["Ajuste", data && data.ajuste],
    ["Desarrolladora", base.desarrolladora],
  ].filter(([, v]) => v);

  return (
    <div className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center p-0 sm:p-4 scrim-soft" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={base.nombre} className="w-full sm:max-w-lg max-h-[94dvh] bg-surface rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Handle de arrastre (solo mobile, señal de bottom-sheet) */}
        <div className="sm:hidden shrink-0 pt-2.5 pb-1 flex justify-center"><span className="w-10 h-1 rounded-full bg-outline-variant" aria-hidden="true" /></div>
        {/* GALERÍA */}
        <div className="relative aspect-[16/10] bg-surface-container-high shrink-0">
          {cur ? (
            <img src={cur} alt={`${base.nombre} — foto ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary-container to-primary text-on-primary">
              <span className="material-symbols-outlined text-4xl opacity-80">apartment</span>
              <span className="font-label-caps text-[11px] tracking-widest opacity-80">{base.barrio || "En pozo"}</span>
            </div>
          )}
          <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">{(base.etapa || "EN POZO").toUpperCase()}</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar" className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 shadow hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
            <span className="material-symbols-outlined text-[20px] text-primary">close</span>
          </button>
          <GuardarBtn card={card} className="!top-3 !right-14" />
          {galeria.length > 1 && (
            <>
              <button type="button" onClick={goPrev} aria-label="Foto anterior" className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"><span className="material-symbols-outlined text-[22px] text-primary">chevron_left</span></button>
              <button type="button" onClick={goNext} aria-label="Foto siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"><span className="material-symbols-outlined text-[22px] text-primary">chevron_right</span></button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/45 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px] text-white">photo_library</span>
                <span className="text-white text-[12px] font-medium">{idx + 1} / {galeria.length}</span>
              </div>
            </>
          )}
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="p-5 md:p-6 overflow-y-auto flex flex-col gap-4">
          <div>
            <h2 className="serif text-headline-sm text-primary leading-tight">{base.nombre}</h2>
            <p className="text-on-surface-variant text-[13px] flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[16px] text-link-gold">location_on</span>{base.direccion || base.barrio}</p>
            <p className="text-primary font-headline-md text-headline-sm mt-2">{precioLabelDe(base)}</p>
          </div>

          {galeria.length > 1 && (
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 [scrollbar-width:thin]">
              {galeria.map((g, i) => (
                <button key={i} type="button" onClick={() => setIdx(i)} className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 ${i === idx ? "border-secondary" : "border-transparent"}`}>
                  <img src={g} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {datos.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-outline-variant pt-4">
              {datos.map(([k, v]) => (
                <div key={k}><dt className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">{k}</dt><dd className="text-[14px] text-primary">{v}</dd></div>
              ))}
            </dl>
          )}

          {data && data.avance != null && (
            <div>
              <div className="flex items-center justify-between mb-1"><span className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Avance de obra</span><span className="text-[13px] text-primary font-medium">{data.avance}%</span></div>
              <div className="h-2 rounded-full bg-surface-container-high overflow-hidden"><div className="h-full bg-secondary" style={{ width: data.avance + "%" }} /></div>
            </div>
          )}

          {data && data.amenities && data.amenities.length > 0 && (
            <div className="border-t border-outline-variant pt-4">
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {data.amenities.slice(0, 16).map((a) => (<span key={a} className="text-[12.5px] px-2.5 py-1 rounded-full bg-secondary-container text-primary">{a}</span>))}
              </div>
            </div>
          )}

          {data && data.descripcionHtml && (
            <div className="border-t border-outline-variant pt-4">
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Descripción</p>
              <div className={`prose max-w-none text-[14px] text-on-surface-variant leading-relaxed overflow-hidden ${descOpen ? "" : "max-h-40"}`} dangerouslySetInnerHTML={{ __html: data.descripcionHtml }} />
              <button type="button" onClick={() => setDescOpen((o) => !o)} className="mt-1 inline-flex items-center gap-1 text-secondary font-medium text-[13.5px]">{descOpen ? "Ver menos" : "Leer más"}<span className={`material-symbols-outlined text-[17px] transition-transform ${descOpen ? "rotate-180" : ""}`}>expand_more</span></button>
            </div>
          )}

          {cargando && (<p className="text-on-surface-variant text-[13px] flex items-center gap-2"><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Cargando la ficha completa…</p>)}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-outline-variant">
            <button type="button" onClick={() => onConsultar(base)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-secondary text-white px-5 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2">
              <span className="material-symbols-outlined text-[18px]">forum</span> Pedir precio y cuota
            </button>
            <button type="button" onClick={() => onDescartar(base.slug, "Otro")} className="sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant text-primary px-5 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:border-secondary transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
              <span className="material-symbols-outlined text-[18px]">close</span> No me interesa
            </button>
          </div>

          <p className="text-center text-[11.5px] text-on-surface-variant">Todo sin salir de <strong className="font-medium text-primary">Mi Plan</strong>. <Link href={`/desarrollos-inmobiliarios/${base.slug}/`} className="text-secondary underline hover:no-underline">Abrir ficha completa</Link></p>
        </div>
      </div>
    </div>
  );
}

/* ============================ ACCESO / CUENTA ============================ */

// Pantalla de acceso: sin sesión no se muestra el plan. Entrar = crear/loguear con Google.
function LoginGate({ login }) {
  return (
    <div className="max-w-lg mx-auto text-center border border-outline-variant rounded-2xl p-8 md:p-10 bg-surface-container-low">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[30px] text-secondary icon-fill" aria-hidden="true">space_dashboard</span>
      </div>
      <h2 className="font-headline-md text-headline-md serif text-primary mb-2">Ingresá para ver Mi Plan</h2>
      <p className="text-on-surface-variant text-[15px] mb-6">
        Guardá los proyectos que te interesan y tu perfil de búsqueda en tu cuenta, y accedé desde cualquier dispositivo. Es gratis y sin contraseñas.
      </p>
      <button
        type="button"
        onClick={() => login(typeof window !== "undefined" ? window.location.href : undefined)}
        className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-primary-container text-on-primary px-8 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">login</span>
        Continuar con Google
      </button>
      <p className="mt-5 text-[13px] text-on-surface-variant">
        ¿Solo querés mirar? <Link href="/desarrollos-inmobiliarios/" className="text-secondary underline hover:no-underline">Explorá los proyectos en pozo</Link>
      </p>
    </div>
  );
}

// Bloque de cuenta: login con Google (persistir cross-device) o estado + salir.
function CuentaBloque({ enabled, user, login, logout }) {
  if (!enabled) return null;
  if (user) {
    const email = user.email || (user.user_metadata && user.user_metadata.email) || "tu cuenta";
    return (
      <div className="border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-container-low">
        <p className="text-[13.5px] text-on-surface flex items-start gap-2 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-green-600 icon-fill shrink-0">check_circle</span>
          Conectado como <strong className="font-medium break-all">{email}</strong> — tu plan se guarda en todos tus dispositivos.
        </p>
        <button type="button" onClick={logout} className="shrink-0 self-start sm:self-auto rounded border border-outline-variant px-4 py-2 text-[13px] text-primary hover:border-secondary transition-colors">Salir</button>
      </div>
    );
  }
  return (
    <div className="border border-outline-variant rounded-xl p-5 md:flex md:items-center md:justify-between gap-6 bg-surface-container-low">
      <div>
        <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Ingresá con Google</h2>
        <p className="text-on-surface-variant text-[14px]">Guardá tu plan —proyectos, objetivo y presupuesto— en tu cuenta para verlo desde cualquier dispositivo. Sin contraseñas.</p>
      </div>
      <button type="button" onClick={login} className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
        <span className="material-symbols-outlined text-[18px]">login</span> Ingresar con Google
      </button>
    </div>
  );
}
