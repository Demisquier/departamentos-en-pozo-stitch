"use client";
import Link from "next/link";
import { useState } from "react";
import AuthButton from "../_auth/AuthButton";

const NAV = [
  // "INICIO" salió del menú: el logo ya lleva al home.
  { label: "PROYECTOS EN POZO", href: "/desarrollos-inmobiliarios/" },
];

// Las 9 páginas de barrio salieron del menú (decisión de producto: el header queda
// para los dos verticales, desarrolladoras e inmobiliarias). Viven en el footer y en
// el índice de Guías, así que ninguna queda huérfana.
const NAV_END = [
  { label: "DESARROLLADORAS", href: "/desarrolladoras-inmobiliarias-en-capital-federal/" },
  { label: "INMOBILIARIAS", href: "/mejores-inmobiliarias-caba/" },
  { label: "HERRAMIENTAS", href: "/#herramientas" },
  { label: "VIDEOS", href: "/videos-de-emprendimientos-en-pozo/" },
  { label: "GUÍAS", href: "/novedades/" },
  { label: "NOSOTROS", href: "/sobre-nosotros/" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-surface sticky top-0 z-50 shadow-sm transition-all duration-300 py-3">
      <div className="flex justify-between items-center gap-4 w-full px-margin-mobile md:px-margin-desktop py-0 max-w-container-max mx-auto">
        <Link href="/" className="flex items-center shrink-0" aria-label="Departamentos en Pozo — Inicio">
          {/* Logo con fondo TRANSPARENTE (se integra al fondo del header) y liviano (66KB).
              Lockup ancho → limitamos alto Y ancho máx para que nunca se coma el margen. */}
          <img
            src="/wp-content/uploads/logo-header.png"
            alt="Departamentos en Pozo"
            className="h-7 md:h-8 w-auto max-w-[150px] md:max-w-[190px] object-contain"
          />
        </Link>

        <button className="md:hidden p-2 text-primary" onClick={() => setOpen(!open)} aria-label="Abrir menú" aria-expanded={open} aria-controls="mobile-nav">
          <span className="material-symbols-outlined">menu</span>
        </button>

        <nav className="hidden md:flex items-center gap-3 lg:gap-4">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              className={`${i === 0 ? "text-secondary font-bold" : "text-on-surface-variant"} whitespace-nowrap text-label-caps font-label-caps hover:text-secondary transition-colors duration-300`}
            >
              {n.label}
            </Link>
          ))}

          {NAV_END.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="text-on-surface-variant whitespace-nowrap text-label-caps font-label-caps hover:text-secondary transition-colors duration-300"
            >
              {n.label}
            </Link>
          ))}

          {/* CONTACTO salió del header (pedido de producto): libera espacio. Sigue en el menú
              mobile y en el footer, así que la vía de contacto no se pierde. */}
          <AuthButton />
        </nav>
      </div>

      {open && (
        <div id="mobile-nav" className="md:hidden bg-surface border-t border-outline-variant absolute w-full left-0 p-margin-mobile space-y-4 shadow-xl font-label-caps">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          {NAV_END.map((n) => (
            <Link key={n.label} href={n.href} className="block" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <Link href="/contacto/" className="block font-bold" onClick={() => setOpen(false)}>
            CONTACTO
          </Link>
          <div className="pt-2"><AuthButton onNavigate={() => setOpen(false)} full /></div>
        </div>
      )}
    </header>
  );
}
