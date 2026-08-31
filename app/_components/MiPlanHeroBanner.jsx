"use client";
// app/_components/MiPlanHeroBanner.jsx — Banda personalizada arriba del home para usuarios
// logueados con proyectos guardados: le da protagonismo a "Mi Plan" apenas entran.
// Renderiza null si no hay sesión o no hay guardados (no molesta al visitante anónimo).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";

function primerNombre(s) {
  const t = String(s || "").trim().split(/\s+/)[0];
  return (t && t.length >= 2 && !/https?:|@|\d{4,}/i.test(t)) ? t : "";
}

export default function MiPlanHeroBanner() {
  const { user, count, ready, enabled } = useAuth();
  const [nombre, setNombre] = useState("");
  useEffect(() => {
    try { const p = JSON.parse(localStorage.getItem("dpp_perfil_v1")) || {}; setNombre(primerNombre(p.nombre)); } catch {}
  }, []);
  const logged = enabled ? !!user : false;
  if (!ready || !logged || !count) return null;

  return (
    <section className="bg-secondary text-white">
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 md:py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="material-symbols-outlined text-link-gold text-[28px] shrink-0">space_dashboard</span>
          <div className="min-w-0">
            <p className="font-headline-sm text-[18px] leading-tight">
              {nombre ? `Hola de nuevo, ${nombre}.` : "Hola de nuevo."} Tenés {count} {count === 1 ? "proyecto" : "proyectos"} en tu Plan.
            </p>
            <p className="text-white/80 text-[13px] leading-snug">Retomá donde dejaste: comparalos y pedí precio y cuota.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/mi-seleccion/" className="inline-flex items-center gap-2 rounded-full bg-white text-secondary px-6 py-2.5 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span> Ver mi Plan ({count})
          </Link>
          <Link href="/desarrollos-inmobiliarios/" className="hidden sm:inline text-white/90 text-[13.5px] underline underline-offset-2 hover:text-white">Seguir buscando</Link>
        </div>
      </div>
    </section>
  );
}
