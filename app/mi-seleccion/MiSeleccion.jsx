"use client";
// app/mi-seleccion/MiSeleccion.jsx — Las fichas que el usuario guardó (localStorage, sin login).
// Lee del provider (una sola fuente de verdad) y renderiza cada card desde el dato guardado.
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";
import ProjectCard from "../_ui/ProjectCard";

export default function MiSeleccion() {
  const { items, ready } = useAuth();

  if (!ready) {
    return <Estado titulo="Cargando tu selección…" texto="Un segundo." />;
  }
  if (items.length === 0) {
    return (
      <Estado
        titulo="Todavía no guardaste propiedades"
        texto="Tocá el corazón en cualquier proyecto para sumarlo a tu selección y encontrarlo acá."
      >
        <Link
          href="/desarrollos-inmobiliarios/"
          className="mt-6 inline-block rounded bg-primary-container px-6 py-3 text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all"
        >
          Explorar proyectos en pozo
        </Link>
      </Estado>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((it) => (
        <ProjectCard key={it.slug} {...it} />
      ))}
    </div>
  );
}

function Estado({ titulo, texto, children }) {
  return (
    <div className="text-center py-16 max-w-lg mx-auto">
      <h2 className="font-headline-sm text-headline-sm text-primary mb-2">{titulo}</h2>
      <p className="text-on-surface-variant font-body-md text-body-md">{texto}</p>
      {children}
    </div>
  );
}
