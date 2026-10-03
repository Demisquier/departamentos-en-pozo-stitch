"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AuthButton from "../_auth/AuthButton";

const NAV = [
  // "INICIO" salió del menú: el logo ya lleva al home.
  { label: "PROYECTOS EN POZO", href: "/desarrollos-inmobiliarios/", primary: true },
];

// "Directorios" agrupa los verticales de empresas (desarrolladoras, inmobiliarias, corralones)
// en un solo dropdown → el header queda corto y le da lugar a Inmobiliarias sin sumar ruido.
const DIRECTORIOS = [
  { label: "Desarrolladoras", href: "/desarrolladoras-inmobiliarias-en-capital-federal/" },
  { label: "Inmobiliarias", href: "/mejores-inmobiliarias-caba/" },
  { label: "Corralones y materiales", href: "/corralones-y-materiales-de-construccion-en-caba/" },
];

const NAV_END = [
  { label: "HERRAMIENTAS", href: "/#herramientas" },
  { label: "GUÍAS", href: "/novedades/" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const norm = (s) => (String(s || "/").split("#")[0].replace(/\/+$/, "") || "/");
  const cur = norm(pathname);
  // Solo se destaca la sección donde estoy parado (o una subruta); nunca un link a un hash del home.
  const isActive = (href) => { const t = norm(href); if (t === "/") return false; return cur === t || cur.startsWith(t + "/"); };
  const dirActive = DIRECTORIOS.some((d) => isActive(d.href));
  const linkClass = (href) => `${isActive(href) ? "text-secondary font-bold" : "text-on-surface-variant"} whitespace-nowrap text-label-caps font-label-caps hover:text-secondary transition-colors duration-300`;

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
          <Link href="/explorar/" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary/10 text-secondary px-3 py-1.5 text-label-caps font-label-caps hover:bg-secondary hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[16px]">forum</span> BUSCÁ CONVERSANDO
          </Link>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={linkClass(n.href)}
            >
              {n.label}
            </Link>
          ))}

          {/* Directorios: dropdown (hover + focus-within, con "puente" pt-2 para no cerrarse en el gap). */}
          <div className="relative group">
            <button
              type="button"
              aria-haspopup="true"
              className={`inline-flex items-center gap-1 ${dirActive ? "text-secondary font-bold" : "text-on-surface-variant"} whitespace-nowrap text-label-caps font-label-caps hover:text-secondary transition-colors`}
            >
              DIRECTORIOS
              <span className="material-symbols-outlined text-[16px] transition-transform group-hover:rotate-180" aria-hidden="true">expand_more</span>
            </button>
            <div className="absolute right-0 top-full pt-2 hidden group-hover:block group-focus-within:block">
              <div className="bg-surface border border-outline-variant rounded-xl shadow-xl py-2 min-w-[230px]">
                {DIRECTORIOS.map((d) => (
                  <Link key={d.href} href={d.href} aria-current={isActive(d.href) ? "page" : undefined}
                    className={`block px-4 py-2.5 text-[13.5px] ${isActive(d.href) ? "text-secondary font-medium" : "text-primary"} hover:bg-surface-container transition-colors`}>
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {NAV_END.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={linkClass(n.href)}
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
          <Link href="/explorar/" className="flex items-center gap-2 text-secondary font-bold" onClick={() => setOpen(false)}>
            <span className="material-symbols-outlined text-[18px]">forum</span> BUSCÁ CONVERSANDO
          </Link>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block" onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          {/* Directorios: grupo expandido inline en mobile. */}
          <div>
            <p className="text-on-surface-variant/70 text-[11px] tracking-wide mb-1.5">DIRECTORIOS</p>
            <div className="space-y-2 pl-1">
              {DIRECTORIOS.map((d) => (
                <Link key={d.href} href={d.href} className="block" onClick={() => setOpen(false)}>{d.label}</Link>
              ))}
            </div>
          </div>
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
