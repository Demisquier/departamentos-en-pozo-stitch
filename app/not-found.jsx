import Link from "next/link";

// Página 404 — diseño Stitch portado (estética navy/bronce, mensaje + volver al inicio).
export default function NotFound() {
  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <section className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="space-y-4">
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">404</h1>
          <h2 className="font-headline-md text-headline-md text-secondary">Propiedad no encontrada</h2>
          <p className="max-w-xl mx-auto text-body-lg text-on-surface-variant">
            Parece que la ubicación que busca ha cambiado de plano. Permítanos guiarle de regreso a las mejores
            oportunidades de inversión.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            className="text-link-gold font-bold border-b border-link-gold hover:opacity-70 transition-opacity"
            href="/desarrollos-inmobiliarios"
          >
            Ver Proyectos Destacados
          </Link>
          <span className="text-outline-variant">|</span>
          <Link
            className="text-link-gold font-bold border-b border-link-gold hover:opacity-70 transition-opacity"
            href="/sobre-nosotros"
          >
            Sobre Nosotros
          </Link>
          <span className="text-outline-variant">|</span>
          <Link
            className="text-link-gold font-bold border-b border-link-gold hover:opacity-70 transition-opacity"
            href="/contacto"
          >
            Contactar Asesor
          </Link>
        </div>

        <div className="pt-8">
          <Link
            className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-8 py-4 rounded-lg font-label-caps uppercase tracking-widest hover:opacity-90 transition-all"
            href="/"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
