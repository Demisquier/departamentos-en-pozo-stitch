"use client";
// app/mi-seleccion/MiSeleccion.jsx — Landing privada del usuario: las fichas que guardó.
// Estados: (1) feature no configurada, (2) cargando sesión, (3) sin login → CTA login,
// (4) logueado sin guardados → empty state, (5) logueado con guardados → grilla de cards.
// Renderiza desde el dato denormalizado guardado en cada favorito (no vuelve a leer el catálogo).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../_auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import ProjectCard from "../_ui/ProjectCard";

export default function MiSeleccion() {
  const { user, loading, enabled, signIn, favoritos } = useAuth();
  const [rows, setRows] = useState(null); // null = cargando

  useEffect(() => {
    if (!enabled || !user) { setRows([]); return; }
    let alive = true;
    supabase
      .from("favoritos")
      .select("slug, data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (alive) setRows(data || []); });
    return () => { alive = false; };
    // Se recarga cuando cambia el set de favoritos (guardar/quitar desde otra pantalla).
  }, [user, enabled, favoritos]);

  if (!enabled) {
    return <Estado titulo="Muy pronto" texto="La sección de propiedades guardadas está por activarse." />;
  }
  if (loading) {
    return <Estado titulo="Cargando…" texto="Un segundo." />;
  }
  if (!user) {
    return (
      <Estado
        titulo="Ingresá para ver tu selección"
        texto="Guardá las propiedades que te interesan y accedé a ellas desde cualquier dispositivo."
      >
        <button onClick={signIn} className="mt-6 inline-flex items-center gap-3 rounded border border-outline-variant bg-white px-6 py-3 font-medium text-primary hover:border-secondary transition-all">
          <GoogleIcon /> Ingresar con Google
        </button>
      </Estado>
    );
  }
  if (rows === null) {
    return <Estado titulo="Cargando tu selección…" texto="Un segundo." />;
  }
  if (rows.length === 0) {
    return (
      <Estado
        titulo="Todavía no guardaste propiedades"
        texto="Tocá el corazón en cualquier proyecto para sumarlo a tu selección y encontrarlo acá."
      >
        <Link href="/desarrollos-inmobiliarios/" className="mt-6 inline-block rounded bg-primary-container px-6 py-3 text-on-primary font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all">
          Explorar proyectos en pozo
        </Link>
      </Estado>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {rows.map((r) => (
        <ProjectCard key={r.slug} {...(r.data || {})} slug={r.slug} />
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
