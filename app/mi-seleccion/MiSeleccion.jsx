"use client";
// app/mi-seleccion/MiSeleccion.jsx — "Mi Plan": tu espacio de decisión.
// Dashboard proactivo (resumen + próximo paso) + perfil + guardados +
// RECOMENDADOS por tu perfil + SIMILARES a lo guardado, todo con "descartar con motivo".
// Sin login funciona en localStorage; con login, cross-device vía el provider.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";
import ProjectCard from "../_ui/ProjectCard";
import GuardarBtn from "../_auth/GuardarBtn";
import AsesorModal from "../asesor/AsesorModal";
import { track } from "../../lib/track";

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

export default function MiSeleccion({ catalogo = [] }) {
  const { items, ready, enabled, authReady, user, login, logout } = useAuth();
  const [perfil, setPerfil] = useState(undefined); // undefined = cargando
  const [descartes, setDescartes] = useState({}); // { slug: motivo }
  const [consulta, setConsulta] = useState(null); // { nombre, slug }

  useEffect(() => {
    const loadPerfil = () => { try { const raw = localStorage.getItem("dpp_perfil_v1"); setPerfil(raw ? JSON.parse(raw) : null); } catch { setPerfil(null); } };
    loadPerfil();
    try { const d = localStorage.getItem(DESCARTES_KEY); if (d) setDescartes(JSON.parse(d)); } catch {}
    // El perfil puede llegar de la nube (Supabase) DESPUÉS del montaje: AuthProvider dispara
    // "dpp-perfil-updated" al hidratar, y otras pestañas via "storage". Re-leemos para no
    // mostrar "Armá tu perfil" a alguien que ya lo tiene en su cuenta.
    const onStorage = (e) => { if (!e || e.key === "dpp_perfil_v1") loadPerfil(); };
    window.addEventListener("dpp-perfil-updated", loadPerfil);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("dpp-perfil-updated", loadPerfil); window.removeEventListener("storage", onStorage); };
  }, []);

  // Evento norte: "usuario activo de Mi Plan" (se cuenta cada visita a la sección).
  useEffect(() => {
    if (perfil === undefined) return; // esperamos a saber si hay perfil
    try { track("mi_plan_view", { guardados: items.length, tiene_perfil: !!perfil }); } catch {}
    // eslint-c�sable-next-line react-hooks/exhaustive-deps
  }, [perfil === undefined]);

  function descartar(slug, motivo) {
    setDescartes((prev) => {
      const next = { ...prev, [slug]: motivo };
      try { localStorage.setItem(DESCARTES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    try { track("mi_plan_descarte", { slug, motivo }); } catch {}
  }

  const excluir = useMemo(() => {
    const set = new Set(Object.keys(descartes));
    for (const it of items) set.add(it.slug);
    return set;
  }, [descartes, items]);

  // Recomendados por perfil (excluye guardados y descartados).
  const recomendados = useMemo(() => {
    if (!ready || !perfil || !catalogo.length) return [];
    return recomendadosLocal(perfil, catalogo, excluir, 12);
  }, [ready, perfil, catalogo, excluir]);

  // Similares a lo guardado (excluye guardados y descartados).
  const similares = useMemo(() => {
    if (!ready || !items.length || !catalogo.length) return [];
    const vistos = new Set(); const out = [];
    for (const it of items) {
      const cands = similaresLocal(it.slug, catalogo, { barrio: it.barrio, precioDesde: it.precioDesde, precioM2: it.precioM2 ?? it.precio, etapa: it.etapa }, 6);
      for (const c of cands) { if (excluir.has(c.slug) || vistos.has(c.slug)) continue; vistos.add(c.slug); out.push(c); }
    }
    return out.slice(0, 12);
  }, [ready, items, catalogo, excluir]);

  // Con auth activo, "Mi Plan" es privado: sin sesión no se ve.
  if (enabled && !authReady) {
    return <p className="text-on-surface-variant py-10 text-center">Cargando…</p>;
  }
  if (enabled && !user) {
    return <LoginGate login={login} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <PlanResumen perfil={perfil} nGuardados={items.length} onConsultar={() => items[0] && setConsulta({ nombre: items[0].nombre, slug: items[0].slug })} />
      <CuentaBloque enabled={enabled} user={user} login={login} logout={logout} />
      {perfil && <PerfilBloque perfil={perfil} />}

      <div>
        <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Tus proyectos guardados</h2>
        {!ready ? (
          <p className="text-on-surface-variant">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-on-surface-variant mb-4">Todavía no guardaste proyectos. Tocá el corazón en cualquiera para sumarlo a tu plan.</p>
            <Link href="/desarrollos-inmobiliarios/" className="inline-block rounded bg-primary-container px-6 py-3 text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">Explorar proyectos en pozo</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (<ProjectCard key={it.slug} {...it} />))}
          </div>
        )}
      </div>

      {recomendados.length > 0 && (
        <FeedCarousel
          titulo="Recomendados para tu plan"
          subtitulo="Según tu objetivo, zona y presupuesto. Descartá lo que no va y afinamos."
          items={recomendados}
          onConsultar={(m) => setConsulta({ nombre: m.nombre, slug: m.slug })}
          onDescartar={descartar}
        />
      )}

      {similares.length > 0 && (
        <FeedCarousel
          titulo="Similares a lo que guardaste"
          subtitulo="Por zona, etapa de obra y rango de precio de tu plan."
          items={similares}
          onConsultar={(m) => setConsulta({ nombre: m.nombre, slug: m.slug })}
          onDescartar={descartar}
        />
      )}

      {consulta && (<AsesorModal nombre={consulta.nombre} slug={consulta.slug} onClose={() => setConsulta(null)} />)}
    </div>
  );
}

// Resumen del plan + PRÓXIMO PASO (dashboard proactivo, muestra solo lo relevante).
function PlanResumen({ perfil, nGuardados, onConsultar }) {
  if (perfil === undefined) return null;
  let paso, cta, href, action, icon;
  if (!perfil) {
    icon = "support_agent";
    paso = "Armá tu perfil en 2 minutos y te recomendamos proyectos a tu medida.";
    cta = "Armar mi perfil"; href = "/asesor/";
  } else if (nGuardados === 0) {
    icon = "explore";
    paso = "Ya tenés tu perfil. Guardá tu primer proyecto de los recomendados para empezar a comparar.";
    cta = "Ver proyectos"; href = "/desarrollos-inmobiliarios/";
  } else {
    icon = "forum";
    paso = `Tenés ${nGuardados} ${nGuardados === 1 ? "proyecto" : "proyectos"} en tu plan. Consultá precio y forma de pago sin compromiso.`;
    cta = "Consultar con un asesor"; action = onConsultar;
  }
  return (
    <div className="rounded-2xl bg-primary-container text-on-primary p-6 md:p-7 md:flex md:items-center md:justify-between gap-6">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-link-gold text-[26px] mt-0.5">{icon}</span>
        <div>
          <p className="font-label-caps text-label-caps tracking-widest text-link-gold mb-1">Tu próximo paso</p>
          <p className="text-on-primary text-[15.5px] leading-snug max-w-xl">{paso}</p>
        </div>
      </div>
      {action ? (
        <button type="button" onClick={action} className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-2 rounded-full bg-surface text-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
          <span className="material-symbols-outlined text-[18px]">{icon}</span> {cta}
        </button>
      ) : (
        <Link href={href} className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-2 rounded-full bg-surface text-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
          <span className="material-symbols-outlined text-[18px]">{icon}</span> {cta}
        </Link>
      )}
    </div>
  );
}

// Carrusel genérico (recomendados / similares) con scroll horizontal + snap.
function FeedCarousel({ titulo, subtitulo, items, onConsultar, onDescartar }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <h2 className="font-headline-sm text-headline-sm text-primary">{titulo}</h2>
      </div>
      {subtitulo && <p className="text-on-surface-variant text-[14px] mb-4">{subtitulo}</p>}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:thin]">
        {items.map((m) => (
          <FeedCard key={m.slug} m={m} onConsultar={() => onConsultar(m)} onDescartar={onDescartar} />
        ))}
      </div>
    </div>
  );
}

