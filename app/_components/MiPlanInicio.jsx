"use client";
// app/_components/MiPlanInicio.jsx — "Mi Plan" como home para quien ya conocemos.
// Por qué: el usuario que vuelve no necesita el pitch; necesita retomar (guardados, consultas)
// y ver lo nuevo que le encaja. Cómo: se muestra SOLO en cliente si hay sesión con guardados o
// señales locales (fichas vistas, perfil, consultas). El HTML del server no cambia → SEO intacto.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";
import { leerAfinidad, puntajeAfinidad, encajaPerfil } from "../../lib/afinidad";

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const usd = (n) => (n ? "USD " + Math.round(n).toLocaleString("es-AR") : null);
const DIA = 864e5;
function primerNombre(s) {
  const t = String(s || "").trim().split(/\s+/)[0];
  return t && t.length >= 2 && !/https?:|@|\d{4,}/i.test(t) ? t : "";
}
const cap = (s) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());

export default function MiPlanInicio() {
  const { user, items: guardados = [], count = 0, ready, enabled } = useAuth();
  const [st, setSt] = useState(null); // señales locales
  const [catalogo, setCatalogo] = useState(null);
  const [resp, setResp] = useState({});

  useEffect(() => {
    const af = leerAfinidad();
    const consultas = read("dpp_consultas_v1", []);
    const perfil = read("dpp_perfil_v1", {}) || {};
    const vistos = read("dpp_vistos_v1", []);
    setResp(read("dpp_respuesta_v1", {}));
    setSt({ af, consultas: Array.isArray(consultas) ? consultas : [], nombre: primerNombre(perfil.nombre), nVistos: Array.isArray(vistos) ? vistos.length : 0 });
  }, []);

  const logged = enabled ? !!user : false;
  const nGuard = logged ? count : 0;
  const activo = !!st && ready && (nGuard > 0 || st.consultas.length > 0 || st.nVistos >= 3 || (st.af && Object.keys(st.af.barrios).length >= 1 && st.nVistos >= 1));

  useEffect(() => {
    if (!activo || catalogo) return;
    fetch("/api/para-vos").then((r) => r.json()).then((j) => setCatalogo(j.items || [])).catch(() => setCatalogo([]));
  }, [activo, catalogo]);

  const recos = useMemo(() => {
    if (!catalogo || !st) return [];
    const ya = new Set([...guardados.map((g) => g.slug), ...st.consultas.map((c) => c.s)]);
    const idMax = Math.max(0, ...catalogo.map((x) => x.id));
    return catalogo
      .filter((x) => !ya.has(x.s) && !(st.af.vistos && st.af.vistos.has(x.s)))
      .map((x) => {
        const it = { slug: x.s, barrio: x.b, precioDesde: x.p, precio: x.m2, ambientesNums: x.amb };
        let sc = puntajeAfinidad(it, st.af);
        if (x.sel && encajaPerfil(it, st.af)) sc += 120;     // verificado y le encaja
        if (idMax && x.id >= idMax - 60) sc += 80;              // ingreso reciente al catálogo
        return { ...x, sc, nuevo: idMax && x.id >= idMax - 60 };
      })
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 6);
  }, [catalogo, st, guardados]);

  // "Empezar de cero": borra lo que inferimos de tu navegación (barrios, precio, vistas, descartes).
  // NO borra tus guardados ni tus consultas. Es como armar un plan nuevo.
  const empezarDeCero = () => {
    if (!window.confirm("¿Empezar una búsqueda nueva? Olvidamos los barrios, precios y fichas vistas. Tus guardados y consultas quedan.")) return;
    try {
      ["dpp_vistos_v1", "dpp_imp_v1", "dpp_rebote_v1", "dpp_accion_v1", "dpp_respuesta_v1"].forEach((k) => localStorage.removeItem(k));
      const p = JSON.parse(localStorage.getItem("dpp_perfil_v1") || "{}");
      delete p.zonas; delete p.presupuesto; delete p.ambientes;
      localStorage.setItem("dpp_perfil_v1", JSON.stringify(p));
    } catch {}
    try { window.gtag && window.gtag("event", "mi_plan_reset"); } catch {}
    window.location.hash = "buscar";
    window.location.reload();
  };

  if (!activo) return null;

  const pendientes = st.consultas.filter((c) => c.s && Date.now() - c.t > 2 * DIA && !resp[c.s]).slice(0, 2);
  const marcar = (slug, v) => {
    const next = { ...resp, [slug]: v };
    setResp(next);
    try { localStorage.setItem("dpp_respuesta_v1", JSON.stringify(next)); } catch {}
    try { window.gtag && window.gtag("event", "mi_plan_respuesta", { respuesta: v }); } catch {}
  };
  const barriosTop = Object.entries(st.af.barrios || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([b]) => b);
  const precioRef = st.af.precioRef;

  return (
    <section className="bg-surface-container-low border-b border-outline-variant" aria-label="Tu plan">
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-link-gold font-label-caps text-label-caps uppercase tracking-widest">Tu plan</p>
            <h2 className="font-headline-sm text-headline-sm text-primary leading-tight">
              {st.nombre ? `Hola de nuevo, ${st.nombre}.` : "Hola de nuevo."} Retomá donde dejaste
            </h2>
            {(barriosTop.length > 0 || precioRef) && (
              <p className="text-on-surface-variant text-[14px] mt-1">
                Buscás {barriosTop.length ? <>en <strong className="text-primary">{barriosTop.map(cap).join(" y ")}</strong></> : null}
                {precioRef ? <> · alrededor de <strong className="text-primary">{usd(precioRef)}</strong></> : null}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Link href="/mi-seleccion/" className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-5 py-2.5 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90">
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              {nGuard ? `Ver mi Plan (${nGuard})` : logged ? "Ver mi Plan" : "Guardar mi plan"}
            </Link>
            <a href="#buscar" className="inline-flex items-center gap-2 rounded-full border border-primary text-primary px-5 py-2.5 font-label-caps text-label-caps uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">search</span> Nueva búsqueda
            </a>
            <button type="button" onClick={empezarDeCero} className="inline-flex items-center gap-1 px-2 py-2.5 text-[13px] text-on-surface-variant underline underline-offset-2 hover:text-primary">
              <span className="material-symbols-outlined text-[16px]">refresh</span> Empezar de cero
            </button>
          </div>
        </div>

        {/* Resumen de lo hecho: seguimiento */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            ["favorite", nGuard, nGuard === 1 ? "guardado" : "guardados", "/mi-seleccion/"],
            ["mark_email_read", st.consultas.length, st.consultas.length === 1 ? "consulta enviada" : "consultas enviadas", "/mi-seleccion/"],
            ["visibility", st.nVistos, st.nVistos === 1 ? "ficha vista" : "fichas vistas", null],
          ].map(([ic, n, l, href]) => {
            const inner = (<><span className="material-symbols-outlined text-link-gold text-[20px]">{ic}</span><span className="font-headline-sm text-[22px] text-primary leading-none">{n}</span><span className="text-[12px] text-on-surface-variant leading-tight">{l}</span></>);
            return href
              ? <Link key={l} href={href} className="flex flex-col gap-1 rounded-xl bg-surface border border-outline-variant p-3 hover:border-link-gold">{inner}</Link>
              : <div key={l} className="flex flex-col gap-1 rounded-xl bg-surface border border-outline-variant p-3">{inner}</div>;
          })}
        </div>

        {/* ¿Te respondieron? — cierra el loop de la consulta */}
        {pendientes.map((c) => (
          <div key={c.s} className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl border border-link-gold/40 bg-surface p-4">
            <p className="text-[14px] text-primary flex-1">
              Consultaste por <Link href={`/desarrollos-inmobiliarios/${c.s}/`} className="font-semibold underline underline-offset-2">{c.n || c.s}</Link> hace {Math.round((Date.now() - c.t) / DIA)} días. ¿Te respondieron?
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => marcar(c.s, "si")} className="rounded-full border border-outline-variant px-4 py-1.5 text-[13px] hover:border-primary">Sí</button>
              <button type="button" onClick={() => marcar(c.s, "no")} className="rounded-full bg-primary text-on-primary px-4 py-1.5 text-[13px]">Todavía no</button>
            </div>
          </div>
        ))}
        {Object.entries(resp).filter(([, v]) => v === "no").slice(0, 1).map(([s]) => (
          <p key={s} className="mb-4 text-[13.5px] text-on-surface-variant">
            Probá por WhatsApp desde la <Link href={`/desarrollos-inmobiliarios/${s}/`} className="text-primary underline underline-offset-2">ficha</Link>: es el canal que más rápido responde. Si no hay respuesta, escribinos a <a href="mailto:contacto@departamentosenpozo.com.ar" className="text-primary underline underline-offset-2">contacto@departamentosenpozo.com.ar</a> y lo reclamamos por vos.
          </p>
        ))}

        {/* Novedades para vos */}
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h3 className="font-headline-sm text-[18px] text-primary">Para vos: nuevos y verificados que encajan</h3>
          <Link href={barriosTop[0] ? `/desarrollos-inmobiliarios/?barrio=${encodeURIComponent(cap(barriosTop[0]))}` : "/desarrollos-inmobiliarios/"} className="text-[13px] text-secondary font-medium hover:underline whitespace-nowrap">Seguir buscando →</Link>
        </div>
        {!catalogo ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 rounded-xl bg-surface-container animate-pulse" />)}</div>
        ) : recos.length ? (
          <ul className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto snap-x pb-1 -mx-1 px-1">
            {recos.map((x) => (
              <li key={x.s} className="snap-start shrink-0 w-[44vw] sm:w-[30vw] md:w-auto">
                <Link href={`/desarrollos-inmobiliarios/${x.s}/`} data-imp-slug={x.s} className="block rounded-xl overflow-hidden border border-outline-variant bg-surface hover:shadow-md h-full">
                  <div className="relative aspect-[4/3] bg-surface-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={x.img} alt={x.n} loading="lazy" className="w-full h-full object-cover" />
                    {x.sel && <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 rounded bg-primary/90 text-white font-label-caps tracking-wider text-[10px] px-1.5 py-0.5"><span className="material-symbols-outlined icon-fill text-[12px] text-link-gold">verified</span>Verificado</span>}
                    {x.nuevo && <span className="absolute top-2 right-2 rounded bg-link-gold text-white text-[10px] px-1.5 py-0.5">Nuevo</span>}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[13.5px] font-semibold text-primary leading-tight line-clamp-2">{x.n}</p>
                    <p className="text-[12px] text-on-surface-variant truncate">{x.b}</p>
                    {(x.p || x.m2) && <p className="text-[12.5px] text-primary mt-0.5">{x.p ? `Desde ${usd(x.p)}` : `${usd(x.m2)}/m²`}</p>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-on-surface-variant">Ya viste todo lo que encaja con tu búsqueda. Te avisamos cuando entre algo nuevo: <Link href="/alertas-de-lanzamientos-en-pozo/" className="text-primary underline underline-offset-2">activá tu alerta</Link>.</p>
        )}

        {/* Guardados recientes */}
        {nGuard > 0 && (
          <p className="mt-5 text-[13.5px] text-on-surface-variant">
            Guardados: {guardados.slice(0, 3).map((g, i) => (
              <span key={g.slug}>{i ? " · " : ""}<Link href={`/desarrollos-inmobiliarios/${g.slug}/`} className="text-primary hover:underline">{g.nombre || g.slug}</Link></span>
            ))}
            {nGuard > 3 ? ` y ${nGuard - 3} más` : ""} · <Link href="/mi-seleccion/" className="text-secondary font-medium hover:underline">Comparar</Link>
          </p>
        )}
      </div>
    </section>
  );
}
