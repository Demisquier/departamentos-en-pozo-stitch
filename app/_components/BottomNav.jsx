"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* Nav inferior mobile — idéntico a Stitch (solo < md). Se OCULTA en la ficha, donde
   AccionesFicha ya pone una barra CTA fija abajo (evita que se pisen los botones). */
const ITEMS = [
  { icon: "home", label: "Inicio", href: "/", fill: true },
  { icon: "apartment", label: "Proyectos", href: "/desarrollos-inmobiliarios/" },
  { icon: "business", label: "Desarrolladoras", href: "/desarrolladoras-inmobiliarias-en-capital-federal/" },
  { icon: "mail", label: "Contacto", href: "/contacto/" },
];

export default function BottomNav() {
  const path = usePathname() || "";
  const enFicha = /^\/desarrollos-inmobiliarios\/[^/]+\/?$/.test(path);
  if (enFicha) return null;
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center bg-surface py-3 px-margin-mobile z-50 border-t border-outline-variant shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {ITEMS.map((it, i) => (
        <Link key={it.href} href={it.href} className={`flex flex-col items-center justify-center ${i === 0 ? "text-secondary font-bold" : "text-on-surface-variant hover:text-secondary"} transition-colors`}>
          <span className={`material-symbols-outlined${it.fill ? " icon-fill" : ""}`}>{it.icon}</span>
          <span className="text-[10px] uppercase mt-1 font-label-caps">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
