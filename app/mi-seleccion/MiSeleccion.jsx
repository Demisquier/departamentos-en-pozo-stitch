"use client";
// app/mi-seleccion/MiSeleccion.jsx — Tu landing privada: tu PERFIL (armado con el asesor,
// guardado en localStorage) + las fichas que guardaste (favoritos, vía el provider).
// Todo sin login, en el navegador.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";
import ProjectCard from "../_ui/ProjectCard";

const ETIQUETAS = { objetivo: "Objetivo", presupuesto: "Presupuesto", zonas: "Zonas", ambientes: "Tipología", entrega: "Entrega", plazo: "Plazo", financiacion: "Financiación" };

export default function MiSeleccion() {
  const { items, ready, enabled, authReady, user, login, logout } = useAuth();
  const [perfil, setPerfil] = useState(undefined); // undefined = cargando

  useEffect(() => {
    try { const raw = localStorage.getItem("dpp_perfil_v1"); setPerfil(raw ? JSON.parse(raw) : null); }
    catch { setPerfil(null); }
  }, []);

  // Con auth activo, "Mi selección" es privada: sin sesión no se ve la lista.
  if (enabled && !authReady) {
    return <p className="text-on-surface-variant py-10 text-center">Cargando…</p>;
  }
  if (enabled && !user) {
    return <LoginGate login={login} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <CuentaBloque enabled={enabled} user={user} login={login} logout={logout} />
      <PerfilBloque perfil={perfil} />

      <div>
        <h2 className="font-headline-sm text-headline-sm text-primary mb-4">Tus proyectos guardados</h2>
        {!ready ? (
          <p className="text-on-surface-variant">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="border border-outline-variant rounded-xl p-8 text-center">
            <p className="text-on-surface-variant mb-4">Todavía no guardaste proyectos. Tocá el corazón en cualquiera para sumarlo acá.</p>
            <Link href="/desarrollos-inmobiliarios/" className="inline-block rounded bg-primary-container px-6 py-3 text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">Explorar proyectos en pozo</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it) => (<ProjectCard key={it.slug} {...it} />))}
          </div>
        )}
      </div>
    </div>
  );
}

// Pantalla de acceso: sin sesión no se muestra la selección. Entrar = crear/loguear con Google.
function LoginGate({ login }) {
  return (
    <div className="max-w-lg mx-auto text-center border border-outline-variant rounded-2xl p-8 md:p-10 bg-surface-container-low">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[30px] text-secondary icon-fill" aria-hidden="true">favorite</span>
      </div>
      <h1 className="font-headline-md text-headline-md serif text-primary mb-2">Ingresá para ver tu selección</h1>
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
          Conectado como <strong className="font-medium">{email}</strong> — tu selección y perfil se guardan en todos tus dispositivos.
        </p>
        <button type="button" onClick={logout} className="shrink-0 rounded border border-outline-variant px-4 py-2 text-[13px] text-primary hover:border-secondary transition-colors">Salir</button>
      </div>
    );
  }
  return (
    <div className="border border-outline-variant rounded-xl p-5 md:flex md:items-center md:justify-between gap-6 bg-surface-container-low">
      <div>
        <h2 className="font-headline-sm text-headline-sm text-primary mb-1">Ingresá con Google</h2>
        <p className="text-on-surface-variant text-[14px]">Guardá tu selección y tu perfil en tu cuenta para verlos desde cualquier dispositivo. Sin contraseñas.</p>
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
