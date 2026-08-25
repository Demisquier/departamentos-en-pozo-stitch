"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* Nav inferior mobile — idéntico a Stitch (solo < md). Se OCULTA en la ficha, donde
   AccionesFicha ya pone una barra CTA fija abajo (evita que se pisen los botones).
   Suma "Mi Plan" (espacio personal del usuario) y resalta la sección activa por ruta. */
const ITEMS = [
  { icon: "home", label: "Inicio", href: "/", fill: true },
  { icon: "apartment", label: "Proyectos", href: "/desarrollos-inmobiliarios/" },
  { icon: "space_dashboard", label: "Mi Plan", href: "/mi-seleccion/" },
  { icon: "mail", label: "Contacto", href: "/contacto/" },
];

export default function BottomNav() {
  const path = usePathname() || "";
  const enFicha = /^\/desarrollos-inmobiliarios\/[^/]+\/?$/.test(path);
  if (enFicha) return null;
  const isActive = (href) => { const h = href.replace(/\/$/, "") || "/"; return h === "/" ? path === "/" : path.startsWith(h); };
  return (
    <nav aria-label="Navegación principal" className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center bg-surface py-2.5 px-margin-mobile z-50 border-t border-outline-variant shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {ITEMS.map((it) => {
        const on = isActive(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center justify-center flex-1 min-w-0 ${on ? "text-secondary font-bold" : "text-on-surface-variant hover:text-secondary"} transition-colors`}>
            <span className={`material-symbols-outlined text-[23px]${it.fill && on ? " icon-fill" : ""}`}>{it.icon}</span>
            <span className="text-[10px] uppercase mt-0.5 font-label-caps truncate max-w-full">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
