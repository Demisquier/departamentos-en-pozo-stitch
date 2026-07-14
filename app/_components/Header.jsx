"use client";
import Link from "next/link";
import { useState } from "react";

const NAV = [
  { label: "INICIO", href: "/" },
  { label: "PROYECTOS EN POZO", href: "/desarrollos-inmobiliarios/" },
  { label: "POR BARRIO", href: "/desarrolladoras-inmobiliarias-en-palermo/" },
  { label: "DESARROLLADORAS", href: "/desarrolladoras-inmobiliarias-en-capital-federal/" },
  { label: "GUÍAS", href: "/novedades/" },
  { label: "NOSOTROS", href: "/sobre-nosotros/" },
];

/* Header idéntico a Stitch: wordmark Caslon + nav label-caps + botón Contacto navy */
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-surface sticky top-0 z-50 shadow-sm transition-all duration-300 py-4">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-0 max-w-container-max mx-auto">
        <Link href="/" className="flex items-center" aria-label="Departamentos en Pozo — Inicio">
          <img
            src="/wp-content/uploads/2026/05/Logo-depatamentos-en-pozo.png"
            alt="Departamentos en Pozo"
            className="h-11 md:h-14 w-auto"
          />
        </Link>
        <button className="md:hidden p-2 text-primary" onClick={() => setOpen(!open)} aria-label="Menú">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              className={`${i === 0 ? "text-link-gold font-bold" : "text-on-surface-variant"} text-label-caps font-label-caps hover:text-link-gold transition-colors duration-300`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/contacto/"
            className="bg-primary-container text-on-primary rounded px-6 py-2 text-label-caps font-label-caps hover:opacity-90 transition-all"
          >
            CONTACTO
          </Link>
        </nav>
      </div>
      {open && (
        <div className="md:hidden bg-surface border-t border-outline-variant absolute w-full left-0 p-margin-mobile space-y-4 shadow-xl font-label-caps">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <Link href="/contacto/" className="block font-bold" onClick={() => setOpen(false)}>
            CONTACTO
          </Link>
        </div>
      )}
    </header>
  );
}
