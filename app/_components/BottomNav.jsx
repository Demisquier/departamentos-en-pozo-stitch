import Link from "next/link";

/* Nav inferior mobile — idéntico a Stitch (solo < md) */
const ITEMS = [
  { icon: "home", label: "Inicio", href: "/", fill: true },
  { icon: "apartment", label: "Proyectos", href: "/desarrollos-inmobiliarios/" },
  { icon: "business", label: "Desarrolladoras", href: "/desarrolladoras-inmobiliarias-en-capital-federal/" },
  { icon: "mail", label: "Contacto", href: "/contacto/" },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center bg-surface py-3 px-margin-mobile z-50 border-t border-outline-variant shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {ITEMS.map((it, i) => (
        <Link key={it.href} href={it.href} className={`flex flex-col items-center justify-center ${i === 0 ? "text-link-gold font-bold" : "text-on-surface-variant hover:text-link-gold"} transition-colors`}>
          <span className="material-symbols-outlined" style={it.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>{it.icon}</span>
          <span className="text-[10px] uppercase mt-1 font-label-caps">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
