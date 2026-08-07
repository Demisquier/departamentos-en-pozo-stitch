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
  const { items, ready } = useAuth();
  const [perfil, setPerfil] = useState(undefined); // undefined = cargando

  useEffect(() => {
    try { const raw = localStorage.getItem("dpp_perfil_v1"); setPerfil(raw ? JSON.parse(raw) : null); }
    catch { setPerfil(null); }
  }, []);

  return (
    <div className="flex flex-col gap-8">
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
