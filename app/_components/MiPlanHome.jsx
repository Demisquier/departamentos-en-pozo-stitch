"use client";
// app/_components/MiPlanHome.jsx — Bloque de home que presenta "Mi Plan" (la sección personal
// del usuario) y sugiere ingresar. Deslogueado: explica + CTA armar plan. Logueado: retomá tu plan + contador.
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";

const FEATURES = [
  ["favorite", "Guardá tus proyectos", "Armá tu lista corta y comparala cuando quieras."],
  ["badge", "Tu objetivo y presupuesto", "Los recordamos para recomendarte a tu medida."],
  ["notifications_active", "Qué cambió para vos", "Novedades y precios de lo que seguís, no ruido."],
  ["forum", "Asesor cuando lo necesites", "Consultá sin empezar de cero: ya conoce tu búsqueda."],
];

export default function MiPlanHome() {
  const { user, count, ready, enabled } = useAuth();
  const logged = enabled ? !!user : false;
  const n = ready && logged ? count : 0;

  return (
    <section className="py-16 md:py-20 bg-primary-container">
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <span className="inline-block text-link-gold font-bold tracking-widest uppercase mb-3 text-label-caps font-label-caps">Tu espacio personal</span>
            <h2 className="text-on-primary font-headline-md text-headline-md leading-tight mb-4">
              {logged ? "Retomá tu plan de inversión en pozo" : "Tu plan de inversión en pozo, en un solo lugar"}
            </h2>
            <p className="text-on-primary text-body-lg font-body-lg opacity-90 mb-6 max-w-xl">
              Guardá proyectos, definí tu objetivo y presupuesto, y mirá qué cambió para vos. Te ayudamos a decidir — sin costo y sin vueltas.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/mi-seleccion/" className="inline-flex items-center gap-2 rounded-full bg-surface text-primary px-7 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                {logged ? (n > 0 ? `Ver mi plan (${n})` : "Ver mi plan") : "Armá mi plan"}
              </Link>
              {!logged && (
                <span className="text-on-primary opacity-80 text-[13.5px]">Ingresá con Google y guardalo en todos tus dispositivos.</span>
              )}
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(([ic, h, p]) => (
              <li key={h} className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
                <span className="material-symbols-outlined text-link-gold mt-0.5">{ic}</span>
                <div>
                  <p className="text-on-primary font-medium text-[15px] leading-tight">{h}</p>
                  <p className="text-on-primary opacity-80 text-[13px] leading-snug mt-0.5">{p}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