const MOTIVOS = ["Zona", "Precio", "Etapa/entrega", "Ya la vi", "Otro"];

function FeedCard({ m, onConsultar, onDescartar }) {
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const card = { slug: m.slug, nombre: m.nombre, barrio: m.barrio, direccion: m.direccion, precio: m.precio, precioDesde: m.precioDesde, precioM2: m.precioM2, img: m.imagen, etapa: m.etapa, ambientes: m.ambientes, entrega: m.entrega, desarrolladora: m.desarrolladora };
  const precioLabel = m.precioDesde ? `Desde USD ${m.precioDesde.toLocaleString("es-AR")}` : (m.precioM2 ? `USD ${m.precioM2.toLocaleString("es-AR")} /m²` : "Consultar");
  return (
    <div className="snap-start shrink-0 w-64 flex flex-col bg-surface rounded-xl overflow-hidden border border-outline-variant">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
        <Link href={`/desarrollos-inmobiliarios/${m.slug}/`} className="block w-full h-full">
          {m.imagen ? (
            <img src={m.imagen} alt={`${m.nombre} — ${m.barrio}`} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary-container to-primary text-on-primary">
              <span className="material-symbols-outlined text-3xl opacity-80">apartment</span>
              <span className="font-label-caps text-[10px] tracking-widest opacity-80">{m.barrio || "En pozo"}</span>
            </div>
          )}
        </Link>
        <span className="absolute top-3 left-3 bg-primary/90 text-white px-2.5 py-1 rounded font-label-caps text-[10px] tracking-widest">{(m.etapa || "EN POZO").toUpperCase()}</span>
        <GuardarBtn card={card} />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/desarrollos-inmobiliarios/${m.slug}/`} className="block">
          <h3 className="serif text-[17px] text-primary leading-tight hover:text-secondary transition-colors">{m.nombre}</h3>
        </Link>
        <p className="text-on-surface-variant text-[12.5px] flex items-center gap-1 mt-1">
          <span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>{m.barrio || m.direccion}
        </p>
        <p className="text-primary font-headline-sm text-[15px] mt-2">{precioLabel}</p>

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
            <button
              type="button"
              onClick={onConsultar}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded bg-primary-container text-on-primary px-4 py-2.5 text-[12px] font-label-caps uppercase tracking-wider hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">forum</span> Consultar
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
      <div className="border border-outline-variant rounded-xl p-4 flex items-center justify-between gap-4 bg-surface-container-low">
        <p className="text-[13.5px] text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-green-600 icon-fill">check_circle</span>
          Conectado como <strong className="font-medium">{email}</strong> — tu plan se guarda en todos tus dispositivos.
        </p>
        <button type="button" onClick={logout} className="shrink-0 rounded border border-outline-variant px-4 py-2 text-[13px] text-primary hover:border-secondary transition-colors">Salir</button>
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

function PerfilBloque({ perfil }) {
  if (perfil === undefined) return null;

  if (!perfil) {
    return (
      <div className="border border-outline-variant rounded-xl p-6 md:flex md:items-center md:justify-between gap-6 bg-surface-container-low">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Armá tu perfil y te recomendamos a tu medida</h2>
          <p className="text-on-surface-variant text-[14px]">Contanos qué buscás en 2 minutos. Lo guardamos acá y te acompañamos, sin presiones.</p>
        </div>
        <Link href="/asesor/" className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-2 rounded bg-primary-container text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
          <span className="material-symbols-outlined text-[18px]">support_agent</span> Armar mi perfil
        </Link>
      </div>
    );
  }

  const chips = Object.keys(ETIQUETAS).filter((k) => perfil[k]).map((k) => [ETIQUETAS[k], perfil[k]]);
  return (
    <div className="border border-outline-variant rounded-xl p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-secondary">badge</span>Mi perfil</h2>
        <Link href="/asesor/" className="text-[13px] text-secondary underline hover:no-underline">Actualizar</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map(([label, val]) => (
          <span key={label} className="inline-flex items-baseline gap-1.5 text-[13px] px-3 py-1.5 rounded-full bg-secondary-container text-primary">
            <span className="text-[11px] uppercase tracking-wide text-secondary">{label}</span>{val}
          </span>
        ))}
      </div>
    </div>
  );
}
